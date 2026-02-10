/**
 * API Route: Get Project Permissions
 * 
 * Returns permissions for a project from cached UserSettingsPlus
 * No DB queries - uses in-memory cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getProjectPermissions, getProjectPersona, canViewProject, canEditProject, canManageProject, canCommentOnProject } from '@/lib/permission-helpers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')

    if (!orgId || !clientId || !projectId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get permissions from cache (no DB queries)
    const [
      canView,
      canEdit,
      canManage,
      canComment,
      persona,
      scopes
    ] = await Promise.all([
      canViewProject(orgId, clientId, projectId),
      canEditProject(orgId, clientId, projectId),
      canManageProject(orgId, clientId, projectId),
      canCommentOnProject(orgId, clientId, projectId),
      getProjectPersona(orgId, clientId, projectId),
      getProjectPermissions(orgId, clientId, projectId)
    ])

    return NextResponse.json({
      canView,
      canEdit,
      canManage,
      canComment,
      persona,
      scopes
    })
  } catch (error) {
    console.error('Error fetching project permissions', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}
