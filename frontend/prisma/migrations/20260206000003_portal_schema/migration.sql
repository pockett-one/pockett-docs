-- ============================================================================
-- Portal Schema — Canonical Squashed Migration
-- Combines all portal schema changes into a single source of truth.
-- ============================================================================

-- Enable pgvector extension (required for project_document_search_index)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create Portal Schema
CREATE SCHEMA IF NOT EXISTS portal;

-- ============================================================================
-- Enums
-- ============================================================================

DROP TYPE IF EXISTS portal."ConnectorType" CASCADE;
CREATE TYPE portal."ConnectorType" AS ENUM ('GOOGLE_DRIVE', 'GOOGLE_CALENDAR', 'GOOGLE_TASKS', 'DROPBOX', 'ONEDRIVE', 'BOX', 'NOTION', 'CONFLUENCE');

DROP TYPE IF EXISTS portal."ConnectorStatus" CASCADE;
CREATE TYPE portal."ConnectorStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

DROP TYPE IF EXISTS portal."DocumentStatus" CASCADE;
CREATE TYPE portal."DocumentStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'ERROR', 'ARCHIVED');

DROP TYPE IF EXISTS portal."InvitationStatus" CASCADE;
CREATE TYPE portal."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'JOINED', 'EXPIRED');

DROP TYPE IF EXISTS portal."TicketType" CASCADE;
CREATE TYPE portal."TicketType" AS ENUM ('BUG', 'REQUEST', 'ENQUIRY');

DROP TYPE IF EXISTS portal."TicketStatus" CASCADE;
CREATE TYPE portal."TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- ============================================================================
-- Drop All Portal Tables (Clean slate)
-- ============================================================================

DROP TABLE IF EXISTS portal.project_document_sharing CASCADE;
DROP TABLE IF EXISTS portal.project_document_search_index CASCADE;
DROP TABLE IF EXISTS portal.connector_linked_files CASCADE;
DROP TABLE IF EXISTS portal.customer_requests CASCADE;
DROP TABLE IF EXISTS portal.linked_files CASCADE;
DROP TABLE IF EXISTS portal.documents CASCADE;
DROP TABLE IF EXISTS portal.project_invitations CASCADE;
DROP TABLE IF EXISTS portal.project_members CASCADE;
DROP TABLE IF EXISTS portal.project_personas CASCADE;
DROP TABLE IF EXISTS portal.client_members CASCADE;
DROP TABLE IF EXISTS portal.client_personas CASCADE;
DROP TABLE IF EXISTS portal.organization_members CASCADE;
DROP TABLE IF EXISTS portal.organization_personas CASCADE;
DROP TABLE IF EXISTS portal.connectors CASCADE;
DROP TABLE IF EXISTS portal.projects CASCADE;
DROP TABLE IF EXISTS portal.clients CASCADE;
DROP TABLE IF EXISTS portal.organizations CASCADE;

-- Drop legacy portal roles tables (replaced by rbac schema)
DROP TABLE IF EXISTS portal.roles CASCADE;
DROP TABLE IF EXISTS portal.role_permissions CASCADE;

-- ============================================================================
-- Portal Tables
-- ============================================================================

-- Organizations
CREATE TABLE portal.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    "allowDomainAccess" BOOLEAN NOT NULL DEFAULT false,
    "allowedEmailDomain" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'none',
    -- Branding
    "brandingSubtext" TEXT,
    "logoUrl" TEXT,
    "themeColorHex" TEXT
);

-- Clients
CREATE TABLE portal.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    industry TEXT,
    sector TEXT,
    status TEXT DEFAULT 'ACTIVE',
    settings JSONB NOT NULL DEFAULT '{}',
    UNIQUE("organizationId", slug)
);

-- Projects
CREATE TABLE portal.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    "connectorRootFolderId" TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    UNIQUE("clientId", slug)
);

-- Organization Personas
CREATE TABLE portal.organization_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "rbacPersonaId" UUID NOT NULL REFERENCES rbac.personas(id),
    "displayName" TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("organizationId", "rbacPersonaId")
);

-- Organization Members
CREATE TABLE portal.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationPersonaId" UUID REFERENCES portal.organization_personas(id),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    UNIQUE("organizationId", "userId")
);

-- Client Personas
CREATE TABLE portal.client_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientId" UUID NOT NULL,
    "rbacPersonaId" UUID NOT NULL REFERENCES rbac.personas(id),
    "displayName" TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("clientId", "rbacPersonaId")
);

-- Client Members
CREATE TABLE portal.client_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientPersonaId" UUID REFERENCES portal.client_personas(id),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    UNIQUE("clientId", "userId")
);

