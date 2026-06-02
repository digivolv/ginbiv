// Core discovery + classification + autopost pipeline.
// Called by the API route for manual scans and by the scheduler for automatic scans.

import prisma from "./db";
import { getSettings } from "./settings";
import {
  fetchSubredditPosts,
  searchSubreddit,
  postReply,
  isRedditAvailable,
} from "./redditClient";
import { classifyContent, passesPreFilter } from "./scoring";
import { generateDrafts } from "./promotionPolicy";
import { fullSafetyCheck, isCrisisContent } from "./safety";
import { canPostNow, recordPost } from "./rateState";
import { logAudit } from "./auditLogger";
import type { AutonomyMode } from "@/types";

export interface ScanOptions {
  dryRun?: boolean;
  subredditsOverride?: string[];
}

export interface ScanResult {
  runId: string;
  opportunitiesFound: number;
  draftsGenerated: number;
  autoRepliesPosted: number;
  queuedForReview: number;
  errors: string[];
}

// Semaphore: only one scan at a time
let scanInProgress = false;

export function isScanRunning(): boolean {
  return scanInProgress;
}

export async function runScan(options: ScanOptions = {}): Promise<ScanResult> {
  if (scanInProgress) {
    throw new Error("A scan is already running. Please wait for it to complete.");
  }
  scanInProgress = true;

  const settings = await getSettings();
  const isDryRun = options.dryRun ?? settings.autonomyMode === "review_only";
  const subreddits = options.subredditsOverride ?? settings.trackedSubreddits;

  const run = await prisma.agentRun.create({
    data: {
      mode: settings.autonomyMode,
      isDryRun,
      subredditsScanned: JSON.stringify(subreddits),
    },
  });

  await logAudit({
    eventType: "scan_started",
    message: `Scan started. Mode: ${settings.autonomyMode}. Dry run: ${isDryRun}. Subreddits: ${subreddits.join(", ")}`,
    metadata: { runId: run.id },
  });

  const errors: string[] = [];
  let opportunitiesFound = 0;
  let draftsGenerated = 0;
  let autoRepliesPosted = 0;
  let queuedForReview = 0;

  try {
    if (!isRedditAvailable()) {
      throw new Error("Reddit credentials not configured — cannot run automated scan");
    }

    for (const subreddit of subreddits) {
      try {
        // Fetch posts via hot/new and keyword search
        const [browsePosts, searchPosts] = await Promise.allSettled([
          fetchSubredditPosts(subreddit, settings.maxResultsPerScan, settings.maxContentAgeHours),
          searchSubreddit(
            subreddit,
            settings.searchKeywords,
            settings.maxResultsPerScan,
            settings.maxContentAgeHours
          ),
        ]);

        const rawPosts = [
          ...(browsePosts.status === "fulfilled" ? browsePosts.value : []),
          ...(searchPosts.status === "fulfilled" ? searchPosts.value : []),
        ];

        if (browsePosts.status === "rejected") {
          errors.push(`Browse failed for r/${subreddit}: ${browsePosts.reason}`);
        }
        if (searchPosts.status === "rejected") {
          errors.push(`Search failed for r/${subreddit}: ${searchPosts.reason}`);
        }

        // Deduplicate by Reddit ID
        const seen = new Map<string, (typeof rawPosts)[0]>();
        for (const p of rawPosts) seen.set(p.id, p);

        for (const post of Array.from(seen.values())) {
          try {
            // Check if already in DB
            const existing = await prisma.opportunity.findUnique({
              where: { redditId: post.id },
            });
            if (existing) continue;

            // Check blocked authors
            const blocked = await prisma.authorBlock.findUnique({
              where: { username: post.author },
            });
            if (blocked) continue;

            // Pre-filter before expensive LLM call
            const content = `${post.title} ${post.selftext}`;
            if (!passesPreFilter(content)) continue;

            // Check blocked keywords
            const hasBlockedKw = settings.blockedKeywords.some((kw) =>
              content.toLowerCase().includes(kw.toLowerCase())
            );
            if (hasBlockedKw) continue;

            // Persist the opportunity
            const crisis = isCrisisContent(content);
            const opp = await prisma.opportunity.create({
              data: {
                sourceType: "post",
                subreddit: post.subreddit,
                redditId: post.id,
                redditUrl: post.url,
                title: post.title,
                author: post.author,
                body: post.selftext,
                createdAtReddit: new Date(post.created_utc * 1000),
                isCrisis: crisis,
                safetyStatus: crisis ? "crisis" : "pending",
                status: "new",
                rawJson: JSON.stringify(post),
              },
            });

            opportunitiesFound++;

            await logAudit({
              opportunityId: opp.id,
              eventType: "discovered",
              message: `Discovered r/${subreddit} post by u/${post.author}`,
              metadata: { redditId: post.id, url: post.url },
            });

            // Classify
            await classifyAndDraft(opp.id, content, null, subreddit, settings, {
              isDryRun,
              autopost: settings.autonomyMode === "support_only_autopilot" && !isDryRun,
              countDrafts: (n: number) => { draftsGenerated += n; },
              countAutopost: () => { autoRepliesPosted++; },
              countQueue: () => { queuedForReview++; },
              logError: (e: string) => errors.push(e),
              post,
            });
          } catch (itemError) {
            const msg = `Error processing post ${post.id}: ${itemError instanceof Error ? itemError.message : String(itemError)}`;
            errors.push(msg);
            await logAudit({
              eventType: "error",
              message: msg,
            });
          }
        }
      } catch (subError) {
        const msg = `Error scanning r/${subreddit}: ${subError instanceof Error ? subError.message : String(subError)}`;
        errors.push(msg);
      }
    }
  } catch (fatalError) {
    const msg = `Fatal scan error: ${fatalError instanceof Error ? fatalError.message : String(fatalError)}`;
    errors.push(msg);
  } finally {
    scanInProgress = false;
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        opportunitiesFound,
        draftsGenerated,
        autoRepliesPosted,
        queuedForReview,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    await logAudit({
      eventType: "scan_completed",
      message: `Scan complete. Found: ${opportunitiesFound}, Drafted: ${draftsGenerated}, Auto-posted: ${autoRepliesPosted}, Queued: ${queuedForReview}`,
      metadata: { runId: run.id, errors },
    });
  }

  return {
    runId: run.id,
    opportunitiesFound,
    draftsGenerated,
    autoRepliesPosted,
    queuedForReview,
    errors,
  };
}

