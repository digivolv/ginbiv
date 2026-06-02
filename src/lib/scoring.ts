import { z } from "zod";
import type { ClassificationResult } from "@/types";
import { PAIN_POINTS, EMOTIONAL_STATES } from "@/types";
import { callLLMForJson, isLLMAvailable } from "./llmClient";
import { classifyOpportunityPrompt } from "./maraPrompt";
import { isCrisisContent } from "./safety";

const ClassificationSchema = z.object({
  painPoint: z.enum(PAIN_POINTS),
  emotionalState: z.enum(EMOTIONAL_STATES),
  relevanceScore: z.number().min(0).max(100),
  urgencyScore: z.number().min(0).max(100),
  promoSuitabilityScore: z.number().min(0).max(100),
  promoRiskScore: z.number().min(0).max(100),
  isCrisis: z.boolean(),
  shouldGenerateDraft: z.boolean(),
  shouldAutopostSupportReply: z.boolean(),
  shouldQueueForReview: z.boolean(),
  reasoning: z.string(),
  safetyNotes: z.string(),
});

// Classify content using the LLM
export async function classifyContent(
  body: string,
  parentContext: string | null,
  subreddit: string
): Promise<ClassificationResult> {
  if (!isLLMAvailable()) {
    throw new Error("LLM not available — set OPENAI_API_KEY in environment");
  }

  const result = await callLLMForJson(
    classifyOpportunityPrompt(body, parentContext, subreddit),
    ClassificationSchema,
    { temperature: 0.1 }
  );

  // Hard override: if deterministic crisis check fires, enforce crisis scores
  const detectedCrisis = isCrisisContent(body);
  if (detectedCrisis || result.isCrisis) {
    return {
      ...result,
      isCrisis: true,
      promoSuitabilityScore: 0,
      promoRiskScore: 100,
      shouldAutopostSupportReply: false,
      safetyNotes: `CRISIS CONTENT DETECTED. ${result.safetyNotes}`,
    };
  }

  return result;
}

// Determine if a content item passes the autopost eligibility bar.
// This is purely data-driven — the scheduler layer checks rate limits separately.
export function isAutopostEligible(
  classification: ClassificationResult,
  draftType: "no_promo" | "short_reply"
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (classification.isCrisis) reasons.push("Crisis content");
  if (classification.relevanceScore < 80) reasons.push(`relevanceScore ${classification.relevanceScore} < 80`);
  if (classification.promoRiskScore > 20) reasons.push(`promoRiskScore ${classification.promoRiskScore} > 20`);
  if (!["no_promo", "short_reply"].includes(draftType)) reasons.push("Draft type is promotional");
  if (!classification.shouldAutopostSupportReply) reasons.push("Classifier did not flag for autopost");

  return { eligible: reasons.length === 0, reasons };
}

// Keyword-based pre-filter used before calling the LLM to save tokens on obviously irrelevant content
const STRONG_POSITIVE_KEYWORDS = [
  "breakup",
  "break up",
  "broke up",
  "no contact",
  "miss my ex",
  "missing my ex",
  "can't sleep",
  "cannot sleep",
  "couldn't sleep",
  "heartbroke",
  "heartbreak",
  "heartbroken",
  "want to text",
  "texting my ex",
  "lonely at night",
  "lying awake",
  "night anxiety",
  "affirmation",
  "meditation",
  "moving on",
  "self worth",
  "relapse",
  "healing",
];

const HARD_NEGATIVE_KEYWORDS = [
  "legal advice",
  "lawyer",
  "attorney",
  "prescription",
  "medication dosage",
  "what medication",
  "i hate ads",
  "i hate spam",
  "sick of promotion",
];

export function passesPreFilter(text: string): boolean {
  const lower = text.toLowerCase();
  const hasPositive = STRONG_POSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
  const hasNegative = HARD_NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw));
  // Must have at least one positive keyword and no hard negatives
  return hasPositive && !hasNegative;
}
