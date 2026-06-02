import { z } from "zod";
import type { SafetyCheckResult } from "@/types";
import { callLLMForJson, isLLMAvailable } from "./llmClient";
import { safetyCheckPrompt } from "./maraPrompt";

// ─── Crisis Keywords ───────────────────────────────────────────────────────────

const CRISIS_PATTERNS = [
  /\bsuicid/i,
  /\bkill\s+myself\b/i,
  /\bkilling\s+myself\b/i,
  /\bend\s+my\s+life\b/i,
  /\bending\s+my\s+life\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive)/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bself.?harm\b/i,
  /\bcutting\s+myself\b/i,
  /\bcut\s+myself\b/i,
  /\boverdos/i,
  /\bwant\s+to\s+die\b/i,
  /\bwished?\s+i\s+was\s+dead\b/i,
];

// ─── Self-Promo Patterns ───────────────────────────────────────────────────────

const SELF_PROMO_PATTERNS = [
  /\bsubscribe\b/i,
  /\bsmash\s+(the\s+)?like\b/i,
  /\bcheck\s+out\s+my\s+(channel|video|content)\b/i,
  /\bfollow\s+me\b/i,
  /\bDM\s+me\b/i,
  /\bcheck\s+my\s+profile\b/i,
  /\bwatch\s+my\s+video\s+now\b/i,
  /\bguaranteed\s+healing\b/i,
  /\bthis\s+will\s+fix\s+you\b/i,
  /\bI\s+(make|run|have)\s+a\s+(youtube\s+)?channel\b/i,
];

// ─── Medical/Legal Advice Patterns ────────────────────────────────────────────

const ADVICE_PATTERNS = [
  /\byou\s+should\s+(see\s+a\s+)?(therapist|psychiatrist|psychologist|doctor|lawyer|attorney)\b/i,
  /\btake\s+(this\s+)?(medication|drug|pill|antidepressant)\b/i,
  /\bdiagnos/i,
  /\bprescri/i,
  /\blegal\s+right/i,
  /\bcourt\s+order/i,
];

// ─── URL Patterns ──────────────────────────────────────────────────────────────

const URL_PATTERN = /https?:\/\/[^\s)>\]]+/gi;
const ALLOWED_DOMAINS = ["youtube.com", "youtu.be"];

function hasDisallowedUrls(text: string, allowedYoutubeUrl: string): boolean {
  const matches = text.match(URL_PATTERN) ?? [];
  for (const url of matches) {
    const isAllowed =
      ALLOWED_DOMAINS.some((domain) => url.includes(domain)) &&
      (allowedYoutubeUrl === "" || url.includes("youtube.com") || url.includes("youtu.be"));
    if (!isAllowed) return true;
  }
  return false;
}

// ─── Deterministic Safety Check ────────────────────────────────────────────────
// Fast, rule-based check that runs before any LLM call.
// Returns a SafetyCheckResult.

export function deterministicSafetyCheck(
  draftBody: string,
  originalContent: string,
  allowedYoutubeUrl = ""
): SafetyCheckResult {
  const flags: string[] = [];

  // Crisis check on original content
  const isCrisis = CRISIS_PATTERNS.some((p) => p.test(originalContent));
  if (isCrisis) {
    flags.push("Crisis content detected in original post");
  }

  // Self-promo in draft
  for (const pattern of SELF_PROMO_PATTERNS) {
    if (pattern.test(draftBody)) {
      flags.push(`Self-promotion phrase detected: ${pattern.source}`);
    }
  }

  // Medical/legal advice in draft
  for (const pattern of ADVICE_PATTERNS) {
    if (pattern.test(draftBody)) {
      flags.push(`Potential advice language: ${pattern.source}`);
    }
  }

  // Disallowed URLs
  if (hasDisallowedUrls(draftBody, allowedYoutubeUrl)) {
    flags.push("Draft contains disallowed external URL");
  }

  // Empty draft
  if (draftBody.trim().length < 10) {
    flags.push("Draft body is too short");
  }

  return {
    isSafe: flags.length === 0,
    isCrisis,
    flags,
    notes: flags.length === 0 ? "Passed all deterministic checks." : flags.join("; "),
  };
}

const SafetyCheckSchema = z.object({
  isSafe: z.boolean(),
  isCrisis: z.boolean(),
  flags: z.array(z.string()),
  notes: z.string(),
});

// Full safety check: deterministic first, then LLM if available.
// If deterministic fails, short-circuits (no LLM needed).
// If they disagree (det says safe, LLM says unsafe) → treat as unsafe.
export async function fullSafetyCheck(
  draftBody: string,
  originalContent: string,
  allowedYoutubeUrl = ""
): Promise<SafetyCheckResult> {
  const det = deterministicSafetyCheck(draftBody, originalContent, allowedYoutubeUrl);

  // Crisis or obvious failure — skip LLM call
  if (!det.isSafe || det.isCrisis) {
    return det;
  }

  if (!isLLMAvailable()) {
    return det;
  }

  try {
    const llmResult = await callLLMForJson(
      safetyCheckPrompt(draftBody, originalContent),
      SafetyCheckSchema,
      { temperature: 0 }
    );

    // Merge: flag anything either checker caught
    const mergedFlags = Array.from(new Set([...det.flags, ...llmResult.flags]));
    const isSafe = det.isSafe && llmResult.isSafe;
    const isCrisis = det.isCrisis || llmResult.isCrisis;

    return {
      isSafe: isSafe && !isCrisis,
      isCrisis,
      flags: mergedFlags,
      notes: llmResult.notes,
    };
  } catch (e) {
    // LLM safety check failed — be conservative and treat as review_required
    return {
      isSafe: false,
      isCrisis: det.isCrisis,
      flags: [...det.flags, `LLM safety check error: ${e instanceof Error ? e.message : String(e)}`],
      notes: "LLM safety check failed; queuing for human review.",
    };
  }
}

// Quick crisis scan on raw content — used at discovery time before any reply generation
export function isCrisisContent(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}

// Check whether a subreddit is likely to ban links based on known policies
export function isLikelyLinkBannedSubreddit(subreddit: string): boolean {
  const conservative = ["ExNoContact", "survivorsofabuse", "raisedbynarcissists", "depression"];
  return conservative.some(
    (s) => s.toLowerCase() === subreddit.toLowerCase()
  );
}