// Classify an opportunity and optionally generate drafts + autopost
async function classifyAndDraft(
  oppId: string,
  content: string,
  parentContext: string | null,
  subreddit: string,
  settings: Awaited<ReturnType<typeof getSettings>>,
  opts: {
    isDryRun: boolean;
    autopost: boolean;
    countDrafts: (n: number) => void;
    countAutopost: () => void;
    countQueue: () => void;
    logError: (e: string) => void;
    post?: { id: string; author: string };
  }
): Promise<void> {
  // Update status to classifying
  await prisma.opportunity.update({
    where: { id: oppId },
    data: { status: "classifying" },
  });

  let classification;
  try {
    classification = await classifyContent(content, parentContext, subreddit);
  } catch (e) {
    const msg = `Classification failed for ${oppId}: ${e instanceof Error ? e.message : String(e)}`;
    opts.logError(msg);
    await prisma.opportunity.update({
      where: { id: oppId },
      data: { status: "error", notes: msg },
    });
    return;
  }

  // Apply hard crisis overrides
  const safetyStatus = classification.isCrisis
    ? "crisis"
    : classification.relevanceScore >= 80 && classification.promoRiskScore <= 20
    ? "safe"
    : "review_required";

  await prisma.opportunity.update({
    where: { id: oppId },
    data: {
      painPoint: classification.painPoint,
      emotionalState: classification.emotionalState,
      relevanceScore: classification.relevanceScore,
      urgencyScore: classification.urgencyScore,
      promoSuitabilityScore: classification.promoSuitabilityScore,
      promoRiskScore: classification.promoRiskScore,
      isCrisis: classification.isCrisis,
      safetyStatus,
      autonomyEligible: classification.shouldAutopostSupportReply,
      classificationReasoning: classification.reasoning,
      safetyNotes: classification.safetyNotes,
      status: "classified",
    },
  });

  await logAudit({
    opportunityId: oppId,
    eventType: "classified",
    message: `Classified: ${classification.painPoint} / ${classification.emotionalState}, relevance=${classification.relevanceScore}, crisis=${classification.isCrisis}`,
    metadata: { classification },
  });

  // Skip irrelevant content
  if (classification.painPoint === "not_relevant" || !classification.shouldGenerateDraft) {
    return;
  }

  // Crisis: queue for human review, no autopost
  if (classification.isCrisis) {
    await logAudit({
      opportunityId: oppId,
      eventType: "crisis_flagged",
      message: "Crisis content flagged — queuing for human review only",
    });
    opts.countQueue();
  }

  // Generate drafts
  let drafts;
  try {
    drafts = await generateDrafts({
      body: content,
      parentContext,
      subreddit,
      painPoint: classification.painPoint,
      emotionalState: classification.emotionalState,
      promoSuitabilityScore: classification.promoSuitabilityScore,
      promoRiskScore: classification.promoRiskScore,
      isCrisis: classification.isCrisis,
      voiceProfile: settings.maraVoiceProfile,
      youtubeUrl: settings.youtubeUrl,
      promotionPolicy: settings.promotionPolicy,
    });
  } catch (e) {
    const msg = `Draft generation failed for ${oppId}: ${e instanceof Error ? e.message : String(e)}`;
    opts.logError(msg);
    await prisma.opportunity.update({
      where: { id: oppId },
      data: { status: "error", notes: msg },
    });
    return;
  }

  // Persist drafts
  for (const draft of drafts) {
    await prisma.draftReply.create({
      data: {
        opportunityId: oppId,
        draftType: draft.draftType,
        body: draft.body,
        rationale: draft.rationale,
        riskNotes: draft.riskNotes,
      },
    });
  }

  opts.countDrafts(drafts.length);

  await prisma.opportunity.update({
    where: { id: oppId },
    data: { status: "drafted" },
  });

  await logAudit({
    opportunityId: oppId,
    eventType: "draft_generated",
    message: `${drafts.length} draft(s) generated`,
    metadata: { draftTypes: drafts.map((d) => d.draftType) },
  });

  // Autopost logic (support_only_autopilot mode, no_promo drafts only)
  if (
    opts.autopost &&
    !opts.isDryRun &&
    !classification.isCrisis &&
    opts.post
  ) {
    const noproDraft = drafts.find(
      (d) => d.draftType === "no_promo" || d.draftType === "short_reply"
    );

    if (noproDraft && classification.shouldAutopostSupportReply) {
      await attemptAutopost(oppId, noproDraft, opts.post, subreddit, settings, opts);
    } else {
      opts.countQueue();
    }
  } else if (!classification.isCrisis) {
    opts.countQueue();
  }
}

