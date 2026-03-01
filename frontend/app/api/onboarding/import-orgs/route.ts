import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { importMultipleOrganizations } from '@/lib/services/auto-import'
import { createGoogleDriveAdapter } from '@/lib/connectors/adapters/google-drive-adapter'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { duplicateConnectorForOrganization } from '@/lib/services/connection-manager'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        // Get user from authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id

        const body = await request.json()
        const { connectionId, selectedOrgIds, newOrgName } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        logger.info('Importing organizations', {
            userId,
            connectionId,
            selectedOrgCount: selectedOrgIds?.length || 0,
            newOrgName: !!newOrgName
        })

        // Create adapter for Google Drive
        const adapter = createGoogleDriveAdapter(async () => {
            const token = await googleDriveConnector.getAccessToken(connectionId)
            if (!token) throw new Error('Could not get access token')
            return token
        })

        // Get user's default/source organization (the one created during initial signup)
        const sourceOrganization = await prisma.organization.findFirst({
            where: {
                members: {
                    some: {
                        userId: userId,
                        isDefault: true,
                    },
                },
            },
        })

        if (!sourceOrganization) {
            return NextResponse.json(
                { error: 'Default organization not found' },
                { status: 400 }
            )
        }

        let defaultOrgSlug: string | null = null
        let defaultOrgId: string | null = null

        // If selected org IDs provided, import them
        if (selectedOrgIds && selectedOrgIds.length > 0) {
            const importResults = await importMultipleOrganizations(
                connectionId,
                'root',
                selectedOrgIds,
                adapter,
                userId,
                sourceOrganization.id
            )

            if (importResults.length > 0) {
                defaultOrgSlug = importResults[0].orgSlug
                // Look up the imported org's ID for downstream steps
                const importedOrg = await prisma.organization.findFirst({
                    where: { slug: defaultOrgSlug }
                })
                defaultOrgId = importedOrg?.id ?? null
                logger.info('Organizations imported', {
                    count: importResults.length,
                    defaultOrgSlug,
                    defaultOrgId
                })
            }
        }

        // If newOrgName provided and no default org yet, create new org
        if (newOrgName && !defaultOrgSlug) {
            // Get org_admin persona for RBAC
            const orgAdminPersona = await prisma.rbacPersona.findFirst({
                where: { slug: 'org_admin' }
            })
            if (!orgAdminPersona) {
                throw new Error("System Error: org_admin persona not found")
            }

            const newOrg = await prisma.organization.create({
                data: {
                    name: newOrgName,
                    slug: generateSlug(newOrgName),
                    sandboxOnly: false,
                    settings: {
                        onboarding: {
                            currentStep: 4,
                            isComplete: false,
                            driveConnected: true,
                            testOrgCreated: false,
                            orgsImported: selectedOrgIds || [],
                            defaultOrgSlug: '',
                            lastUpdated: new Date().toISOString()
                        }
                    }
                }
            })

            // Create organization persona for RBAC
            const orgPersona = await prisma.organizationPersona.create({
                data: {
                    organizationId: newOrg.id,
                    rbacPersonaId: orgAdminPersona.id,
                    displayName: 'Organization Owner'
                }
            })

            // Create member with organization persona
            await prisma.organizationMember.create({
                data: {
                    userId,
                    organizationId: newOrg.id,
                    organizationPersonaId: orgPersona.id,
                    isDefault: true
                }
            })

            // Duplicate connection from source organization
            await duplicateConnectorForOrganization(
                sourceOrganization.id,
                newOrg.id,
                prisma
            )

            defaultOrgSlug = newOrg.slug
            defaultOrgId = newOrg.id
            logger.info('New organization created', { slug: defaultOrgSlug, id: defaultOrgId, connectionDuplicated: true })
        }

        if (!defaultOrgSlug) {
            return NextResponse.json(
                { error: 'No organizations selected or created' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            defaultOrgSlug,
            organizationId: defaultOrgId,
            imported: selectedOrgIds?.length || 0,
            created: newOrgName ? 1 : 0
        })
    } catch (error) {
        logger.error('Error importing organizations', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to import organizations' },
            { status: 500 }
        )
    }
}

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
    return (
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            // Add random suffix for uniqueness
            .concat('-', Math.random().toString(36).substring(2, 6))
    )
}
