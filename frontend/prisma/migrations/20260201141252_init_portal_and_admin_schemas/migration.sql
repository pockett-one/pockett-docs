-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "admin";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "portal";

-- CreateEnum
CREATE TYPE "portal"."ConnectorType" AS ENUM ('GOOGLE_DRIVE', 'GOOGLE_CALENDAR', 'GOOGLE_TASKS', 'DROPBOX', 'ONEDRIVE', 'BOX', 'NOTION', 'CONFLUENCE');

-- CreateEnum
CREATE TYPE "portal"."ConnectorStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "portal"."DocumentStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'ERROR', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "portal"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'JOINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "portal"."TicketType" AS ENUM ('BUG', 'REQUEST', 'ENQUIRY');

-- CreateEnum
CREATE TYPE "portal"."TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "portal"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'none',

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "sector" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "driveFolderId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "displayLabel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."connectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" "portal"."ConnectorType" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "googleAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "portal"."ConnectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "connectorId" UUID,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT,
    "webViewLink" TEXT,
    "content" TEXT,
    "summary" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "portal"."DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "lastModifiedAt" TIMESTAMP(3),
    "projectId" UUID,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."project_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "personaId" UUID,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."project_personas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roleId" UUID NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."project_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    "status" "portal"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "project_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."linked_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "connectorId" UUID NOT NULL,
    "fileId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_grant_revoked" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."contact_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CREATE TABLE "portal"."customer_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "portal"."TicketType" NOT NULL,
    "status" "portal"."TicketStatus" NOT NULL DEFAULT 'NEW',
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

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "portal"."organizations"("slug");

-- CreateIndex
CREATE INDEX "clients_organizationId_idx" ON "portal"."clients"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organizationId_slug_key" ON "portal"."clients"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "projects_organizationId_idx" ON "portal"."projects"("organizationId");

-- CreateIndex
CREATE INDEX "projects_clientId_idx" ON "portal"."projects"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_clientId_slug_key" ON "portal"."projects"("clientId", "slug");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "portal"."organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_userId_isDefault_idx" ON "portal"."organization_members"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "portal"."organization_members"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "portal"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_displayLabel_key" ON "portal"."role_permissions"("displayLabel");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_name_key" ON "portal"."role_permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "connectors_organizationId_googleAccountId_key" ON "portal"."connectors"("organizationId", "googleAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_organizationId_externalId_key" ON "portal"."documents"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "portal"."project_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "portal"."project_members"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_token_key" ON "portal"."project_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_projectId_email_key" ON "portal"."project_invitations"("projectId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "linked_files_connectorId_fileId_key" ON "portal"."linked_files"("connectorId", "fileId");

-- CreateIndex
CREATE INDEX "customer_requests_userId_idx" ON "portal"."customer_requests"("userId");

-- CreateIndex
CREATE INDEX "customer_requests_status_idx" ON "portal"."customer_requests"("status");

-- AddForeignKey
ALTER TABLE "portal"."clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "portal"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "portal"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "portal"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "portal"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."organization_members" ADD CONSTRAINT "organization_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "portal"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."connectors" ADD CONSTRAINT "connectors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "portal"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."documents" ADD CONSTRAINT "documents_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "portal"."connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "portal"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."documents" ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portal"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portal"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_members" ADD CONSTRAINT "project_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "portal"."project_personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_personas" ADD CONSTRAINT "project_personas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "portal"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_personas" ADD CONSTRAINT "project_personas_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "portal"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_invitations" ADD CONSTRAINT "project_invitations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portal"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_invitations" ADD CONSTRAINT "project_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "portal"."project_personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."linked_files" ADD CONSTRAINT "linked_files_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "portal"."connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SEED ROLES
INSERT INTO "portal"."roles" ("name", "displayLabel", "description", "updatedAt") VALUES
('ORG_OWNER', 'Organization Owner', 'Owner of the organization with full access', NOW()),
('ORG_MEMBER', 'Organization Member', 'Internal member of the organization', NOW()),
('ORG_GUEST', 'Organization Guest', 'External guest or client', NOW())
ON CONFLICT ("name") DO NOTHING;

-- SEED ROLE PERMISSIONS
INSERT INTO "portal"."role_permissions" ("name", "displayLabel", "description", "updatedAt") VALUES
('can_view', 'View Project', 'Can perform least privilege operations such as view', NOW()),
('can_edit', 'Edit Project', 'Can perform operative tasks such as create, modify but not delete', NOW()),
('can_manage', 'Manage Project', 'Can perform elevated tasks such as setup and delete', NOW()),
('can_comment', 'Comment on Project', 'Can provide feedback or comments on documents and project content', NOW())
ON CONFLICT ("name") DO NOTHING;

-- Row-Level Security (RLS) per HLD: org-level for org-owned tables, project-level (membership-based) for project-scoped tables.
CREATE OR REPLACE FUNCTION "portal".get_current_user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
  SELECT "projectId" FROM portal.project_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid);
$$;

ALTER TABLE "portal"."organizations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_org_id ON "portal"."organizations";
CREATE POLICY org_org_id ON "portal"."organizations"
  FOR ALL USING (id = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."clients" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_org_id ON "portal"."clients";
CREATE POLICY clients_org_id ON "portal"."clients"
  FOR ALL USING ("organizationId" = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."projects" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_org_id ON "portal"."projects";
CREATE POLICY projects_org_id ON "portal"."projects"
  FOR ALL USING ("organizationId" = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."organization_members" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_members_org_id ON "portal"."organization_members";
CREATE POLICY org_members_org_id ON "portal"."organization_members"
  FOR ALL USING ("organizationId" = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."connectors" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connectors_org_id ON "portal"."connectors";
CREATE POLICY connectors_org_id ON "portal"."connectors"
  FOR ALL USING ("organizationId" = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."project_personas" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_personas_org_id ON "portal"."project_personas";
CREATE POLICY project_personas_org_id ON "portal"."project_personas"
  FOR ALL USING ("organizationId" = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."project_members" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_members_own_or_member ON "portal"."project_members";
CREATE POLICY project_members_own_or_member ON "portal"."project_members"
  FOR ALL USING (
    ("userId" = (current_setting('app.current_user_id', true)::uuid))
    OR ("projectId" IN (SELECT "portal".get_current_user_project_ids()))
  );

ALTER TABLE "portal"."project_invitations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_invitations_member ON "portal"."project_invitations";
CREATE POLICY project_invitations_member ON "portal"."project_invitations"
  FOR ALL USING ("projectId" IN (SELECT "portal".get_current_user_project_ids()));

ALTER TABLE "portal"."documents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_org_id ON "portal"."documents";
CREATE POLICY documents_org_id ON "portal"."documents"
  FOR ALL USING ("organizationId" = (current_setting('app.current_org_id', true)::uuid));

ALTER TABLE "portal"."linked_files" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS linked_files_org_id ON "portal"."linked_files";
CREATE POLICY linked_files_org_id ON "portal"."linked_files"
  FOR ALL USING ("connectorId" IN (SELECT id FROM portal.connectors WHERE "organizationId" = (current_setting('app.current_org_id', true)::uuid)));

ALTER TABLE "portal"."customer_requests" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_requests_user_id ON "portal"."customer_requests";
CREATE POLICY customer_requests_user_id ON "portal"."customer_requests"
  FOR ALL USING (
    ("userId" = (current_setting('app.current_user_id', true)::uuid))
    OR ("organizationId" = (current_setting('app.current_org_id', true)::uuid))
  );
