import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateDrafts } from "@/lib/promotionPolicy";
import { getSettings } from "@/lib/settings";
import { logAudit } from "@/lib/auditLogger";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: params.id } });
    if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!opp.painPoint) {
      return NextResponse.json(
        { error: "Opportunity must be classified before generating drafts" },
        { status: 400 }
      );
    }

    await prisma.opportunity.update({
      where: { id: params.id },
      data: { status: "drafting" },
    });

    const settings = await getSettings();
    const content = [opp.title, opp.body].filter(Boolean).join("\n\n");

    const drafts = await generateDrafts({
      body: content,
      parentContext: opp.parentContext ?? null,
      subreddit: opp.subreddit,
      painPoint: opp.painPoint,
      emotionalState: opp.emotionalState ?? "confused",
      promoSuitabilityScore: opp.promoSuitabilityScore ?? 0,
      promoRiskScore: opp.promoRiskScore ?? 100,
      isCrisis: opp.isCrisis,
      voiceProfile: settings.maraVoiceProfile,
      youtubeUrl: settings.youtubeUrl,
      promotionPolicy: settings.promotionPolicy,
    });

    // Remove existing drafts and replace
    await prisma.draftReply.deleteMany({ where: { opportunityId: params.id } });

    const created = await Promise.all(
      drafts.map((d) =>
        prisma.draftReply.create({
          data: {
            opportunityId: params.id,
            draftType: d.draftType,
            body: d.body,
            rationale: d.rationale,
            riskNotes: d.riskNotes,
          },
        })
      )
    );

    await prisma.opportunity.update({
      where: { id: params.id },
      data: { status: "drafted" },
    });

    await logAudit({
      opportunityId: params.id,
      eventType: "draft_generated",
      message: `${drafts.length} draft(s) generated`,
      metadata: { draftTypes: drafts.map((d) => d.draftType) },
    });

    return NextResponse.json(created);
  } catch (e) {
    await prisma.opportunity.update({
      where: { id: params.id },
      data: { status: "error", notes: e instanceof Error ? e.message : "Draft generation failed" },
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Draft generation failed" },
      { status: 500 }
    );
  }
}
