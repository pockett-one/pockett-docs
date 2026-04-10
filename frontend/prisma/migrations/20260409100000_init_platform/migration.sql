-- Squashed platform schema: enums, tables (with audit columns), client_invitations,
-- engagement_documents, engagement_canvases, platform_notifications, RLS,
-- billing caps on firms, engagement rename + RLS realignment (single baseline for fresh DB).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "platform"."ConnectorType" AS ENUM ('GOOGLE_DRIVE', 'GOOGLE_CALENDAR', 'GOOGLE_TASKS', 'DROPBOX', 'ONEDRIVE', 'BOX', 'NOTION', 'CONFLUENCE');
CREATE TYPE "platform"."ConnectorStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');
CREATE TYPE "platform"."WorkspaceRootLocation" AS ENUM ('MY_DRIVE', 'SHARED_DRIVE');
CREATE TYPE "platform"."DocumentStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'ERROR', 'ARCHIVED');
CREATE TYPE "platform"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'JOINED', 'EXPIRED');
CREATE TYPE "platform"."TicketType" AS ENUM ('BUG', 'REQUEST', 'ENQUIRY');
CREATE TYPE "platform"."TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "platform"."FirmRole" AS ENUM ('firm_admin', 'firm_member');
CREATE TYPE "platform"."EngagementRole" AS ENUM ('eng_admin', 'eng_member', 'eng_ext_collaborator', 'eng_viewer');
CREATE TYPE "platform"."MembershipType" AS ENUM ('internal', 'external');
CREATE TYPE "platform"."ClientStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'ON_HOLD', 'PAST');
CREATE TYPE "platform"."EngagementStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED');
CREATE TYPE "platform"."NotificationPriority" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "platform"."PlatformAuditScope" AS ENUM ('PROJECT');
CREATE TYPE "platform"."PlatformAuditEventType" AS ENUM ('PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_CLOSED', 'PROJECT_REOPENED', 'PROJECT_SOFT_DELETED', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED', 'PROJECT_MEMBER_ROLE_CHANGED', 'PROJECT_DOCUMENT_ADDED', 'PROJECT_DOCUMENT_REMOVED', 'PROJECT_DOCUMENT_RENAMED', 'FILE_UPLOADED', 'STATUS_CHANGE', 'SHARED_EXT', 'PROJECT_LOCKED', 'DOCUMENT_ACTIVITY_STATUS_CHANGED', 'DOCUMENT_SHARED_INTERNAL', 'DOCUMENT_SHARED_EXTERNAL', 'DOCUMENT_SHARE_FINALIZED', 'DOCUMENT_SHARE_REGRANTED', 'PROJECT_INDEX_REQUESTED', 'DOCUMENT_INDEX_REQUESTED', 'DOCUMENT_INDEX_COMPLETED', 'PROJECT_CONNECTOR_FOLDER_ATTACHED', 'PROJECT_SETTINGS_CHANGED', 'DOCUMENT_ACCESS_LOG_ENTRY');

-- CreateTable
CREATE TABLE "platform"."connectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
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
    "workspaceRootLocation" "platform"."WorkspaceRootLocation",
    "workspaceRootSharedDriveId" TEXT,
    "workspaceRootSharedDriveName" TEXT,
    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."firms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,
    "deletedAt" TIMESTAMPTZ(6),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "allowDomainAccess" BOOLEAN NOT NULL DEFAULT false,
    "allowedEmailDomain" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'none',
    "subscriptionProvider" TEXT,
    "subscriptionPlan" TEXT,
    "pricingModel" TEXT,
    "subscriptionCurrentPeriodEnd" TIMESTAMPTZ(6),
    "polarCustomerId" TEXT,
    "polarSubscriptionId" TEXT,
    "polarOrderId" TEXT,
    "billingSharesSubscriptionFromFirmId" UUID,
    "billingGroupFirmCap" INTEGER,
    "billingActiveEngagementCap" INTEGER,
    "billingCapsLocked" BOOLEAN NOT NULL DEFAULT false,
    "brandingSubtext" TEXT,
    "logoUrl" TEXT,
    "themeColorHex" TEXT,
    "connectorId" UUID,
    "firmFolderId" TEXT,
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firmId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,
    "deletedAt" TIMESTAMPTZ(6),
    "industry" TEXT,
    "sector" TEXT,
    "status" "platform"."ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" UUID,
    "website" TEXT,
    "description" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,
    "driveFolderId" TEXT,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."client_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "firmId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "projectId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firmId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,
    "deletedAt" TIMESTAMPTZ(6),
    "description" TEXT,
    "connectorRootFolderId" TEXT,
    "kickoffDate" TIMESTAMPTZ(6),
    "dueDate" TIMESTAMPTZ(6),
    "status" "platform"."EngagementStatus" NOT NULL DEFAULT 'ACTIVE',
    "contractType" TEXT,
    "rateOrValue" DECIMAL(15,2),
    "tags" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "sandboxOnly" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."personas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."firm_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "role" "platform"."FirmRole" NOT NULL,
    "membershipType" "platform"."MembershipType" NOT NULL DEFAULT 'internal',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    CONSTRAINT "firm_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."client_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    CONSTRAINT "client_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."project_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "role" "platform"."EngagementRole" NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."file_persona_grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fileId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "personaSlug" TEXT NOT NULL,
    "grantedByUserId" UUID NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "file_persona_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."project_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
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

CREATE TABLE "platform"."firm_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "firmId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    "status" "platform"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    CONSTRAINT "firm_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."client_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "clientId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    "status" "platform"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    CONSTRAINT "client_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."engagement_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "firmId" UUID NOT NULL,
    "clientId" UUID,
    "projectId" UUID NOT NULL,
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
    "dueDate" TIMESTAMPTZ(6),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "slug" TEXT,
    "createdBy" UUID,
    "updatedBy" UUID,
    CONSTRAINT "engagement_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."platform_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedBy" UUID,
    "firmId" UUID NOT NULL,
    "clientId" UUID,
    "projectId" UUID,
    "documentId" UUID,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "priority" "platform"."NotificationPriority" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "ctaUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "channels" JSONB NOT NULL DEFAULT '{}',
    "dedupeKey" TEXT,
    "readAt" TIMESTAMPTZ(6),
    "dismissedAt" TIMESTAMPTZ(6),
    "deliveredAt" TIMESTAMPTZ(6),
    "emailSentAt" TIMESTAMPTZ(6),
    CONSTRAINT "platform_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."user_personalizations" (
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "bookmarks" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    CONSTRAINT "user_personalizations_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "platform"."engagement_canvases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "firmId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "allowExternal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "engagement_canvases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."project_document_sharing_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "projectDocumentId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "googlePermissionId" TEXT,
    CONSTRAINT "project_document_sharing_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."doc_comment_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "firmId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "projectDocumentId" UUID NOT NULL,
    "authorUserId" UUID,
    "content" TEXT NOT NULL,
    "reactions" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "doc_comment_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."platform_audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firmId" UUID NOT NULL,
    "clientId" UUID,
    "projectId" UUID,
    "projectDocumentId" UUID,
    "scope" "platform"."PlatformAuditScope" NOT NULL,
    "eventType" "platform"."PlatformAuditEventType" NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "platform_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."customer_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "platform"."TicketType" NOT NULL,
    "status" "platform"."TicketStatus" NOT NULL DEFAULT 'NEW',
    "description" TEXT NOT NULL,
    "errorDetails" JSONB,
    "metadata" JSONB,
    "firmId" UUID,
    "clientId" UUID,
    "projectId" UUID,
    "userId" UUID,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform"."platform_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connectors_type_userId_key" ON "platform"."connectors"("type", "userId");
CREATE UNIQUE INDEX "firms_slug_key" ON "platform"."firms"("slug");
CREATE INDEX "firms_billingSharesSubscriptionFromFirmId_idx" ON "platform"."firms"("billingSharesSubscriptionFromFirmId");
CREATE UNIQUE INDEX "clients_firmId_slug_key" ON "platform"."clients"("firmId", "slug");
CREATE INDEX "client_contacts_firmId_clientId_idx" ON "platform"."client_contacts"("firmId", "clientId");
CREATE UNIQUE INDEX "client_contacts_clientId_email_key" ON "platform"."client_contacts"("clientId", "email");
CREATE UNIQUE INDEX "projects_clientId_slug_key" ON "platform"."projects"("clientId", "slug");
CREATE UNIQUE INDEX "personas_slug_key" ON "platform"."personas"("slug");
CREATE UNIQUE INDEX "firm_members_userId_firmId_key" ON "platform"."firm_members"("userId", "firmId");
CREATE UNIQUE INDEX "client_members_userId_clientId_personaId_key" ON "platform"."client_members"("userId", "clientId", "personaId");
CREATE UNIQUE INDEX "project_members_userId_projectId_key" ON "platform"."project_members"("userId", "projectId");
CREATE UNIQUE INDEX "project_invitations_token_key" ON "platform"."project_invitations"("token");
CREATE UNIQUE INDEX "project_invitations_projectId_email_key" ON "platform"."project_invitations"("projectId", "email");
CREATE UNIQUE INDEX "firm_invitations_token_key" ON "platform"."firm_invitations"("token");
CREATE UNIQUE INDEX "firm_invitations_firmId_email_key" ON "platform"."firm_invitations"("firmId", "email");
CREATE UNIQUE INDEX "client_invitations_token_key" ON "platform"."client_invitations"("token");
CREATE UNIQUE INDEX "client_invitations_clientId_email_key" ON "platform"."client_invitations"("clientId", "email");
CREATE UNIQUE INDEX "engagement_documents_slug_key" ON "platform"."engagement_documents"("slug");
CREATE INDEX "engagement_documents_firmId_clientId_projectId_idx" ON "platform"."engagement_documents"("firmId", "clientId", "projectId");
CREATE INDEX "engagement_documents_embedding_idx" ON "platform"."engagement_documents"("embedding");
CREATE UNIQUE INDEX "engagement_documents_projectId_firmId_externalId_key" ON "platform"."engagement_documents"("projectId", "firmId", "externalId");
CREATE INDEX "platform_notifications_firmId_clientId_userId_idx" ON "platform"."platform_notifications"("firmId", "clientId", "userId");
CREATE INDEX "platform_notifications_clientId_projectId_documentId_idx" ON "platform"."platform_notifications"("clientId", "projectId", "documentId");
CREATE INDEX "platform_notifications_userId_readAt_idx" ON "platform"."platform_notifications"("userId", "readAt");
CREATE INDEX "platform_notifications_userId_dismissedAt_idx" ON "platform"."platform_notifications"("userId", "dismissedAt");
CREATE INDEX "engagement_canvases_firmId_projectId_idx" ON "platform"."engagement_canvases"("firmId", "projectId");
CREATE UNIQUE INDEX "engagement_canvases_projectId_key" ON "platform"."engagement_canvases"("projectId");
CREATE UNIQUE INDEX "project_document_sharing_users_projectDocumentId_userId_key" ON "platform"."project_document_sharing_users"("projectDocumentId", "userId");
CREATE INDEX "doc_comment_messages_projectId_projectDocumentId_createdAt_idx" ON "platform"."doc_comment_messages"("projectId", "projectDocumentId", "createdAt");
CREATE INDEX "platform_audit_events_projectId_eventAt_idx" ON "platform"."platform_audit_events"("projectId", "eventAt");
CREATE INDEX "platform_audit_events_projectId_projectDocumentId_eventAt_idx" ON "platform"."platform_audit_events"("projectId", "projectDocumentId", "eventAt");
CREATE INDEX "idx_customer_requests_status" ON "platform"."customer_requests"("status");
CREATE INDEX "idx_customer_requests_user" ON "platform"."customer_requests"("userId");
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform"."platform_config"("key");

-- AddForeignKey
ALTER TABLE "platform"."firms" ADD CONSTRAINT "firms_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "platform"."connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."firms" ADD CONSTRAINT "firms_billingSharesSubscriptionFromFirmId_fkey" FOREIGN KEY ("billingSharesSubscriptionFromFirmId") REFERENCES "platform"."firms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."clients" ADD CONSTRAINT "clients_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."client_contacts" ADD CONSTRAINT "client_contacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."projects" ADD CONSTRAINT "projects_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."firm_members" ADD CONSTRAINT "firm_members_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."client_members" ADD CONSTRAINT "client_members_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."client_members" ADD CONSTRAINT "client_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."file_persona_grants" ADD CONSTRAINT "file_persona_grants_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."project_invitations" ADD CONSTRAINT "project_invitations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."project_invitations" ADD CONSTRAINT "project_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."firm_invitations" ADD CONSTRAINT "firm_invitations_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."firm_invitations" ADD CONSTRAINT "firm_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."client_invitations" ADD CONSTRAINT "client_invitations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."client_invitations" ADD CONSTRAINT "client_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "platform"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."engagement_documents" ADD CONSTRAINT "engagement_documents_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."engagement_documents" ADD CONSTRAINT "engagement_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."engagement_documents" ADD CONSTRAINT "engagement_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."platform_notifications" ADD CONSTRAINT "platform_notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."platform_notifications" ADD CONSTRAINT "platform_notifications_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "platform"."engagement_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."engagement_canvases" ADD CONSTRAINT "engagement_canvases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."project_document_sharing_users" ADD CONSTRAINT "project_document_sharing_users_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "platform"."engagement_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."project_document_sharing_users" ADD CONSTRAINT "project_document_sharing_users_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "platform"."engagement_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "platform"."engagement_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS helper functions
CREATE OR REPLACE FUNCTION platform.current_user_id()
RETURNS uuid AS $$
  DECLARE s text;
  BEGIN
    s := NULLIF(TRIM(current_setting('app.current_user_id', true)), '');
    IF s IS NULL OR s = '' THEN RETURN NULL; END IF;
    RETURN s::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RETURN NULL;
  END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION platform.get_current_user_firm_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(ARRAY_AGG("firmId"), ARRAY[]::uuid[]) FROM platform.firm_members WHERE "userId" = platform.current_user_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.get_user_project_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(ARRAY_AGG("projectId"), ARRAY[]::uuid[]) FROM platform.project_members WHERE "userId" = platform.current_user_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.is_user_project_member(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM platform.project_members WHERE "projectId" = p_project_id AND "userId" = platform.current_user_id());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.is_user_client_member(p_client_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM platform.client_members WHERE "clientId" = p_client_id AND "userId" = platform.current_user_id())
  OR EXISTS (SELECT 1 FROM platform.clients c JOIN platform.firm_members fm ON fm."firmId" = c."firmId" WHERE c.id = p_client_id AND fm."userId" = platform.current_user_id());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

-- Enable RLS
ALTER TABLE "platform"."firms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."firm_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."firm_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."connectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."engagement_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."project_document_sharing_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."customer_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."client_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."platform_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."user_personalizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."doc_comment_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."platform_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."engagement_canvases" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "firms_isolation" ON "platform"."firms" FOR ALL USING (id = ANY(platform.get_current_user_firm_ids()));
CREATE POLICY "firm_members_isolation" ON "platform"."firm_members" FOR ALL USING ("firmId" = ANY(platform.get_current_user_firm_ids()));
CREATE POLICY "firm_invitations_isolation" ON "platform"."firm_invitations" FOR ALL USING ("firmId" = ANY(platform.get_current_user_firm_ids()));
CREATE POLICY "clients_firm_client_isolation" ON "platform"."clients" FOR ALL USING ("firmId" = ANY(platform.get_current_user_firm_ids()) AND platform.is_user_client_member(id));
CREATE POLICY "projects_project_isolation" ON "platform"."projects" FOR ALL USING (platform.is_user_project_member(id));
CREATE POLICY "project_members_project_isolation" ON "platform"."project_members" FOR ALL USING ("projectId" = ANY(platform.get_user_project_ids()));
CREATE POLICY "project_invitations_project_isolation" ON "platform"."project_invitations" FOR ALL USING ("projectId" = ANY(platform.get_user_project_ids()));
CREATE POLICY "connectors_firm_isolation" ON "platform"."connectors" FOR ALL USING (
  id IN (SELECT "connectorId" FROM platform.firms WHERE id = ANY(platform.get_current_user_firm_ids()) AND "connectorId" IS NOT NULL)
);
CREATE POLICY "engagement_documents_project_isolation" ON "platform"."engagement_documents" FOR ALL USING (platform.is_user_project_member("projectId"));
CREATE POLICY "pdsu_project_isolation" ON "platform"."project_document_sharing_users" FOR ALL USING ("projectId" = ANY(platform.get_user_project_ids()));
CREATE POLICY "customer_requests_isolation" ON "platform"."customer_requests" FOR ALL USING (
  ("firmId" IS NOT NULL AND "firmId" = ANY(platform.get_current_user_firm_ids())) OR ("userId" IS NOT NULL AND "userId" = platform.current_user_id())
);
CREATE POLICY "client_contacts_isolation" ON "platform"."client_contacts" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND platform.is_user_client_member("clientId")
);
CREATE POLICY "platform_notifications_isolation" ON "platform"."platform_notifications" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND "userId" = platform.current_user_id()
);
CREATE POLICY "user_personalizations_isolation" ON "platform"."user_personalizations" FOR ALL USING ("userId" = platform.current_user_id());
CREATE POLICY "doc_comment_messages_isolation" ON "platform"."doc_comment_messages" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND platform.is_user_project_member("projectId")
);
CREATE POLICY "platform_audit_events_isolation" ON "platform"."platform_audit_events" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND ("projectId" IS NULL OR platform.is_user_project_member("projectId"))
);
CREATE POLICY "engagement_canvases_isolation" ON "platform"."engagement_canvases" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND platform.is_user_project_member("projectId")
);

