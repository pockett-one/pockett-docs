/**
 * UserSettingsPlus Cache Service
 * 
 * Unified cache for:
 * - Permissions (RBAC from V2 platform schema)
 * - User preferences & personalization
 * - Project-level settings
 * - Organization-level settings
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// ============================================================================
// Type Definitions
// ============================================================================

export interface OrgPermissions {
  id: string
  role: string
  personas: string[]
  scopes: Record<string, string[]>
  isDefault: boolean
  clients: ClientPermissions[]
}

export interface ClientPermissions {
  id: string
  scopes: Record<string, string[]>
  projects: ProjectPermissions[]
}

export interface ProjectPermissions {
  id: string
  persona: string
  scopes: Record<string, string[]>
}

export interface UserPermissions {
  organizations: OrgPermissions[]
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  viewMode?: 'grid' | 'list' | 'compact'
  sidebarCollapsed?: boolean
  emailNotifications?: {
    projectInvites: boolean
    documentUpdates: boolean
    mentions: boolean
  }
  features?: {
    showInsights: boolean
    showAnalytics: boolean
    enableKeyboardShortcuts: boolean
  }
}

export interface ProjectSettings {
  [projectId: string]: {
    notifications?: boolean
    defaultView?: string
    customFields?: Record<string, any>
  }
}

export interface OrganizationSettings {
  [orgId: string]: {
    branding?: {
      logoUrl?: string
      brandColor?: string
      themeColor?: string
      subtext?: string
    }
  }
}

export interface UserSettingsPlus {
  userId: string
  computedAt: number
  version: string
  permissions: UserPermissions
  preferences: UserPreferences
  projectSettings: ProjectSettings
  organizationSettings: OrganizationSettings
}

// ============================================================================
// Cache Implementation
// ============================================================================

class UserSettingsPlusCache {
  private cache = new Map<string, { data: UserSettingsPlus; expiresAt: number }>()
  private readonly TTL = 1000 * 60 * 30 // 30 minutes
  private readonly VERSION = '2.0.0' // Bump for V2 schema

  async getUserSettingsPlus(userId: string): Promise<UserSettingsPlus> {
    const cached = this.cache.get(userId)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }

    logger.debug('Cache miss - computing UserSettingsPlus from DB (V2)', 'UserSettingsPlus', { userId })
    const settings = await this.computeUserSettingsPlus(userId)

    this.cache.set(userId, {
      data: settings,
      expiresAt: Date.now() + this.TTL
    })

    return settings
  }

  private async computeUserSettingsPlus(userId: string): Promise<UserSettingsPlus> {
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

  private async computePermissions(userId: string): Promise<UserPermissions> {
    const { getCapabilitiesForPersona } = await import('./permissions/persona-map')

    // Fetch V2 org memberships - directly linked to personas
    const orgMemberships = await (prisma as any).orgMember.findMany({
      where: { userId },
      include: {
        persona: true,
        organization: {
          select: {
            id: true,
            clients: {
              include: {
                members: {
                  where: { userId },
                  include: {
                    persona: true
                  }
                },
                projects: {
                  where: {
                    members: { some: { userId } },
                    isDeleted: false
                  },
                  include: {
                    members: {
                      where: { userId },
                      include: {
                        persona: true
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

    for (const orgMember of orgMemberships) {
      const orgId = orgMember.organization.id
      const orgPersonas: string[] = []
      if (orgMember.persona) orgPersonas.push(orgMember.persona.slug)

      const orgScopes = getCapabilitiesForPersona(orgMember.persona?.slug)

      const clients: ClientPermissions[] = []
      for (const client of orgMember.organization.clients) {
        const clientMember = client.members.find((m: any) => m.userId === userId)
        const clientScopes = getCapabilitiesForPersona(clientMember?.persona?.slug)

        const projects: ProjectPermissions[] = []
        for (const project of client.projects) {
          const projectMember = project.members.find((m: any) => m.userId === userId)
          if (!projectMember?.persona) continue

          projects.push({
            id: project.id,
            persona: projectMember.persona.slug,
            scopes: getCapabilitiesForPersona(projectMember.persona.slug) as any
          })
        }

        if (clientMember || projects.length > 0) {
          clients.push({
            id: client.id,
            scopes: clientScopes as any,
            projects
          })
        }
      }

      organizations.push({
        id: orgId,
        role: orgMember.persona?.slug || 'org_member',
        personas: orgPersonas,
        scopes: orgScopes as any,
        isDefault: orgMember.isDefault || false,
        clients
      })
    }

    return { organizations }
  }

  private async computePreferences(userId: string): Promise<UserPreferences> {
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

  private async computeProjectSettings(userId: string): Promise<ProjectSettings> {
    const projectMembers = await (prisma as any).projectMember.findMany({
      where: { userId },
      select: {
        projectId: true,
        settings: true,
        project: { select: { isDeleted: true } }
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

  private async computeOrganizationSettings(userId: string): Promise<OrganizationSettings> {
    const orgMemberships = await (prisma as any).orgMember.findMany({
      where: { userId },
      select: {
        organizationId: true,
        organization: { select: { settings: true } }
      }
    })

    const settings: OrganizationSettings = {}
    for (const membership of orgMemberships) {
      const orgSettings = membership.organization.settings as Record<string, any> || {}
      settings[membership.organizationId] = {
        branding: {
          logoUrl: orgSettings.branding?.logoUrl,
          brandColor: orgSettings.branding?.brandColor ?? orgSettings.branding?.themeColor,
          themeColor: orgSettings.branding?.themeColor ?? orgSettings.branding?.brandColor,
          subtext: orgSettings.branding?.subtext
        }
      }
    }
    return settings
  }

  invalidateUser(userId: string): void {
    this.cache.delete(userId)
    logger.debug('Invalidated UserSettingsPlus cache', 'UserSettingsPlus', { userId })
  }

  invalidateUsers(userIds: string[]): void {
    userIds.forEach(userId => this.cache.delete(userId))
  }

  clear(): void {
    this.cache.clear()
  }

  getStats() {
    const now = Date.now()
    let valid = 0
    let expired = 0
    for (const { expiresAt } of Array.from(this.cache.values())) {
      if (now < expiresAt) valid++
      else expired++
    }
    return { total: this.cache.size, valid, expired }
  }
}

export const userSettingsPlus = new UserSettingsPlusCache()

export async function checkProjectPermission(
  userId: string,
  projectId: string,
  scope: string,
  privilege: string
): Promise<boolean> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  for (const org of settings.permissions.organizations) {
    for (const client of org.clients) {
      const project = client.projects.find(p => p.id === projectId)
      if (project) {
        return project.scopes[scope]?.includes(privilege) ?? false
      }
    }
  }
  return false
}

export async function getProjectPermissions(
  userId: string,
  projectId: string
): Promise<Record<string, string[]>> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  for (const org of settings.permissions.organizations) {
    for (const client of org.clients) {
      const project = client.projects.find(p => p.id === projectId)
      if (project) return project.scopes
    }
  }
  return {}
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.preferences
}

export async function getProjectSettings(userId: string, projectId: string): Promise<ProjectSettings[string] | undefined> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.projectSettings[projectId]
}

export async function getOrganizationSettings(userId: string, orgId: string): Promise<OrganizationSettings[string] | undefined> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.organizationSettings[orgId]
}
