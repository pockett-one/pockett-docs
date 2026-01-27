import { prisma } from './prisma'
import { User } from '@supabase/supabase-js'
import { MemberRole } from '@prisma/client'

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
    role: MemberRole
    isDefault: boolean
    // email: string // Removed from schema
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

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Use immutable friendly slug (name + suffix)
    const slug = await this.generateUniqueSlug(data.organizationName)

    // Transaction: Org -> Member -> Customer -> Project
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          id,
          name: data.organizationName,
          slug,
          members: {
            create: {
              userId: data.userId,
              role: MemberRole.ORG_OWNER,
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

      // Auto-creation of Client/Project DISABLED per new requirements.
      // Org starts empty.

      return org
    })

    return result as unknown as OrganizationWithMembers
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
      return existingMembership.organization as unknown as OrganizationWithMembers
    }

    // Create new organization for user
    const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email!.split('@')[0]
    const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''

    return this.createOrganizationWithMember({
      userId: user.id,
      email: user.email!, // legacy param, not used in modern schema?
      firstName,
      lastName,
      organizationName: `${firstName}'s Organization`
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

    return memberships.map(m => m.organization as unknown as OrganizationWithMembers)
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

    return (membership?.organization as unknown as OrganizationWithMembers) || null
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

    return (membership?.organization as unknown as OrganizationWithMembers) || null
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

    // Only ORG_OWNER can update organization logic/billing
    if (membership.role !== MemberRole.ORG_OWNER) {
      throw new Error('Insufficient permissions')
    }

    const updateData: any = {}
    if (data.name) {
      updateData.name = data.name
      // updateData.slug = await this.generateUniqueSlug(data.name) // Keep slug stable (UUID)
    }
    if (data.settings) {
      updateData.settings = data.settings
    }

    const org = await prisma.organization.update({
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

    return org as unknown as OrganizationWithMembers
  }

  /**
   * Delete organization and all related data
   */
  static async deleteOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Verify user is ORG_OWNER
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId
        }
      }
    })

    if (!membership || membership.role !== MemberRole.ORG_OWNER) {
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
      .replace(/organization/gi, '') // Remove "organization" (case insensitive)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Always append random suffix for uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const slug = `${baseSlug}-${randomSuffix}`

    return slug
  }
}