-- Workstream B (squashed): metadata-only rename from project* to engagement*
-- Keeps reset DB baseline aligned with engagement terminology.
ALTER TABLE "platform"."projects" RENAME TO "engagements";
ALTER TABLE "platform"."project_members" RENAME TO "engagement_members";
ALTER TABLE "platform"."project_invitations" RENAME TO "engagement_invitations";
ALTER TABLE "platform"."project_document_sharing_users" RENAME TO "engagement_document_sharing_users";

ALTER TABLE "platform"."client_contacts" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."engagement_members" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."file_persona_grants" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."engagement_invitations" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."engagement_documents" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."platform_notifications" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."engagement_canvases" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."engagement_document_sharing_users" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."doc_comment_messages" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."platform_audit_events" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "platform"."customer_requests" RENAME COLUMN "projectId" TO "engagementId";

ALTER TABLE "platform"."engagements" RENAME CONSTRAINT "projects_pkey" TO "engagements_pkey";
ALTER TABLE "platform"."engagement_members" RENAME CONSTRAINT "project_members_pkey" TO "engagement_members_pkey";
ALTER TABLE "platform"."engagement_invitations" RENAME CONSTRAINT "project_invitations_pkey" TO "engagement_invitations_pkey";
ALTER TABLE "platform"."engagement_document_sharing_users" RENAME CONSTRAINT "project_document_sharing_users_pkey" TO "engagement_document_sharing_users_pkey";

