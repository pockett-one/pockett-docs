import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { buildSettingsForDb } from '@/lib/sharing-settings'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getFileInfo(projectId: string, documentIdParam: string): Promise<{ organizationId: string, externalId: string } | null> {
  const index = await prisma.projectDocumentSearchIndex.findFirst({
    where: {
      OR: [
        { externalId: documentIdParam },
        { id: UUID_REGEX.test(documentIdParam) ? documentIdParam : undefined }
      ]
    },
    select: { organizationId: true, externalId: true },
  })
  if (index) return { organizationId: index.organizationId, externalId: index.externalId }

  const project = await (prisma as any).project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  })
  if (project && !UUID_REGEX.test(documentIdParam)) {
    return { organizationId: project.organizationId, externalId: documentIdParam }
  }
  return null
}

/**
 * PATCH /api/projects/[projectId]/documents/[documentId]/sharing/finalize
 * Set share as finalized (locked).
 * RBAC: User must have project:can_manage.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params
    const { resolveProjectContext } = await import('@/lib/resolve-project-context')
    const { canManageProject } = await import('@/lib/permission-helpers')
    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const canManage = await canManageProject(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const fileInfo = await getFileInfo(projectId, documentIdParam)
    if (!fileInfo)
      return NextResponse.json({ error: 'File not found in this project' }, { status: 404 })

    const existing = await (prisma as any).projectDocumentSharing.findUnique({
      where: { projectId_organizationId_externalId: { projectId, organizationId: fileInfo.organizationId, externalId: fileInfo.externalId } },
    })
    if (!existing)
      return NextResponse.json({ error: 'Share record not found' }, { status: 404 })

    const now = new Date().toISOString()
    const settings = buildSettingsForDb(existing.settings as Record<string, unknown>, {
      finalizedAt: now,
    })

    await (prisma as any).projectDocumentSharing.update({
      where: { id: existing.id },
      data: { settings, updatedAt: new Date() },
    })

    const updated = await (prisma as any).projectDocumentSharing.findUnique({
      where: { projectId_organizationId_externalId: { projectId, organizationId: fileInfo.organizationId, externalId: fileInfo.externalId } },
    })
    return NextResponse.json({ sharing: updated })
  } catch (e) {
    console.error('PATCH sharing/finalize error', e)
    return NextResponse.json({ error: 'Failed to finalize' }, { status: 500 })
  }
}
