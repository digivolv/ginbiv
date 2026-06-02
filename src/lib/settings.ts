import prisma from "./db";
import type { AppSettings, AutonomyMode } from "@/types";

// Parses a JSON string value safely; returns fallback on failure
function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.settings.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    autonomyMode: (map.autonomyMode as AutonomyMode) ?? "review_only",
    allowAutonomousPromo: map.allowAutonomousPromo === "true",
    maxAutonomousRepliesPerDay: parseInt(map.maxAutonomousRepliesPerDay ?? "10", 10),
    maxRepliesPerSubredditPerDay: parseInt(map.maxRepliesPerSubredditPerDay ?? "3", 10),
    minMinutesBetweenReplies: parseInt(map.minMinutesBetweenReplies ?? "20", 10),
    minThreadAgeMinutes: parseInt(map.minThreadAgeMinutes ?? "10", 10),
    maxContentAgeHours: parseInt(map.maxContentAgeHours ?? "72", 10),
    trackedSubreddits: parseJson<string[]>(map.trackedSubreddits ?? "[]", [
      "BreakUps",
      "ExNoContact",
      "heartbreak",
      "dating_advice",
    ]),
    searchKeywords: parseJson<string[]>(map.searchKeywords ?? "[]", []),
    blockedKeywords: parseJson<string[]>(map.blockedKeywords ?? "[]", []),
    blockedAuthors: parseJson<string[]>(map.blockedAuthors ?? "[]", []),
    maraVoiceProfile: parseJson(map.maraVoiceProfile ?? "{}", {
      tone: "soft, warm, soothing, emotionally intelligent",
      style: "non-judgmental, late-night comfort, gently poetic, validating, practical",
      avoid: "corporate language, fake cheerfulness, therapy-speak, manipulation",
      persona:
        "A calm voice beside someone at night, helping them not text their ex and helping them sleep.",
    }),
    youtubeUrl: map.youtubeUrl ?? process.env.MARA_YOUTUBE_URL ?? "",
    promotionPolicy: parseJson(map.promotionPolicy ?? "{}", {
      softPromoTopics: ["sleep", "night anxiety", "affirmations", "no-contact urges", "meditation", "comfort"],
      noPromoWhenCrisis: true,
      noPromoWhenSubredditRulesUnknown: true,
      maxPromoRatioPerTen: 1,
      alwaysProvideNoPromoVersion: true,
    }),
    scanIntervalMinutes: parseInt(map.scanIntervalMinutes ?? "60", 10),
    maxResultsPerScan: parseInt(map.maxResultsPerScan ?? "50", 10),
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function setSettings(patch: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(patch).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
}
