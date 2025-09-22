import { prisma } from './prisma'
import { User } from '@supabase/supabase-js'

export interface CreateOrganizationData {
  userId: string
  email: string
  name: string
  displayName?: string
  avatarUrl?: string
  settings?: any
}

export interface OrganizationWithConnectors {
  id: string
  name: string
  email: string
  displayName?: string | null
  avatarUrl?: string | null
  connectors: {
    id: string
    type: string
    email: string
    name: string | null
    status: string
    lastSyncAt: Date | null
  }[]
}

export class OrganizationService {
  /**
   * Create or get organization for a Supabase user
   */
  static async createOrGetOrganization(user: User): Promise<OrganizationWithConnectors> {
    const existingOrg = await prisma.organization.findUnique({
      where: { userId: user.id },
      include: {
        connectors: {
          select: {
            id: true,
            type: true,
            email: true,
            name: true,
            status: true,
            lastSyncAt: true
          }
        }
      }
    })

    if (existingOrg) {
      return existingOrg
    }

    // Create new organization
    const organization = await prisma.organization.create({
      data: {
        userId: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email!.split('@')[0],
        displayName: user.user_metadata?.full_name,
        avatarUrl: user.user_metadata?.avatar_url
      },
      include: {
        connectors: {
          select: {
            id: true,
            type: true,
            email: true,
            name: true,
            status: true,
            lastSyncAt: true
          }
        }
      }
    })

    return organization
  }

  /**
   * Get organization by user ID
   */
  static async getOrganizationByUserId(userId: string): Promise<OrganizationWithConnectors | null> {
    return prisma.organization.findUnique({
      where: { userId },
      include: {
        connectors: {
          select: {
            id: true,
            type: true,
            email: true,
            name: true,
            status: true,
            lastSyncAt: true
          }
        }
      }
    })
  }

  /**
   * Update organization settings
   */
  static async updateOrganization(
    organizationId: string, 
    data: Partial<CreateOrganizationData>
  ): Promise<OrganizationWithConnectors> {
    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        settings: data.settings || {}
      },
      include: {
        connectors: {
          select: {
            id: true,
            type: true,
            email: true,
            name: true,
            status: true,
            lastSyncAt: true
          }
        }
      }
    })
  }

  /**
   * Delete organization and all related data
   */
  static async deleteOrganization(organizationId: string): Promise<void> {
    await prisma.organization.delete({
      where: { id: organizationId }
    })
  }
}


