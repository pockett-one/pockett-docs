import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/projects/[projectId]/shares
 * Returns list of share records for the project with document details and access logs.
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

    // Fetch all shares for this project with document details
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

    // Transform to include document name and access log from settings
    const sharesWithDetails = shares.map((share) => {
      const settings = (share.settings as Record<string, unknown>) || {}
      const accessLog = Array.isArray(settings.accessLog) ? settings.accessLog : []
      
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
          externalCollaborator: settings.externalCollaborator ?? true,
          guest: settings.guest ?? false,
          guestOptions: settings.guestOptions || {},
          publishedVersionId: settings.publishedVersionId || null,
          publishedAt: settings.publishedAt || null,
        },
        accessLog: accessLog.map((entry: any) => ({
          at: entry.at || new Date().toISOString(),
          by: entry.by || 'unknown',
          userId: entry.userId || null,
          email: entry.email || null,
          sessionId: entry.sessionId || null,
        })),
      }
    })

    return NextResponse.json({ shares: sharesWithDetails })
  } catch (e) {
    console.error('GET shares error', e)
    return NextResponse.json({ error: 'Failed to load shares' }, { status: 500 })
  }
}
