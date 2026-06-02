// ─── Enums ─────────────────────────────────────────────────────────────────────

export const PAIN_POINTS = [
  "no_contact_urge",
  "breakup_insomnia",
  "missing_ex",
  "self_blame",
  "anxious_attachment",
  "loneliness",
  "relapse_after_progress",
  "anger_or_betrayal",
  "general_breakup_pain",
  "crisis",
  "not_relevant",
] as const;

export type PainPoint = (typeof PAIN_POINTS)[number];

export const EMOTIONAL_STATES = [
  "devastated",
  "anxious",
  "numb",
  "angry",
  "ashamed",
  "hopeful",
  "confused",
  "desperate",
  "stable",
] as const;

export type EmotionalState = (typeof EMOTIONAL_STATES)[number];

export const OPPORTUNITY_STATUSES = [
  "new",
  "classifying",
  "classified",
  "drafting",
  "drafted",
  "approved",
  "rejected",
  "copied",
  "posted_manually",
  "auto_posted",
  "false_positive",
  "error",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const DRAFT_TYPES = [
  "no_promo",
  "soft_promo",
  "crisis_safe",
  "short_reply",
] as const;

export type DraftType = (typeof DRAFT_TYPES)[number];

export const SAFETY_STATUSES = [
  "pending",
  "safe",
  "unsafe",
  "crisis",
  "review_required",
] as const;

export type SafetyStatus = (typeof SAFETY_STATUSES)[number];

export const SOURCE_TYPES = ["post", "comment", "manual"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const AUTONOMY_MODES = [
  "review_only",
  "support_only_autopilot",
  "full_autopilot",
] as const;

export type AutonomyMode = (typeof AUTONOMY_MODES)[number];

export const AUDIT_EVENT_TYPES = [
  "discovered",
  "classified",
  "draft_generated",
  "auto_posted",
  "queued_for_review",
  "approved",
  "rejected",
  "copied",
  "posted_manually",
  "safety_check_failed",
  "safety_check_passed",
  "crisis_flagged",
  "scan_started",
  "scan_completed",
  "error",
  "false_positive",
  "author_blocked",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

// ─── LLM Response Types ────────────────────────────────────────────────────────

export interface ClassificationResult {
  painPoint: PainPoint;
  emotionalState: EmotionalState;
  relevanceScore: number;        // 0-100
  urgencyScore: number;          // 0-100
  promoSuitabilityScore: number; // 0-100
  promoRiskScore: number;        // 0-100
  isCrisis: boolean;
  shouldGenerateDraft: boolean;
  shouldAutopostSupportReply: boolean;
  shouldQueueForReview: boolean;
  reasoning: string;
  safetyNotes: string;
}

export interface DraftResult {
  draftType: DraftType;
  body: string;
  rationale: string;
  riskNotes: string;
}

export interface DraftGenerationResult {
  drafts: DraftResult[];
}

export interface SafetyCheckResult {
  isSafe: boolean;
  isCrisis: boolean;
  flags: string[];
  notes: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Reddit Types ──────────────────────────────────────────────────────────────

export interface RedditPost {
  id: string;
  subreddit: string;
  author: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  created_utc: number;
  score: number;
  num_comments: number;
  is_self: boolean;
  locked: boolean;
  removed_by_category: string | null;
}

export interface RedditComment {
  id: string;
  subreddit: string;
  author: string;
  body: string;
  permalink: string;
  created_utc: number;
  score: number;
  link_id: string;
  parent_id: string;
  link_title?: string;
}

// ─── Settings Types ────────────────────────────────────────────────────────────

export interface MaraVoiceProfile {
  tone: string;
  style: string;
  avoid: string;
  persona: string;
}

export interface PromotionPolicy {
  softPromoTopics: string[];
  noPromoWhenCrisis: boolean;
  noPromoWhenSubredditRulesUnknown: boolean;
  maxPromoRatioPerTen: number;
  alwaysProvideNoPromoVersion: boolean;
}

export interface AppSettings {
  autonomyMode: AutonomyMode;
  allowAutonomousPromo: boolean;
  maxAutonomousRepliesPerDay: number;
  maxRepliesPerSubredditPerDay: number;
  minMinutesBetweenReplies: number;
  minThreadAgeMinutes: number;
  maxContentAgeHours: number;
  trackedSubreddits: string[];
  searchKeywords: string[];
  blockedKeywords: string[];
  blockedAuthors: string[];
  maraVoiceProfile: MaraVoiceProfile;
  youtubeUrl: string;
  promotionPolicy: PromotionPolicy;
  scanIntervalMinutes: number;
  maxResultsPerScan: number;
}

// ─── Safety Check Input ─────────────────────────────────────────────────────────

export interface AutopostEligibilityCheck {
  eligible: boolean;
  reasons: string[];
}