-- Project Personas
CREATE TABLE portal.project_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "rbacPersonaId" UUID NOT NULL REFERENCES rbac.personas(id),
    "displayName" TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("projectId", "rbacPersonaId")
);

-- Project Members
CREATE TABLE portal.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "personaId" UUID REFERENCES portal.project_personas(id),
    settings JSONB NOT NULL DEFAULT '{}',
    UNIQUE("projectId", "userId")
);

-- Project Invitations
CREATE TABLE portal.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    email TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    status portal."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    token TEXT UNIQUE NOT NULL,
    "expireAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    UNIQUE("projectId", email)
);

-- Connectors
-- Note: accessToken and refreshToken store AES-256-GCM encrypted ciphertext
CREATE TABLE portal.connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    type portal."ConnectorType" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "externalAccountId" TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    status portal."ConnectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    settings JSONB NOT NULL DEFAULT '{}',
    UNIQUE("organizationId", type, "externalAccountId")
);

-- Connector Linked Files
-- Tracks which Drive files/folders are linked to a connector (grants access context)
CREATE TABLE portal.connector_linked_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "connectorId" UUID NOT NULL,
    "fileId" TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    "is_grant_revoked" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("connectorId", "fileId")
);

-- Project Document Search Index
-- Central store for file metadata and vector embeddings; used for semantic search and sharing
CREATE TABLE portal.project_document_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status portal."DocumentStatus" NOT NULL DEFAULT 'PROCESSED',
    content TEXT,
    embedding vector(384),
    metadata JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Document Sharing
-- Per-document share settings scoped to a project, linked to the search index by (organizationId, externalId)
CREATE TABLE portal.project_document_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    -- URL-safe slug for share detail routes (e.g. document-name-a1b2c3d4). Unique per project.
    slug TEXT,
    -- Set when share settings are updated (different from createdBy when someone else edits)
    "updatedBy" UUID,
    "organizationId" UUID,
    "externalId" TEXT
);

-- Customer Requests
CREATE TABLE portal.customer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW',
    description TEXT NOT NULL,
    "errorDetails" JSONB,
    metadata JSONB,
    "organizationId" UUID,
    "clientId" UUID,
    "projectId" UUID,
    "userId" UUID,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_organization ON portal.clients("organizationId");
CREATE INDEX IF NOT EXISTS idx_projects_organization ON portal.projects("organizationId");
CREATE INDEX IF NOT EXISTS idx_projects_client ON portal.projects("clientId");
CREATE INDEX IF NOT EXISTS idx_org_members_user ON portal.organization_members("userId");
CREATE INDEX IF NOT EXISTS idx_org_members_user_default ON portal.organization_members("userId", "isDefault");
CREATE INDEX IF NOT EXISTS idx_client_members_user ON portal.client_members("userId");
CREATE INDEX IF NOT EXISTS idx_project_members_user ON portal.project_members("userId");
CREATE INDEX IF NOT EXISTS idx_customer_requests_user ON portal.customer_requests("userId");
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON portal.customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_org_personas_org ON portal.organization_personas("organizationId");
CREATE INDEX IF NOT EXISTS idx_org_personas_rbac ON portal.organization_personas("rbacPersonaId");
CREATE INDEX IF NOT EXISTS idx_client_personas_client ON portal.client_personas("clientId");
CREATE INDEX IF NOT EXISTS idx_client_personas_rbac ON portal.client_personas("rbacPersonaId");
CREATE INDEX IF NOT EXISTS idx_project_personas_project ON portal.project_personas("projectId");
CREATE INDEX IF NOT EXISTS idx_project_personas_rbac ON portal.project_personas("rbacPersonaId");

-- project_document_search_index indexes
CREATE UNIQUE INDEX IF NOT EXISTS pdsi_org_external_idx ON portal.project_document_search_index("organizationId", "externalId");
CREATE INDEX IF NOT EXISTS pdsi_org_client_project_idx ON portal.project_document_search_index("organizationId", "clientId", "projectId");
CREATE INDEX IF NOT EXISTS pdsi_embedding_idx ON portal.project_document_search_index
    USING hnsw (embedding vector_cosine_ops);

-- project_document_sharing indexes
CREATE UNIQUE INDEX IF NOT EXISTS project_document_sharing_projectId_organizationId_externalId_key
    ON portal.project_document_sharing("projectId", "organizationId", "externalId");
CREATE UNIQUE INDEX IF NOT EXISTS project_document_sharing_projectId_externalId_key
    ON portal.project_document_sharing("projectId", "externalId");