ALTER TABLE "platform"."client_contacts" RENAME CONSTRAINT "client_contacts_projectId_fkey" TO "client_contacts_engagementId_fkey";
ALTER TABLE "platform"."engagement_members" RENAME CONSTRAINT "project_members_projectId_fkey" TO "engagement_members_engagementId_fkey";
ALTER TABLE "platform"."file_persona_grants" RENAME CONSTRAINT "file_persona_grants_projectId_fkey" TO "file_persona_grants_engagementId_fkey";
ALTER TABLE "platform"."engagement_invitations" RENAME CONSTRAINT "project_invitations_projectId_fkey" TO "engagement_invitations_engagementId_fkey";
ALTER TABLE "platform"."engagement_documents" RENAME CONSTRAINT "engagement_documents_projectId_fkey" TO "engagement_documents_engagementId_fkey";
ALTER TABLE "platform"."platform_notifications" RENAME CONSTRAINT "platform_notifications_projectId_fkey" TO "platform_notifications_engagementId_fkey";
ALTER TABLE "platform"."engagement_canvases" RENAME CONSTRAINT "engagement_canvases_projectId_fkey" TO "engagement_canvases_engagementId_fkey";
ALTER TABLE "platform"."engagement_document_sharing_users" RENAME CONSTRAINT "project_document_sharing_users_projectId_fkey" TO "engagement_document_sharing_users_engagementId_fkey";
ALTER TABLE "platform"."doc_comment_messages" RENAME CONSTRAINT "doc_comment_messages_projectId_fkey" TO "doc_comment_messages_engagementId_fkey";
ALTER TABLE "platform"."platform_audit_events" RENAME CONSTRAINT "platform_audit_events_projectId_fkey" TO "platform_audit_events_engagementId_fkey";

