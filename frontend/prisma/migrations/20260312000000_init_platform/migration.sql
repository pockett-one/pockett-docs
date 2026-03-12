-- =============================================================================
-- Platform schema: extensions, enums, tables, indexes, FKs, RLS
-- =============================================================================

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

-- CreateEnum
CREATE TYPE "platform"."OrgRole" AS ENUM ('org_admin', 'org_member');

-- CreateEnum
CREATE TYPE "platform"."ProjectRole" AS ENUM ('proj_admin', 'proj_member', 'proj_ext_collaborator', 'proj_viewer');

-- CreateEnum
CREATE TYPE "platform"."MembershipType" AS ENUM ('internal', 'external');

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
    "description" TEXT,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."org_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "role" "platform"."OrgRole" NOT NULL,
    "membershipType" "platform"."MembershipType" NOT NULL DEFAULT 'internal',
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
    "role" "platform"."ProjectRole" NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
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
    "organizationId" UUID NOT NULL,
    "searchIndexId" UUID,
    "externalId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "slug" TEXT,
    "createdBy" UUID,
    "updatedBy" UUID,

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
CREATE UNIQUE INDEX "org_members_userId_organizationId_key" ON "platform"."org_members"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "client_members_userId_clientId_personaId_key" ON "platform"."client_members"("userId", "clientId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_userId_projectId_key" ON "platform"."project_members"("userId", "projectId");

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
CREATE UNIQUE INDEX "project_document_sharing_slug_key" ON "platform"."project_document_sharing"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_document_sharing_projectId_organizationId_externalI_key" ON "platform"."project_document_sharing"("projectId", "organizationId", "externalId");

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
ALTER TABLE "platform"."client_members" ADD CONSTRAINT "client_members_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."client_members" ADD CONSTRAINT "client_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- =============================================================================
-- RLS (helper functions + policies)
-- =============================================================================

-- Safe extraction of current user ID (avoids invalid uuid cast when unset)
CREATE OR REPLACE FUNCTION platform.current_user_id()
RETURNS uuid AS $$
  DECLARE
    s text;
  BEGIN
    s := NULLIF(TRIM(current_setting('app.current_user_id', true)), '');
    IF s IS NULL OR s = '' THEN
      RETURN NULL;
    END IF;
    RETURN s::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Helper Functions (SECURITY DEFINER to avoid recursion when reading RLS-protected tables)
CREATE OR REPLACE FUNCTION platform.get_current_user_organization_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(ARRAY_AGG("organizationId"), ARRAY[]::uuid[]) FROM platform.org_members
  WHERE "userId" = platform.current_user_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.get_user_project_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(ARRAY_AGG("projectId"), ARRAY[]::uuid[]) FROM platform.project_members
  WHERE "userId" = platform.current_user_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.is_user_project_member(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform.project_members
    WHERE "projectId" = p_project_id
    AND "userId" = platform.current_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.is_user_client_member(p_client_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform.client_members WHERE "clientId" = p_client_id
    AND "userId" = platform.current_user_id()
  ) OR EXISTS (
    SELECT 1 FROM platform.clients c
    JOIN platform.org_members om ON om."organizationId" = c."organizationId"
    WHERE c.id = p_client_id
    AND om."userId" = platform.current_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

-- Enable RLS on platform tables
ALTER TABLE "platform"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."org_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."connectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_document_search_index" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_document_sharing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_document_sharing_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."customer_requests" ENABLE ROW LEVEL SECURITY;

-- Policies: organizations
CREATE POLICY "organizations_org_isolation" ON "platform"."organizations"
  FOR ALL USING (id = ANY(platform.get_current_user_organization_ids()));

-- Policies: org_members
CREATE POLICY "org_members_org_isolation" ON "platform"."org_members"
  FOR ALL USING ("organizationId" = ANY(platform.get_current_user_organization_ids()));

-- Policies: clients
CREATE POLICY "clients_org_client_isolation" ON "platform"."clients"
  FOR ALL USING (
    "organizationId" = ANY(platform.get_current_user_organization_ids())
    AND platform.is_user_client_member(id)
  );

-- Policies: projects
CREATE POLICY "projects_project_isolation" ON "platform"."projects"
  FOR ALL USING (platform.is_user_project_member(id));

-- Policies: project_members
CREATE POLICY "project_members_project_isolation" ON "platform"."project_members"
  FOR ALL USING ("projectId" = ANY(platform.get_user_project_ids()));

-- Policies: project_invitations
CREATE POLICY "project_invitations_project_isolation" ON "platform"."project_invitations"
  FOR ALL USING ("projectId" = ANY(platform.get_user_project_ids()));

-- Policies: connectors
CREATE POLICY "connectors_org_isolation" ON "platform"."connectors"
  FOR ALL USING (
    id IN (
      SELECT "connectorId" FROM platform.organizations
      WHERE id = ANY(platform.get_current_user_organization_ids())
      AND "connectorId" IS NOT NULL
    )
  );

-- Policies: project_document_search_index
CREATE POLICY "pdsi_project_isolation" ON "platform"."project_document_search_index"
  FOR ALL USING (platform.is_user_project_member("projectId"));

-- Policies: project_document_sharing
CREATE POLICY "pds_project_isolation" ON "platform"."project_document_sharing"
  FOR ALL USING (platform.is_user_project_member("projectId"));

-- Policies: project_document_sharing_users
CREATE POLICY "pdsu_project_isolation" ON "platform"."project_document_sharing_users"
  FOR ALL USING (
    "projectId" = ANY(platform.get_user_project_ids())
  );

-- Policies: customer_requests
CREATE POLICY "customer_requests_isolation" ON "platform"."customer_requests"
  FOR ALL USING (
    ("organizationId" IS NOT NULL AND "organizationId" = ANY(platform.get_current_user_organization_ids()))
    OR ("userId" IS NOT NULL AND "userId" = platform.current_user_id())
  );