async function attemptAutopost(
  oppId: string,
  draft: Awaited<ReturnType<typeof generateDrafts>>[0],
  post: { id: string; author: string },
  subreddit: string,
  settings: Awaited<ReturnType<typeof getSettings>>,
  opts: { countAutopost: () => void; countQueue: () => void; logError: (e: string) => void }
): Promise<void> {
  const rateCheck = canPostNow({
    subreddit,
    maxGlobal: settings.maxAutonomousRepliesPerDay,
    maxPerSubreddit: settings.maxRepliesPerSubredditPerDay,
    minMinutesBetween: settings.minMinutesBetweenReplies,
  });

  if (!rateCheck.allowed) {
    await logAudit({
      opportunityId: oppId,
      eventType: "queued_for_review",
      message: `Rate limit: ${rateCheck.reason}`,
    });
    opts.countQueue();
    return;
  }

  // Full safety check before posting
  const safetyResult = await fullSafetyCheck(draft.body, "", settings.youtubeUrl);
  if (!safetyResult.isSafe || safetyResult.isCrisis) {
    await logAudit({
      opportunityId: oppId,
      eventType: "safety_check_failed",
      message: `Safety check failed: ${safetyResult.flags.join("; ")}`,
    });
    opts.countQueue();
    return;
  }

  await logAudit({
    opportunityId: oppId,
    eventType: "safety_check_passed",
    message: "All safety checks passed — attempting autopost",
  });

  const result = await postReply(`t3_${post.id}`, draft.body);

  if (!result.success) {
    opts.logError(`Autopost failed for ${oppId}: ${result.error}`);
    await logAudit({
      opportunityId: oppId,
      eventType: "error",
      message: `Autopost failed: ${result.error}`,
    });
    opts.countQueue();
    return;
  }

  recordPost(subreddit);

  await prisma.opportunity.update({
    where: { id: oppId },
    data: { status: "auto_posted", shouldAutopost: true },
  });

  const savedDraft = await prisma.draftReply.findFirst({
    where: { opportunityId: oppId, draftType: draft.draftType },
  });

  if (savedDraft) {
    await prisma.draftReply.update({
      where: { id: savedDraft.id },
      data: {
        isAutoPosted: true,
        isApproved: true,
        redditReplyId: result.replyId,
        postedAt: new Date(),
      },
    });
  }

  await logAudit({
    opportunityId: oppId,
    eventType: "auto_posted",
    message: `Auto-posted to r/${subreddit} — Reddit reply ID: ${result.replyId}`,
    metadata: { replyId: result.replyId, draftType: draft.draftType },
  });

  opts.countAutopost();
}
