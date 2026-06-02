import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const blocks = await prisma.authorBlock.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(blocks);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, reason } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }
    const block = await prisma.authorBlock.upsert({
      where: { username },
      update: { reason },
      create: { username, reason },
    });
    return NextResponse.json(block);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { username } = await req.json();
    await prisma.authorBlock.delete({ where: { username } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
