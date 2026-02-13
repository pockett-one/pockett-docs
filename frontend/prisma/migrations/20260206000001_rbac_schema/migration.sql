-- Create RBAC Schema
CREATE SCHEMA IF NOT EXISTS rbac;

-- ============================================================================
-- RBAC Tables
-- ============================================================================

-- Roles (Abstract identity roles)
CREATE TABLE rbac.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    "displayName" TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Permission Scopes (Contexts: organization, client, project, document)
CREATE TABLE rbac.permission_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Privileges (Actions: can_view, can_edit, can_comment, can_manage)
CREATE TABLE rbac.privileges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Personas (User-facing roles with capabilities)
CREATE TABLE rbac.personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    "displayName" TEXT NOT NULL,
    description TEXT,
    "roleId" UUID NOT NULL REFERENCES rbac.roles(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Grants (Persona + Scope + Privilege mappings)
CREATE TABLE rbac.grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "personaId" UUID NOT NULL REFERENCES rbac.personas(id) ON DELETE CASCADE,
    "scopeId" UUID NOT NULL REFERENCES rbac.permission_scopes(id) ON DELETE CASCADE,
    "privilegeId" UUID NOT NULL REFERENCES rbac.privileges(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("personaId", "scopeId", "privilegeId")
);

-- Indexes
CREATE INDEX idx_personas_role ON rbac.personas("roleId");
CREATE INDEX idx_grants_persona ON rbac.grants("personaId");
CREATE INDEX idx_grants_scope ON rbac.grants("scopeId");
CREATE INDEX idx_grants_privilege ON rbac.grants("privilegeId");

-- ============================================================================
-- Seed Data
-- ============================================================================

-- Roles
INSERT INTO rbac.roles (slug, "displayName", description) VALUES
('sys_manager', 'System Manager', 'System-level administrative role'),
('org_member', 'Organization Member', 'Internal member of an organization'),
('org_guest', 'Organization Guest', 'External collaborator with limited project access')
ON CONFLICT (slug) DO NOTHING;

-- Permission Scopes
INSERT INTO rbac.permission_scopes (slug, description) VALUES
('organization', 'Organization activity scope'),
('client', 'Client activity scope'),
('project', 'Project activity scope'),
('document', 'Document activity scope')
ON CONFLICT (slug) DO NOTHING;

-- Privileges
INSERT INTO rbac.privileges (slug, description) VALUES
('can_view', 'Can view content'),
('can_edit', 'Can edit content'),
('can_comment', 'Can comment on content'),
('can_manage', 'Can manage content and settings')
ON CONFLICT (slug) DO NOTHING;

-- Personas
INSERT INTO rbac.personas (slug, "displayName", "roleId", description) VALUES
('sys_admin', 'System Admin', (SELECT id FROM rbac.roles WHERE slug = 'sys_manager'), 'System administrator with full system access'),
('org_owner', 'Organization Owner', (SELECT id FROM rbac.roles WHERE slug = 'org_member'), 'Organization owner with full org control'),
('client_admin', 'Client Partner', (SELECT id FROM rbac.roles WHERE slug = 'org_member'), 'Client-level administrator'),
('proj_admin', 'Project Lead', (SELECT id FROM rbac.roles WHERE slug = 'org_member'), 'Project lead with full project management capabilities'),
('proj_member', 'Team Member', (SELECT id FROM rbac.roles WHERE slug = 'org_member'), 'Team member with full project access'),
('proj_ext_collaborator', 'External Collaborator', (SELECT id FROM rbac.roles WHERE slug = 'org_guest'), 'External collaborator with edit access'),
('proj_guest', 'Guest', (SELECT id FROM rbac.roles WHERE slug = 'org_guest'), 'Guest with view-only access')
ON CONFLICT (slug) DO NOTHING;

-- Grants for org_owner persona
INSERT INTO rbac.grants ("personaId", "scopeId", "privilegeId") VALUES
-- Organization scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'organization'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'organization'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'organization'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage')),
-- Client scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'client'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'client'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'client'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage')),
-- Project scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_comment')),
-- Document scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage')),
((SELECT id FROM rbac.personas WHERE slug = 'org_owner'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_comment'))
ON CONFLICT DO NOTHING;

-- Grants for client_admin persona
INSERT INTO rbac.grants ("personaId", "scopeId", "privilegeId") VALUES
-- Client scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'client_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'client'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'client_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'client'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'client_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'client'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage'))
ON CONFLICT DO NOTHING;

-- Grants for proj_admin persona
INSERT INTO rbac.grants ("personaId", "scopeId", "privilegeId") VALUES
-- Project scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_comment')),
-- Document scope (full access)
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_manage')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_admin'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_comment'))
ON CONFLICT DO NOTHING;

-- Grants for proj_member persona
INSERT INTO rbac.grants ("personaId", "scopeId", "privilegeId") VALUES
-- Project scope (view + edit)
((SELECT id FROM rbac.personas WHERE slug = 'proj_member'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_member'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_member'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_comment')),
-- Document scope (view + edit)
((SELECT id FROM rbac.personas WHERE slug = 'proj_member'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_member'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_member'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_comment'))
ON CONFLICT DO NOTHING;

-- Grants for proj_ext_collaborator persona
INSERT INTO rbac.grants ("personaId", "scopeId", "privilegeId") VALUES
-- Project scope (view + edit)
((SELECT id FROM rbac.personas WHERE slug = 'proj_ext_collaborator'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_ext_collaborator'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit')),
-- Document scope (view + edit)
((SELECT id FROM rbac.personas WHERE slug = 'proj_ext_collaborator'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
((SELECT id FROM rbac.personas WHERE slug = 'proj_ext_collaborator'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_edit'))
ON CONFLICT DO NOTHING;

-- Grants for proj_guest persona
INSERT INTO rbac.grants ("personaId", "scopeId", "privilegeId") VALUES
-- Project scope (view only)
((SELECT id FROM rbac.personas WHERE slug = 'proj_guest'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'project'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view')),
-- Document scope (view only)
((SELECT id FROM rbac.personas WHERE slug = 'proj_guest'), (SELECT id FROM rbac.permission_scopes WHERE slug = 'document'), (SELECT id FROM rbac.privileges WHERE slug = 'can_view'))
ON CONFLICT DO NOTHING;
