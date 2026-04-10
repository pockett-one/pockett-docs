import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { buildSettingsForDb, parseSettingsFromDb, type ActivityStatus } from '@/lib/sharing-settings'
import { getFileInfo } from '@/lib/file-utils'
import { createPlatformAuditEvent } from '@/lib/platform-audit'

const VALID_STATUSES: ActivityStatus[] = ['to_do', 'in_progress', 'done']

/**
 * PATCH /api/projects/[projectId]/documents/[documentId]/sharing/activity
 * Update activity status (to_do | in_progress | done). Used by EC/Guest to move cards.
 * RBAC: User must have project:can_view_internal to update activity.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params
    const { resolveProjectContext } = await import('@/lib/resolve-project-context')
    const { canViewProjectInternalTabs } = await import('@/lib/permission-helpers')
    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const canView = await canViewProjectInternalTabs(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const fileInfo = await getFileInfo(projectId, documentIdParam)
    if (!fileInfo)
      return NextResponse.json({ error: 'File not found in this project' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const status = VALID_STATUSES.includes(body.status) ? body.status : undefined
    if (!status)
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 })
    const orderIndex = typeof body.orderIndex === 'number' && body.orderIndex >= 0 ? body.orderIndex : undefined

    const existing = await prisma.engagementDocument.findUnique({
      where: {
        engagementId_firmId_externalId: {
          engagementId: projectId,
          firmId: fileInfo.organizationId,
          externalId: fileInfo.externalId,
        },
      },
    })
    if (!existing)
      return NextResponse.json({ error: 'Share record not found' }, { status: 404 })

    const parsed = parseSettingsFromDb(existing.settings)
    if (parsed.share?.finalizedAt)
      return NextResponse.json({ error: 'Share is finalized and cannot be updated' }, { status: 403 })

    const now = new Date().toISOString()
    const settings = buildSettingsForDb(existing.settings as Record<string, unknown>, {
      activity: { status, updatedAt: now, orderIndex },
    })

    const oldStatus = parsed.activity?.status

    await prisma.engagementDocument.update({
      where: { id: existing.id },
      data: { settings, updatedAt: new Date() },
    })

    try {
      const project = await prisma.engagement.findUnique({
        where: { id: projectId },
        select: { firmId: true, clientId: true },
      })
      if (project) {
        await createPlatformAuditEvent({
          organizationId: project.firmId,
          clientId: project.clientId,
          projectId,
          projectDocumentId: existing.id,
          eventType: 'DOCUMENT_ACTIVITY_STATUS_CHANGED',
          actorUserId: user.id,
          metadata: {
            fileName: existing.fileName,
            oldStatus: oldStatus ?? null,
            newStatus: status,
          },
        })
      }
    } catch (auditErr) {
      console.warn('Audit event create failed', auditErr)
    }

    const updated = await prisma.engagementDocument.findUnique({
      where: {
        engagementId_firmId_externalId: {
          engagementId: projectId,
          firmId: fileInfo.organizationId,
          externalId: fileInfo.externalId,
        },
      },
    })
    return NextResponse.json({ sharing: updated })
  } catch (e) {
    console.error('PATCH sharing/activity error', e)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}
