-- Create Portal Schema
CREATE SCHEMA IF NOT EXISTS portal;

-- ============================================================================
-- Enums (Drop and recreate to avoid conflicts)
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
-- Drop All Portal Tables (if they exist) - Clean slate
-- ============================================================================

-- Drop all portal tables in reverse dependency order
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

-- Drop old portal.roles and portal.role_permissions (replaced by rbac schema)
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
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'none'
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
    "driveFolderId" TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    UNIQUE("clientId", slug)
);

-- Organization Personas (org-specific persona customizations)
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

-- Client Personas (org-specific client persona customizations)
CREATE TABLE portal.client_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "rbacPersonaId" UUID NOT NULL REFERENCES rbac.personas(id),
    "displayName" TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("organizationId", "rbacPersonaId")
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

-- Project Personas (org-specific project persona customizations)
CREATE TABLE portal.project_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "rbacPersonaId" UUID NOT NULL REFERENCES rbac.personas(id),
    "displayName" TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("organizationId", "rbacPersonaId")
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
CREATE TABLE portal.connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    type portal."ConnectorType" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "googleAccountId" TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    status portal."ConnectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    settings JSONB NOT NULL DEFAULT '{}',
    UNIQUE("organizationId", "googleAccountId")
);

-- Documents
CREATE TABLE portal.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "connectorId" UUID,
    "externalId" TEXT NOT NULL,
    title TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT,
    "webViewLink" TEXT,
    content TEXT,
    summary TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB NOT NULL DEFAULT '{}',
    status portal."DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "lastModifiedAt" TIMESTAMP(3),
    "projectId" UUID,
    UNIQUE("organizationId", "externalId")
);

-- Linked Files
CREATE TABLE portal.linked_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "connectorId" UUID NOT NULL,
    "fileId" TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    "is_grant_revoked" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("connectorId", "fileId")
);

-- Customer Requests
DROP TABLE IF EXISTS portal.customer_requests CASCADE;
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
CREATE INDEX IF NOT EXISTS idx_client_personas_org ON portal.client_personas("organizationId");
CREATE INDEX IF NOT EXISTS idx_client_personas_rbac ON portal.client_personas("rbacPersonaId");
CREATE INDEX IF NOT EXISTS idx_project_personas_org ON portal.project_personas("organizationId");
CREATE INDEX IF NOT EXISTS idx_project_personas_rbac ON portal.project_personas("rbacPersonaId");

-- ============================================================================
-- Foreign Keys
-- ============================================================================

ALTER TABLE portal.clients ADD CONSTRAINT clients_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.projects ADD CONSTRAINT projects_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.projects ADD CONSTRAINT projects_clientId_fkey 
    FOREIGN KEY ("clientId") REFERENCES portal.clients(id) ON DELETE CASCADE;

ALTER TABLE portal.organization_personas ADD CONSTRAINT organization_personas_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.organization_members ADD CONSTRAINT organization_members_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.organization_members ADD CONSTRAINT organization_members_organizationPersonaId_fkey 
    FOREIGN KEY ("organizationPersonaId") REFERENCES portal.organization_personas(id);

ALTER TABLE portal.client_personas ADD CONSTRAINT client_personas_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.client_members ADD CONSTRAINT client_members_clientId_fkey 
    FOREIGN KEY ("clientId") REFERENCES portal.clients(id) ON DELETE CASCADE;

ALTER TABLE portal.client_members ADD CONSTRAINT client_members_clientPersonaId_fkey 
    FOREIGN KEY ("clientPersonaId") REFERENCES portal.client_personas(id);

ALTER TABLE portal.project_personas ADD CONSTRAINT project_personas_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.project_members ADD CONSTRAINT project_members_projectId_fkey 
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE CASCADE;

ALTER TABLE portal.project_members ADD CONSTRAINT project_members_personaId_fkey 
    FOREIGN KEY ("personaId") REFERENCES portal.project_personas(id);

ALTER TABLE portal.project_invitations ADD CONSTRAINT project_invitations_projectId_fkey 
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE CASCADE;

ALTER TABLE portal.project_invitations ADD CONSTRAINT project_invitations_personaId_fkey 
    FOREIGN KEY ("personaId") REFERENCES portal.project_personas(id);

ALTER TABLE portal.connectors ADD CONSTRAINT connectors_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.documents ADD CONSTRAINT documents_organizationId_fkey 
    FOREIGN KEY ("organizationId") REFERENCES portal.organizations(id) ON DELETE CASCADE;

