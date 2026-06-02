import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { classifyContent } from "@/lib/scoring";
import { generateDrafts } from "@/lib/promotionPolicy";
import { getSettings } from "@/lib/settings";
import { logAudit } from "@/lib/auditLogger";
import { isCrisisContent } from "@/lib/safety";
import {
  fetchPostByUrl,
  parseRedditUrl,
  isRedditAvailable,
} from "@/lib/redditClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, text, title, subreddit: subredditHint } = body;

    if (!url && !text) {
      return NextResponse.json(
        { error: "Provide either a Reddit URL or raw text" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    let postBody = text ?? "";
    let postTitle = title ?? "";
    let postAuthor = "manual_input";
    let postSubreddit = subredditHint ?? "unknown";
    let redditUrl: string | null = url ?? null;
    let redditId: string | null = null;
    let parentContext: string | null = null;
    let createdAtReddit: Date | null = null;

    // If URL provided, try to fetch from Reddit
    if (url) {
      const parsed = parseRedditUrl(url);
      if (parsed.subreddit) postSubreddit = parsed.subreddit;

      if (isRedditAvailable()) {
        const fetched = await fetchPostByUrl(url);
        if (fetched.error) {
          // Fall through to manual mode with whatever text was provided
        } else if (fetched.comment) {
          postBody = fetched.comment.body;
          postAuthor = fetched.comment.author;
          redditId = `t1_${fetched.comment.id}`;
          redditUrl = fetched.comment.permalink;
          createdAtReddit = new Date(fetched.comment.created_utc * 1000);
          if (fetched.post) {
            postTitle = fetched.post.title;
            parentContext = fetched.post.selftext?.slice(0, 500);
          }
        } else if (fetched.post) {
          postBody = fetched.post.selftext;
          postTitle = fetched.post.title;
          postAuthor = fetched.post.author;
          redditId = `t3_${fetched.post.id}`;
          redditUrl = fetched.post.url;
          createdAtReddit = new Date(fetched.post.created_utc * 1000);
        }
      }
    }

    if (!postBody.trim()) {
      return NextResponse.json({ error: "No content to analyze" }, { status: 400 });
    }

    const fullContent = [postTitle, postBody].filter(Boolean).join("\n\n");

    // Check for duplicate
    if (redditId) {
      const existing = await prisma.opportunity.findUnique({
        where: { redditId },
        include: { drafts: true },
      });
      if (existing) {
        return NextResponse.json({ opportunity: existing, isDuplicate: true });
      }
    }

    const crisis = isCrisisContent(fullContent);

    const opp = await prisma.opportunity.create({
      data: {
        sourceType: "manual",
        subreddit: postSubreddit,
        redditId: redditId ?? undefined,
        redditUrl: redditUrl ?? undefined,
        title: postTitle || undefined,
        author: postAuthor,
        body: postBody,
        parentContext: parentContext ?? undefined,
        createdAtReddit: createdAtReddit ?? undefined,
        isCrisis: crisis,
        safetyStatus: crisis ? "crisis" : "pending",
        status: "new",
      },
    });

    await logAudit({
      opportunityId: opp.id,
      eventType: "discovered",
      message: `Manual input from r/${postSubreddit}`,
    });

    // Auto-classify
    let classification;
    try {
      classification = await classifyContent(fullContent, parentContext, postSubreddit);
      const safetyStatus = (crisis || classification.isCrisis)
        ? "crisis"
        : classification.relevanceScore >= 80 && classification.promoRiskScore <= 20
        ? "safe"
        : "review_required";

      await prisma.opportunity.update({
        where: { id: opp.id },
        data: {
          painPoint: classification.painPoint,
          emotionalState: classification.emotionalState,
          relevanceScore: classification.relevanceScore,
          urgencyScore: classification.urgencyScore,
          promoSuitabilityScore: crisis ? 0 : classification.promoSuitabilityScore,
          promoRiskScore: crisis ? 100 : classification.promoRiskScore,
          isCrisis: crisis || classification.isCrisis,
          safetyStatus,
          autonomyEligible: !crisis && classification.shouldAutopostSupportReply,
          classificationReasoning: classification.reasoning,
          safetyNotes: classification.safetyNotes,
          status: "classified",
        },
      });
    } catch {
      // Classification failed — still return the opportunity
    }

    // Generate drafts
    if (classification?.shouldGenerateDraft) {
      try {
        const drafts = await generateDrafts({
          body: fullContent,
          parentContext,
          subreddit: postSubreddit,
          painPoint: classification.painPoint,
          emotionalState: classification.emotionalState ?? "confused",
          promoSuitabilityScore: crisis ? 0 : (classification.promoSuitabilityScore ?? 0),
          promoRiskScore: crisis ? 100 : (classification.promoRiskScore ?? 100),
          isCrisis: crisis || classification.isCrisis,
          voiceProfile: settings.maraVoiceProfile,
          youtubeUrl: settings.youtubeUrl,
          promotionPolicy: settings.promotionPolicy,
        });

        await Promise.all(
          drafts.map((d) =>
            prisma.draftReply.create({
              data: {
                opportunityId: opp.id,
                draftType: d.draftType,
                body: d.body,
                rationale: d.rationale,
                riskNotes: d.riskNotes,
              },
            })
          )
        );

        await prisma.opportunity.update({
          where: { id: opp.id },
          data: { status: "drafted" },
        });
      } catch {
        // Drafts failed — still return opportunity
      }
    }

    const final = await prisma.opportunity.findUnique({
      where: { id: opp.id },
      include: { drafts: true },
    });

    return NextResponse.json({ opportunity: final, isDuplicate: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Manual input failed" },
      { status: 500 }
    );
  }
}
