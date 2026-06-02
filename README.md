# Mara Reddit Agent

A **local-first autonomous Reddit engagement agent** for the YouTube channel
**Sleep Affirmations With Mara** — a soothing breakup-support character.

The agent discovers Reddit posts where Mara can genuinely help (heartbreak,
no-contact, breakup insomnia, loneliness, affirmations), generates compassionate
reply drafts, and — when configured — can autonomously post supportive no-promo
replies under strict safety guardrails.

> **Default behavior: Review Only.** No post is ever made without your approval
> unless you explicitly enable `support_only_autopilot` mode.

---

## What This App Does

- Scans configured subreddits for posts related to breakups, no-contact, heartbreak, loneliness, and sleep anxiety
- Classifies content by pain point, emotional state, and relevance
- Generates Mara-style reply drafts (no-promo, short reply, and optionally soft-promo)
- Flags crisis content and prevents any promotional reply generation for it
- Lets you review, edit, approve, copy, and manually post replies via the UI
- Optionally auto-posts supportive no-promo replies in `support_only_autopilot` mode
- Maintains a full audit log of all agent decisions

## What This App Does NOT Do

- It does **not** auto-post by default
- It does **not** auto-post promotional content in any mode (requires `ALLOW_AUTONOMOUS_PROMO=true`)
- It does **not** DM users
- It does **not** vote, upvote, or manipulate engagement
- It does **not** use browser automation
- It does **not** rotate accounts or bypass Reddit protections
- It does **not** post to subreddits not on your allowlist
- It does **not** reply to the same thread or author repeatedly
- It does **not** post near-duplicate comments
- It does **not** give medical, clinical, or legal advice

---

## Requirements

- Node.js 18+
- An OpenAI API key (or compatible provider)
- Reddit API credentials (optional — app works without them in manual mode)

---

## Installation

```bash
# 1. Clone and install
git clone <repo>
cd mara-reddit-agent
npm install

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Initialize the database
npx prisma migrate dev --name init
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key (or compatible provider) |
| `LLM_MODEL` | No | Default: `gpt-4o-mini` |
| `LLM_BASE_URL` | No | Override for Ollama or other OpenAI-compatible providers |
| `REDDIT_CLIENT_ID` | No* | Reddit app client ID |
| `REDDIT_CLIENT_SECRET` | No* | Reddit app client secret |
| `REDDIT_USERNAME` | No* | Reddit account username |
| `REDDIT_PASSWORD` | No* | Reddit account password |
| `REDDIT_USER_AGENT` | No* | Format: `AppName/Version by YourRedditUsername` |
| `MARA_YOUTUBE_URL` | No | YouTube video URL for soft-promo drafts |
| `AUTONOMY_MODE` | No | `review_only` (default) or `support_only_autopilot` |
| `ALLOW_AUTONOMOUS_PROMO` | No | `false` (default) — **do not set to true** in v1 |
| `MAX_AUTONOMOUS_REPLIES_PER_DAY` | No | Default: `10` |
| `MAX_AUTONOMOUS_REPLIES_PER_SUBREDDIT_PER_DAY` | No | Default: `3` |
| `MIN_MINUTES_BETWEEN_REPLIES` | No | Default: `20` |
| `MIN_THREAD_AGE_MINUTES` | No | Default: `10` |
| `MAX_CONTENT_AGE_HOURS` | No | Default: `72` |
| `DATABASE_URL` | No | Default: `file:./dev.db` |

*Reddit credentials are optional — without them the app runs in manual-only mode.

---

## Getting Reddit API Credentials

1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "create another app"
3. Choose **script** type
4. Set redirect URI to `http://localhost:8080`
5. Copy the **client ID** (under the app name) and **client secret**
6. Use your Reddit account username and password

**Strongly recommended**: Use a dedicated Reddit account for the agent, not your personal account.

---

## Running the Database Migration

```bash
# First-time setup
npx prisma migrate dev --name init

# Seed default settings and subreddit policies
npm run db:seed

# View database in a GUI (optional)
npm run db:studio
```

---

## Starting the Dev Server

```bash
npm run dev
# Opens at http://localhost:3000
```

The app auto-redirects to `/dashboard`.

---

## Autonomy Modes

### `review_only` (default)
The agent discovers opportunities and generates drafts. It **never posts anything**.
Use this to build up a library of drafts and manually review which ones to use.

### `support_only_autopilot`
The agent **may autonomously post supportive, no-promo replies** if ALL of the
following conditions are met:

1. Draft type is `no_promo` or `short_reply`
2. No external URLs in the draft
3. No mention of YouTube, channel, or video
4. Subreddit is on the allowlist
5. Subreddit policy `allowAutonomousSupportReplies = true`
6. `relevanceScore >= 80`
7. `promoRiskScore <= 20`
8. `isCrisis = false`
9. `safetyStatus = safe`
10. Thread age ≥ configured minimum
11. Daily global and per-subreddit limits not exceeded
12. Cooldown between posts respected
13. Author not recently replied to
14. Deterministic safety check passed
15. LLM safety check passed

