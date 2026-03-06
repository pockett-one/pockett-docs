import { getRlsPrisma } from './prisma-server'
import { prisma } from './prisma' // Administrative client for creating
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
          isDefault: true
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
   * Get user's organizations (Uses RLS!)
   */
  static async getUserOrganizations(): Promise<OrganizationWithMembers[]> {
    const rlsPrisma = await getRlsPrisma()

    // RLS handles filtering which organizations we can see
    const orgs = await rlsPrisma.organization.findMany({
      include: {
        members: {
          include: { persona: true }
        }
      },
      orderBy: [
        { createdAt: 'asc' }
      ]
    })

    // Map organizations
    return orgs.map((org: any) => this.mapToInterface(org))
  }

  /**
   * Get user's default organization
   */
  static async getDefaultOrganization(userId: string): Promise<OrganizationWithMembers | null> {
    const rlsPrisma = await getRlsPrisma()

    // In V2, we might just want to find the one where the user is an org member and isDefault is true
    // Since we are moving to RLS, the user can only see orgs they have access to.
    const orgIdRecords = await rlsPrisma.orgMember.findMany({
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
   * Get organization by ID (Uses RLS!)
   */
  static async getOrganizationById(organizationId: string): Promise<OrganizationWithMembers | null> {
    const rlsPrisma = await getRlsPrisma()

    // If the user doesn't have access, RLS will silently return null
    const org = await rlsPrisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: { persona: true }
        }
      }
    })

    return org ? this.mapToInterface(org) : null
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
   * Update organization settings (Uses RLS!)
   */
  static async updateOrganization(
    organizationId: string,
    userId: string,
    data: any
  ): Promise<OrganizationWithMembers> {
    const rlsPrisma = await getRlsPrisma()

    // We don't need manual checking. If the user isn't an org_admin, RLS will throw or return RecordNotFound.
    const updateData: any = {}
    if (data.name) updateData.name = data.name

    const org = await rlsPrisma.organization.update({
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
   * Delete organization (Uses RLS!)
   */
  static async deleteOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const rlsPrisma = await getRlsPrisma()

    // Only org_admin can delete. The DB level policies must enforce this.
    // If we haven't strictly written a DELETE policy for RLS, it will throw an error.
    await rlsPrisma.organization.delete({
      where: { id: organizationId }
    })
  }

  static async generateUniqueSlug(name: string): Promise<string> {
    const { generateOrganizationSlug } = await import('@/lib/slug-utils')
    return generateOrganizationSlug(name)
  }
}
