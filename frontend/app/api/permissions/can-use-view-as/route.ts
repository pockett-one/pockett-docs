/**
 * API Route: Can current user use "View As"?
 * Returns true if user can access RBAC admin (e.g. org_admin in any org).
 * Used by the sidebar to show the View As dropdown based on persona, not page location.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { canAccessRbacAdmin } from '@/lib/permission-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ canUseViewAs: false }, { status: 200 })
    }

    const canUseViewAs = await canAccessRbacAdmin(user.id)
    return NextResponse.json({ canUseViewAs })
  } catch {
    return NextResponse.json({ canUseViewAs: false }, { status: 200 })
  }
}
