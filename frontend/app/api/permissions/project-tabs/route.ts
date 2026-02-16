/**
 * GET /api/permissions/project-tabs?orgSlug=&clientSlug=&projectSlug=
 * Returns tab visibility from the permission framework (config-driven).
 * Respects View As cookie when user is org admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { canViewProject, canAccessRbacAdmin } from '@/lib/permission-helpers'
import { getViewAsPersonaFromCookie } from '@/lib/view-as-server'
import {
  resolveProjectCapabilitiesForUser,
  resolveProjectCapabilitiesForPersona,
} from '@/lib/permissions/resolve'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgSlug = searchParams.get('orgSlug')
    const clientSlug = searchParams.get('clientSlug')
    const projectSlug = searchParams.get('projectSlug')

    if (!orgSlug || !clientSlug || !projectSlug) {
      return NextResponse.json({ error: 'Missing orgSlug, clientSlug, or projectSlug' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const client = await prisma.client.findFirst({
      where: { organizationId: org.id, slug: clientSlug },
      select: { id: true },
    })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: { clientId: client.id, slug: projectSlug, isDeleted: false },
      select: { id: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const canView = await canViewProject(org.id, client.id, project.id)
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const viewAsSlug = await getViewAsPersonaFromCookie()
    const applyViewAs = viewAsSlug && (await canAccessRbacAdmin(user.id))
    const capabilities = applyViewAs
      ? await resolveProjectCapabilitiesForPersona(viewAsSlug)
      : await resolveProjectCapabilitiesForUser(org.id, client.id, project.id)

    const canViewInternalTabs = capabilities['project:can_view_internal'] ?? false
    const canViewSettings = capabilities['project:can_manage'] ?? false

    return NextResponse.json({ canViewInternalTabs, canViewSettings })
  } catch (error) {
    console.error('Project tab permissions error', error)
    return NextResponse.json(
      { error: 'Failed to fetch project tab permissions' },
      { status: 500 }
    )
  }
}
