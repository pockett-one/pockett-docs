import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSharedAndAncestorIdsForPersona } from '@/lib/project-sharing-ids'

/**
 * GET /api/projects/[projectId]/sharing/ids
 * Returns persona-specific ids so EC only sees EC-shared items and Guest only sees Guest-shared items.
 * Used by the frontend for the Shared badge and for restrictToSharedOnly when no View As is set.
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

    const [forEC, forGuest, union] = await Promise.all([
      getSharedAndAncestorIdsForPersona(projectId, 'proj_ext_collaborator'),
      getSharedAndAncestorIdsForPersona(projectId, 'proj_guest'),
      getSharedAndAncestorIdsForPersona(projectId, null),
    ])

    return NextResponse.json({
      sharedExternalIds: union.sharedIds,
      ancestorFolderIds: union.ancestorIds,
      sharedExternalIdsForEC: forEC.sharedIds,
      ancestorFolderIdsForEC: forEC.ancestorIds,
      sharedExternalIdsForGuest: forGuest.sharedIds,
      ancestorFolderIdsForGuest: forGuest.ancestorIds,
    })
  } catch (e) {
    console.error('GET sharing ids error', e)
    return NextResponse.json({ error: 'Failed to load shared ids' }, { status: 500 })
  }
}
