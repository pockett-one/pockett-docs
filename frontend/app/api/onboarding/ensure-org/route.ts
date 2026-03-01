import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'

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

    // createOrGetOrganization is idempotent — returns existing org if one already exists
    const org = await OrganizationService.createOrGetOrganization(user)

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
