-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "redditId" TEXT,
    "redditUrl" TEXT,
    "parentRedditId" TEXT,
    "title" TEXT,
    "author" TEXT,
    "body" TEXT NOT NULL,
    "parentContext" TEXT,
    "createdAtReddit" DATETIME,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "painPoint" TEXT,
    "emotionalState" TEXT,
    "relevanceScore" INTEGER,
    "urgencyScore" INTEGER,
    "promoSuitabilityScore" INTEGER,
    "promoRiskScore" INTEGER,
    "classificationReasoning" TEXT,
    "safetyNotes" TEXT,
    "autonomyEligible" BOOLEAN NOT NULL DEFAULT false,
    "safetyStatus" TEXT,
    "isCrisis" BOOLEAN NOT NULL DEFAULT false,
    "shouldAutopost" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "rawJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DraftReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "draftType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rationale" TEXT,
    "riskNotes" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isCopied" BOOLEAN NOT NULL DEFAULT false,
    "isAutoPosted" BOOLEAN NOT NULL DEFAULT false,
    "redditReplyId" TEXT,
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DraftReply_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubredditPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subreddit" TEXT NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,
    "allowAutonomousSupportReplies" BOOLEAN NOT NULL DEFAULT false,
    "allowPromoWithReview" BOOLEAN NOT NULL DEFAULT false,
    "allowLinks" BOOLEAN NOT NULL DEFAULT false,
    "maxRepliesPerDay" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthorBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "mode" TEXT NOT NULL,
    "isDryRun" BOOLEAN NOT NULL DEFAULT true,
    "subredditsScanned" TEXT,
    "opportunitiesFound" INTEGER NOT NULL DEFAULT 0,
    "draftsGenerated" INTEGER NOT NULL DEFAULT 0,
    "autoRepliesPosted" INTEGER NOT NULL DEFAULT 0,
    "queuedForReview" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT,
    "draftReplyId" TEXT,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_redditId_key" ON "Opportunity"("redditId");

-- CreateIndex
CREATE UNIQUE INDEX "SubredditPolicy_subreddit_key" ON "SubredditPolicy"("subreddit");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorBlock_username_key" ON "AuthorBlock"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");