ALTER TABLE portal.documents ADD CONSTRAINT documents_connectorId_fkey 
    FOREIGN KEY ("connectorId") REFERENCES portal.connectors(id) ON DELETE SET NULL;

ALTER TABLE portal.documents ADD CONSTRAINT documents_projectId_fkey 
    FOREIGN KEY ("projectId") REFERENCES portal.projects(id) ON DELETE SET NULL;

ALTER TABLE portal.linked_files ADD CONSTRAINT linked_files_connectorId_fkey 
    FOREIGN KEY ("connectorId") REFERENCES portal.connectors(id) ON DELETE CASCADE;

-- ============================================================================
-- Row-Level Security (RLS) Helper Functions
-- ============================================================================

-- Get organization IDs where user is a member
CREATE OR REPLACE FUNCTION portal.get_current_user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
  SELECT "organizationId" FROM portal.organization_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid);
$$;

-- Get client IDs where user has access (via client_members OR via project membership)
CREATE OR REPLACE FUNCTION portal.get_current_user_client_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
  -- User is a direct client member
  SELECT DISTINCT "clientId" FROM portal.client_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid)
  UNION
  -- User has access via project membership (derive client access from projects)
  SELECT DISTINCT "clientId" FROM portal.projects
  WHERE id IN (
    SELECT "projectId" FROM portal.project_members
    WHERE "userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

-- Get project IDs where user is a member
CREATE OR REPLACE FUNCTION portal.get_current_user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
  SELECT "projectId" FROM portal.project_members
  WHERE "userId" = (current_setting('app.current_user_id', true)::uuid);
$$;

-- Check if user is member of a specific organization
CREATE OR REPLACE FUNCTION portal.is_user_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal.organization_members
    WHERE "organizationId" = org_id
    AND "userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

-- Check if user has access to a specific client (via client_members OR project membership)
CREATE OR REPLACE FUNCTION portal.is_user_client_member(client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
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

-- Check if user is member of a specific project
CREATE OR REPLACE FUNCTION portal.is_user_project_member(project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal
AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal.project_members
    WHERE "projectId" = project_id
    AND "userId" = (current_setting('app.current_user_id', true)::uuid)
  );
$$;

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
-- Strict hierarchical isolation: Organization → Client → Project

-- Organizations: User must be a member of the organization
-- Strict isolation: Only members can see their organizations
ALTER TABLE portal.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_member_only ON portal.organizations;
CREATE POLICY org_member_only ON portal.organizations
  FOR ALL USING (
    -- Direct membership check (most secure)
    id IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
    -- Also support app-set context for convenience (must still be a member)
    OR (
      current_setting('app.current_org_id', true)::uuid IS NOT NULL
      AND id = current_setting('app.current_org_id', true)::uuid
      AND EXISTS (SELECT 1 FROM portal.organization_members WHERE "organizationId" = id AND "userId" = (current_setting('app.current_user_id', true)::uuid))
    )
  );

-- Clients: User must be a member of the organization AND have access to the client
-- Strict hierarchical isolation: Org → Client
ALTER TABLE portal.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_org_and_access ON portal.clients;
CREATE POLICY client_org_and_access ON portal.clients
  FOR ALL USING (
    -- Must be member of the organization
    "organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    AND (
      -- Must have access to the client (via client_members OR project membership)
      EXISTS (SELECT 1 FROM portal.client_members cm WHERE cm."clientId" = portal.clients.id AND cm."userId" = (current_setting('app.current_user_id', true)::uuid))
      OR EXISTS (
        SELECT 1 FROM portal.projects p
        INNER JOIN portal.project_members pm ON p.id = pm."projectId"
        WHERE p."clientId" = portal.clients.id AND pm."userId" = (current_setting('app.current_user_id', true)::uuid)
      )
    )
  );

-- Projects: User must be a member of the project (which implies org and client access)
-- Strict hierarchical isolation: Org → Client → Project
-- Note: Project membership already implies access to parent client and org
ALTER TABLE portal.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_member_only ON portal.projects;
CREATE POLICY project_member_only ON portal.projects
  FOR ALL USING (
    -- Must be member of the project (this already ensures org and client access)
    EXISTS (SELECT 1 FROM portal.project_members WHERE "projectId" = id AND "userId" = (current_setting('app.current_user_id', true)::uuid))
    -- Additional defense: verify project's client belongs to user's org
    AND EXISTS (
      SELECT 1 FROM portal.clients c
      WHERE c.id = portal.projects."clientId"
      AND c."organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
  );

-- Organization Members: User can only see members of organizations they belong to
ALTER TABLE portal.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_members_org_isolation ON portal.organization_members;
CREATE POLICY org_members_org_isolation ON portal.organization_members
  FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Organization Personas: User can only see personas of organizations they belong to
ALTER TABLE portal.organization_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_personas_org_isolation ON portal.organization_personas;
CREATE POLICY org_personas_org_isolation ON portal.organization_personas
  FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Client Members: User can only see members of clients they have access to
ALTER TABLE portal.client_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_members_client_isolation ON portal.client_members;
CREATE POLICY client_members_client_isolation ON portal.client_members
  FOR ALL USING (
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

-- Client Personas: User can only see personas of organizations they belong to
ALTER TABLE portal.client_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_personas_org_isolation ON portal.client_personas;
CREATE POLICY client_personas_org_isolation ON portal.client_personas
  FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Project Members: User can only see members of projects they belong to
ALTER TABLE portal.project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_members_project_isolation ON portal.project_members;
CREATE POLICY project_members_project_isolation ON portal.project_members
  FOR ALL USING (
    "projectId" IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
    AND EXISTS (SELECT 1 FROM portal.project_members pm2 WHERE pm2."projectId" = portal.project_members."projectId" AND pm2."userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Project Personas: User can only see personas of organizations they belong to
ALTER TABLE portal.project_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_personas_org_isolation ON portal.project_personas;
CREATE POLICY project_personas_org_isolation ON portal.project_personas
  FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Project Invitations: User can only see invitations for projects they belong to
ALTER TABLE portal.project_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_invitations_project_isolation ON portal.project_invitations;
CREATE POLICY project_invitations_project_isolation ON portal.project_invitations
  FOR ALL USING (
    "projectId" IN (SELECT pm."projectId" FROM portal.project_members pm WHERE pm."userId" = (current_setting('app.current_user_id', true)::uuid))
    AND EXISTS (SELECT 1 FROM portal.project_members pm2 WHERE pm2."projectId" = portal.project_invitations."projectId" AND pm2."userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Connectors: User can only see connectors of organizations they belong to
ALTER TABLE portal.connectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connectors_org_isolation ON portal.connectors;
CREATE POLICY connectors_org_isolation ON portal.connectors
  FOR ALL USING (
    "organizationId" IN (SELECT "organizationId" FROM portal.organization_members WHERE "userId" = (current_setting('app.current_user_id', true)::uuid))
  );

-- Documents: User can only see documents in projects they belong to (or org-scoped if no project)
-- Strict hierarchical isolation: Org → Client → Project → Document
ALTER TABLE portal.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_project_isolation ON portal.documents;
CREATE POLICY documents_project_isolation ON portal.documents
  FOR ALL USING (
    -- Org-scoped documents (no project): user must be org member
    (
      "projectId" IS NULL 
      AND "organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
    OR (
      -- Project-scoped documents: user must be project member
      "projectId" IS NOT NULL 
      AND EXISTS (SELECT 1 FROM portal.project_members pm WHERE pm."projectId" = portal.documents."projectId" AND pm."userId" = (current_setting('app.current_user_id', true)::uuid))
      AND "projectId" IN (SELECT pm2."projectId" FROM portal.project_members pm2 WHERE pm2."userId" = (current_setting('app.current_user_id', true)::uuid))
      -- Additional defense: verify document's org matches user's org
      AND "organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
  );

-- Linked Files: User can only see linked files for connectors in their organizations
ALTER TABLE portal.linked_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS linked_files_connector_isolation ON portal.linked_files;
CREATE POLICY linked_files_connector_isolation ON portal.linked_files
  FOR ALL USING (
    "connectorId" IN (
      SELECT c.id FROM portal.connectors c
      WHERE c."organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
  );

-- Customer Requests: User can only see their own requests or requests in their organizations
ALTER TABLE portal.customer_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_requests_user_org_isolation ON portal.customer_requests;
CREATE POLICY customer_requests_user_org_isolation ON portal.customer_requests
  FOR ALL USING (
    "userId" = (current_setting('app.current_user_id', true)::uuid)
    OR (
      "organizationId" IS NOT NULL 
      AND "organizationId" IN (SELECT om."organizationId" FROM portal.organization_members om WHERE om."userId" = (current_setting('app.current_user_id', true)::uuid))
    )
  );
