/**
 * UserSettingsPlus Cache Service
 * 
 * Unified cache for:
 * - Permissions (RBAC from 5-table system)
 * - User preferences & personalization
 * - Project-level settings
 * - Organization-level settings
 * - Future personalization settings
 * 
 * Built on login and cached in-memory with TTL.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// ============================================================================
// Type Definitions
// ============================================================================

// Hierarchical permissions structure: Organization → Client → Project
export interface OrgPermissions {
  id: string
  role: string  // "org_member" (org_guest removed)
  personas: string[]  // Array of persona slugs (e.g., ["org_admin"])
  scopes: Record<string, string[]>  // scope -> privileges[] (includes ALL scopes from org persona: organization, client, project, document)
  isDefault: boolean  // Whether this is the user's default organization
  clients: ClientPermissions[]
}

export interface ClientPermissions {
  id: string
  scopes: Record<string, string[]>  // scope -> privileges[] (only "client" scope at client level)
  projects: ProjectPermissions[]
}

export interface ProjectPermissions {
  id: string
  persona: string  // Persona slug (e.g., "proj_admin")
  scopes: Record<string, string[]>  // scope -> privileges[] ("project" and "document" scopes)
}

export interface UserPermissions {
  organizations: OrgPermissions[]
}

export interface UserPreferences {
  // UI Preferences
  theme?: 'light' | 'dark' | 'system'
  viewMode?: 'grid' | 'list' | 'compact'
  sidebarCollapsed?: boolean
  
  // Notification Preferences
  emailNotifications?: {
    projectInvites: boolean
    documentUpdates: boolean
    mentions: boolean
  }
  
  // Feature Preferences
  features?: {
    showInsights: boolean
    showAnalytics: boolean
    enableKeyboardShortcuts: boolean
  }
  
  // Cookie Consent (from localStorage, synced here)
  cookieConsent?: {
    necessary: boolean
    analytics: boolean
    marketing: boolean
    personalization: boolean
    timestamp: string
  }
}

export interface ProjectSettings {
  [projectId: string]: {
    // From ProjectMember.settings JSON
    notifications?: boolean
    defaultView?: string
    customFields?: Record<string, any>
    // Future: custom filters, saved searches, etc.
  }
}

export interface OrganizationSettings {
  [orgId: string]: {
    // From Organization.settings JSON (user's view)
    branding?: {
      logoUrl?: string
      brandColor?: string
    }
    // Future: org-level preferences visible to user
  }
}

export interface UserSettingsPlus {
  // Core
  userId: string
  computedAt: number
  version: string
  
  // Permissions (RBAC)
  permissions: UserPermissions
  
  // User Preferences
  preferences: UserPreferences
  
  // Project-level Settings
  projectSettings: ProjectSettings
  
  // Organization-level Settings (user's view)
  organizationSettings: OrganizationSettings
  
  // Future: Add more sections as needed
  // personalization?: PersonalizationSettings
  // analytics?: AnalyticsSettings
  // integrations?: IntegrationSettings
}

// ============================================================================
// Cache Implementation
// ============================================================================

class UserSettingsPlusCache {
  private cache = new Map<string, { data: UserSettingsPlus; expiresAt: number }>()
  private readonly TTL = 1000 * 60 * 30 // 30 minutes
  private readonly VERSION = '1.0.0'

  /**
   * Get user settings plus from cache or compute from DB
   */
  async getUserSettingsPlus(userId: string): Promise<UserSettingsPlus> {
    // Check cache
    const cached = this.cache.get(userId)
    if (cached && Date.now() < cached.expiresAt) {
      logger.debug('Cache hit for UserSettingsPlus', 'UserSettingsPlus', { userId })
      return cached.data
    }

    // Cache miss - compute from DB
    logger.debug('Cache miss - computing UserSettingsPlus from DB', 'UserSettingsPlus', { userId })
    const settings = await this.computeUserSettingsPlus(userId)
    
    // Store in cache
    this.cache.set(userId, {
      data: settings,
      expiresAt: Date.now() + this.TTL
    })

    return settings
  }

  /**
   * Compute UserSettingsPlus from database
   */
  private async computeUserSettingsPlus(userId: string): Promise<UserSettingsPlus> {
    // Parallel fetch all data
    const [
      permissions,
      preferences,
      projectSettings,
      organizationSettings
    ] = await Promise.all([
      this.computePermissions(userId),
      this.computePreferences(userId),
      this.computeProjectSettings(userId),
      this.computeOrganizationSettings(userId)
    ])

    return {
      userId,
      computedAt: Date.now(),
      version: this.VERSION,
      permissions,
      preferences,
      projectSettings,
      organizationSettings
    }
  }

  /**
   * Compute permissions from database using new RBAC schema
   * Builds hierarchical structure: Organization → Client → Project
   */
  private async computePermissions(userId: string): Promise<UserPermissions> {
    // Fetch org memberships with organization personas and rbac personas
    const orgMemberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organizationPersona: {
          include: {
            rbacPersona: {
              include: {
                grants: {
                  include: {
                    scope: true,
                    privilege: true
                  }
                },
                role: true
              }
            }
          }
        },
        organization: {
          select: {
            id: true,
            clients: {
              include: {
                members: {
                  where: { userId },
                  include: {
                    clientPersona: {
                      include: {
                        rbacPersona: {
                          include: {
                            grants: {
                              include: {
                                scope: true,
                                privilege: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                projects: {
                  where: {
                    members: {
                      some: { userId }
                    },
                    isDeleted: false
                  },
                  include: {
                    members: {
                      where: { userId },
                      include: {
                        persona: {
                          include: {
                            rbacPersona: {
                              include: {
                                grants: {
                                  include: {
                                    scope: true,
                                    privilege: true
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const organizations: OrgPermissions[] = []

    // Helper: Build scopes from grants
    const buildScopesFromGrants = (grants: Array<{
      scope: { slug: string }
      privilege: { slug: string }
    }>): Record<string, string[]> => {
      const scopes: Record<string, string[]> = {}
      
      for (const grant of grants) {
        const scopeSlug = grant.scope.slug
        const privilegeSlug = grant.privilege.slug
        
        if (!scopes[scopeSlug]) {
          scopes[scopeSlug] = []
        }
        if (!scopes[scopeSlug].includes(privilegeSlug)) {
          scopes[scopeSlug].push(privilegeSlug)
        }
      }
      
      return scopes
    }

    // Helper: Get role name from organization persona or default
    const getRoleName = (orgMember: any): string => {
      // If has organization persona, get role from rbac persona
      if (orgMember.organizationPersona?.rbacPersona?.role) {
        const roleSlug = orgMember.organizationPersona.rbacPersona.role.slug
      // Map rbac role slugs to simplified org roles (org_guest removed)
      return 'org_member' // org_member or sys_manager both map to org_member
      }
      // Default to org_member if no persona assigned
      return 'org_member'
    }

    // Build hierarchical permissions
    for (const orgMember of orgMemberships) {
      const orgId = orgMember.organization.id
      
      // Get org-level scopes from organization persona grants
      // Include ALL scopes from org persona (organization, client, project, document)
      // This allows org_admin to have client can_manage at org level for creating clients
      const orgScopes: Record<string, string[]> = {}
      const orgPersonas: string[] = []
      
      if (orgMember.organizationPersona?.rbacPersona) {
        const rbacPersona = orgMember.organizationPersona.rbacPersona
        orgPersonas.push(rbacPersona.slug)
        
        // Get ALL grants from organization persona (not just "organization" scope)
        // This includes organization, client, project, document scopes
        // Example: org_admin has can_manage on both organization AND client scopes
        const allOrgGrants = rbacPersona.grants
        const scopes = buildScopesFromGrants(allOrgGrants)
        Object.assign(orgScopes, scopes)
      }

      // Build clients array
      const clients: ClientPermissions[] = []
      
      for (const client of orgMember.organization.clients) {
        // Check if user is a member of this client
        const clientMember = client.members.find(m => m.userId === userId)
        
        // Get client-level scopes from client persona grants
        const clientScopes: Record<string, string[]> = {}
        
        if (clientMember?.clientPersona?.rbacPersona) {
          const rbacPersona = clientMember.clientPersona.rbacPersona
          // Get grants filtered to "client" scope only
          const clientGrants = rbacPersona.grants.filter(g => g.scope.slug === 'client')
          const scopes = buildScopesFromGrants(clientGrants)
          Object.assign(clientScopes, scopes)
        }
        
        // Build projects array for this client
        const projects: ProjectPermissions[] = []
        
        for (const project of client.projects) {
          const projectMember = project.members.find(m => m.userId === userId)
          
          if (!projectMember?.persona) continue
          
          const rbacPersona = projectMember.persona.rbacPersona
          
          // Get grants filtered to "project" and "document" scopes
          const projectGrants = rbacPersona.grants.filter(
            g => g.scope.slug === 'project' || g.scope.slug === 'document'
          )
          const projectScopes = buildScopesFromGrants(projectGrants)
          
          projects.push({
            id: project.id,
            persona: rbacPersona.slug,
            scopes: projectScopes
          })
        }
        
        // Only add client if user has access (via client member or project member)
        if (clientMember || projects.length > 0) {
          clients.push({
            id: client.id,
            scopes: clientScopes,
            projects
          })
        }
      }

      organizations.push({
        id: orgId,
        role: getRoleName(orgMember),
        personas: orgPersonas,
        scopes: orgScopes,
        isDefault: orgMember.isDefault || false,
        clients
      })
    }

    return { organizations }
  }

  /**
   * Compute user preferences
   * Currently pulls from localStorage on client, but can be extended to DB
   */
  private async computePreferences(userId: string): Promise<UserPreferences> {
    // TODO: In the future, store preferences in a user_preferences table
    // For now, return defaults (client-side can override from localStorage)
    
    return {
      theme: 'system',
      viewMode: 'grid',
      sidebarCollapsed: false,
      emailNotifications: {
        projectInvites: true,
        documentUpdates: true,
        mentions: true
      },
      features: {
        showInsights: true,
        showAnalytics: true,
        enableKeyboardShortcuts: true
      }
    }
  }

  /**
   * Compute project-level settings from ProjectMember.settings JSON
   */
  private async computeProjectSettings(userId: string): Promise<ProjectSettings> {
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId },
      select: {
        projectId: true,
        settings: true,
        project: {
          select: { isDeleted: true }
        }
      }
    })

    const settings: ProjectSettings = {}
    
    for (const member of projectMembers) {
      if (member.project.isDeleted) continue
      
      const memberSettings = member.settings as Record<string, any> || {}
      settings[member.projectId] = {
        notifications: memberSettings.notifications ?? true,
        defaultView: memberSettings.defaultView,
        customFields: memberSettings.customFields
      }
    }

    return settings
  }

  /**
   * Compute organization-level settings (user's view of org settings)
   */
  private async computeOrganizationSettings(userId: string): Promise<OrganizationSettings> {
    const orgMemberships = await prisma.organizationMember.findMany({
      where: { userId },
      select: {
        organizationId: true,
        organization: {
          select: {
            settings: true
          }
        }
      }
    })

    const settings: OrganizationSettings = {}
    
    for (const membership of orgMemberships) {
      const orgSettings = membership.organization.settings as Record<string, any> || {}
      settings[membership.organizationId] = {
        branding: {
          logoUrl: orgSettings.branding?.logoUrl,
          brandColor: orgSettings.branding?.brandColor
        }
      }
    }

    return settings
  }

  /**
   * Invalidate cache for user (call after permission/settings changes)
   */
  invalidateUser(userId: string): void {
    this.cache.delete(userId)
    logger.debug('Invalidated UserSettingsPlus cache', 'UserSettingsPlus', { userId })
  }

  /**
   * Invalidate cache for multiple users
   */
  invalidateUsers(userIds: string[]): void {
    userIds.forEach(userId => this.cache.delete(userId))
    logger.debug('Invalidated UserSettingsPlus cache for multiple users', 'UserSettingsPlus', { 
      count: userIds.length 
    })
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    logger.debug('Cleared all UserSettingsPlus cache', 'UserSettingsPlus')
  }

  /**
   * Get cache stats (for monitoring)
   */
  getStats() {
    const now = Date.now()
    let valid = 0
    let expired = 0

    for (const { expiresAt } of Array.from(this.cache.values())) {
      if (now < expiresAt) {
        valid++
      } else {
        expired++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired
    }
  }

  /**
   * Update a specific section of settings (partial update)
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const current = await this.getUserSettingsPlus(userId)
    const updated = {
      ...current,
      preferences: {
        ...current.preferences,
        ...preferences
      },
      computedAt: Date.now()
    }
    
    this.cache.set(userId, {
      data: updated,
      expiresAt: Date.now() + this.TTL
    })
  }

  /**
   * Update project settings for a specific project
   */
  async updateProjectSettings(
    userId: string, 
    projectId: string, 
    settings: Partial<ProjectSettings[string]>
  ): Promise<void> {
    const current = await this.getUserSettingsPlus(userId)
    const updated = {
      ...current,
      projectSettings: {
        ...current.projectSettings,
        [projectId]: {
          ...current.projectSettings[projectId],
          ...settings
        }
      },
      computedAt: Date.now()
    }
    
    this.cache.set(userId, {
      data: updated,
      expiresAt: Date.now() + this.TTL
    })
  }
}

// Singleton instance
export const userSettingsPlus = new UserSettingsPlusCache()

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Helper: Find project in hierarchical permissions structure
 */
function findProjectInPermissions(
  permissions: UserPermissions,
  projectId: string
): ProjectPermissions | null {
  for (const org of permissions.organizations) {
    for (const client of org.clients) {
      const project = client.projects.find(p => p.id === projectId)
      if (project) return project
    }
  }
  return null
}

/**
 * Check if user has permission for a project
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  scope: string,
  privilege: string
): Promise<boolean> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  const projectPerms = findProjectInPermissions(settings.permissions, projectId)
  
  if (!projectPerms) return false
  
  return projectPerms.scopes[scope]?.includes(privilege) ?? false
}

/**
 * Get all permissions for a project
 */
export async function getProjectPermissions(
  userId: string,
  projectId: string
): Promise<Record<string, string[]>> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  const projectPerms = findProjectInPermissions(settings.permissions, projectId)
  return projectPerms?.scopes ?? {}
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.preferences
}

/**
 * Get project settings for a specific project
 */
export async function getProjectSettings(
  userId: string,
  projectId: string
): Promise<ProjectSettings[string] | undefined> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.projectSettings[projectId]
}

/**
 * Get organization settings for a specific org
 */
export async function getOrganizationSettings(
  userId: string,
  orgId: string
): Promise<OrganizationSettings[string] | undefined> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.organizationSettings[orgId]
}
