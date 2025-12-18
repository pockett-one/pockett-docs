-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ConnectorType" AS ENUM ('GOOGLE_DRIVE', 'GOOGLE_CALENDAR', 'GOOGLE_TASKS', 'DROPBOX', 'ONEDRIVE', 'BOX', 'NOTION', 'CONFLUENCE');

-- CreateEnum
CREATE TYPE "public"."ConnectorStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'ERROR', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connectors" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."ConnectorType" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "googleAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "public"."ConnectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorId" TEXT,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT,
    "webViewLink" TEXT,
    "content" TEXT,
    "summary" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "lastModifiedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "plan" TEXT,
    "role" TEXT,
    "team_size" TEXT,
    "pain_point" TEXT,
    "feature_request" TEXT,
    "comments" TEXT,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_userId_key" ON "public"."organizations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "connectors_organizationId_googleAccountId_key" ON "public"."connectors"("organizationId", "googleAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_organizationId_externalId_key" ON "public"."documents"("organizationId", "externalId");

-- AddForeignKey
ALTER TABLE "public"."connectors" ADD CONSTRAINT "connectors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "public"."connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

