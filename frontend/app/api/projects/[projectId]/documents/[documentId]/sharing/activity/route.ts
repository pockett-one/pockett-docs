import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { buildSettingsForDb, parseSettingsFromDb, type ActivityStatus } from '@/lib/sharing-settings'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_STATUSES: ActivityStatus[] = ['to_do', 'in_progress', 'done']

async function getDocumentId(projectId: string, documentIdParam: string): Promise<string | null> {
  if (UUID_REGEX.test(documentIdParam)) {
    const doc = await prisma.document.findFirst({
      where: { id: documentIdParam, projectId },
      select: { id: true },
    })
    return doc?.id ?? null
  }
  const doc = await prisma.document.findFirst({
    where: { projectId, externalId: documentIdParam },
    select: { id: true },
  })
  return doc?.id ?? null
}

/**
 * PATCH /api/projects/[projectId]/documents/[documentId]/sharing/activity
 * Update activity status (to_do | in_progress | done). Used by EC/Guest to move cards.
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
    const portalDocumentId = await getDocumentId(projectId, documentIdParam)
    if (!portalDocumentId)
      return NextResponse.json({ error: 'Document not found in this project' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const status = VALID_STATUSES.includes(body.status) ? body.status : undefined
    if (!status)
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 })
    const orderIndex = typeof body.orderIndex === 'number' && body.orderIndex >= 0 ? body.orderIndex : undefined

    const existing = await prisma.projectDocumentSharing.findUnique({
      where: { projectId_documentId: { projectId, documentId: portalDocumentId } },
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

    await prisma.projectDocumentSharing.update({
      where: { id: existing.id },
      data: { settings, updatedAt: new Date() },
    })

    const updated = await prisma.projectDocumentSharing.findUnique({
      where: { projectId_documentId: { projectId, documentId: portalDocumentId } },
    })
    return NextResponse.json({ sharing: updated })
  } catch (e) {
    console.error('PATCH sharing/activity error', e)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}
