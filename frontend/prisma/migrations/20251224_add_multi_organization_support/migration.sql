-- ============================================
-- IMPORTANT: This migration will DELETE ALL existing data
-- This is necessary for the breaking schema change
-- Make sure to backup any important data before running
-- ============================================

-- Step 0: Clean up all existing data (cascading deletes will handle related records)
-- Delete all documents (will cascade to related data)
DELETE FROM "documents";

-- Delete all connectors (will cascade to related data)
DELETE FROM "connectors";

-- Delete all organizations (will cascade to related data)
DELETE FROM "organizations";

-- Delete all contact submissions (optional, but for clean slate)
DELETE FROM "contact_submissions";

-- Delete Supabase auth users
-- For LOCAL (Docker Supabase): This will work
-- For PRODUCTION: Manually delete via Supabase Dashboard > Authentication > Users BEFORE deployment
DELETE FROM auth.users;

-- Drop existing tables if they exist (for clean reset)
DROP TABLE IF EXISTS "organization_members" CASCADE;
DROP TYPE IF EXISTS "MemberRole" CASCADE;

-- ============================================
-- Schema Changes Begin
-- ============================================

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'OWNER',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_userId_isDefault_idx" ON "organization_members"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add slug column to organizations
ALTER TABLE "organizations" ADD COLUMN "slug" TEXT;

-- Since we deleted all data, we can directly make it non-nullable
ALTER TABLE "organizations" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Drop old columns from organizations
ALTER TABLE "organizations" DROP COLUMN "userId";
ALTER TABLE "organizations" DROP COLUMN "email";
ALTER TABLE "organizations" DROP COLUMN "displayName";
ALTER TABLE "organizations" DROP COLUMN "avatarUrl";