If **any** condition fails, the item is queued for human review.

### `full_autopilot` (disabled in v1)
This mode is included in the code for future use but is **blocked in the UI**
and requires `ALLOW_AUTONOMOUS_PROMO=true` in the environment to activate.

**Do not enable this in v1.** The risk of being perceived as spam is high.
Build a reputation for authentic helpful replies first.

---

## Safety Warnings

- **Never enable `ALLOW_AUTONOMOUS_PROMO=true`** unless you have manually reviewed
  many successful no-promo interactions and understand the subreddit rules.
- **Never add subreddits to the autonomy allowlist** without reading their rules.
- **Crisis content is never promoted** — the system has hard-coded overrides
  that set `promoSuitabilityScore=0` and `promoRiskScore=100` on any content
  that triggers crisis patterns.
- **All promotional drafts require human approval** regardless of mode.
- The agent uses a per-day rate limit and per-subreddit rate limit to prevent
  flooding communities.
- A 20-minute cooldown between autonomous posts is enforced by default.

---

## Why Promo Auto-Posting Is Disabled by Default

Reddit communities have strict rules about self-promotion and spam.
Autonomous promotional replies — even well-intentioned ones — can result in:

- Bans from subreddits
- Reddit account suspension
- Harm to your channel's reputation
- Genuine distress to vulnerable people who feel marketed to during a crisis

The `review_only` default ensures every promotional reply is a deliberate
human decision, not an algorithm.

---

## How to Add Subreddits Safely

1. Go to Settings → Tracked Subreddits and add the subreddit name
2. Read the subreddit's rules in full (especially around self-promotion and links)
3. Go to Settings → visit the Subreddit Policies section in the database or API
4. Set `allowAutonomousSupportReplies = true` **only** for subreddits that explicitly
   allow supportive community replies and do not ban links/promotion
5. Leave `allowPromoWithReview = false` unless you have verified the subreddit
   allows relevant resource sharing

---

## Running Tests

```bash
npm test
```

Tests cover:
- Crisis content detection
- Deterministic safety checks (self-promo phrases, URLs, advice language)
- Pre-filter keyword matching

---

## Known Limitations

- **No persistent scheduler**: Scans are triggered manually from the UI. A real
  cron-style scheduler would require a separate process or deployment.
- **In-memory rate state**: Daily reply counts reset on process restart. For
  production, back this with the database.
- **No comment-level scanning**: Currently scans post-level content only.
  Comment scanning would require deeper Reddit API traversal.
- **No subreddit rule auto-fetching**: Subreddit rules must be reviewed and
  configured manually.
- **No near-duplicate detection**: Draft body comparison against recent replies
  is not yet implemented.
- **LLM cost**: Each classification uses ~500-800 tokens (gpt-4o-mini is fine).
  Draft generation uses ~800-1200 tokens.

---

## Suggested Next Improvements

1. **Comment-level scanning** — traverse comments on relevant posts
2. **Persistent scheduler** — proper cron job with database-backed locks
3. **Near-duplicate detection** — cosine similarity or hash comparison on draft bodies
4. **Subreddit rule fetching** — automatically fetch and summarize subreddit rules
5. **Analytics dashboard** — track reply acceptance rate, engagement feedback
6. **Multi-video support** — different videos for different pain point categories
7. **A/B draft testing** — track which draft styles get the best community response
8. **Webhook on new opportunities** — browser notification when high-relevance item found

---

## Product Decisions Made vs. Spec

| Decision | Reason |
|---|---|
| Used `snoowrap` library instead of raw Reddit OAuth | Snoowrap handles OAuth token refresh, rate limiting, and error retries reliably |
| In-process scheduler instead of separate worker | Correct for local-first MVP; avoids process management complexity |
| Scan is synchronous (waits for result) | MVP simplicity; move to job queue for production |
| `full_autopilot` exists in code but blocked in UI | Future-proofing without shipping the risk |
| No browser automation mentioned in spec was included | Confirmed not built |
| Crisis detection is deterministic-first | LLM detection is supplemental; regex cannot be fooled by LLM output |

---

## Architecture

```
src/
  app/
    dashboard/         # Opportunity queue
    opportunities/[id] # Detail + draft editor
    manual/            # Paste input
    settings/          # Configuration
    audit/             # Audit log
    api/               # All API routes
  components/          # React UI components
  lib/
    db.ts              # Prisma singleton
    settings.ts        # Settings read/write
    redditClient.ts    # Reddit API (snoowrap)
    llmClient.ts       # OpenAI-compatible LLM
    maraPrompt.ts      # All LLM prompt templates
    scoring.ts         # Classification logic
    safety.ts          # Deterministic + LLM safety checks
    promotionPolicy.ts # Draft generation + promo rules
    scanner.ts         # Main scan pipeline
    rateState.ts       # In-memory daily rate tracking
    auditLogger.ts     # Audit event helper
  types/
    index.ts           # All TypeScript types and enums
  __tests__/
    safety.test.ts     # Unit tests for safety + scoring
prisma/
  schema.prisma
  seed.ts
```
