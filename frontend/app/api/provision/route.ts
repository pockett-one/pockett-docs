import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { OrganizationService } from '@/lib/organization-service'
import { ROLES } from '@/lib/roles'
import { logger } from '@/lib/logger'

/**
 * POST /api/provision
 * 
 * Idempotent provisioning endpoint.
 * 1. Validates Supabase Token
 * 
 * Idempotent provisioning endpoint.
 * 1. Checks if user has an existing Organization
 * 2. IF NOT: Creates Default Org with explicit name
 * 3. Returns the slug to redirect to.
 */
export async function POST(request: NextRequest) {
    let userId: string | undefined

    try {
        // Parse Body for organizationName (Explicit Onboarding)
        const body = await request.json().catch(() => ({}))
        const { organizationName } = body
        // 1. Get Auth Token from Header
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
        }

        // 2. Validate User with Supabase
        // We create a fresh client here to ensure we verify the token against Supabase Auth
        const supabase = createClient(config.supabase.url, config.supabase.anonKey)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user || !user.email) {
            if (authError) logger.error('Provisioning Auth Error:', authError as Error)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        userId = user.id
        const userEmail = user.email
        const userName = user.user_metadata?.full_name || userEmail.split('@')[0]

        // 3. Check for existing Organization Membership
        // We look for the "Default" org first, or any org
        const existingMembership = await prisma.organizationMember.findFirst({
            where: { userId: userId },
            include: { organization: true },
            orderBy: { isDefault: 'desc' } // Prefer default marked orgs
        })

        if (existingMembership) {
            logger.debug(`User ${userId} already has org: ${existingMembership.organization.slug}`)
            return NextResponse.json({
                slug: existingMembership.organization.slug,
                type: 'existing'
            })
        }

        logger.debug(`Provisioning new organization for user ${userId}`)

        // 4. Create Default Hierarchy via Transaction

        if (!organizationName) {
            return NextResponse.json({ error: 'Onboarding Required', code: 'NO_ORG_NAME' }, { status: 400 })
        }

        const crypto = require('crypto')
        const newOrgId = crypto.randomUUID()
        // Slug generation is now handled inside OrganizationService logic implicitly? 
        // No, we are creating manually here transactions.
        // We need to generate the slug manually here using the new logic.
        // Or better, let's replicate the name-suffix logic here for consistency.

        const slug = await OrganizationService.generateUniqueSlug(organizationName)

        // Fetch Owner Role
        const ownerRole = await prisma.role.findUnique({ where: { name: ROLES.ORG_OWNER } })
        if (!ownerRole) throw new Error("System Error: ORG_OWNER role not found")

        const { newOrg } = await prisma.$transaction(async (tx) => {
            // 4a. Create Organization & Member
            const org = await tx.organization.create({
                data: {
                    id: newOrgId,
                    name: organizationName,
                    slug: slug,
                    settings: {
                        onboarding: {
                            currentStep: 2,
                            isComplete: false,
                            lastUpdated: new Date().toISOString()
                        }
                    },
                    members: {
                        create: {
                            userId: userId!,
                            roleId: ownerRole.id,
                            isDefault: true
                        }
                    }
                }
            })

            // 4b. Auto-creation of Client/Project DISABLED
            // The org will be created but empty.

            return { newOrg: org }
        })

        logger.debug(`Created new org: ${newOrg.slug} (${newOrg.id})`)

        return NextResponse.json({
            slug: newOrg.slug,
            type: 'created'
        })

    } catch (error: any) {
        logger.error('Provisioning Error:', error)

        // Handle Race Condition (P2002: Unique constraint failed)
        // If another request created the default org in parallel, just fetch it.
        if (error.code === 'P2002' && userId) {
            logger.debug('Race condition detected, fetching existing default org...')
            const existingMembership = await prisma.organizationMember.findFirst({
                where: { userId: userId },
                include: { organization: true },
                orderBy: { isDefault: 'desc' }
            })

            if (existingMembership) {
                return NextResponse.json({
                    slug: existingMembership.organization.slug,
                    type: 'existing'
                })
            }
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
