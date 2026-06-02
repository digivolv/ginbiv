import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const opportunityId = searchParams.get("opportunityId");
    const eventType = searchParams.get("eventType");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
    const cursor = searchParams.get("cursor");

    const where: Record<string, unknown> = {};
    if (opportunityId) where.opportunityId = opportunityId;
    if (eventType) where.eventType = eventType;

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        opportunity: {
          select: {
            subreddit: true,
            title: true,
            author: true,
            redditUrl: true,
          },
        },
      },
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, -1) : events;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ items, nextCursor, hasMore });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load audit log" },
      { status: 500 }
    );
  }
}
