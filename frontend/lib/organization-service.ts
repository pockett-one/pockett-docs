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
        role: m.role || 'org_member',
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

    // Transaction: Org -> Member (RBAC v2: use role enum)
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

      await tx.orgMember.create({
        data: {
          userId: data.userId,
          organizationId: createdOrg.id,
          role: 'org_admin',
          membershipType: 'internal',
          isDefault: false
        }
      })

      return await tx.organization.findUnique({
        where: { id: createdOrg.id },
        include: { members: true }
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
          include: { members: true }
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
          include: { members: true }
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
          include: { members: true }
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
      include: { members: true }
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
    const membership = await (prisma as any).orgMember.findFirst({
      where: { organizationId, userId }
    })
    if (!membership) throw new Error('You do not have access to this organization')
    if (membership.role !== 'org_admin') {
      throw new Error('Only org admins can update organization settings')
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.settings !== undefined) updateData.settings = data.settings

    const org = await (prisma as any).organization.update({
      where: { id: organizationId },
      data: updateData,
      include: { members: true }
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
    const membership = await (prisma as any).orgMember.findFirst({
      where: { organizationId, userId }
    })
    if (!membership) throw new Error('You do not have access to this organization')
    if (membership.role !== 'org_admin') {
      throw new Error('Only org admins can delete an organization')
    }

    await (prisma as any).organization.delete({
      where: { id: organizationId }
    })
  }

  static async generateUniqueSlug(name: string): Promise<string> {
    const { generateOrganizationSlug } = await import('@/lib/slug-utils')
    return generateOrganizationSlug(name)
  }

  /**
   * Hands-free onboarding: create a default sandbox org for a user (no connector, no clients/projects).
   * Used from auth callback when user has no default org. Caller must then set default org and JWT.
   */
  static async autoProvisionDefaultSandbox(user: {
    id: string
    email?: string | null
    user_metadata?: { first_name?: string; full_name?: string }
  }): Promise<OrganizationWithMembers> {
    const firstName = user.user_metadata?.first_name ||
      (user.user_metadata?.full_name && user.user_metadata.full_name.split(' ')[0]) ||
      (user.email && user.email.split('@')[0]) ||
      'My'
    const lastName = (user.user_metadata?.full_name && user.user_metadata.full_name.split(' ').slice(1).join(' ')) || ''
    const orgName = firstName.trim() || 'My Workspace'
    const safeName = orgName.replace(/\s+/g, ' ').trim().slice(0, 100) || 'My Workspace'

    const org = await this.createOrganizationWithMember({
      userId: user.id,
      email: user.email || '',
      firstName,
      lastName,
      organizationName: safeName,
      sandboxOnly: true,
      connectorId: null,
      allowDomainAccess: false,
    })

    await this.setDefaultOrganization(user.id, org.id)
    await this.updateOrganization(org.id, user.id, {
      settings: { onboarding: { isComplete: true } },
    })

    return org
  }
}
