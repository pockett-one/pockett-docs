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

    const persona = await prisma.rbacPersona.findUnique({
      where: { slug: personaSlug },
      include: {
        grants: {
          include: {
            scope: { select: { slug: true } },
            privilege: { select: { slug: true } },
          },
        },
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const orgPrivs = persona.grants
      .filter((g) => g.scope.slug === 'organization')
      .map((g) => g.privilege.slug)
    const clientPrivs = persona.grants
      .filter((g) => g.scope.slug === 'client')
      .map((g) => g.privilege.slug)

    return NextResponse.json({
      canView: orgPrivs.includes('can_view'),
      canEdit: orgPrivs.includes('can_edit'),
      canManage: orgPrivs.includes('can_manage'),
      canViewClients: clientPrivs.includes('can_view'),
      canEditClients: clientPrivs.includes('can_edit'),
      canManageClients: clientPrivs.includes('can_manage'),
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
