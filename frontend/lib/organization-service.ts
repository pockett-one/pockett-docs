import { prisma } from './prisma'
import { User } from '@supabase/supabase-js'
import { logger } from './logger'

export interface CreateOrganizationData {
  userId: string
  email: string
  firstName: string
  lastName: string
  organizationName: string
  /** When true, users with allowedEmailDomain can join org without invite (org member only). */
  allowDomainAccess?: boolean
  /** Email domain (e.g. "acme.com") to allow; stored lowercase. */
  allowedEmailDomain?: string | null
  /** Optional Drive Folder ID for the organization. */
  orgFolderId?: string | null
  /** Optional Connector ID for the organization. */
  connectorId?: string | null
  /** Whether this is a sandbox organization. */
  sandboxOnly?: boolean
}

export interface OrganizationWithMembers {
  id: string
  name: string
  slug: string
  settings?: any
  allowDomainAccess?: boolean
  allowedEmailDomain?: string | null
  brandingSubtext?: string | null
  logoUrl?: string | null
  themeColorHex?: string | null
  orgFolderId?: string | null
  connectorId?: string | null
  createdAt: Date
  sandboxOnly: boolean
  members: {
    id: string
    userId: string
    role: string // Role Name (e.g. org_owner)
    isDefault: boolean
  }[]
}

