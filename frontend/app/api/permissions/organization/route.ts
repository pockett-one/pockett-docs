/**
 * API Route: Get Organization Permissions
 *
 * Returns permissions for an organization from cached UserSettingsPlus.
 * Respects View As cookie when user is org admin (permission-based UI framework).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { findOrganizationInPermissions, findClientInPermissions } from '@/lib/permission-helpers'
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

    // Single cache read: get permissions once
    const settings = await userSettingsPlus.getUserSettingsPlus(user.id)

    let org = null
    if (orgId) {
      org = findOrganizationInPermissions(settings.permissions, orgId)
    } else if (orgSlug) {
      org = settings.permissions.organizations[0] || null
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found in permissions' }, { status: 404 })
    }

    // Derive org/client booleans from already-fetched settings (no extra checkOrgPermission calls)
    const canView = org.scopes?.organization?.includes('can_view') ?? false
    const canEdit = org.scopes?.organization?.includes('can_edit') ?? false
    const canManage = org.scopes?.organization?.includes('can_manage') ?? false
    const canManageClients = org.scopes?.client?.includes('can_manage') ?? false
    const canEditClients = org.scopes?.client?.includes('can_edit') ?? false
    const canViewClients = org.scopes?.client?.includes('can_view') ?? false

    // View As: when set and user is org admin, return permissions for the viewed persona
    const viewAsSlug = await getViewAsPersonaFromCookie()
    const hasRbacAdmin = settings.permissions.organizations.some((o) => (o.personas?.includes('org_admin') || o.personas?.includes('sys_admin')) ?? false)
    const applyViewAs = viewAsSlug && hasRbacAdmin

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
        // any other persona: no Org Settings, Client Settings only where they have client-level can_manage
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
