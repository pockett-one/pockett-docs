/**
 * API Route: Get Organization Permissions
 *
 * Returns permissions for an organization from cached UserSettingsPlus.
 * Respects View As cookie when user is org admin (permission-based UI framework).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkOrgPermission, findOrganizationInPermissions, findClientInPermissions, canAccessRbacAdmin } from '@/lib/permission-helpers'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { getViewAsPersonaFromCookie } from '@/lib/view-as-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const orgSlug = searchParams.get('orgSlug')
    const clientId = searchParams.get('clientId') // optional: for client-level Settings visibility

    if (!orgId && !orgSlug) {
      return NextResponse.json({ error: 'Missing orgId or orgSlug parameter' }, { status: 400 })
    }

    // Get permissions from cache (no DB queries)
    const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
    
    let org = null
    if (orgId) {
      org = findOrganizationInPermissions(settings.permissions, orgId)
    } else if (orgSlug) {
      // If we have orgSlug, we need to resolve it to orgId first
      // But since we're using cache, we'll check all orgs
      // The caller should ideally provide orgId, but we'll handle slug for convenience
      // For now, we'll use the first org that matches (this works if user only has one org)
      // TODO: Store slug in permissions cache or resolve slug->id via a lightweight lookup
      org = settings.permissions.organizations[0] || null
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found in permissions' }, { status: 404 })
    }

    // View As: when set and user is org admin, return permissions for the viewed persona
    const viewAsSlug = await getViewAsPersonaFromCookie()
    const applyViewAs = viewAsSlug && (await canAccessRbacAdmin(user.id))

    // Check common permissions for organization scope (real user)
    const [
      canView,
      canEdit,
      canManage
    ] = await Promise.all([
      checkOrgPermission(org.id, 'organization', 'can_view'),
      checkOrgPermission(org.id, 'organization', 'can_edit'),
      checkOrgPermission(org.id, 'organization', 'can_manage')
    ])

    const [
      canManageClients,
      canEditClients,
      canViewClients
    ] = await Promise.all([
      checkOrgPermission(org.id, 'client', 'can_manage'),
      checkOrgPermission(org.id, 'client', 'can_edit'),
      checkOrgPermission(org.id, 'client', 'can_view')
    ])

    let isOrgOwner: boolean
    let effectiveCanManageClients: boolean
    let canManageClient: boolean | undefined

    if (applyViewAs) {
      // Permission-based UI: show what the viewed persona would see
      if (viewAsSlug === 'org_admin') {
        isOrgOwner = true
        effectiveCanManageClients = true
        if (clientId) canManageClient = true
      } else {
        // client_admin (Client Partner) or any other persona: no Org Settings, Client Settings only where they have client-level can_manage
        isOrgOwner = false
        effectiveCanManageClients = false
        if (clientId) {
          const client = findClientInPermissions(settings.permissions, org.id, clientId)
          canManageClient = client?.scopes?.client?.includes('can_manage') ?? false
        }
      }
    } else {
      isOrgOwner = (org.personas?.includes('org_admin') ?? false) || (org.scopes?.organization?.includes('can_manage') ?? false)
      effectiveCanManageClients = canManageClients ?? false
      if (clientId) {
        const client = findClientInPermissions(settings.permissions, org.id, clientId)
        const clientScopeManage = client?.scopes?.client?.includes('can_manage') ?? false
        canManageClient = canManageClients || clientScopeManage
      }
    }

    const body: Record<string, unknown> = {
      canView,
      canEdit,
      canManage,
      canManageClients: effectiveCanManageClients ?? canManageClients,
      canEditClients,
      canViewClients,
      isOrgOwner,
      scopes: org.scopes
    }
    if (clientId !== null && clientId !== undefined) {
      body.canManageClient = canManageClient
    }

    return NextResponse.json(body)
  } catch (error) {
    console.error('Error fetching organization permissions', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}