CREATE INDEX IF NOT EXISTS project_document_sharing_projectId_idx ON portal.project_document_sharing("projectId");
CREATE INDEX IF NOT EXISTS project_document_sharing_projectId_slug_idx ON portal.project_document_sharing("projectId", slug);

-- ============================================================================
-- Foreign Keys
-- ============================================================================

ALTER TABLE portal.clients ADD CONSTRAINT clients_organizationid_fkey
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.projects ADD CONSTRAINT projects_organizationid_fkey
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.projects ADD CONSTRAINT projects_clientid_fkey
    FOREIGN KEY ("clientId") REFERENCES portal.clients(id) ON DELETE CASCADE;

ALTER TABLE portal.organization_personas ADD CONSTRAINT organization_personas_organizationid_fkey
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.organization_members ADD CONSTRAINT organization_members_organizationid_fkey
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.client_personas ADD CONSTRAINT client_personas_clientid_fkey
    FOREIGN KEY ("clientId") REFERENCES portal.clients(id) ON DELETE CASCADE;

ALTER TABLE portal.client_members ADD CONSTRAINT client_members_clientid_fkey
    FOREIGN KEY ("clientId") REFERENCES portal.clients(id) ON DELETE CASCADE;

ALTER TABLE portal.project_personas ADD CONSTRAINT project_personas_projectid_fkey
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE CASCADE;

ALTER TABLE portal.project_members ADD CONSTRAINT project_members_projectid_fkey
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE CASCADE;

ALTER TABLE portal.project_invitations ADD CONSTRAINT project_invitations_projectid_fkey
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE CASCADE;

ALTER TABLE portal.project_invitations ADD CONSTRAINT project_invitations_personaid_fkey
    FOREIGN KEY ("personaId") REFERENCES portal.project_personas(id);

ALTER TABLE portal.connectors ADD CONSTRAINT connectors_organizationid_fkey
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.connector_linked_files ADD CONSTRAINT connector_linked_files_connectorid_fkey
    FOREIGN KEY ("connectorId") REFERENCES portal.connectors(id) ON DELETE CASCADE;

ALTER TABLE portal.project_document_sharing ADD CONSTRAINT project_document_sharing_projectid_fkey
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE CASCADE;

ALTER TABLE portal.project_document_sharing ADD CONSTRAINT project_document_sharing_organizationid_externalid_fkey
    FOREIGN KEY ("organizationId", "externalId")
    REFERENCES portal.project_document_search_index("organizationId", "externalId") ON DELETE CASCADE;

-- ============================================================================
-- Row-Level Security (RLS) Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION portal.get_current_user_organization_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = portal AS $$
  SELECT "organizationId" FROM portal.organization_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid);
$$;

CREATE OR REPLACE FUNCTION portal.get_current_user_client_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = portal AS $$
  SELECT DISTINCT "clientId" FROM portal.client_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid)
  UNION
  SELECT DISTINCT "clientId" FROM portal.projects
  WHERE id IN (
    SELECT "projectId" FROM portal.project_members
    WHERE "userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

CREATE OR REPLACE FUNCTION portal.get_current_user_project_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = portal AS $$
  SELECT "projectId" FROM portal.project_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid);
$$;

