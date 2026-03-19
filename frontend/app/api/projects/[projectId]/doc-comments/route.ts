import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { resolveProjectContext } from '@/lib/resolve-project-context'
import { canViewProject } from '@/lib/permission-helpers'

/**
 * GET /api/projects/[projectId]/doc-comments
 * Project-level rollup of doc comments: list documents with counts + latest message preview.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const ctx = await resolveProjectContext(projectId)
  if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const canView = await canViewProject(ctx.orgId, ctx.clientId, ctx.projectId)
  if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || ''

  const docs = await prisma.engagementDocument.findMany({
    where: {
      engagementId: projectId,
      ...(q ? { fileName: { contains: q, mode: 'insensitive' } } : {}),
    },
    select: { id: true, fileName: true },
    take: 200,
  })
  const docIds = docs.map((d) => d.id)
  if (docIds.length === 0) return NextResponse.json({ documents: [] })

  const counts = await prisma.docCommentMessage.groupBy({
    by: ['projectDocumentId'],
    where: { engagementId: projectId, projectDocumentId: { in: docIds } },
    _count: { _all: true },
  })

  // Latest message per document (small N; acceptable to do one query per doc for now)
  const latestByDocId: Record<string, { createdAt: string; preview: string; authorUserId: string | null }> = {}
  await Promise.all(
    docIds.map(async (docId) => {
      const latest = await prisma.docCommentMessage.findFirst({
        where: { engagementId: projectId, projectDocumentId: docId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, content: true, authorUserId: true },
      })
      if (!latest) return
      latestByDocId[docId] = {
        createdAt: latest.createdAt.toISOString(),
        preview: latest.content.slice(0, 220),
        authorUserId: latest.authorUserId ?? null,
      }
    })
  )

  const countByDocId = Object.fromEntries(counts.map((c) => [c.projectDocumentId, c._count._all]))
  const documents = docs
    .map((d) => ({
      projectDocumentId: d.id,
      documentName: d.fileName,
      count: countByDocId[d.id] ?? 0,
      latest: latestByDocId[d.id] ?? null,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => {
      const at = a.latest?.createdAt ?? ''
      const bt = b.latest?.createdAt ?? ''
      return bt.localeCompare(at)
    })

  return NextResponse.json({ documents })
}

