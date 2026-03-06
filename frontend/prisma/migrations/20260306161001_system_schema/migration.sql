-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "system";

-- CreateTable
CREATE TABLE "system"."system_admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "system_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."contact_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "email" TEXT,
    "plan" TEXT,
    "role" TEXT,
    "team_size" TEXT,
    "pain_point" TEXT,
    "feature_request" TEXT,
    "comments" TEXT,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."waitlist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Pro',
    "company_name" TEXT,
    "company_size" TEXT,
    "role" TEXT,
    "comments" TEXT,
    "ip_address" TEXT,
    "referral_code" TEXT DEFAULT "substring"((gen_random_uuid())::text, 1, 8),
    "referred_by" TEXT,
    "referral_count" INTEGER NOT NULL DEFAULT 0,
    "position_boost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_referral_code_key" ON "system"."waitlist"("referral_code");

-- CreateIndex
CREATE INDEX "idx_waitlist_created_at" ON "system"."waitlist"("created_at");

-- CreateIndex
CREATE INDEX "idx_waitlist_email" ON "system"."waitlist"("email");

-- CreateIndex
CREATE INDEX "idx_waitlist_plan" ON "system"."waitlist"("plan");

-- CreateIndex
CREATE INDEX "idx_waitlist_referral_code" ON "system"."waitlist"("referral_code");

-- CreateIndex
CREATE INDEX "idx_waitlist_referred_by" ON "system"."waitlist"("referred_by");
