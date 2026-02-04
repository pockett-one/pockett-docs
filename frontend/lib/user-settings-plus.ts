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

export interface UserPermissions {
  organizations: Record<string, {
    role: string
    personas: string[]
    scopes: Record<string, string[]> // scope -> permissions[]
  }>
  projects: Record<string, {
    persona: string
    scopes: Record<string, string[]> // scope -> permissions[]
  }>
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
   * Compute permissions from database (5-table RBAC)
   */
  private async computePermissions(userId: string): Promise<UserPermissions> {
    // Fetch org memberships with roles
    const orgMemberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        role: true,
        organization: {
          include: {
            personas: {
              where: {
                members: {
                  some: { userId }
                }
              },
              include: {
                grants: {
                  include: {
                    permission: true,
                    scope: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Fetch project memberships with personas
    const projectMemberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          select: { id: true, isDeleted: true }
        },
        persona: {
          include: {
            grants: {
              include: {
                permission: true,
                scope: true
              }
            }
          }
        }
      }
    })

    const permissions: UserPermissions = {
      organizations: {},
      projects: {}
    }

    // Build org-level permissions
    for (const membership of orgMemberships) {
      const orgId = membership.organizationId
      const userPersonas = membership.organization.personas.map(p => p.id)
      
      // Aggregate grants by scope
      const scopes: Record<string, string[]> = {}
      for (const persona of membership.organization.personas) {
        for (const grant of persona.grants) {
          const scopeSlug = grant.scope.slug
          const permSlug = grant.permission.slug
          
          if (!scopes[scopeSlug]) {
            scopes[scopeSlug] = []
          }
          if (!scopes[scopeSlug].includes(permSlug)) {
            scopes[scopeSlug].push(permSlug)
          }
        }
      }

      permissions.organizations[orgId] = {
        role: membership.role.name,
        personas: userPersonas,
        scopes
      }
    }

    // Build project-level permissions (exclude deleted projects)
    for (const membership of projectMemberships) {
      if (membership.project.isDeleted || !membership.persona) continue

      const projectId = membership.project.id
      const persona = membership.persona

      // Group grants by scope
      const scopes: Record<string, string[]> = {}
      for (const grant of persona.grants) {
        const scopeSlug = grant.scope.slug
        const permSlug = grant.permission.slug
        
        if (!scopes[scopeSlug]) {
          scopes[scopeSlug] = []
        }
        if (!scopes[scopeSlug].includes(permSlug)) {
          scopes[scopeSlug].push(permSlug)
        }
      }

      permissions.projects[projectId] = {
        persona: persona.id,
        scopes
      }
    }

    return permissions
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

    for (const { expiresAt } of this.cache.values()) {
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
 * Check if user has permission for a project
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  scope: string,
  permission: string
): Promise<boolean> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  const projectPerms = settings.permissions.projects[projectId]
  
  if (!projectPerms) return false
  
  return projectPerms.scopes[scope]?.includes(permission) ?? false
}

/**
 * Get all permissions for a project
 */
export async function getProjectPermissions(
  userId: string,
  projectId: string
): Promise<Record<string, string[]>> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.permissions.projects[projectId]?.scopes ?? {}
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
