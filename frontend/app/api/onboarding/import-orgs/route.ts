import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { importMultipleOrganizations } from '@/lib/services/auto-import'
import { createGoogleDriveAdapter } from '@/lib/connectors/adapters/google-drive-adapter'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { duplicateConnectorForOrganization } from '@/lib/services/connection-manager'
import { createClient } from '@supabase/supabase-js'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { FirmService } from '@/lib/firm-service'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id
        const body = await request.json()
        const { connectionId, selectedOrgIds, newOrgName, allowDomainAccess } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        logger.info('Importing organizations (V2)', {
            userId,
            connectionId,
            selectedOrgCount: selectedOrgIds?.length || 0,
            newOrgName: !!newOrgName
        })

        const adapter = createGoogleDriveAdapter(async () => {
            const token = await googleDriveConnector.getAccessToken(connectionId)
            if (!token) throw new Error('Could not get access token')
            return token
        })

        // 1. Get user's source organization (V2)
        const sourceFirm = await (prisma as any).firm.findFirst({
            where: {
                members: {
                    some: {
                        userId: userId,
                        isDefault: true,
                    },
                },
            },
        })

        if (!sourceFirm) {
            return NextResponse.json({ error: 'Default firm not found' }, { status: 400 })
        }

        let defaultOrgSlug: string | null = null
        let defaultOrgId: string | null = null

        // 2. Import selected organizations
        if (selectedOrgIds && selectedOrgIds.length > 0) {
            const importResults = await importMultipleOrganizations(
                connectionId,
                'root',
                selectedOrgIds,
                adapter,
                userId,
                sourceFirm.id,
                allowDomainAccess ?? true
            )

            if (importResults.length > 0) {
                // Last imported org is default (setDefaultOrganization called per org in import loop)
                const lastResult = importResults[importResults.length - 1]
                defaultOrgSlug = lastResult.orgSlug
                defaultOrgId = lastResult.orgId
            }
        }

        // 3. Manual creation if requested
        if (newOrgName && !defaultOrgSlug) {
            const firm = await FirmService.createFirmWithMember({
                userId,
                email: user.email || '',
                firstName: user.user_metadata?.first_name || '',
                lastName: user.user_metadata?.last_name || '',
                firmName: newOrgName,
                connectorId: connectionId,
                allowDomainAccess: allowDomainAccess ?? true
            })

            await FirmService.setDefaultFirm(userId, firm.id)
            await duplicateConnectorForOrganization(sourceFirm.id, firm.id, prisma)

            defaultOrgSlug = firm.slug
            defaultOrgId = firm.id
        }

        if (!defaultOrgSlug) {
            return NextResponse.json({ error: 'No organizations selected or created' }, { status: 400 })
        }

        // 4. Update connector progress
        if (connectionId) {
            const connector = await (prisma as any).connector.findUnique({ where: { id: connectionId } })
            if (connector) {
                const currentSettings = (connector.settings as any) || {}
                const testOrgCreated = currentSettings.onboarding?.testOrgCreated ?? false

                await (prisma as any).connector.update({
                    where: { id: connectionId },
                    data: {
                        settings: {
                            ...currentSettings,
                            onboarding: {
                                ...currentSettings.onboarding,
                                currentStep: 3,
                                isComplete: false,
                                driveConnected: true,
                                testOrgCreated,
                                orgsImported: selectedOrgIds || [],
                                defaultOrgSlug: defaultOrgSlug,
                                lastUpdated: new Date().toISOString()
                            }
                        }
                    }
                })
            }
        }

        // 5. Inject JWT Metadata (RBAC V2)
        if (defaultOrgId && defaultOrgSlug) {
            try {
                const adminClient = createAdminClient()
                await adminClient.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        ...user.user_metadata,
                        active_firm_id: defaultOrgId,
                        active_firm_slug: defaultOrgSlug,
                        active_persona: 'firm_admin',
                    },
                    app_metadata: {
                        active_firm_id: defaultOrgId,
                        active_persona: 'firm_admin',
                    }
                })
                logger.info('JWT metadata injected during onboarding (import-orgs)', { userId, firmId: defaultOrgId })
            } catch (jwtError) {
                logger.error('Failed to inject JWT metadata during onboarding (import-orgs)', jwtError as Error)
            }
        }

        await invalidateUserSettingsPlus(userId);

        return NextResponse.json({
            success: true,
            defaultOrgSlug,
            organizationId: defaultOrgId,
            imported: selectedOrgIds?.length || 0,
            created: newOrgName ? 1 : 0
        })
    } catch (error) {
        logger.error('Error importing organizations (V2)', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to import organizations' },
            { status: 500 }
        )
    }
}
