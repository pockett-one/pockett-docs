import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { buildDefaultSandboxFirmName } from '@/lib/onboarding/sandbox-firm-name'
import { SANDBOX_FIRM_NAME_FALLBACK } from '@/lib/services/sample-file-service'
import { FirmService } from '@/lib/firm-service'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/utils/supabase/admin'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { safeInngestSend } from '@/lib/inngest/client'

/**
 * POST /api/onboarding/create-sandbox
 * Auth: Bearer token (Supabase). Body: { connectionId, sandboxFirmName? } (legacy: sandboxOrgName).
 * Fast path: create/reuse anchor sandbox firm, enqueue background provisioning in Inngest.
 */
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

    const body = await request.json().catch(() => ({}))
    const { connectionId, sandboxFirmName: bodyFirmName, sandboxOrgName: legacyOrgName } = body
    const sandboxFirmNameRaw = (typeof bodyFirmName === 'string' ? bodyFirmName : legacyOrgName) as
      | string
      | undefined

    if (!connectionId) {
      return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
    }

    const trimmedFromClient = (sandboxFirmNameRaw || '').trim()
    const resolvedForLog =
      trimmedFromClient ||
      buildDefaultSandboxFirmName(user.user_metadata?.first_name as string | undefined, SANDBOX_FIRM_NAME_FALLBACK)

    logger.info('Creating sandbox (batched)', {
      userId: user.id,
      connectionId,
      sandboxFirmName: resolvedForLog,
    })

    let firm = await prisma.firm.findFirst({
      where: {
        connectorId: connectionId,
        sandboxOnly: true,
        deletedAt: null,
        members: { some: { userId: user.id } },
      },
      select: { id: true, slug: true, name: true, settings: true },
    })

    if (!firm) {
      const created = await FirmService.createFirmWithMember({
        userId: user.id,
        email: user.email || '',
        firstName: (user.user_metadata?.first_name as string) || '',
        lastName: (user.user_metadata?.last_name as string) || '',
        firmName: resolvedForLog,
        connectorId: connectionId,
        allowDomainAccess: false,
        sandboxOnly: true,
      })
      firm = { id: created.id, slug: created.slug, name: created.name, settings: created.settings }
    }

    await prisma.firm.update({
      where: { id: firm.id },
      data: {
        settings: {
          ...((firm.settings as Record<string, unknown>) || {}),
          onboarding: {
            currentStep: 2,
            stage: 'provisioning',
            isComplete: false,
            driveConnected: true,
            lastUpdated: new Date().toISOString(),
          },
        },
      },
    })

    await Promise.all([
      FirmService.setDefaultFirm(user.id, firm.id),
      createAdminClient().auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          active_firm_id: firm.id,
          active_firm_slug: firm.slug,
          active_persona: 'firm_admin',
        },
        app_metadata: {
          ...(user.app_metadata ?? {}),
          active_firm_id: firm.id,
          active_persona: 'firm_admin',
        },
      }),
      invalidateUserSettingsPlus(user.id),
    ])

    await safeInngestSend('sandbox.provision.requested', {
      firmId: firm.id,
      userId: user.id,
      userEmail: user.email || '',
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      connectionId,
    })

    logger.info('Sandbox onboarding queued in background', {
      userId: user.id,
      firmId: firm.id,
      firmSlug: firm.slug,
    })

    return NextResponse.json({
      success: true,
      organizationId: firm.id,
      organizationSlug: firm.slug,
      organizationName: firm.name,
      firmId: firm.id,
      firmSlug: firm.slug,
      firmName: firm.name,
      provisioning: true,
    })
  } catch (error) {
    logger.error('Error creating sandbox (batched)', error as Error)
    const msg = error instanceof Error ? error.message : 'Failed to create sandbox'
    const isDbUnreachable = /can't reach database|P1001|connection refused|could not get access token/i.test(msg)
    return NextResponse.json(
      {
        error: isDbUnreachable
          ? 'Database is unreachable. For local dev, run supabase start and ensure DATABASE_URL is set.'
          : msg,
      },
      { status: 500 }
    )
  }
}