ALTER INDEX "platform"."projects_clientId_slug_key" RENAME TO "engagements_clientId_slug_key";
ALTER INDEX "platform"."project_members_userId_projectId_key" RENAME TO "engagement_members_userId_engagementId_key";
ALTER INDEX "platform"."project_invitations_token_key" RENAME TO "engagement_invitations_token_key";
ALTER INDEX "platform"."project_invitations_projectId_email_key" RENAME TO "engagement_invitations_engagementId_email_key";
ALTER INDEX "platform"."engagement_documents_firmId_clientId_projectId_idx" RENAME TO "engagement_documents_firmId_clientId_engagementId_idx";
ALTER INDEX "platform"."engagement_documents_projectId_firmId_externalId_key" RENAME TO "engagement_documents_engagementId_firmId_externalId_key";
ALTER INDEX "platform"."platform_notifications_clientId_projectId_documentId_idx" RENAME TO "platform_notifications_clientId_engagementId_documentId_idx";
ALTER INDEX "platform"."engagement_canvases_firmId_projectId_idx" RENAME TO "engagement_canvases_firmId_engagementId_idx";
ALTER INDEX "platform"."engagement_canvases_projectId_key" RENAME TO "engagement_canvases_engagementId_key";
ALTER INDEX "platform"."project_document_sharing_users_projectDocumentId_userId_key" RENAME TO "engagement_document_sharing_users_projectDocumentId_userId_key";
ALTER INDEX "platform"."doc_comment_messages_projectId_projectDocumentId_createdAt_idx" RENAME TO "doc_comment_messages_engagementId_projectDocumentId_createdAt_idx";
ALTER INDEX "platform"."platform_audit_events_projectId_eventAt_idx" RENAME TO "platform_audit_events_engagementId_eventAt_idx";
ALTER INDEX "platform"."platform_audit_events_projectId_projectDocumentId_eventAt_idx" RENAME TO "platform_audit_events_engagementId_projectDocumentId_eventAt_idx";

