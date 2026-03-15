/**
 * GET /api/debug/user-context
 *
 * Enabled when WORKSPACE_ENV=development (so it works with npm start locally).
 * Returns 404 otherwise. Never returns raw tokens.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { userSettingsPlus } from '@/lib/user-settings-plus'

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    if (!payload) return null
    const decoded = Buffer.from(payload, 'base64url').toString('utf8')
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET() {
  if (process.env.WORKSPACE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jwt = decodeJwtPayload(session.access_token ?? '')
  const userSettingsPlusData = await userSettingsPlus.getUserSettingsPlus(session.user.id)

  return NextResponse.json({
    jwt: jwt ?? { error: 'Failed to decode JWT payload' },
    userSettingsPlus: userSettingsPlusData,
  })
}
