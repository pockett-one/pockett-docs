/**
 * GET /api/permissions/is-system-admin
 * Returns whether the current user can access /internal (org_admin of System Management org).
 * Does NOT grant access to customer orgs.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isSystemManagementAdmin } from '@/lib/permission-helpers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await isSystemManagementAdmin(user.id)
  return NextResponse.json({ isSystemAdmin: admin })
}
