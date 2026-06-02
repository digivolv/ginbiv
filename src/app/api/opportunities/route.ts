import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const subreddit = searchParams.get("subreddit");
    const painPoint = searchParams.get("painPoint");
    const sort = searchParams.get("sort") ?? "newest";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const cursor = searchParams.get("cursor");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (subreddit) where.subreddit = subreddit;
    if (painPoint) where.painPoint = painPoint;

    const orderBy: Record<string, string>[] =
      sort === "relevance"
        ? [{ relevanceScore: "desc" }]
        : sort === "urgency"
        ? [{ urgencyScore: "desc" }]
        : sort === "promo_risk_asc"
        ? [{ promoRiskScore: "asc" }]
        : [{ discoveredAt: "desc" }];

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        drafts: { orderBy: { createdAt: "asc" } },
        _count: { select: { auditEvents: true } },
      },
    });

    const hasMore = opportunities.length > limit;
    const items = hasMore ? opportunities.slice(0, -1) : opportunities;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ items, nextCursor, hasMore });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
