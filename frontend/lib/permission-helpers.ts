/**
 * Permission Helper Functions
 * 
 * Provides utilities for checking permissions from the cached UserSettingsPlus
 * All functions use the in-memory cache - no DB queries
 */

import { userSettingsPlus, UserPermissions } from './user-settings-plus'
import { createClient } from '@/utils/supabase/server'

// Re-export for convenience
export { userSettingsPlus, type UserPermissions }

// ============================================================================
// Helper: Find entities in hierarchical permissions structure
// ============================================================================

export function findOrganizationInPermissions(
  permissions: UserPermissions,
  orgId: string
) {
  return permissions.organizations.find(o => o.id === orgId) || null
}

export function findClientInPermissions(
  permissions: UserPermissions,
  orgId: string,
  clientId: string
) {
  const org = findOrganizationInPermissions(permissions, orgId)
  return org?.clients.find(c => c.id === clientId) || null
}

export function findProjectInPermissions(
  permissions: UserPermissions,
  orgId: string,
  clientId: string,
  projectId: string
) {
  const client = findClientInPermissions(permissions, orgId, clientId)
  return client?.projects.find(p => p.id === projectId) || null
}

// ============================================================================
// Permission Check Functions (Server-Side)
// ============================================================================

/**
 * Check if user has a specific privilege in a scope for an organization
 */
export async function checkOrgPermission(
  orgId: string,
  scope: string,
  privilege: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const settings = await userSettingsPlus.getUserSettingsPlus(user.id)

  // High-performance check: If this is the active org in the JWT (RBAC V2)
  if (user.app_metadata?.active_org_id === orgId) {
    const { getCapabilitiesForPersona } = await import('./permissions/persona-map')
    const persona = user.app_metadata.active_persona
    const caps = getCapabilitiesForPersona(persona)

    // Scopes mapping in V2
    if (scope === 'organization' || scope === 'org') {
      if (privilege === 'can_manage') return caps['org:can_manage'] === true
    }
    // Add other scope mappings as needed for V2
  }

  const org = findOrganizationInPermissions(settings.permissions, orgId)

  if (!org) return false

  return org.scopes[scope]?.includes(privilege) ?? false
}

/**
 * Check if user has a specific privilege in a scope for a client
 */
export async function checkClientPermission(
  orgId: string,
  clientId: string,
  scope: string,
  privilege: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const settings = await userSettingsPlus.getUserSettingsPlus(user.id)

  // High-performance check: If this is the active org in the JWT (RBAC V2)
  if (user.app_metadata?.active_org_id === orgId) {
    const { getCapabilitiesForPersona } = await import('./permissions/persona-map')
    const persona = user.app_metadata.active_persona
    const caps = getCapabilitiesForPersona(persona)

    // Scopes mapping in V2 for client
    if (scope === 'client') {
      if (privilege === 'can_manage') return caps['client:can_manage'] === true
    }
  }

  const client = findClientInPermissions(settings.permissions, orgId, clientId)

  if (!client) return false

  return client.scopes[scope]?.includes(privilege) ?? false
}

/**
 * Check if user has a specific privilege in a scope for a project
 */
