import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { findOrganizationInPermissions } from '@/lib/permission-helpers'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { PlatformAuditEventType, type Prisma } from '@prisma/client'

/**
 * GET /api/organizations/[orgId]/audit
 * List organization-scoped platform audit events. Requires org manage permission.
 * Query: limit (default 50), cursor, eventType, fromDate, toDate, clientId (repeatable), projectId (repeatable).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orgId } = await params
    const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
    const org = findOrganizationInPermissions(settings.permissions, orgId)
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    const canManage = org.scopes?.organization?.includes('can_manage') ?? false
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
    const cursor = searchParams.get('cursor') ?? undefined
    const eventType = searchParams.get('eventType') ?? undefined
    const fromDate = searchParams.get('fromDate') ?? undefined
    const toDate = searchParams.get('toDate') ?? undefined
    const clientIds = searchParams.getAll('clientId').filter(Boolean)
    const projectIds = searchParams.getAll('projectId').filter(Boolean)

    if (eventType && !Object.values(PlatformAuditEventType).includes(eventType as PlatformAuditEventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    const where: Prisma.PlatformAuditEventWhereInput = {
      organizationId: orgId,
      scope: 'PROJECT',
    }
    if (eventType) where.eventType = eventType as PlatformAuditEventType
    if (clientIds.length === 1) where.clientId = clientIds[0]
    if (clientIds.length > 1) where.clientId = { in: clientIds }
    if (projectIds.length === 1) where.projectId = projectIds[0]
    if (projectIds.length > 1) where.projectId = { in: projectIds }
    if (fromDate || toDate) {
      where.eventAt = {}
      if (fromDate) where.eventAt.gte = new Date(fromDate)
      if (toDate) {
        const endOfDay = new Date(toDate)
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1)
        endOfDay.setUTCHours(0, 0, 0, 0)
        where.eventAt.lt = endOfDay
      }
    }
    const events = await prisma.platformAuditEvent.findMany({
      where,
      orderBy: { eventAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        eventType: true,
        eventAt: true,
        actorUserId: true,
        projectDocumentId: true,
        metadata: true,
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    })

    const hasMore = events.length > limit
    const items = hasMore ? events.slice(0, limit) : events
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    const uniqueActorIds = Array.from(new Set(items.map((e) => e.actorUserId).filter(Boolean))) as string[]
    const actorEmailMap: Record<string, string> = {}
    if (uniqueActorIds.length > 0) {
      const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await Promise.all(
        uniqueActorIds.map(async (actorId) => {
          try {
            const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(actorId)
            actorEmailMap[actorId] = u?.email ?? ''
          } catch {
            actorEmailMap[actorId] = ''
          }
        })
      )
    }

    const eventsWithEmail = items.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      eventAt: e.eventAt.toISOString(),
      actorUserId: e.actorUserId,
      actorEmail: e.actorUserId ? (actorEmailMap[e.actorUserId] ?? null) : null,
      projectDocumentId: e.projectDocumentId,
      metadata: e.metadata,
      clientName: e.client?.name ?? null,
      projectName: e.project?.name ?? null,
    }))

    return NextResponse.json({
      events: eventsWithEmail,
      nextCursor,
    })
  } catch (e) {
    console.error('GET organization audit error', e)
    return NextResponse.json({ error: 'Failed to load audit' }, { status: 500 })
  }
}
