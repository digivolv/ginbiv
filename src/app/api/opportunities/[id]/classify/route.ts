import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { classifyContent } from "@/lib/scoring";
import { logAudit } from "@/lib/auditLogger";
import { isCrisisContent } from "@/lib/safety";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: params.id } });
    if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.opportunity.update({
      where: { id: params.id },
      data: { status: "classifying" },
    });

    const content = [opp.title, opp.body].filter(Boolean).join("\n\n");
    const classification = await classifyContent(
      content,
      opp.parentContext ?? null,
      opp.subreddit
    );

    // Deterministic crisis override
    const crisis = isCrisisContent(content) || classification.isCrisis;

    const safetyStatus = crisis
      ? "crisis"
      : classification.relevanceScore >= 80 && classification.promoRiskScore <= 20
      ? "safe"
      : "review_required";

    const updated = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        painPoint: classification.painPoint,
        emotionalState: classification.emotionalState,
        relevanceScore: classification.relevanceScore,
        urgencyScore: classification.urgencyScore,
        promoSuitabilityScore: crisis ? 0 : classification.promoSuitabilityScore,
        promoRiskScore: crisis ? 100 : classification.promoRiskScore,
        isCrisis: crisis,
        safetyStatus,
        autonomyEligible: !crisis && classification.shouldAutopostSupportReply,
        classificationReasoning: classification.reasoning,
        safetyNotes: classification.safetyNotes,
        status: "classified",
      },
    });

    await logAudit({
      opportunityId: params.id,
      eventType: "classified",
      message: `Classified: ${classification.painPoint}, relevance=${classification.relevanceScore}, crisis=${crisis}`,
      metadata: { classification },
    });

    if (crisis) {
      await logAudit({
        opportunityId: params.id,
        eventType: "crisis_flagged",
        message: "Crisis content detected — promotional drafts disabled",
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    await prisma.opportunity.update({
      where: { id: params.id },
      data: { status: "error", notes: e instanceof Error ? e.message : "Classification failed" },
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Classification failed" },
      { status: 500 }
    );
  }
}
