// In-process rate state for the autonomous posting system.
// Tracks daily posting counts per subreddit and globally.
// Resets at midnight local time (or on process restart).
//
// For production deployments with multiple processes, this should be backed
// by the database — but for this local-first MVP, in-memory is sufficient.

interface DayBucket {
  date: string; // YYYY-MM-DD
  globalCount: number;
  perSubreddit: Record<string, number>;
  lastPostTime: number; // Date.now() ms
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

let bucket: DayBucket = {
  date: todayKey(),
  globalCount: 0,
  perSubreddit: {},
  lastPostTime: 0,
};

function ensureFreshBucket(): void {
  const today = todayKey();
  if (bucket.date !== today) {
    bucket = {
      date: today,
      globalCount: 0,
      perSubreddit: {},
      lastPostTime: bucket.lastPostTime, // carry over last post time for cooldown
    };
  }
}

export function canPostNow(params: {
  subreddit: string;
  maxGlobal: number;
  maxPerSubreddit: number;
  minMinutesBetween: number;
}): { allowed: boolean; reason?: string } {
  ensureFreshBucket();

  if (bucket.globalCount >= params.maxGlobal) {
    return {
      allowed: false,
      reason: `Daily global limit reached (${bucket.globalCount}/${params.maxGlobal})`,
    };
  }

  const subCount = bucket.perSubreddit[params.subreddit] ?? 0;
  if (subCount >= params.maxPerSubreddit) {
    return {
      allowed: false,
      reason: `Daily subreddit limit reached for r/${params.subreddit} (${subCount}/${params.maxPerSubreddit})`,
    };
  }

  if (bucket.lastPostTime > 0) {
    const elapsed = (Date.now() - bucket.lastPostTime) / 1000 / 60;
    if (elapsed < params.minMinutesBetween) {
      return {
        allowed: false,
        reason: `Cooldown active — ${params.minMinutesBetween - Math.floor(elapsed)}m remaining`,
      };
    }
  }

  return { allowed: true };
}

export function recordPost(subreddit: string): void {
  ensureFreshBucket();
  bucket.globalCount++;
  bucket.perSubreddit[subreddit] = (bucket.perSubreddit[subreddit] ?? 0) + 1;
  bucket.lastPostTime = Date.now();
}

export function getRateStats(): {
  date: string;
  globalCount: number;
  perSubreddit: Record<string, number>;
  lastPostTime: number;
} {
  ensureFreshBucket();
  return { ...bucket, perSubreddit: { ...bucket.perSubreddit } };
}
