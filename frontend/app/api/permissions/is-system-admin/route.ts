/**
 * GET /api/permissions/is-system-admin
 * Returns whether the current user can access /system (JWT app_metadata.role === 'SYS_ADMIN').
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const JWT_ADMIN_ROLE = 'SYS_ADMIN'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isSystemAdmin = (user.app_metadata?.role as string) === JWT_ADMIN_ROLE
  return NextResponse.json({ isSystemAdmin })
}
