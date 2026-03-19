import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FirmService } from '@/lib/firm-service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/utils/supabase/admin'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "dummy")
)

/**
 * POST /api/onboarding/ensure-org
 *
 * Legacy endpoint: idempotently ensures the authenticated user has a default firm.
 * Called during onboarding init when no org is found (e.g. users with an
 * existing session that bypassed the auth/callback org-creation step).
 *
 * Returns { id, slug, name } of the firm (legacy shape).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has a default firm
    const firm = await FirmService.getDefaultFirm(user.id)

    if (!firm) {
      return NextResponse.json({ organization: null })
    }

    // Inject JWT Metadata (RBAC V2)
    try {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          active_firm_id: firm.id,
          active_firm_slug: firm.slug,
          active_persona: 'firm_admin',
        },
        app_metadata: {
          active_firm_id: firm.id,
          active_persona: 'firm_admin', // Fallback to admin if ensuring
        }
      })
      logger.info('JWT metadata injected during onboarding (ensure-org)', { userId: user.id, firmId: firm.id })
    } catch (jwtError) {
      logger.error('Failed to inject JWT metadata during onboarding (ensure-org)', jwtError as Error)
    }

    return NextResponse.json({
      id: firm.id,
      slug: firm.slug,
      name: firm.name
    })
  } catch (error) {
    console.error('[ensure-org] Error:', error)
    return NextResponse.json(
      { error: 'Failed to ensure firm' },
      { status: 500 }
    )
  }
}
