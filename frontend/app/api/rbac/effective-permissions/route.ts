/**
 * GET /api/rbac/effective-permissions?persona=<slug>
 * Returns effective org-level permission flags for a persona (for "View As").
 * Protected: org_admin or SYS_ADMIN.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { canAccessRbacAdmin } from '@/lib/permission-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSysAdmin = (user.app_metadata?.role as string) === 'SYS_ADMIN'
    const canRbac = isSysAdmin || (await canAccessRbacAdmin(user.id))

    if (!canRbac) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const personaSlug = request.nextUrl.searchParams.get('persona')
    if (!personaSlug) {
      return NextResponse.json({ error: 'Missing persona' }, { status: 400 })
    }

    const { getCapabilitiesForPersona } = await import('@/lib/permissions/persona-map')
    const capabilities = getCapabilitiesForPersona(personaSlug)

    return NextResponse.json({
      canView: capabilities['project:can_view'] === true,
      canEdit: capabilities['project:can_manage'] === true, // Map manage to edit for UI
      canManage: capabilities['project:can_manage'] === true,
      canViewClients: capabilities['project:can_view'] === true,
      canEditClients: capabilities['project:can_manage'] === true,
      canManageClients: capabilities['project:can_manage'] === true,
      viewAsPersona: personaSlug,
    })
  } catch (error) {
    console.error('Effective permissions error', error)
    return NextResponse.json(
      { error: 'Failed to fetch effective permissions' },
      { status: 500 }
    )
  }
}
