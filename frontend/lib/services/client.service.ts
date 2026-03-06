import { prisma } from '@/lib/prisma'
import { getRlsPrisma } from '@/lib/prisma-server'
import { logger } from '@/lib/logger'

export interface ClientWithMembers {
    id: string
    organizationId: string
    name: string
    slug: string
    industry?: string | null
    sector?: string | null
    status?: string | null
    settings?: any
    sandboxOnly: boolean
    members: {
        id: string
        userId: string
        role: string
        isDefault: boolean
    }[]
}

export class ClientService {
    /**
     * Map Prisma result to ClientWithMembers interface
     */
    private static mapToInterface(client: any): ClientWithMembers {
        if (!client) return null as any
        return {
            id: client.id,
            organizationId: client.organizationId,
            name: client.name,
            slug: client.slug,
            industry: client.industry,
            sector: client.sector,
            status: client.status,
            settings: client.settings,
            sandboxOnly: client.sandboxOnly,
            members: client.members ? client.members.map((m: any) => ({
                id: m.id,
                userId: m.userId,
                role: m.persona?.slug || 'project_viewer',
                isDefault: m.isDefault
            })) : []
        }
    }

    /**
     * Create a new client and add the creator as a member (Administrative action)
     */
    static async createClient(data: {
        organizationId: string
        name: string
        creatorUserId: string
        industry?: string
        sector?: string
        sandboxOnly?: boolean
        settings?: any
    }): Promise<ClientWithMembers> {
        const { generateClientSlug } = await import('@/lib/slug-utils')
        const slug = await generateClientSlug(data.name)

        // Fetch Project Admin persona (which now covers Client Admin duties)
        const projectAdminPersona = await (prisma as any).persona.findUnique({
            where: { slug: 'project_admin' }
        })

        if (!projectAdminPersona) {
            throw new Error("System Error: project_admin persona not found in DB")
        }

        const client = await (prisma as any).$transaction(async (tx: any) => {
            const createdClient = await tx.client.create({
                data: {
                    organizationId: data.organizationId,
                    name: data.name,
                    slug,
                    industry: data.industry,
                    sector: data.sector,
                    sandboxOnly: data.sandboxOnly ?? false,
                    settings: data.settings ?? {}
                }
            })

            // Add Creator as Client Admin
            await tx.clientMember.create({
                data: {
                    clientId: createdClient.id,
                    userId: data.creatorUserId,
                    personaId: projectAdminPersona.id,
                    isDefault: true
                }
            })

            return await tx.client.findUnique({
                where: { id: createdClient.id },
                include: {
                    members: {
                        include: { persona: true }
                    }
                }
            })
        })

        return this.mapToInterface(client)
    }

    /**
     * Get organization clients (Uses RLS!)
     */
    static async getOrganizationClients(organizationId: string): Promise<ClientWithMembers[]> {
        const rlsPrisma = await getRlsPrisma()
        const clients = await rlsPrisma.client.findMany({
            where: { organizationId },
            include: {
                members: {
                    include: { persona: true }
                }
            }
        })
        return clients.map(c => this.mapToInterface(c))
    }

    /**
     * Get client by ID (Uses RLS!)
     */
    static async getClientById(clientId: string): Promise<ClientWithMembers | null> {
        const rlsPrisma = await getRlsPrisma()
        const client = await rlsPrisma.client.findUnique({
            where: { id: clientId },
            include: {
                members: {
                    include: { persona: true }
                }
            }
        })
        return client ? this.mapToInterface(client) : null
    }
}
