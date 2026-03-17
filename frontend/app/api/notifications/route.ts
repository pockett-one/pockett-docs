import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId =
    request.nextUrl.searchParams.get('orgId') ||
    (user.app_metadata?.active_org_id as string | undefined) ||
    null

  if (!orgId) return NextResponse.json({ notifications: [] })

  const notifications = await prisma.notification.findMany({
    where: { organizationId: orgId, userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      createdAt: true,
      type: true,
      title: true,
      body: true,
      ctaUrl: true,
      readAt: true,
      clientId: true,
      projectId: true,
      documentId: true,
    },
  })

  const unreadCount = await prisma.notification.count({
    where: { organizationId: orgId, userId: user.id, readAt: null },
  })

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt ? n.readAt.toISOString() : null,
    })),
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body?.ids) ? (body.ids as string[]) : []
  if (ids.length === 0) return NextResponse.json({ success: true })

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}

