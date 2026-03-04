import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { duplicateConnectorForOrganization } from '@/lib/services/connection-manager'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { ensureProjectPersonasForProject } from '@/lib/actions/personas'

export async function POST(request: NextRequest) {
    try {
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
        const { connectionId, name, sandboxOnly } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Missing organization name' }, { status: 400 })
        }

        logger.info('Creating organization', {
            userId,
            connectionId,
            newOrgName: name,
            sandboxOnly: !!sandboxOnly
        })

        // No longer relying on a default "Personal" organization in the connector-first flow.

        // Get org_admin persona for RBAC
        const orgAdminPersona = await prisma.rbacPersona.findFirst({
            where: { slug: 'org_admin' }
        })
        if (!orgAdminPersona) {
            throw new Error("System Error: org_admin persona not found")
        }

        const newOrg = await prisma.organization.create({
            data: {
                name: name.trim(),
                slug: generateSlug(name.trim()),
                sandboxOnly: !!sandboxOnly,
                connectorId: connectionId || undefined,
                settings: {}
            }
        })

        // Update connector with onboarding progress
        if (connectionId) {
            const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
            if (connector) {
                const currentSettings = (connector.settings as any) || {}
                await prisma.connector.update({
                    where: { id: connectionId },
                    data: {
                        settings: {
                            ...currentSettings,
                            onboarding: {
                                currentStep: 4,
                                isComplete: false,
                                driveConnected: true,
                                testOrgCreated: false,
                                orgsImported: [],
                                defaultOrgSlug: '',
                                lastUpdated: new Date().toISOString()
                            }
                        }
                    }
                })
            }
        }

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
                userId: userId,
                organizationId: newOrg.id,
                organizationPersonaId: orgPersona.id,
                isDefault: true
            }
        })

        // Set this organization as default (unset other defaults)
        const { OrganizationService } = await import('@/lib/organization-service')
        await OrganizationService.setDefaultOrganization(userId, newOrg.id)

        logger.info('New manual organization created', { slug: newOrg.slug, id: newOrg.id, sandbox: !!sandboxOnly, connectionLinked: !!connectionId })

        // --- GOOGLE DRIVE FOLDER CREATION ---
        if (connectionId) {
            try {
                const { googleDriveConnector } = require('@/lib/google-drive-connector')
                const connectorForDrive = await prisma.connector.findUnique({
                    where: { id: connectionId }
                })

                if (connectorForDrive && connectorForDrive.status === 'ACTIVE') {
                    const driveSettings = (connectorForDrive.settings as any) || {}
                    const driveRootFolderId = driveSettings.rootFolderId || 'root'

                    const accessToken = await googleDriveConnector.getAccessToken(connectorForDrive.id)
                    if (accessToken) {
                        logger.info('Creating Drive folder for Organization', { orgName: newOrg.name, rootFolderId: driveRootFolderId })
                        const folder = await googleDriveConnector.createDriveFile(accessToken, {
                            name: newOrg.name.trim(),
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [driveRootFolderId]
                        })

                        if (folder?.id) {
                            logger.info('Drive folder created successfully', { folderId: folder.id })
                            // Save to OrgConnectorSettings
                            await prisma.orgConnectorSettings.upsert({
                                where: { organizationId: newOrg.id },
                                create: {
                                    organizationId: newOrg.id,
                                    connectorId: connectorForDrive.id,
                                    orgFolderId: folder.id
                                },
                                update: {
                                    orgFolderId: folder.id
                                }
                            })

                            // REMOVED: Redundant "Personal" client and "General" project creation.
                            // The onboarding flow's subsequent steps handle specific project/client creation.
                            logger.info('Organization Drive folder linked to OrgId', { orgId: newOrg.id, folderId: folder.id })
                        }
                    }
                }
            } catch (driveError) {
                logger.error('Failed to create Drive folder for Organization', driveError as Error)
                // We don't fail the whole request to avoid blocking onboarding, but logging is critical
            }
        }
        // ------------------------------------

        // Invalidate cache to ensure UI reflects new org immediately
        await invalidateUserSettingsPlus(userId)

        return NextResponse.json({
            success: true,
            organizationId: newOrg.id,
            organizationSlug: newOrg.slug,
            organizationName: newOrg.name
        })
    } catch (error) {
        logger.error('Error creating organization manually', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create organization' },
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