-- After project* → engagement* renames: RLS helpers and policies must use engagement_members / engagementId
CREATE OR REPLACE FUNCTION platform.get_user_project_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(ARRAY_AGG("engagementId"), ARRAY[]::uuid[]) FROM platform.engagement_members WHERE "userId" = platform.current_user_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

CREATE OR REPLACE FUNCTION platform.is_user_project_member(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM platform.engagement_members WHERE "engagementId" = p_project_id AND "userId" = platform.current_user_id());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = platform;

DROP POLICY IF EXISTS "projects_project_isolation" ON "platform"."engagements";
CREATE POLICY "engagements_member_isolation" ON "platform"."engagements" FOR ALL USING (platform.is_user_project_member(id));

DROP POLICY IF EXISTS "project_members_project_isolation" ON "platform"."engagement_members";
CREATE POLICY "engagement_members_isolation" ON "platform"."engagement_members" FOR ALL USING ("engagementId" = ANY(platform.get_user_project_ids()));

DROP POLICY IF EXISTS "project_invitations_project_isolation" ON "platform"."engagement_invitations";
CREATE POLICY "engagement_invitations_isolation" ON "platform"."engagement_invitations" FOR ALL USING ("engagementId" = ANY(platform.get_user_project_ids()));

DROP POLICY IF EXISTS "engagement_documents_project_isolation" ON "platform"."engagement_documents";
CREATE POLICY "engagement_documents_engagement_isolation" ON "platform"."engagement_documents" FOR ALL USING (platform.is_user_project_member("engagementId"));

