/**
 * GET /api/debug/enabled
 *
 * Returns { enabled: true } when WORKSPACE_ENV=development (server-only; no NEXT_PUBLIC_ needed).
 * Used by the debug floating trigger to decide whether to show the icon.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const enabled = process.env.WORKSPACE_ENV === 'development'
  if (!enabled) {
    return NextResponse.json({ enabled: false })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ enabled: false })
  }
  return NextResponse.json({ enabled: true })
}
