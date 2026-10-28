-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Stakeholder" AS ENUM ('FAN', 'PERFORMER', 'ORGANIZER', 'SPONSOR', 'PROVIDER');

-- CreateEnum
CREATE TYPE "ShowFormat" AS ENUM ('CONCERT', 'ORCHESTRAL', 'THEATRE', 'DANCE', 'COMEDY', 'EXHIBITION_MATCH', 'COMPETITION', 'BESPOKE');

-- CreateEnum
CREATE TYPE "PerformerKind" AS ENUM ('SOLO_ARTIST', 'BAND', 'ORCHESTRA', 'ENSEMBLE', 'THEATRE_COMPANY', 'PRODUCTION', 'DANCE_COMPANY', 'COMEDIAN', 'ATHLETE', 'TEAM', 'OTHER');

-- CreateEnum
CREATE TYPE "PerformerStatus" AS ENUM ('UNCLAIMED', 'CLAIMED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "Billing" AS ENUM ('HEADLINER', 'CO_HEADLINER', 'SUPPORT', 'GUEST', 'OPPONENT');

-- CreateEnum
CREATE TYPE "PerformerResponse" AS ENUM ('NOT_ASKED', 'INTERESTED', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('DRAFT', 'OPEN', 'THRESHOLD_MET', 'BOOKING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PledgeType" AS ENUM ('FAN', 'SPONSOR');

-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'CONVERTED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ThresholdSource" AS ENUM ('SYSTEM', 'ADMIN', 'PERFORMER', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FollowTarget" AS ENUM ('PERFORMER', 'REGION', 'ORGANISATION');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'EMBED', 'VIDEO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "stakeholderRoles" "Stakeholder"[] DEFAULT ARRAY['FAN']::"Stakeholder"[],
    "homeRegionId" TEXT,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'USD',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "referralCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "ShowFormat" NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PerformerKind" NOT NULL,
    "bio" TEXT,
    "countryCode" TEXT,
    "status" "PerformerStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "externalLinks" JSONB,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "claimedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformerGenre" (
    "performerId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "PerformerGenre_pkey" PRIMARY KEY ("performerId","genreId")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "format" "ShowFormat" NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'OPEN',
    "origin" "Stakeholder" NOT NULL DEFAULT 'FAN',
    "originVerified" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "regionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "offerId" TEXT,
    "pitch" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "matchKey" TEXT NOT NULL,
    "pledgeTotalMinor" BIGINT NOT NULL DEFAULT 0,
    "pledgeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "thresholdMetAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionPerformer" (
    "suggestionId" TEXT NOT NULL,
    "performerId" TEXT NOT NULL,
    "billing" "Billing" NOT NULL DEFAULT 'HEADLINER',
    "response" "PerformerResponse" NOT NULL DEFAULT 'NOT_ASKED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SuggestionPerformer_pkey" PRIMARY KEY ("suggestionId","performerId")
);

-- CreateTable
CREATE TABLE "SuggestionGenre" (
    "suggestionId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "SuggestionGenre_pkey" PRIMARY KEY ("suggestionId","genreId")
);

-- CreateTable
CREATE TABLE "Threshold" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "targetAmountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "minPledgers" INTEGER,
    "deadline" TIMESTAMP(3),
    "source" "ThresholdSource" NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Threshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pledge" (
    "id" TEXT NOT NULL,
    "type" "PledgeType" NOT NULL DEFAULT 'FAN',
    "status" "PledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "referrerId" TEXT,
    "source" TEXT,
    "sponsorName" TEXT,
    "sponsorTerms" JSONB,
    "paymentProvider" TEXT,
    "paymentProviderRef" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "as" "Stakeholder" NOT NULL,
    "note" TEXT,
    "organisation" TEXT,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "performerId" TEXT NOT NULL,
    "formats" "ShowFormat"[],
    "basePriceMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "conditions" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRegion" (
    "offerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "OfferRegion_pkey" PRIMARY KEY ("offerId","regionId")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "storageKey" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "provider" TEXT,
    "providerId" TEXT,
    "sourceUrl" TEXT,
    "title" TEXT,
    "thumbnailUrl" TEXT,
    "performerId" TEXT,
    "suggestionId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareEvent" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "userId" TEXT NOT NULL,
    "targetType" "FollowTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("userId","targetType","targetId")
);

-- CreateTable
CREATE TABLE "FxRate" (
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("base","quote")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE INDEX "Region_countryCode_idx" ON "Region"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Genre_format_idx" ON "Genre"("format");

-- CreateIndex
CREATE UNIQUE INDEX "Performer_slug_key" ON "Performer"("slug");

-- CreateIndex
CREATE INDEX "Performer_name_idx" ON "Performer"("name");

-- CreateIndex
CREATE INDEX "Performer_kind_idx" ON "Performer"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_slug_key" ON "Suggestion"("slug");

-- CreateIndex
CREATE INDEX "Suggestion_regionId_status_idx" ON "Suggestion"("regionId", "status");

-- CreateIndex
CREATE INDEX "Suggestion_format_status_idx" ON "Suggestion"("format", "status");

-- CreateIndex
CREATE INDEX "Suggestion_status_pledgeTotalMinor_idx" ON "Suggestion"("status", "pledgeTotalMinor");

-- CreateIndex
CREATE INDEX "Suggestion_matchKey_idx" ON "Suggestion"("matchKey");

-- CreateIndex
CREATE INDEX "SuggestionPerformer_performerId_idx" ON "SuggestionPerformer"("performerId");

-- CreateIndex
CREATE UNIQUE INDEX "Threshold_suggestionId_key" ON "Threshold"("suggestionId");

-- CreateIndex
CREATE INDEX "Pledge_suggestionId_status_idx" ON "Pledge"("suggestionId", "status");

-- CreateIndex
CREATE INDEX "Pledge_referrerId_idx" ON "Pledge"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "Pledge_userId_suggestionId_type_key" ON "Pledge"("userId", "suggestionId", "type");

-- CreateIndex
CREATE INDEX "Participation_suggestionId_as_idx" ON "Participation"("suggestionId", "as");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_userId_suggestionId_as_key" ON "Participation"("userId", "suggestionId", "as");

-- CreateIndex
CREATE INDEX "Media_performerId_idx" ON "Media"("performerId");

-- CreateIndex
CREATE INDEX "Media_suggestionId_idx" ON "Media"("suggestionId");

-- CreateIndex
CREATE INDEX "ShareEvent_suggestionId_platform_idx" ON "ShareEvent"("suggestionId", "platform");

-- CreateIndex
CREATE INDEX "Follow_targetType_targetId_idx" ON "Follow"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeRegionId_fkey" FOREIGN KEY ("homeRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performer" ADD CONSTRAINT "Performer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performer" ADD CONSTRAINT "Performer_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformerGenre" ADD CONSTRAINT "PerformerGenre_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformerGenre" ADD CONSTRAINT "PerformerGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionPerformer" ADD CONSTRAINT "SuggestionPerformer_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionPerformer" ADD CONSTRAINT "SuggestionPerformer_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionGenre" ADD CONSTRAINT "SuggestionGenre_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionGenre" ADD CONSTRAINT "SuggestionGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Threshold" ADD CONSTRAINT "Threshold_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRegion" ADD CONSTRAINT "OfferRegion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRegion" ADD CONSTRAINT "OfferRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareEvent" ADD CONSTRAINT "ShareEvent_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareEvent" ADD CONSTRAINT "ShareEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