CREATE OR REPLACE FUNCTION portal.is_user_org_member(org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = portal AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal.organization_members
    WHERE "organizationId" = org_id
    AND "userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

CREATE OR REPLACE FUNCTION portal.is_user_client_member(client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = portal AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal.client_members
    WHERE "clientId" = client_id
    AND "userId" = (current_setting('app.current_user_id', true)::uuid)
  ) OR EXISTS (
    SELECT 1 FROM portal.projects p
    INNER JOIN portal.project_members pm ON p.id = pm."projectId"
    WHERE p."clientId" = client_id
    AND pm."userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

CREATE OR REPLACE FUNCTION portal.is_user_project_member(project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = portal AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal.project_members
    WHERE "projectId" = project_id
    AND "userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE portal.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_member_only ON portal.organizations;
CREATE POLICY org_member_only ON portal.organizations FOR ALL USING (
    id IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
    OR (
      current_setting('app.current_org_id', true)::uuid IS NOT NULL
      AND id = current_setting('app.current_org_id', true)::uuid
      AND EXISTS (SELECT 1 FROM portal.organization_members WHERE "organizationId" = id AND "userId" = (current_setting('app.current_user_id', true)::uuid))
    )
);

ALTER TABLE portal.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_org_and_access ON portal.clients;
CREATE POLICY client_org_and_access ON portal.clients FOR ALL USING (
    "organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    AND (
      EXISTS (SELECT 1 FROM portal.client_members cm WHERE cm."clientId" = portal.clients.id AND cm."userId" = (current_setting('app.current_user_id', true)::uuid))
      OR EXISTS (
        SELECT 1 FROM portal.projects p
        INNER JOIN portal.project_members pm ON p.id = pm."projectId"
        WHERE p."clientId" = portal.clients.id AND pm."userId" = (current_setting('app.current_user_id', true)::uuid)
      )
    )
);

ALTER TABLE portal.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_member_only ON portal.projects;
CREATE POLICY project_member_only ON portal.projects FOR ALL USING (
    EXISTS (SELECT 1 FROM portal.project_members WHERE "projectId" = id AND "userId" = (current_setting('app.current_user_id', true)::uuid))
    AND EXISTS (
      SELECT 1 FROM portal.clients c
      WHERE c.id = portal.projects."clientId"
      AND c."organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
);

ALTER TABLE portal.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_members_org_isolation ON portal.organization_members;
CREATE POLICY org_members_org_isolation ON portal.organization_members FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.organization_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_personas_org_isolation ON portal.organization_personas;
CREATE POLICY org_personas_org_isolation ON portal.organization_personas FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.client_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_members_client_isolation ON portal.client_members;
CREATE POLICY client_members_client_isolation ON portal.client_members FOR ALL USING (
    "clientId" IN (
      SELECT cm."clientId" FROM portal.client_members cm WHERE cm."userId" = (current_setting('app.current_user_id', true)::uuid)
      UNION
      SELECT DISTINCT p."clientId" FROM portal.projects p WHERE p.id IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
    AND (
      EXISTS (SELECT 1 FROM portal.client_members cm2 WHERE cm2."clientId" = portal.client_members."clientId" AND cm2."userId" = (current_setting('app.current_user_id', true)::uuid))
      OR EXISTS (SELECT 1 FROM portal.projects p2 INNER JOIN portal.project_members pm2 ON p2.id = pm2."projectId" WHERE p2."clientId" = portal.client_members."clientId" AND pm2."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
);

ALTER TABLE portal.client_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_personas_client_isolation ON portal.client_personas;
CREATE POLICY client_personas_client_isolation ON portal.client_personas FOR ALL USING (
    "clientId" IN (
      SELECT cm."clientId" FROM portal.client_members cm WHERE cm."userId" = (current_setting('app.current_user_id', true)::uuid)
      UNION
      SELECT DISTINCT p."clientId" FROM portal.projects p
      WHERE p.id IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
);

ALTER TABLE portal.project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_members_project_isolation ON portal.project_members;
CREATE POLICY project_members_project_isolation ON portal.project_members FOR ALL USING (
    "projectId" IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
    AND EXISTS (SELECT 1 FROM portal.project_members pm2 WHERE pm2."projectId" = portal.project_members."projectId" AND pm2."userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.project_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_personas_project_isolation ON portal.project_personas;
CREATE POLICY project_personas_project_isolation ON portal.project_personas FOR ALL USING (
    "projectId" IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.project_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_invitations_project_isolation ON portal.project_invitations;
CREATE POLICY project_invitations_project_isolation ON portal.project_invitations FOR ALL USING (
    "projectId" IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
    AND EXISTS (SELECT 1 FROM portal.project_members pm2 WHERE pm2."projectId" = portal.project_invitations."projectId" AND pm2."userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.connectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connectors_org_isolation ON portal.connectors;
CREATE POLICY connectors_org_isolation ON portal.connectors FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.connector_linked_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connector_linked_files_connector_isolation ON portal.connector_linked_files;
CREATE POLICY connector_linked_files_connector_isolation ON portal.connector_linked_files FOR ALL USING (
    "connectorId" IN (
      SELECT c.id FROM portal.connectors c
      WHERE c."organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
);

ALTER TABLE portal.project_document_search_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pdsi_org_isolation ON portal.project_document_search_index;
CREATE POLICY pdsi_org_isolation ON portal.project_document_search_index FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.project_document_sharing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_document_sharing_project_isolation ON portal.project_document_sharing;
CREATE POLICY project_document_sharing_project_isolation ON portal.project_document_sharing FOR ALL USING (
    "projectId" IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
);

ALTER TABLE portal.customer_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_requests_user_org_isolation ON portal.customer_requests;
CREATE POLICY customer_requests_user_org_isolation ON portal.customer_requests FOR ALL USING (
    "userId" = (current_setting('app.current_user_id', true)::uuid)
    OR (
      "organizationId" IS NOT NULL
      AND "organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
);
