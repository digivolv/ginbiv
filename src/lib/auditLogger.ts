import prisma from "./db";
import type { AuditEventType } from "@/types";

export async function logAudit(params: {
  opportunityId?: string;
  draftReplyId?: string;
  eventType: AuditEventType;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        opportunityId: params.opportunityId ?? null,
        draftReplyId: params.draftReplyId ?? null,
        eventType: params.eventType,
        message: params.message,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (e) {
    // Audit logging must never break the main flow
    console.error("[AuditLogger] Failed to log event:", e);
  }
}
