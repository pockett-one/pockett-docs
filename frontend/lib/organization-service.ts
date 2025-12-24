import { prisma } from './prisma'
import { User } from '@supabase/supabase-js'

export interface CreateOrganizationData {
  userId: string
  email: string
  firstName: string
  lastName: string
  organizationName: string
}

export interface OrganizationWithMembers {
  id: string
  name: string
  slug: string
  settings: any
  members: {
    id: string
    userId: string
    role: string
    isDefault: boolean
    email: string
    firstName: string | null
    lastName: string | null
    displayName: string | null
    avatarUrl: string | null
  }[]
  connectors: {
    id: string
    type: string
    email: string
    name: string | null
    status: string
    lastSyncAt: Date | null
  }[]
  _count?: {
    documents: number
  }
}

export class OrganizationService {
  /**
   * Create organization with member (for new users during onboarding)
   */
  static async createOrganizationWithMember(data: CreateOrganizationData): Promise<OrganizationWithMembers> {
    const slug = await this.generateUniqueSlug(data.organizationName)

    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        slug,
        members: {
          create: {
            userId: data.userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`.trim(),
            role: 'OWNER',
            isDefault: true
          }
        }
      },
      include: {
        members: true,
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
   * Create or get organization for a Supabase user (legacy support)
   * This maintains backward compatibility with existing auth flow
   */
  static async createOrGetOrganization(user: User): Promise<OrganizationWithMembers> {
    // Check if user already has an organization
    const existingMembership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isDefault: true },
      include: {
        organization: {
          include: {
            members: true,
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
        }
      }
    })

    if (existingMembership) {
      return existingMembership.organization
    }

    // Create new organization for user
    const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email!.split('@')[0]
    const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''

    return this.createOrganizationWithMember({
      userId: user.id,
      email: user.email!,
      firstName,
      lastName,
      organizationName: `${firstName}'s Workspace`
    })
  }

  /**
   * Get user's organizations
   */
  static async getUserOrganizations(userId: string): Promise<OrganizationWithMembers[]> {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: true,
            connectors: {
              select: {
                id: true,
                type: true,
                email: true,
                name: true,
                status: true,
                lastSyncAt: true
              }
            },
            _count: {
              select: { documents: true }
            }
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },  // Default org first
        { createdAt: 'asc' }
      ]
    })

    return memberships.map(m => m.organization)
  }

  /**
   * Get user's default organization
   */
  static async getDefaultOrganization(userId: string): Promise<OrganizationWithMembers | null> {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId, isDefault: true },
      include: {
        organization: {
          include: {
            members: true,
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
        }
      }
    })

    return membership?.organization || null
  }

  /**
   * Get organization by ID (with access check)
   */
  static async getOrganizationById(
    organizationId: string,
    userId: string
  ): Promise<OrganizationWithMembers | null> {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId
        }
      },
      include: {
        organization: {
          include: {
            members: true,
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
        }
      }
    })

    return membership?.organization || null
  }

  /**
   * Set default organization for user
   */
  static async setDefaultOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    await prisma.$transaction([
      // Remove default from all orgs
      prisma.organizationMember.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      // Set new default
      prisma.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId
          }
        },
        data: { isDefault: true }
      })
    ])
  }

  /**
   * Update organization settings
   */
  static async updateOrganization(
    organizationId: string,
    userId: string,
    data: { name?: string; settings?: any }
  ): Promise<OrganizationWithMembers> {
    // Verify user has access
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId
        }
      }
    })

    if (!membership) {
      throw new Error('Access denied')
    }

    // Only OWNER or ADMIN can update organization
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new Error('Insufficient permissions')
    }

    const updateData: any = {}
    if (data.name) {
      updateData.name = data.name
      updateData.slug = await this.generateUniqueSlug(data.name)
    }
    if (data.settings) {
      updateData.settings = data.settings
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        members: true,
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
  static async deleteOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Verify user is OWNER
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId
        }
      }
    })

    if (!membership || membership.role !== 'OWNER') {
      throw new Error('Only organization owner can delete')
    }

    await prisma.organization.delete({
      where: { id: organizationId }
    })
  }

  /**
   * Generate a unique slug for an organization
   */
  static async generateUniqueSlug(name: string): Promise<string> {
    // Convert name to slug format
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Always append random suffix for uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const slug = `${baseSlug}-${randomSuffix}`

    return slug
  }
}
