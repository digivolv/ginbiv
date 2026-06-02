import { NextRequest, NextResponse } from "next/server";
import { runScan, isScanRunning } from "@/lib/scanner";
import { isRedditAvailable } from "@/lib/redditClient";
import { getSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json({
    scanning: isScanRunning(),
    redditAvailable: isRedditAvailable(),
  });
}

export async function POST(req: NextRequest) {
  if (isScanRunning()) {
    return NextResponse.json(
      { error: "A scan is already in progress. Please wait." },
      { status: 409 }
    );
  }

  if (!isRedditAvailable()) {
    return NextResponse.json(
      {
        error:
          "Reddit credentials not configured. Use Manual Input to analyze pasted content.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const settings = await getSettings();

    // full_autopilot mode is disabled in v1 unless explicitly env-enabled
    if (
      settings.autonomyMode === "full_autopilot" &&
      process.env.ALLOW_AUTONOMOUS_PROMO !== "true"
    ) {
      return NextResponse.json(
        {
          error:
            "full_autopilot mode requires ALLOW_AUTONOMOUS_PROMO=true in environment. See README for safety warnings.",
        },
        { status: 403 }
      );
    }

    // Run scan in background — return immediately with job tracking
    const scanPromise = runScan({
      dryRun: body.dryRun ?? settings.autonomyMode === "review_only",
      subredditsOverride: body.subreddits ?? undefined,
    });

    // For MVP, we wait for the result (scans are fast enough for MVP use)
    // In production, move this to a job queue
    const result = await scanPromise;

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scan failed" },
      { status: 500 }
    );
  }
}
