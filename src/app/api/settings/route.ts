import { NextRequest, NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    // Serialize any non-string values
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      patch[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    await setSettings(patch);
    const updated = await getSettings();
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}
