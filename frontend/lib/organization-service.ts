import { prisma } from './prisma'
import { User } from '@supabase/supabase-js'
import { ROLES } from './roles'

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
}

export interface OrganizationWithMembers {
  id: string
  name: string
  slug: string
  settings: any
  brandingSubtext?: string | null
  logoUrl?: string | null
  themeColorHex?: string | null
  members: {
    id: string
    userId: string
    role: string // Role Name (e.g. ORG_OWNER)
    isDefault: boolean
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
   * Helper to map Prisma result to OrganizationWithMembers
   */
  private static mapToInterface(org: any): OrganizationWithMembers {
    return {
      ...org,
      members: org.members.map((m: any) => ({
        ...m,
        role: m.organizationPersona?.rbacPersona?.role?.slug || 'org_member' // Flatten Role Slug
      }))
    }
  }

  /**
   * Create organization with member (for new users during onboarding)
   */
  static async createOrganizationWithMember(data: CreateOrganizationData): Promise<OrganizationWithMembers> {
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const slug = await this.generateUniqueSlug(data.organizationName)

    // Fetch Organization Owner persona from RBAC schema (slug org_admin, displayName Organization Owner)
    const orgOwnerPersona = await prisma.rbacPersona.findFirst({
      where: { slug: 'org_admin' }
    })
    if (!orgOwnerPersona) throw new Error("System Error: org_admin persona not found")

    // Transaction: Org -> Member
    const org = await prisma.$transaction(async (tx) => {
      const domain = data.allowedEmailDomain?.toLowerCase().trim() || null
      const createdOrg = await tx.organization.create({
        data: {
          id,
          name: data.organizationName,
          slug,
          allowDomainAccess: data.allowDomainAccess === true,
          allowedEmailDomain: data.allowDomainAccess ? domain : null
        }
      })

      // Create organization persona
      const orgPersona = await tx.organizationPersona.create({
        data: {
          organizationId: createdOrg.id,
          rbacPersonaId: orgOwnerPersona.id,
          displayName: 'Organization Owner'
        }
      })

      // Create member with organization persona
      await tx.organizationMember.create({
        data: {
          userId: data.userId,
          organizationId: createdOrg.id,
          organizationPersonaId: orgPersona.id,
          isDefault: true
        }
      })

      return await tx.organization.findUnique({
        where: { id: createdOrg.id },
        include: {
          members: {
            include: {
              organizationPersona: {
                include: {
                  rbacPersona: {
                    include: { role: true }
                  }
                }
              }
            }
          },
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
    })

    return this.mapToInterface(org)
  }

  /**
   * Create or get organization for a Supabase user (legacy support)
   */
  static async createOrGetOrganization(user: User): Promise<OrganizationWithMembers> {
    const existingMembership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isDefault: true },
      include: {
        organization: {
          include: {
            members: {
              include: {
                organizationPersona: {
                  include: {
                    rbacPersona: {
                      include: { role: true }
                    }
                  }
                }
              }
            },
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
   * Get user's organizations
   */
  static async getUserOrganizations(userId: string): Promise<OrganizationWithMembers[]> {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              include: {
                organizationPersona: {
                  include: {
                    rbacPersona: {
                      include: { role: true }
                    }
                  }
                }
              }
            },
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
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return memberships.map(m => this.mapToInterface(m.organization))
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
            members: {
              include: {
                organizationPersona: {
                  include: {
                    rbacPersona: {
                      include: { role: true }
                    }
                  }
                }
              }
            },
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

    return membership ? this.mapToInterface(membership.organization) : null
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
            members: {
              include: {
                organizationPersona: {
                  include: {
                    rbacPersona: {
                      include: { role: true }
                    }
                  }
                }
              }
            },
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

    return membership ? this.mapToInterface(membership.organization) : null
  }

  /**
   * Set default organization
   */
  static async setDefaultOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    await prisma.$transaction([
      prisma.organizationMember.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
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
    data: {
      name?: string
      settings?: any
      branding?: { logoUrl?: string | null; subtext?: string | null; themeColor?: string | null }
    }
  ): Promise<OrganizationWithMembers> {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId }
      },
      include: {
        organizationPersona: {
          include: {
            rbacPersona: {
              include: { role: true }
            }
          }
        }
      }
    })

    if (!membership) throw new Error('Access denied')
    const personaSlug = membership.organizationPersona?.rbacPersona?.slug || ''
    if (personaSlug !== 'org_admin') throw new Error('Insufficient permissions')

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.settings) updateData.settings = data.settings
    if (data.branding) {
      if (data.branding.logoUrl !== undefined) updateData.logoUrl = data.branding.logoUrl ?? null
      if (data.branding.subtext !== undefined) updateData.brandingSubtext = data.branding.subtext ?? null
      if (data.branding.themeColor !== undefined) updateData.themeColorHex = data.branding.themeColor ?? null
    }

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        members: {
          include: {
            organizationPersona: {
              include: {
                rbacPersona: {
                  include: { role: true }
                }
              }
            }
          }
        },
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

    return this.mapToInterface(org)
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId }
      },
      include: {
        organizationPersona: {
          include: {
            rbacPersona: {
              include: { role: true }
            }
          }
        }
      }
    })

    if (!membership) {
      throw new Error('Only organization owner can delete')
    }
    const personaSlug = membership.organizationPersona?.rbacPersona?.slug || ''
    if (personaSlug !== 'org_admin') {
      throw new Error('Only organization owner can delete')
    }

    await prisma.organization.delete({
      where: { id: organizationId }
    })
  }

  static async generateUniqueSlug(name: string): Promise<string> {
    const { generateOrganizationSlug } = await import('@/lib/slug-utils')
    return generateOrganizationSlug(name)
  }
}
