import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { runSandboxOnboarding } from '@/lib/onboarding/onboarding-helper'

/**
 * POST /api/onboarding/create-sandbox
 * Auth: Bearer token (Supabase). Body: { connectionId, sandboxOrgName? }.
 * Delegates to OnboardingHelper for firm + hierarchy + Drive + Inngest.
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
    const { connectionId, sandboxOrgName } = body

    if (!connectionId) {
      return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
    }

    logger.info('Creating sandbox (batched)', {
      userId: user.id,
      connectionId,
      sandboxOrgName: (sandboxOrgName || '').trim() || 'Pockett Inc.',
    })

    const result = await runSandboxOnboarding({
      userId: user.id,
      userEmail: user.email || '',
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      connectionId,
      sandboxOrgName,
    })

    logger.info('Sandbox onboarding batch complete (includes Polar free plan when configured)', {
      userId: user.id,
      firmId: result.firm.id,
      firmSlug: result.firm.slug,
    })

    return NextResponse.json({
      success: true,
      organizationId: result.firm.id,
      organizationSlug: result.firm.slug,
      organizationName: result.firm.name,
      firmId: result.firm.id,
      firmSlug: result.firm.slug,
      firmName: result.firm.name,
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
