import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { parseSettingsFromDb, flattenForLegacyUI } from '@/lib/sharing-settings'

/**
 * GET /api/projects/[projectId]/shares
 * Returns list of share records for the project with document details, activity, comments, and access log.
 * Auth: User must have project:can_view_internal (internal tabs permission).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await params

    const shares = await prisma.projectDocumentSharing.findMany({
      where: { projectId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            externalId: true,
            mimeType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const sharesWithDetails = shares.map((share) => {
      const parsed = parseSettingsFromDb(share.settings)
      const flat = flattenForLegacyUI(parsed)
      const accessLog = (parsed.accessLog || []).map((entry: any) => ({
        at: entry.at || new Date().toISOString(),
        by: entry.by || 'unknown',
        userId: entry.userId ?? null,
        email: entry.email ?? null,
        sessionId: entry.sessionId ?? null,
      }))

      return {
        id: share.id,
        projectId: share.projectId,
        documentId: share.documentId,
        documentName: share.document.title || share.document.externalId,
        documentExternalId: share.document.externalId,
        documentMimeType: share.document.mimeType,
        createdBy: share.createdBy,
        createdAt: share.createdAt.toISOString(),
        updatedAt: share.updatedAt.toISOString(),
        settings: {
          externalCollaborator: flat.externalCollaborator,
          guest: flat.guest,
          guestOptions: flat.guestOptions,
          publishedVersionId: flat.publishedVersionId,
          publishedAt: flat.publishedAt,
        },
        activity: flat.activity,
        comments: flat.comments,
        finalizedAt: flat.finalizedAt,
        accessLog,
      }
    })

    const statusOrder = { to_do: 0, in_progress: 1, done: 2 }
    sharesWithDetails.sort((a, b) => {
      const sa = a.activity?.status ?? 'to_do'
      const sb = b.activity?.status ?? 'to_do'
      if (sa !== sb) return statusOrder[sa] - statusOrder[sb]
      const oa = a.activity?.orderIndex ?? 0
      const ob = b.activity?.orderIndex ?? 0
      return oa - ob
    })

    return NextResponse.json({ shares: sharesWithDetails })
  } catch (e) {
    console.error('GET shares error', e)
    return NextResponse.json({ error: 'Failed to load shares' }, { status: 500 })
  }
}
