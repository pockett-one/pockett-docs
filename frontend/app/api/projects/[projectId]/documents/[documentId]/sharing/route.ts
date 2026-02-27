import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { buildSettingsForDb, parseSettingsFromDb, type ShareBlock } from '@/lib/sharing-settings'
import { generateShareSlug } from '@/lib/slug-utils'
import { syncDocumentSharingUsers } from '@/lib/sync-document-sharing'
import { getFileInfo } from '@/lib/file-utils'
import { inngest } from '@/lib/inngest/client'

/** Ensure a file has a row in ProjectDocumentSearchIndex before sharing.
 *  Strategy:
 *  1. Synchronous stub upsert — creates the minimal row so the FK is satisfied immediately (ms-fast).
 *  2. Background full index — fires SearchService.indexFile() without awaiting so Drive metadata
 *     and embedding are filled in asynchronously and don't block the sharing response.
 */
async function ensureFileIndexed(
  projectId: string,
  externalId: string,
  title: string
): Promise<{ organizationId: string, externalId: string }> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
    select: { organizationId: true, clientId: true }
  })
  if (!project) throw new Error('Project not found')

  const { organizationId, clientId } = project

  // 1. Synchronous stub upsert — guarantees the row exists for the FK constraint.
  //    ON CONFLICT DO NOTHING so we never overwrite a fully-indexed row.
  await prisma.$executeRawUnsafe(
    `INSERT INTO portal.project_document_search_index
       ("organizationId", "clientId", "projectId", "externalId", "fileName", "updatedAt")
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, NOW())
     ON CONFLICT ("organizationId", "externalId") DO NOTHING`,
    organizationId,
    clientId || null,
    projectId,
    externalId,
    title || externalId
  )

  // 2. Background full index — Drive metadata + embedding, fire-and-forget.
  const { SearchService } = await import('@/lib/services/search-service')
  Promise.resolve().then(() =>
    SearchService.indexFile({
      organizationId,
      clientId: clientId || undefined,
      projectId,
      externalId,
      fileName: title || externalId,
    }).catch((err) => console.error('Background indexFile error after share stub', err))
  )

  return { organizationId, externalId }
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
    const fileInfo = await getFileInfo(projectId, documentIdParam)
    if (!fileInfo) return NextResponse.json({ sharing: null })

    const sharing = await prisma.projectDocumentSharing.findUnique({
      where: {
        projectId_organizationId_externalId: {
          projectId,
          organizationId: fileInfo.organizationId,
          externalId: fileInfo.externalId
        }
      },
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
    const { resolveProjectContext } = await import('@/lib/resolve-project-context')
    const { canManageProject } = await import('@/lib/permission-helpers')
    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const canManage = await canManageProject(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const title = typeof body.title === 'string' ? body.title : ''

    let fileInfo: { organizationId: string; externalId: string } | null = null

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentIdParam)) {
      // UUID = must already exist in the search index (no implicit creation)
      fileInfo = await getFileInfo(projectId, documentIdParam)
      if (!fileInfo) return NextResponse.json({ error: 'File not found in this project' }, { status: 404 })
    } else {
      // Drive file ID — always run ensureFileIndexed so the index row is guaranteed before
      // the FK-constrained sharing row is created. ON CONFLICT DO NOTHING makes it safe
      // to call even when the file was already indexed.
      try {
        fileInfo = await ensureFileIndexed(projectId, documentIdParam, title)
      } catch (err) {
        console.error('ensureFileIndexed error', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'File not found in this project' },
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
      where: {
        projectId_organizationId_externalId: {
          projectId,
          organizationId: fileInfo.organizationId,
          externalId: fileInfo.externalId
        }
      },
    })

    if (!externalCollaborator && !guest) {
      if (existing) {
        await prisma.projectDocumentSharing.delete({ where: { id: existing.id } })
      }
      return NextResponse.json({ sharing: null })
    }

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
      const updateData: { settings: typeof settings; updatedAt: Date; updatedBy: string; slug?: string } = { settings, updatedAt: new Date(), updatedBy: user.id }
      if (existing.slug == null) {
        const indexRecord = await prisma.projectDocumentSearchIndex.findUnique({
          where: {
            organizationId_externalId: {
              organizationId: fileInfo.organizationId,
              externalId: fileInfo.externalId
            }
          },
          select: { fileName: true }
        })
        const docTitle = indexRecord?.fileName || title || documentIdParam
        updateData.slug = generateShareSlug(docTitle, existing.id.slice(0, 8))
      }
      await prisma.projectDocumentSharing.update({
        where: { id: existing.id },
        data: updateData,
      })
    } else {
      let slug = generateShareSlug(title || documentIdParam, Math.random().toString(36).slice(2, 10))
      for (let attempts = 0; attempts < 5; attempts++) {
        const taken = await prisma.projectDocumentSharing.findFirst({ where: { projectId, slug }, select: { id: true } })
        if (!taken) break
        slug = generateShareSlug(title || documentIdParam, Math.random().toString(36).slice(2, 10))
      }
      await prisma.projectDocumentSharing.create({
        data: {
          projectId,
          organizationId: fileInfo.organizationId,
          externalId: fileInfo.externalId,
          createdBy: user.id,
          settings,
          slug,
        },
      })
    }

    const updated = await prisma.projectDocumentSharing.findUnique({
      where: {
        projectId_organizationId_externalId: {
          projectId,
          organizationId: fileInfo.organizationId,
          externalId: fileInfo.externalId
        }
      },
    })

    if (updated) {
      // Fire off the google drive permission sync in the background
      Promise.resolve().then(() => syncDocumentSharingUsers(updated.id))

      // Fire event if we're disabling any sharing personas
      const oldSettings = existing
        ? parseSettingsFromDb((existing.settings as Record<string, unknown>) || {})
        : null
      const disabledPersonas: Array<'guest' | 'externalCollaborator'> = []

      if (oldSettings?.share?.guest?.enabled && !guest) {
        disabledPersonas.push('guest')
      }
      if (oldSettings?.share?.externalCollaborator?.enabled && !externalCollaborator) {
        disabledPersonas.push('externalCollaborator')
      }

      if (disabledPersonas.length > 0) {
        await inngest.send({
          name: 'sharing.settings.updated',
          data: {
            projectId,
            organizationId: fileInfo.organizationId,
            documentId: fileInfo.externalId,
            sharingId: updated.id,
            disabledPersonas,
            timestamp: new Date().toISOString(),
            userId: user.id
          }
        })
      }
    }

    return NextResponse.json({ sharing: updated })
  } catch (e) {
    console.error('PUT sharing error', e)
    return NextResponse.json({ error: 'Failed to save sharing' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
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
    if (!fileInfo) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const existing = await prisma.projectDocumentSharing.findUnique({
      where: {
        projectId_organizationId_externalId: {
          projectId,
          organizationId: fileInfo.organizationId,
          externalId: fileInfo.externalId
        }
      },
      include: {
        users: true
      }
    })

    if (!existing) return NextResponse.json({ success: true })

    // Disable external collaborator before sync to ensure revocation
    await prisma.projectDocumentSharing.update({
      where: { id: existing.id },
      data: {
        settings: buildSettingsForDb((existing.settings as Record<string, unknown>) || null, {
          share: {
            externalCollaborator: { enabled: false },
            guest: { enabled: false, options: {} }
          }
        })
      }
    })

    // Force sync to revoke drive permissions before deleting
    await syncDocumentSharingUsers(existing.id)

    // Fire event for deleting all sharing (disabling both guest and external collaborator)
    await inngest.send({
      name: 'sharing.settings.updated',
      data: {
        projectId,
        organizationId: fileInfo.organizationId,
        documentId: fileInfo.externalId,
        sharingId: existing.id,
        disabledPersonas: ['guest', 'externalCollaborator'],
        timestamp: new Date().toISOString(),
        userId: user.id
      }
    })

    await prisma.projectDocumentSharing.delete({
      where: { id: existing.id }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE sharing error', e)
    return NextResponse.json({ error: 'Failed to delete sharing' }, { status: 500 })
  }
}
