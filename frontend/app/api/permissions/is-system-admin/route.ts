/**
 * GET /api/permissions/is-system-admin
 * Returns whether the current user is a system admin (source of truth: system.system_admins).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isSystemAdmin } from '@/lib/permission-helpers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await isSystemAdmin(user.id)
  return NextResponse.json({ isSystemAdmin: admin })
}
