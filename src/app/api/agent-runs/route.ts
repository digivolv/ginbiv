import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getRateStats } from "@/lib/rateState";

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10), 100);
    const runs = await prisma.agentRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    const rateStats = getRateStats();
    return NextResponse.json({ runs, rateStats });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