export async function checkProjectPermission(
  orgId: string,
  clientId: string,
  projectId: string,
  scope: string,
  privilege: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const settings = await userSettingsPlus.getUserSettingsPlus(user.id)

  // Safety: JWT path only for org/client scope when active_org_id matches.
  // Project scope always uses UserSettingsPlus (project_members) — never trust JWT for project role.
  if (scope !== 'project' && user.app_metadata?.active_org_id === orgId) {
    const { getCapabilitiesForPersona } = await import('./permissions/persona-map')
    const persona = user.app_metadata?.active_persona
    const caps = getCapabilitiesForPersona(persona ?? null)

    if (scope === 'organization' || scope === 'org') {
      if (privilege === 'can_manage') return caps['org:can_manage'] === true
    }
    if (scope === 'client') {
      if (privilege === 'can_manage') return caps['client:can_manage'] === true
    }
  }

  const project = findProjectInPermissions(settings.permissions, orgId, clientId, projectId)

  if (project) {
    // project:can_edit is a distinct capability; check it directly
    if (scope === 'project' && privilege === 'can_edit') {
      return project.scopes['project']?.includes('can_edit') ?? false
    }
    return project.scopes[scope]?.includes(privilege) ?? false
  }

  // Fallback: org_admin/sys_admin have broad access within their org (intentional).
  // Client can_manage is org-level; only org_admin has it per persona-map.
  const org = findOrganizationInPermissions(settings.permissions, orgId)
  if (org && (org.personas.includes('org_admin') || org.personas.includes('sys_admin'))) {
    return true
  }

  const client = findClientInPermissions(settings.permissions, orgId, clientId)
  if (client?.scopes?.client?.includes('can_manage')) {
    return true
  }

  // Final fallback: Direct DB check for freshly-created orgs where the cache hasn't updated yet.
  // This handles the race condition where a user just created a Custom Org and immediately
  // navigated to a project page before their userSettingsPlus cache was invalidated.
  try {
    const { prisma } = await import('./prisma')
    const dbMembership = await (prisma as any).orgMember.findFirst({
      where: { userId: user.id, organizationId: orgId },
    })
    if (dbMembership) {
      if (dbMembership.role === 'org_admin') {
        return true
      }
    }
  } catch (dbError) {
    // Non-fatal: If DB check fails, fall through to false
    const { logger } = await import('./logger')
    logger.warn('DB fallback check in checkProjectPermission failed', dbError as Error)
  }

  return false
}

/**
 * Get all permissions for a project (returns scopes object)
 */
export async function getProjectPermissions(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<Record<string, string[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return {}

  const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
  const project = findProjectInPermissions(settings.permissions, orgId, clientId, projectId)

  return project?.scopes ?? {}
}

/**
 * Get project persona slug
 */
export async function getProjectPersona(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
  const project = findProjectInPermissions(settings.permissions, orgId, clientId, projectId)

  return project?.persona ?? null
}

/**
 * Check if user can access RBAC admin (Permission/Privilege/Grants UI).
 * Allowed: SYS_ADMIN (app_metadata) or org_admin in any organization.
 */
export async function canAccessRbacAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  const hasOrgAdmin = settings.permissions.organizations.some(
    (org) => org.personas?.includes('org_admin') || org.personas?.includes('sys_admin')
  )
  return hasOrgAdmin
}

/**
 * Convenience functions for common permission checks
 */
export async function canViewProject(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'project', 'can_view')
}

export async function canEditProject(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'project', 'can_edit')
}

export async function canManageProject(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'project', 'can_manage')
}

export async function canCommentOnProject(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'project', 'can_comment')
}

export async function canViewDocument(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'document', 'can_view')
}

export async function canEditDocument(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'document', 'can_edit')
}

export async function canManageDocument(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'document', 'can_manage')
}

/**
 * Project settings (gear) and project-level edits: only Org Owner, Client Owner, or Project Lead.
 * True if user has project can_manage (proj_admin, org_admin) or client can_manage (proj_admin).
 */
export async function canViewProjectSettings(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  // Only check project-level management (Project Lead)
  return checkProjectPermission(orgId, clientId, projectId, 'project', 'can_manage')
}

/**
 * Members, Shares, Insights tabs: Team Member, Project Lead, Client Owners, Org Owners only.
 * Not visible to Guest or External Collaborator.
 */
export async function canViewProjectInternalTabs(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  return checkProjectPermission(orgId, clientId, projectId, 'project', 'can_view_internal')
}

/**
 * Check if user can manage organization
 */
export async function canManageOrganization(orgId: string): Promise<boolean> {
  return checkOrgPermission(orgId, 'organization', 'can_manage') ||
    checkOrgPermission(orgId, 'org', 'can_manage')
}

/**
 * Check if user can manage client
 */
export async function canManageClient(
  orgId: string,
  clientId: string
): Promise<boolean> {
  return checkClientPermission(orgId, clientId, 'client', 'can_manage')
}

/**
 * Check if user is a system admin (source of truth: system.system_admins table).
 * Use this for internal area access. Optionally sync app_metadata.role = 'SYS_ADMIN'
 * when adding users to system_admins for fast client-side checks.
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  try {
    const { prisma } = await import('./prisma')
    const admin = await (prisma as any).systemAdmin.findFirst({
      where: { userId },
    })
    return !!admin
  } catch {
    return false
  }
}
