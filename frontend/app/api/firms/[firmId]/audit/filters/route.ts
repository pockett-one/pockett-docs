import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { findFirmInPermissions } from '@/lib/permission-helpers'

/**
 * GET /api/firms/[firmId]/audit/filters
 * Returns distinct clients and projects (for dropdown filters).
 * Requires firm manage permission (same as firm audit).
 * Query: clientId (repeatable, optional) - when provided, projects are restricted to those clients.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { firmId } = await params
    const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
    const firm = findFirmInPermissions(settings.permissions, firmId)
    if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
    const canManage = firm.scopes?.firm?.includes('can_manage') ?? false
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const clientIds = searchParams.getAll('clientId').filter(Boolean)

    const [clients, projects] = await Promise.all([
      prisma.client.findMany({
        where: { firmId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.engagement.findMany({
        where: {
          ...(clientIds.length > 0 ? { clientId: { in: clientIds } } : { client: { firmId } }),
          isDeleted: false,
        },
        select: { id: true, name: true, clientId: true },
        orderBy: { name: 'asc' },
      }),
    ])

    return NextResponse.json({
      clients,
      projects,
    })
  } catch (e) {
    console.error('GET firm audit filters error', e)
    return NextResponse.json({ error: 'Failed to load filters' }, { status: 500 })
  }
}

