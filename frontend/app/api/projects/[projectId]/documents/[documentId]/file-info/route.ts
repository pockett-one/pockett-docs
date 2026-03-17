import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resolveProjectContext } from '@/lib/resolve-project-context'
import { canViewProject } from '@/lib/permission-helpers'
import { getFileInfo } from '@/lib/file-utils'
import { prisma } from '@/lib/prisma'
import { canAccessRbacAdmin } from '@/lib/permission-helpers'
import { getViewAsPersonaFromCookie } from '@/lib/view-as-server'
import { getSharedAndAncestorIdsForPersona } from '@/lib/project-sharing-ids'

function notFound() {
  // Prefer 404 to avoid leaking doc/project existence via deeplinks.
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params

    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return notFound()
    const canView = await canViewProject(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canView) return notFound()

    const fileInfo = await getFileInfo(projectId, documentIdParam)
    if (!fileInfo) return notFound()

    // Determine persona to enforce shared-only restrictions (View As overrides when allowed).
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
      select: { role: true },
    })
    const actualRole = member?.role ?? null
    const isActualExternal = actualRole === 'proj_ext_collaborator' || actualRole === 'proj_viewer'

    const canUseViewAs = await canAccessRbacAdmin(user.id)
    const cookieViewAs = canUseViewAs ? await getViewAsPersonaFromCookie() : null
    const queryViewAs = canUseViewAs ? request.nextUrl.searchParams.get('viewAsPersonaSlug') : null
    const viewAsSlug =
      (queryViewAs === 'proj_ext_collaborator' || queryViewAs === 'proj_viewer' ? queryViewAs : null) ??
      (cookieViewAs === 'proj_ext_collaborator' || cookieViewAs === 'proj_viewer' ? cookieViewAs : null)

    const personaToEnforce =
      viewAsSlug ??
      (isActualExternal ? actualRole : null)

    if (personaToEnforce === 'proj_ext_collaborator' || personaToEnforce === 'proj_viewer') {
      // Allow when the file itself is shared OR is a descendant of a shared folder.
      const { sharedIds, descendantIds } = await getSharedAndAncestorIdsForPersona(projectId, personaToEnforce, { skipDescendants: false })
      const allow = sharedIds.includes(fileInfo.externalId) || descendantIds.includes(fileInfo.externalId)
      if (!allow) return notFound()
    }

    return NextResponse.json({ externalId: fileInfo.externalId, fileName: fileInfo.fileName ?? null })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to resolve file info' }, { status: 500 })
  }
}

