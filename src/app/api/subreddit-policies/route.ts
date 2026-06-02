import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const policies = await prisma.subredditPolicy.findMany({
      orderBy: { subreddit: "asc" },
    });
    return NextResponse.json(policies);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.subreddit) {
      return NextResponse.json({ error: "subreddit required" }, { status: 400 });
    }
    const policy = await prisma.subredditPolicy.upsert({
      where: { subreddit: body.subreddit },
      update: {
        isAllowed: body.isAllowed ?? true,
        allowAutonomousSupportReplies: body.allowAutonomousSupportReplies ?? false,
        allowPromoWithReview: body.allowPromoWithReview ?? false,
        allowLinks: body.allowLinks ?? false,
        maxRepliesPerDay: body.maxRepliesPerDay ?? 3,
        notes: body.notes ?? null,
        lastReviewedAt: new Date(),
      },
      create: {
        subreddit: body.subreddit,
        isAllowed: body.isAllowed ?? true,
        allowAutonomousSupportReplies: body.allowAutonomousSupportReplies ?? false,
        allowPromoWithReview: body.allowPromoWithReview ?? false,
        allowLinks: body.allowLinks ?? false,
        maxRepliesPerDay: body.maxRepliesPerDay ?? 3,
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json(policy);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