DROP POLICY IF EXISTS "pdsu_project_isolation" ON "platform"."engagement_document_sharing_users";
CREATE POLICY "engagement_document_sharing_users_isolation" ON "platform"."engagement_document_sharing_users" FOR ALL USING ("engagementId" = ANY(platform.get_user_project_ids()));

DROP POLICY IF EXISTS "doc_comment_messages_isolation" ON "platform"."doc_comment_messages";
CREATE POLICY "doc_comment_messages_isolation" ON "platform"."doc_comment_messages" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND platform.is_user_project_member("engagementId")
);

DROP POLICY IF EXISTS "platform_audit_events_isolation" ON "platform"."platform_audit_events";
CREATE POLICY "platform_audit_events_isolation" ON "platform"."platform_audit_events" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND ("engagementId" IS NULL OR platform.is_user_project_member("engagementId"))
);

DROP POLICY IF EXISTS "engagement_canvases_isolation" ON "platform"."engagement_canvases";
CREATE POLICY "engagement_canvases_isolation" ON "platform"."engagement_canvases" FOR ALL USING (
  "firmId" = ANY(platform.get_current_user_firm_ids()) AND platform.is_user_project_member("engagementId")
);

-- ----------------------------------------------------------------------
-- Squashed additions (2026-04-09): firm umbrella, connector ownership, subscriptions
-- ----------------------------------------------------------------------

