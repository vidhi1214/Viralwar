-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CREATOR', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "campaign_status" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED', 'SETTLING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "campaign_metric_metric" AS ENUM ('VIEWS', 'LIKES', 'COMMENTS', 'SHARES', 'SAVES', 'WATCH_TIME', 'CLICKS', 'CONVERSIONS', 'REVENUE');

-- CreateEnum
CREATE TYPE "campaign_metric_cap_type" AS ENUM ('NONE', 'ABSOLUTE', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "fraud_signal_status" AS ENUM ('CLEAR', 'REVIEW', 'RESTRICTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "reward_status" AS ENUM ('CALCULATING', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "attribution_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'CREATOR',
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profile" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "categories" TEXT[] NOT NULL DEFAULT '{}',
    "languages" TEXT[] NOT NULL DEFAULT '{}',
    "location" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedStatus" BOOLEAN NOT NULL DEFAULT false,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "creator_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "website" TEXT,
    "verificationStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_membership" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "product" TEXT,
    "objective" TEXT,
    "status" "campaign_status" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "prizePool" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "rules" JSONB,
    "eligibility" JSONB,
    "platforms" TEXT[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_participant" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "campaign_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_metric_config" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "metric" "campaign_metric_metric" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "capType" "campaign_metric_cap_type" NOT NULL DEFAULT 'NONE',
    "capValue" DOUBLE PRECISION,
    "minimumThreshold" DOUBLE PRECISION,
    "maximumThreshold" DOUBLE PRECISION,

    CONSTRAINT "campaign_metric_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "caption" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metric_snapshot" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "submissionId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "watchTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "content_metric_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entry" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movement" TEXT NOT NULL DEFAULT 'NONE',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "reason" TEXT NOT NULL,
    "status" "reward_status" NOT NULL DEFAULT 'CALCULATING',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "rewardId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "failureReason" TEXT,
    "failureAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_account" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalAccountId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "scopes" TEXT[] NOT NULL DEFAULT '{}',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_event" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "submissionId" TEXT,
    "clickId" TEXT,
    "conversionId" TEXT,
    "click" BOOLEAN NOT NULL DEFAULT false,
    "conversion" BOOLEAN NOT NULL DEFAULT false,
    "order" TEXT,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "attribution_status" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "attribution_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insight" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "campaignId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_signal" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "creatorId" TEXT NOT NULL,
    "submissionId" TEXT,
    "campaignId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" "fraud_signal_status" NOT NULL DEFAULT 'CLEAR',

    CONSTRAINT "fraud_signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL DEFAULT substring(md5(random()::text || now()::text) from 1 for 36),
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profile_userId_key" ON "creator_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_slug_key" ON "brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_membership_organizationId_key" ON "organization_membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metric_config_campaignId_metric_key" ON "campaign_metric_config"("campaignId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "content_metric_snapshot_submissionId_capturedAt_key" ON "content_metric_snapshot"("submissionId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entry_campaignId_creatorId_key" ON "leaderboard_entry"("campaignId", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "attribution_event_idempotencyKey_key" ON "attribution_event"("idempotencyKey");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE INDEX "creator_profile_username_idx" ON "creator_profile"("username");

ALTER TABLE "campaign" ADD CONSTRAINT "campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_membership" ADD CONSTRAINT "organization_membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_membership" ADD CONSTRAINT "organization_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_participant" ADD CONSTRAINT "campaign_participant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_participant" ADD CONSTRAINT "campaign_participant_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_metric_config" ADD CONSTRAINT "campaign_metric_config_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "submission" ADD CONSTRAINT "submission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "submission" ADD CONSTRAINT "submission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_metric_snapshot" ADD CONSTRAINT "content_metric_snapshot_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leaderboard_entry" ADD CONSTRAINT "leaderboard_entry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leaderboard_entry" ADD CONSTRAINT "leaderboard_entry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reward" ADD CONSTRAINT "reward_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reward" ADD CONSTRAINT "reward_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payout" ADD CONSTRAINT "payout_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_account" ADD CONSTRAINT "social_account_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attribution_event" ADD CONSTRAINT "attribution_event_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attribution_event" ADD CONSTRAINT "attribution_event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attribution_event" ADD CONSTRAINT "attribution_event_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_insight" ADD CONSTRAINT "ai_insight_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fraud_signal" ADD CONSTRAINT "fraud_signal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fraud_signal" ADD CONSTRAINT "fraud_signal_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fraud_signal" ADD CONSTRAINT "fraud_signal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;