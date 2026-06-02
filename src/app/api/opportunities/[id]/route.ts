import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/auditLogger";
import { OPPORTUNITY_STATUSES } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        drafts: { orderBy: { createdAt: "asc" } },
        auditEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(opp);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const allowed = [
      "status",
      "notes",
      "painPoint",
      "emotionalState",
      "relevanceScore",
      "urgencyScore",
      "promoSuitabilityScore",
      "promoRiskScore",
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }

    if ("status" in patch && !OPPORTUNITY_STATUSES.includes(patch.status as any)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.opportunity.update({
      where: { id: params.id },
      data: patch,
    });

    if (patch.status) {
      await logAudit({
        opportunityId: params.id,
        eventType: patch.status as any,
        message: `Status changed to ${patch.status}`,
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
