import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { buildSettingsForDb, parseSettingsFromDb, type ShareBlock } from '@/lib/sharing-settings'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

/** Ensure a portal Document exists for this project + externalId (Drive file id); create if missing. */
async function ensureDocumentForShare(
  projectId: string,
  externalId: string,
  title: string,
  mimeType: string
): Promise<string> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
    select: {
      organizationId: true,
      organization: {
        select: {
          connectors: {
            where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  })
  if (!project) throw new Error('Project not found')

  const orgId = project.organizationId
  const existing = await prisma.document.findFirst({
    where: { organizationId: orgId, externalId },
    select: { id: true, projectId: true },
  })
  if (existing) {
    if (existing.projectId !== projectId)
      await prisma.document.update({
        where: { id: existing.id },
        data: { projectId },
      })
    return existing.id
  }

  const connectorId = project.organization.connectors[0]?.id ?? null
  const doc = await prisma.document.create({
    data: {
      organizationId: orgId,
      connectorId,
      externalId,
      title: title || externalId,
      mimeType: mimeType || 'application/octet-stream',
      projectId,
      status: 'PROCESSED',
    },
    select: { id: true },
  })
  return doc.id
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params
    const portalDocumentId = await getDocumentId(projectId, documentIdParam)
    if (!portalDocumentId)
      return NextResponse.json({ sharing: null })

    const sharing = await prisma.projectDocumentSharing.findUnique({
      where: { projectId_documentId: { projectId, documentId: portalDocumentId } },
    })
    return NextResponse.json({ sharing })
  } catch (e) {
    console.error('GET sharing error', e)
    return NextResponse.json({ error: 'Failed to load sharing' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params
    let portalDocumentId = await getDocumentId(projectId, documentIdParam)
    const body = await request.json().catch(() => ({}))
    const title = typeof body.title === 'string' ? body.title : ''
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'application/octet-stream'

    if (!portalDocumentId) {
      if (UUID_REGEX.test(documentIdParam))
        return NextResponse.json({ error: 'Document not found in this project' }, { status: 404 })
      try {
        portalDocumentId = await ensureDocumentForShare(
          projectId,
          documentIdParam,
          title || documentIdParam,
          mimeType
        )
      } catch (err) {
        console.error('ensureDocumentForShare error', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Document not found in this project' },
          { status: 404 }
        )
      }
    }
    const externalCollaborator = body.externalCollaborator !== false
    const guest = body.guest === true
    const guestOptions = {
      sharePdfOnly: body.guestOptions?.sharePdfOnly !== false,
      allowDownload: body.guestOptions?.allowDownload === true,
      addWatermark: body.guestOptions?.addWatermark === true,
      publish: body.guestOptions?.publish === true,
    }

    const existing = await prisma.projectDocumentSharing.findUnique({
      where: { projectId_documentId: { projectId, documentId: portalDocumentId } },
    })

    const now = new Date().toISOString()
    const existingSettings = (existing?.settings as Record<string, unknown>) || null
    const shareUpdate: Partial<ShareBlock> = {
      guest: { enabled: guest, options: guestOptions },
      externalCollaborator: { enabled: externalCollaborator },
      updatedAt: now,
      publishedVersionId: existingSettings?.publishedVersionId as string | undefined,
      publishedAt: existingSettings?.publishedAt as string | undefined,
    }
    if (!existing) shareUpdate.createdAt = now

    const appendComment =
      typeof body.assignerComment === 'string' && body.assignerComment.trim()
        ? { createdAt: now, commentor: user.id, comment: body.assignerComment.trim() }
        : undefined

    const settings = buildSettingsForDb(existingSettings, {
      share: shareUpdate,
      activity: existing ? undefined : { status: 'to_do', updatedAt: now },
      appendComment,
    })

    if (existing) {
      await prisma.projectDocumentSharing.update({
        where: { id: existing.id },
        data: { settings, updatedAt: new Date() },
      })
    } else {
      await prisma.projectDocumentSharing.create({
        data: {
          projectId,
          documentId: portalDocumentId,
          createdBy: user.id,
          settings,
        },
      })
    }

    const updated = await prisma.projectDocumentSharing.findUnique({
      where: { projectId_documentId: { projectId, documentId: portalDocumentId } },
    })
    return NextResponse.json({ sharing: updated })
  } catch (e) {
    console.error('PUT sharing error', e)
    return NextResponse.json({ error: 'Failed to save sharing' }, { status: 500 })
  }
}
