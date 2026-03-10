import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/utils/supabase/admin'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "dummy")
)

/**
 * POST /api/onboarding/ensure-org
 *
 * Idempotently ensures the authenticated user has a default organization.
 * Called during onboarding init when no org is found (e.g. users with an
 * existing session that bypassed the auth/callback org-creation step).
 *
 * Returns { id, slug, name } of the org.
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

    // Check if user has a default organization
    const org = await OrganizationService.getDefaultOrganization(user.id)

    if (!org) {
      return NextResponse.json({ organization: null })
    }

    // Inject JWT Metadata (RBAC V2)
    try {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.updateUserById(user.id, {
        app_metadata: {
          active_org_id: org.id,
          active_persona: 'org_owner' // Fallback to owner if ensuring
        }
      })
      logger.info('JWT metadata injected during onboarding (ensure-org)', { userId: user.id, orgId: org.id })
    } catch (jwtError) {
      logger.error('Failed to inject JWT metadata during onboarding (ensure-org)', jwtError as Error)
    }

    return NextResponse.json({
      id: org.id,
      slug: org.slug,
      name: org.name
    })
  } catch (error) {
    console.error('[ensure-org] Error:', error)
    return NextResponse.json(
      { error: 'Failed to ensure organization' },
      { status: 500 }
    )
  }
}