ALTER TABLE "platform"."connectors"
  ADD COLUMN IF NOT EXISTS "firmId" UUID;

ALTER TABLE "platform"."firms"
  ADD COLUMN IF NOT EXISTS "anchorFirmId" UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'platform' AND table_name = 'firms' AND column_name = 'sandboxOnly'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'platform' AND table_name = 'firms' AND column_name = 'isAnchor'
  ) THEN
    ALTER TABLE "platform"."firms" RENAME COLUMN "sandboxOnly" TO "isAnchor";
  END IF;
END $$;

ALTER TABLE "platform"."firms"
  ADD CONSTRAINT "firms_anchorFirmId_fkey"
  FOREIGN KEY ("anchorFirmId") REFERENCES "platform"."firms"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform"."connectors"
  ADD CONSTRAINT "connectors_firmId_fkey"
  FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "platform"."connectors" c
SET "firmId" = f."id"
FROM "platform"."firms" f
WHERE f."connectorId" = c."id"
  AND c."firmId" IS NULL;

CREATE INDEX IF NOT EXISTS "firms_anchorFirmId_idx" ON "platform"."firms"("anchorFirmId");
CREATE INDEX IF NOT EXISTS "connectors_firmId_idx" ON "platform"."connectors"("firmId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'firms_no_self_anchor_check'
  ) THEN
    ALTER TABLE "platform"."firms"
      ADD CONSTRAINT "firms_no_self_anchor_check"
      CHECK ("anchorFirmId" IS NULL OR "anchorFirmId" <> "id");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "platform"."subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" UUID,
  "updatedBy" UUID,
  "deletedAt" TIMESTAMPTZ(6),
  "deactivatedAt" TIMESTAMPTZ(6),
  "firmId" UUID NOT NULL,
  "provider" TEXT DEFAULT 'polar',
  "status" TEXT NOT NULL DEFAULT 'active',
  "plan" TEXT,
  "polarCustomerId" TEXT,
  "polarSubscriptionId" TEXT,
  "polarOrderId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "platform"."firms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "subscriptions_firmId_active_idx" ON "platform"."subscriptions"("firmId", "active");
CREATE INDEX IF NOT EXISTS "subscriptions_polarSubscriptionId_idx" ON "platform"."subscriptions"("polarSubscriptionId");

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_one_active_per_firm"
  ON "platform"."subscriptions"("firmId")
  WHERE "active" = true AND "deletedAt" IS NULL;
