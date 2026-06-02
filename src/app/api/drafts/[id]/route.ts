import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/auditLogger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const allowed = ["body", "isApproved", "isCopied", "isAutoPosted", "riskNotes"];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }

    const draft = await prisma.draftReply.update({
      where: { id: params.id },
      data: patch,
    });

    if (body.isApproved === true) {
      await logAudit({
        opportunityId: draft.opportunityId,
        draftReplyId: draft.id,
        eventType: "approved",
        message: `Draft (${draft.draftType}) approved`,
      });
    }
    if (body.isCopied === true) {
      await logAudit({
        opportunityId: draft.opportunityId,
        draftReplyId: draft.id,
        eventType: "copied",
        message: `Draft (${draft.draftType}) copied to clipboard`,
      });
      // Also update opportunity status
      await prisma.opportunity.update({
        where: { id: draft.opportunityId },
        data: { status: "copied" },
      });
    }

    return NextResponse.json(draft);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.draftReply.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
