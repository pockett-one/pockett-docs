-- Cleanup legacy schemas
DROP SCHEMA IF EXISTS "portal" CASCADE;
DROP SCHEMA IF EXISTS "rbac" CASCADE;
DROP SCHEMA IF EXISTS "admin" CASCADE;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- CreateEnum
CREATE TYPE "platform"."ConnectorType" AS ENUM ('GOOGLE_DRIVE', 'GOOGLE_CALENDAR', 'GOOGLE_TASKS', 'DROPBOX', 'ONEDRIVE', 'BOX', 'NOTION', 'CONFLUENCE');

-- CreateEnum
CREATE TYPE "platform"."ConnectorStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "platform"."DocumentStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'ERROR', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "platform"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'JOINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "platform"."TicketType" AS ENUM ('BUG', 'REQUEST', 'ENQUIRY');

-- CreateEnum
CREATE TYPE "platform"."TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "platform"."connectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "platform"."ConnectorType" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "userId" UUID NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "platform"."ConnectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "allowDomainAccess" BOOLEAN NOT NULL DEFAULT false,
    "allowedEmailDomain" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'none',
    "brandingSubtext" TEXT,
    "logoUrl" TEXT,
    "themeColorHex" TEXT,
    "connectorId" UUID,
    "orgFolderId" TEXT,
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "industry" TEXT,
    "sector" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,
    "driveFolderId" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "connectorRootFolderId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."personas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."org_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."client_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "client_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."project_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."project_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orgId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "externalFileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" UUID,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."file_persona_grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fileId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "personaSlug" TEXT NOT NULL,
    "grantedByUserId" UUID NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_persona_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."project_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    "status" "platform"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "project_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."org_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    "status" "platform"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."project_document_search_index" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "clientId" UUID,
    "projectId" UUID,
    "connectorId" UUID,
    "externalId" TEXT NOT NULL,
    "parentId" TEXT,
    "fileName" TEXT NOT NULL,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "mimeType" TEXT,
    "fileSize" BIGINT,
    "status" "platform"."DocumentStatus" NOT NULL DEFAULT 'PROCESSED',
    "content" TEXT,
    "embedding" vector,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_document_search_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."project_document_sharing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    "searchIndexId" UUID,
    "externalId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "project_document_sharing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."project_document_sharing_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sharingId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "googlePermissionId" TEXT,

    CONSTRAINT "project_document_sharing_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."customer_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "platform"."TicketType" NOT NULL,
    "status" "platform"."TicketStatus" NOT NULL DEFAULT 'NEW',
    "description" TEXT NOT NULL,
    "errorDetails" JSONB,
    "metadata" JSONB,
    "organizationId" UUID,
    "clientId" UUID,
    "projectId" UUID,
    "userId" UUID,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."platform_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connectors_type_userId_key" ON "platform"."connectors"("type", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "platform"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organizationId_slug_key" ON "platform"."clients"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "projects_clientId_slug_key" ON "platform"."projects"("clientId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "personas_slug_key" ON "platform"."personas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_userId_organizationId_personaId_key" ON "platform"."org_members"("userId", "organizationId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "client_members_userId_clientId_personaId_key" ON "platform"."client_members"("userId", "clientId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_userId_projectId_personaId_key" ON "platform"."project_members"("userId", "projectId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_token_key" ON "platform"."project_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_projectId_email_key" ON "platform"."project_invitations"("projectId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_token_key" ON "platform"."org_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_organizationId_email_key" ON "platform"."org_invitations"("organizationId", "email");

-- CreateIndex
CREATE INDEX "pdsi_org_client_project_idx_v2" ON "platform"."project_document_search_index"("organizationId", "clientId", "projectId");

-- CreateIndex
CREATE INDEX "pdsi_embedding_idx_v2" ON "platform"."project_document_search_index"("embedding");

-- CreateIndex
CREATE UNIQUE INDEX "pdsi_org_external_idx_v2" ON "platform"."project_document_search_index"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "project_document_sharing_users_sharingId_userId_key" ON "platform"."project_document_sharing_users"("sharingId", "userId");

-- CreateIndex
CREATE INDEX "idx_customer_requests_status" ON "platform"."customer_requests"("status");

-- CreateIndex
CREATE INDEX "idx_customer_requests_user" ON "platform"."customer_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform"."platform_config"("key");

-- AddForeignKey
ALTER TABLE "platform"."organizations" ADD CONSTRAINT "organizations_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "platform"."connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."org_members" ADD CONSTRAINT "org_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."org_members" ADD CONSTRAINT "org_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."client_members" ADD CONSTRAINT "client_members_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."client_members" ADD CONSTRAINT "client_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_members" ADD CONSTRAINT "project_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_files" ADD CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."file_persona_grants" ADD CONSTRAINT "file_persona_grants_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_invitations" ADD CONSTRAINT "project_invitations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_invitations" ADD CONSTRAINT "project_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."org_invitations" ADD CONSTRAINT "org_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."org_invitations" ADD CONSTRAINT "org_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_document_search_index" ADD CONSTRAINT "project_document_search_index_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_document_search_index" ADD CONSTRAINT "project_document_search_index_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_document_sharing" ADD CONSTRAINT "project_document_sharing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_document_sharing" ADD CONSTRAINT "project_document_sharing_searchIndexId_fkey" FOREIGN KEY ("searchIndexId") REFERENCES "platform"."project_document_search_index"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_document_sharing_users" ADD CONSTRAINT "project_document_sharing_users_sharingId_fkey" FOREIGN KEY ("sharingId") REFERENCES "platform"."project_document_sharing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_document_sharing_users" ADD CONSTRAINT "project_document_sharing_users_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
