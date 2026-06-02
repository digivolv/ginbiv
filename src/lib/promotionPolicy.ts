import type { PromotionPolicy } from "@/types";
import type { DraftResult } from "@/types";
import { z } from "zod";
import { callLLMForJson, isLLMAvailable } from "./llmClient";
import { generateMaraDraftsPrompt } from "./maraPrompt";
import type { MaraVoiceProfile } from "@/types";

const DraftSchema = z.object({
  draftType: z.enum(["no_promo", "soft_promo", "crisis_safe", "short_reply"]),
  body: z.string().min(1),
  rationale: z.string(),
  riskNotes: z.string(),
});

const DraftGenerationSchema = z.object({
  drafts: z.array(DraftSchema).min(1).max(4),
});

export async function generateDrafts(params: {
  body: string;
  parentContext: string | null;
  subreddit: string;
  painPoint: string;
  emotionalState: string;
  promoSuitabilityScore: number;
  promoRiskScore: number;
  isCrisis: boolean;
  voiceProfile: MaraVoiceProfile;
  youtubeUrl: string;
  promotionPolicy: PromotionPolicy;
}): Promise<DraftResult[]> {
  if (!isLLMAvailable()) {
    throw new Error("LLM not available — set OPENAI_API_KEY");
  }

  // Crisis: generate only crisis_safe draft
  if (params.isCrisis) {
    return generateCrisisDraft(params.body, params.voiceProfile);
  }

  const result = await callLLMForJson(
    generateMaraDraftsPrompt(
      params.body,
      params.parentContext,
      params.subreddit,
      params.painPoint,
      params.emotionalState,
      params.promoSuitabilityScore,
      params.promoRiskScore,
      params.voiceProfile,
      params.youtubeUrl,
      params.promotionPolicy
    ),
    DraftGenerationSchema,
    { temperature: 0.7 }
  );

  // Strip soft_promo if it slipped through when it shouldn't exist
  const filtered = result.drafts.filter((d) => {
    if (d.draftType === "soft_promo") {
      return (
        params.promoSuitabilityScore >= 70 &&
        params.promoRiskScore <= 35 &&
        params.youtubeUrl.length > 0 &&
        !params.isCrisis
      );
    }
    return true;
  });

  return filtered;
}

// Fallback crisis draft — never calls LLM if not needed
async function generateCrisisDraft(
  body: string,
  _voiceProfile: MaraVoiceProfile
): Promise<DraftResult[]> {
  // Try LLM first; fall back to static template
  if (isLLMAvailable()) {
    try {
      const result = await callLLMForJson(
        [
          {
            role: "system",
            content: `You are Mara, a caring support presence. The following Reddit post may indicate a crisis. Write ONE compassionate, non-promotional reply that:
1. Acknowledges the person is in real pain
2. Encourages them to reach out to a crisis line (988 Suicide and Crisis Lifeline in the US, or their local equivalent)
3. Does NOT attempt to solve the problem or give advice
4. Does NOT mention any YouTube channel, video, or external resource except crisis services
5. Is warm, human, and brief (under 80 words)

Return ONLY this JSON:
{"drafts": [{"draftType": "crisis_safe", "body": "<reply>", "rationale": "Crisis-safe compassionate support", "riskNotes": "CRISIS CONTENT — do not add promotional content. Human review required before posting."}]}`,
          },
          { role: "user", content: body.slice(0, 800) },
        ],
        DraftGenerationSchema,
        { temperature: 0.4 }
      );
      return result.drafts;
    } catch {
      // Fall through to static template
    }
  }

  return [
    {
      draftType: "crisis_safe",
      body: "I'm really glad you shared this, and I want you to know that what you're feeling matters. Please reach out — the 988 Suicide and Crisis Lifeline is available 24/7 (call or text 988 in the US). You don't have to get through this alone tonight.",
      rationale: "Static crisis-safe template (LLM unavailable)",
      riskNotes:
        "CRISIS CONTENT — do not add promotional content. Human review required before posting.",
    },
  ];
}

// Check whether promo content ratio is within policy
export async function promoRatioCheck(prisma: {
  draftReply: {
    count: (args: {
      where: { isApproved: true; createdAt: { gte: Date } };
    }) => Promise<number>;
  };
}): Promise<{ allowed: boolean; reason?: string }> {
  const tenRecentApproved = await prisma.draftReply.count({
    where: {
      isApproved: true,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  // Promo is allowed if fewer than 1 in 10 approved in the last week would be promo
  const threshold = Math.floor(tenRecentApproved / 10);
  const promoCount = await (prisma as any).draftReply.count({
    where: {
      isApproved: true,
      draftType: "soft_promo",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  if (promoCount >= threshold + 1) {
    return {
      allowed: false,
      reason: `Promo ratio exceeded: ${promoCount} promo / ${tenRecentApproved} total in last 7 days`,
    };
  }

  return { allowed: true };
}
