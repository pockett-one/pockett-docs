import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { parseSettingsFromDb, flattenForLegacyUI } from '@/lib/sharing-settings'
import { resolveProjectContext } from '@/lib/resolve-project-context'
import { canViewProject } from '@/lib/permission-helpers'

function getAvatarUrlFromUser(dbUser: { user_metadata?: Record<string, unknown>; identities?: Array<{ identity_data?: Record<string, unknown> }> } | null | undefined): string | null {
  if (!dbUser) return null
  const meta = dbUser.user_metadata
  const fromMeta = (meta?.avatar_url ?? meta?.picture) as string | undefined
  if (fromMeta) return fromMeta
  const firstIdentity = dbUser.identities?.[0]?.identity_data
  return (firstIdentity?.avatar_url ?? firstIdentity?.picture) as string | undefined ?? null
}

/**
 * GET /api/projects/[projectId]/shares
 * Returns list of share records for the project with document details, activity, comments, and access log.
 * RBAC: User must have project:can_view (all personas with project access, including External Collaborator and Guest).
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
    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const canView = await canViewProject(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const shares = await prisma.engagementDocument.findMany({
      where: { engagementId: projectId, slug: { not: null } },
      orderBy: { createdAt: 'desc' },
    })

    const sharesWithDetails = shares.map((share) => {
      const parsed = parseSettingsFromDb(share.settings)
      const flat = flattenForLegacyUI(parsed)

      const indexMetadata = (share.metadata as any) || {}
      const thumbnailLink = indexMetadata.thumbnailLink || indexMetadata.thumbnail_link || null
      let webViewLink = indexMetadata.webViewLink || indexMetadata.web_view_link || null

      const externalId = share.externalId
      if (!webViewLink && externalId) {
        const mt = share.mimeType
        if (mt === 'application/vnd.google-apps.document') webViewLink = `https://docs.google.com/document/d/${externalId}/edit`
        else if (mt === 'application/vnd.google-apps.spreadsheet') webViewLink = `https://docs.google.com/spreadsheets/d/${externalId}/edit`
        else if (mt === 'application/vnd.google-apps.presentation') webViewLink = `https://docs.google.com/presentation/d/${externalId}/edit`
        else webViewLink = `https://drive.google.com/file/d/${externalId}/view`
      }

      const accessLog = (parsed.accessLog || []).map((entry: any) => ({
        at: entry.at || new Date().toISOString(),
        by: entry.by || 'unknown',
        userId: entry.userId ?? null,
        email: entry.email ?? null,
        sessionId: entry.sessionId ?? null,
      }))

      return {
        id: share.id,
        organizationId: ctx.orgId,
        projectId: share.engagementId,
        documentId: share.id,
        documentName: share.fileName || share.externalId || 'Unknown Document',
        documentExternalId: externalId || null,
        documentMimeType: share.mimeType || null,
        thumbnailLink,
        webViewLink,
        slug: share.slug ?? null,
        createdBy: share.createdBy ?? null,
        createdAt: share.createdAt.toISOString(),
        updatedAt: share.updatedAt.toISOString(),
        updatedBy: share.updatedBy ?? null,
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

    const uniqueCreatedBy = Array.from(new Set(sharesWithDetails.map((s) => s.createdBy).filter(Boolean))) as string[]
    const uniqueUpdatedBy = Array.from(new Set(sharesWithDetails.map((s) => s.updatedBy).filter(Boolean))) as string[]
    const uniqueUserIds = Array.from(new Set([...uniqueCreatedBy, ...uniqueUpdatedBy]))
    const supabaseAdmin = createSupabaseAdmin(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const userMap: Record<string, { email: string | null; avatarUrl: string | null }> = {}
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const { data: { user: dbUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
          userMap[userId] = {
            email: dbUser?.email ?? null,
            avatarUrl: getAvatarUrlFromUser(dbUser),
          }
        } catch {
          userMap[userId] = { email: null, avatarUrl: null }
        }
      })
    )
    const enriched = sharesWithDetails.map((s) => ({
      ...s,
      createdByEmail: s.createdBy ? (userMap[s.createdBy]?.email ?? null) : null,
      createdByAvatarUrl: s.createdBy ? (userMap[s.createdBy]?.avatarUrl ?? null) : null,
      updatedByEmail: s.updatedBy ? (userMap[s.updatedBy]?.email ?? null) : null,
      updatedByAvatarUrl: s.updatedBy ? (userMap[s.updatedBy]?.avatarUrl ?? null) : null,
    }))

    const statusOrder = { to_do: 0, in_progress: 1, done: 2 }
    enriched.sort((a, b) => {
      const sa = a.activity?.status ?? 'to_do'
      const sb = b.activity?.status ?? 'to_do'
      if (sa !== sb) return statusOrder[sa] - statusOrder[sb]
      const oa = a.activity?.orderIndex ?? 0
      const ob = b.activity?.orderIndex ?? 0
      return oa - ob
    })

    return NextResponse.json({ shares: enriched })
  } catch (e) {
    console.error('GET shares error', e)
    return NextResponse.json({ error: 'Failed to load shares' }, { status: 500 })
  }
}
