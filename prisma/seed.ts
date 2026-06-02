import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: Record<string, string> = {
  autonomyMode: "review_only",
  allowAutonomousPromo: "false",
  maxAutonomousRepliesPerDay: "10",
  maxRepliesPerSubredditPerDay: "3",
  minMinutesBetweenReplies: "20",
  minThreadAgeMinutes: "10",
  maxContentAgeHours: "72",
  trackedSubreddits: JSON.stringify([
    "BreakUps",
    "ExNoContact",
    "heartbreak",
    "dating_advice",
  ]),
  searchKeywords: JSON.stringify([
    "can't sleep",
    "cannot sleep",
    "want to text my ex",
    "no contact",
    "miss my ex",
    "breakup",
    "heartbroken",
    "lonely at night",
    "anxiety after breakup",
    "affirmations",
    "moving on",
    "relapse",
    "healing",
    "self worth",
  ]),
  blockedKeywords: JSON.stringify([
    "lawyer",
    "attorney",
    "legal advice",
    "doctor",
    "medication",
    "prescription",
    "diagnosis",
    "therapy",
    "suicide hotline",
  ]),
  blockedAuthors: JSON.stringify([]),
  maraVoiceProfile: JSON.stringify({
    tone: "soft, warm, soothing, emotionally intelligent",
    style:
      "non-judgmental, late-night comfort, gently poetic, validating, practical",
    avoid:
      "corporate language, fake cheerfulness, therapy-speak, manipulation, sexual content",
    persona:
      "A calm voice beside someone at night, helping them not text their ex and helping them sleep.",
  }),
  youtubeUrl: process.env.MARA_YOUTUBE_URL ?? "",
  promotionPolicy: JSON.stringify({
    softPromoTopics: [
      "sleep",
      "night anxiety",
      "affirmations",
      "no-contact urges",
      "meditation",
      "comfort",
    ],
    noPromoWhenCrisis: true,
    noPromoWhenSubredditRulesUnknown: true,
    maxPromoRatioPerTen: 1,
    alwaysProvideNoPromoVersion: true,
  }),
  scanIntervalMinutes: "60",
  maxResultsPerScan: "50",
};

const DEFAULT_SUBREDDIT_POLICIES = [
  {
    subreddit: "BreakUps",
    isAllowed: true,
    allowAutonomousSupportReplies: true,
    allowPromoWithReview: false,
    allowLinks: false,
    maxRepliesPerDay: 3,
    notes:
      "Active community. No self-promotion. Support replies are generally welcome.",
  },
  {
    subreddit: "ExNoContact",
    isAllowed: true,
    allowAutonomousSupportReplies: false,
    allowPromoWithReview: false,
    allowLinks: false,
    maxRepliesPerDay: 2,
    notes:
      "Strict community. Links typically banned. Manual review recommended for all replies.",
  },
  {
    subreddit: "heartbreak",
    isAllowed: true,
    allowAutonomousSupportReplies: true,
    allowPromoWithReview: false,
    allowLinks: false,
    maxRepliesPerDay: 3,
    notes: "Supportive community. Resource links require mod approval.",
  },
  {
    subreddit: "dating_advice",
    isAllowed: true,
    allowAutonomousSupportReplies: false,
    allowPromoWithReview: false,
    allowLinks: false,
    maxRepliesPerDay: 2,
    notes: "Mixed content. Careful — many posts are not suitable for Mara.",
  },
];

async function main() {
  console.log("Seeding database...");

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  for (const policy of DEFAULT_SUBREDDIT_POLICIES) {
    await prisma.subredditPolicy.upsert({
      where: { subreddit: policy.subreddit },
      update: policy,
      create: policy,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
