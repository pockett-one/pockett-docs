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
  const project = findProjectInPermissions(settings.permissions, orgId, clientId, projectId)
  
  if (project) {
    return project.scopes[scope]?.includes(privilege) ?? false
  }
  // Org owners can view/edit/manage any project in their org (e.g. reimport-created projects before members were added)
  const org = findOrganizationInPermissions(settings.permissions, orgId)
  const isOrgOwner = org?.personas?.includes('org_admin') || org?.scopes?.organization?.includes('can_manage') || false
  if (isOrgOwner && scope === 'project') {
    return ['can_view', 'can_edit', 'can_manage'].includes(privilege)
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
    (org) => org.personas?.includes('org_admin') ?? false
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
 * True if user has project can_manage (proj_admin, org_admin) or client can_manage (client_admin).
 */
export async function canViewProjectSettings(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<boolean> {
  const [projectManage, clientManage] = await Promise.all([
    checkProjectPermission(orgId, clientId, projectId, 'project', 'can_manage'),
    checkClientPermission(orgId, clientId, 'client', 'can_manage'),
  ])
  return projectManage || clientManage
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
  const org = findOrganizationInPermissions(settings.permissions, orgId)
  const client = findClientInPermissions(settings.permissions, orgId, clientId)
  const project = findProjectInPermissions(settings.permissions, orgId, clientId, projectId)

  if (org?.personas?.includes('org_admin') || org?.scopes?.organization?.includes('can_manage')) return true
  if (client?.scopes?.client?.includes('can_manage')) return true
  if (project?.persona && ['proj_admin', 'proj_member'].includes(project.persona)) return true
  return false
}

/**
 * Check if user can manage organization
 */
export async function canManageOrganization(orgId: string): Promise<boolean> {
  return checkOrgPermission(orgId, 'organization', 'can_manage')
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
