import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { resolveProjectContext } from '@/lib/resolve-project-context'
import { canViewProject } from '@/lib/permission-helpers'

type DeeplinkKind = 'project' | 'document' | 'comment'

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const kind = (searchParams.get('kind') ?? '') as DeeplinkKind
  const projectId = searchParams.get('projectId') ?? undefined
  const documentId = searchParams.get('documentId') ?? undefined
  const commentId = searchParams.get('commentId') ?? undefined

  if (!kind) return badRequest('Missing kind')
  if (!projectId) return badRequest('Missing projectId')

  const ctx = await resolveProjectContext(projectId)
  if (!ctx) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const allowed = await canViewProject(ctx.orgId, ctx.clientId, ctx.projectId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const project = await prisma.engagement.findUnique({
    where: { id: projectId },
    select: {
      slug: true,
      client: {
        select: {
          slug: true,
          firm: { select: { slug: true } },
        },
      },
    },
  })
  if (!project?.client?.firm?.slug || !project.client.slug || !project.slug) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const base = `/d/f/${project.client.firm.slug}/c/${project.client.slug}/e/${project.slug}`

  if (kind === 'project') {
    return NextResponse.json({ url: `${base}/files` })
  }

  if (!documentId) return badRequest('Missing documentId')

  if (kind === 'document') {
    return NextResponse.json({ url: `${base}/files#doc-file:${documentId}` })
  }

  if (kind === 'comment') {
    const hash = commentId ? `doc-comment:${documentId}:${commentId}` : `doc-comment:${documentId}`
    return NextResponse.json({ url: `${base}/files#${hash}` })
  }

  return badRequest('Invalid kind')
}

