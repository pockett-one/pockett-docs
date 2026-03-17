import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { resolveProjectContext } from '@/lib/resolve-project-context'
import { canViewProject } from '@/lib/permission-helpers'
import { getProjectDocumentContext } from '@/lib/file-utils'

/**
 * GET /api/projects/[projectId]/documents/[documentId]/doc-comments
 * List append-only doc comments for a document. Visible to all personas with project access.
 * Messages are immutable (no UPDATE at DB or API level).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params
    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const canView = await canViewProject(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const docCtx = await getProjectDocumentContext(projectId, documentIdParam)
    if (!docCtx) return NextResponse.json({ error: 'Document not found in this project' }, { status: 404 })

    const messages = await prisma.docCommentMessage.findMany({
      where: {
        projectDocumentId: docCtx.id,
        projectId,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        authorUserId: true,
        content: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (e) {
    console.error('GET doc-comments error', e)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

/**
 * POST /api/projects/[projectId]/documents/[documentId]/doc-comments
 * Append a new comment. Caller must have project view access. Messages are immutable after create.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, documentId: documentIdParam } = await params
    const ctx = await resolveProjectContext(projectId)
    if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const canView = await canViewProject(ctx.orgId, ctx.clientId, ctx.projectId)
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const docCtx = await getProjectDocumentContext(projectId, documentIdParam)
    if (!docCtx) return NextResponse.json({ error: 'Document not found in this project' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

    const message = await prisma.docCommentMessage.create({
      data: {
        organizationId: ctx.orgId,
        clientId: docCtx.clientId,
        projectId,
        projectDocumentId: docCtx.id,
        authorUserId: user.id,
        content,
      },
      select: {
        id: true,
        createdAt: true,
        authorUserId: true,
        content: true,
      },
    })

    return NextResponse.json({ message })
  } catch (e) {
    console.error('POST doc-comments error', e)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