export class OrganizationService {
  /**
   * Helper to map Prisma result to OrganizationWithMembers using V2 schema
   */
  private static mapToInterface(org: any): OrganizationWithMembers {
    if (!org) return null as any
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      settings: org.settings,
      allowDomainAccess: org.allowDomainAccess,
      allowedEmailDomain: org.allowedEmailDomain,
      brandingSubtext: org.brandingSubtext,
      logoUrl: org.logoUrl,
      themeColorHex: org.themeColorHex,
      orgFolderId: org.orgFolderId,
      connectorId: org.connectorId,
      createdAt: org.createdAt,
      sandboxOnly: org.sandboxOnly,
      members: org.members ? org.members.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.persona?.slug || 'org_member',
        isDefault: m.isDefault
      })) : []
    }
  }

  /**
   * Create organization with member (Administrative action, bypasses RLS to insert)
   */
  static async createOrganizationWithMember(data: CreateOrganizationData): Promise<OrganizationWithMembers> {
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const { generateOrganizationSlug } = await import('@/lib/slug-utils')
    const slug = await generateOrganizationSlug(data.organizationName)

    // Fetch Organization Owner persona from V2 schema
    const orgOwnerPersona = await prisma.persona.findFirst({
      where: { slug: 'org_owner' }
    })

    if (!orgOwnerPersona) {
      throw new Error("System Error: org_owner persona not found in DB. Did you run the seed?")
    }

    // Transaction: Org -> Member
    const org = await (prisma as any).$transaction(async (tx: any) => {
      const createdOrg = await tx.organization.create({
        data: {
          id,
          name: data.organizationName, // safeEncrypt happens inside Prisma extension
          slug,
          allowDomainAccess: data.allowDomainAccess ?? false,
          allowedEmailDomain: data.allowedEmailDomain,
          orgFolderId: data.orgFolderId,
          connectorId: data.connectorId,
          sandboxOnly: data.sandboxOnly ?? false
        }
      })

      // Create member directly linked to the persona
      await tx.orgMember.create({
        data: {
          userId: data.userId,
          organizationId: createdOrg.id,
          personaId: orgOwnerPersona.id,
          isDefault: false
        }
      })

      return await tx.organization.findUnique({
        where: { id: createdOrg.id },
        include: {
          members: {
            include: {
              persona: true
            }
          }
        }
      })
    })

    return this.mapToInterface(org)
  }

  /**
   * Create or get organization for a Supabase user
   */
  static async createOrGetOrganization(user: User): Promise<OrganizationWithMembers> {
    const existingMembership = await prisma.orgMember.findFirst({
      where: { userId: user.id, isDefault: true },
      include: {
        organization: {
          include: {
            members: {
              include: { persona: true }
            }
          }
        }
      }
    })

    if (existingMembership) {
      return this.mapToInterface(existingMembership.organization)
    }

    const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email!.split('@')[0]
    const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''

    return this.createOrganizationWithMember({
      userId: user.id,
      email: user.email!,
      firstName,
      lastName,
      organizationName: `${firstName}'s Organization`
    })
  }

  /**
   * Get organizations the current user belongs to.
   * Requires an explicit userId — callers must resolve it from the session first.
   */
  static async getUserOrganizations(userId: string): Promise<OrganizationWithMembers[]> {
    const memberships = await (prisma as any).orgMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              include: { persona: true }
            }
          }
        }
      },
      orderBy: { organization: { createdAt: 'asc' } }
    })

    return memberships.map((m: any) => this.mapToInterface(m.organization))
  }

  /**
   * Get user's default organization (explicit userId filter, no RLS dependency).
   */
  static async getDefaultOrganization(userId: string): Promise<OrganizationWithMembers | null> {
    const orgIdRecords = await (prisma as any).orgMember.findMany({
      where: { userId, isDefault: true },
      include: {
        organization: {
          include: { members: { include: { persona: true } } }
        }
      }
    })

    if (orgIdRecords.length > 0) {
      return this.mapToInterface(orgIdRecords[0].organization)
    }
    return null
  }

  /**
   * Get organization by ID, verifying the caller is a member.
   */
  static async getOrganizationById(organizationId: string, userId?: string): Promise<OrganizationWithMembers | null> {
    const org = await (prisma as any).organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: { persona: true }
        }
      }
    })

    if (!org) return null

    // If a userId is provided, verify membership before returning
    if (userId) {
      const isMember = org.members.some((m: any) => m.userId === userId)
      if (!isMember) return null
    }

    return this.mapToInterface(org)
  }

  /**
   * Set default organization
   */
  static async setDefaultOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    logger.info('Setting default organization', { userId, organizationId })

    // Use admin Prisma for setting default, or RLS if policies allow update
    const [unsetCount, setResults] = await prisma.$transaction([
      prisma.orgMember.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      }),
      prisma.orgMember.updateMany({
        where: {
          organizationId,
          userId
        },
        data: { isDefault: true }
      })
    ])

    if (setResults.count === 0) {
      logger.warn('Failed to set default organization: membership record not found', {
        userId,
        organizationId
      })
    } else {
      logger.info('Successfully set default organization', {
        userId,
        organizationId,
        unsetCount: unsetCount.count
      })
    }
  }

  /**
   * Update organization settings (explicit membership check).
   */
  static async updateOrganization(
    organizationId: string,
    userId: string,
    data: any
  ): Promise<OrganizationWithMembers> {
    // Verify the user is an org_owner or org_admin before allowing update
    const membership = await (prisma as any).orgMember.findFirst({
      where: { organizationId, userId },
      include: { persona: true }
    })
    if (!membership) throw new Error('You do not have access to this organization')

    const adminPersonas = ['org_owner', 'org_admin']
    if (!adminPersonas.includes(membership.persona?.slug)) {
      throw new Error('Only org admins can update organization settings')
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.settings !== undefined) updateData.settings = data.settings

    const org = await (prisma as any).organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        members: {
          include: { persona: true }
        }
      }
    })

    return this.mapToInterface(org)
  }

  /**
   * Delete organization (explicit membership check).
   */
  static async deleteOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Verify the user is an org_owner before allowing delete
    const membership = await (prisma as any).orgMember.findFirst({
      where: { organizationId, userId },
      include: { persona: true }
    })
    if (!membership) throw new Error('You do not have access to this organization')
    if (membership.persona?.slug !== 'org_owner') {
      throw new Error('Only org owners can delete an organization')
    }

    await (prisma as any).organization.delete({
      where: { id: organizationId }
    })
  }

  static async generateUniqueSlug(name: string): Promise<string> {
    const { generateOrganizationSlug } = await import('@/lib/slug-utils')
    return generateOrganizationSlug(name)
  }
}
