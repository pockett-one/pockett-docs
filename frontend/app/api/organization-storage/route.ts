import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { ConnectorType } from '@prisma/client'
import { googleDriveConnector } from '@/lib/google-drive-connector'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/organization-storage?orgSlug=xxx
 * Returns storage used and limit (if available) for the current org's connected Google Drive account(s).
 * usedBytes: total usage from Drive quota (bytes).
 * limitBytes: total limit from Drive quota (bytes), or null if unlimited / not available.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgSlug = searchParams.get('orgSlug')

    // Resolve organization: by slug or default
    const membership = orgSlug
      ? await prisma.organizationMember.findFirst({
          where: {
            userId: user.id,
            organization: { slug: orgSlug }
          },
          include: {
            organization: {
              include: {
                connector: true
              }
            }
          }
        })
      : await prisma.organizationMember.findFirst({
          where: { userId: user.id, isDefault: true },
          include: {
            organization: {
              include: {
                connector: true
              }
            }
          }
        })

    if (!membership?.organization) {
      return NextResponse.json({ usedBytes: 0, limitBytes: null })
    }

    const connector = membership.organization.connector
    if (!connector) {
      return NextResponse.json({ usedBytes: 0, limitBytes: null })
    }

    let totalUsed = 0
    let totalLimit: number | null = 0

    const quota = await googleDriveConnector.getStorageQuota(connector.id)
    if (!quota) {
      return NextResponse.json({
        usedBytes: 0,
        limitBytes: null
      })
    }
    
    const used = quota.usage ? parseInt(quota.usage, 10) : 0
    const limit = quota.limit ? parseInt(quota.limit, 10) : null
    if (!isNaN(used)) totalUsed += used
    if (limit !== null && !isNaN(limit)) {
      totalLimit = (totalLimit ?? 0) + limit
    } else {
      totalLimit = null // unlimited on any account
    }

    return NextResponse.json({
      usedBytes: totalUsed,
      limitBytes: totalLimit === null || totalLimit === 0 ? null : totalLimit
    })
  } catch (error) {
    console.error('[organization-storage]', error)
    return NextResponse.json({ error: 'Failed to fetch storage' }, { status: 500 })
  }
}
