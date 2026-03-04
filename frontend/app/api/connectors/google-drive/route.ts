import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { safeInngestSend } from '@/lib/inngest/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, email, connectionId, rootFolderId } = body

    if (action === 'initiate') {
      // Generate OAuth URL for Google Drive
      const clientId = config.googleDrive.clientId
      const redirectUri = config.googleDrive.redirectUri

      if (!clientId) {
        return NextResponse.json(
          { error: 'Google Drive client ID not configured' },
          { status: 500 }
        )
      }

      // Google Drive OAuth scopes
      const scopes = [
        'https://www.googleapis.com/auth/drive.file', // Per-file access only (Matching user config)
        'https://www.googleapis.com/auth/drive.appdata', // Application data folder
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')

      if (!userId) {
        console.error('[google-drive/route] initiate called without userId — aborting OAuth')
        return NextResponse.json({ error: 'userId is required to initiate OAuth' }, { status: 400 })
      }

      // Use state parameter to pass userId, organizationId and next redirect path
      const stateObj = {
        userId,
        organizationId: body.organizationId,
        rootFolderId: rootFolderId || null,
        next: body.next || null // Will redirect to org connectors page or /d if no org found
      }
      const state = Buffer.from(JSON.stringify(stateObj)).toString('base64')

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('access_type', 'offline')
      // Always force consent to ensure we get a Refresh Token and new scopes
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      // If email is provided, add login_hint for quick account selection
      if (email) {
        authUrl.searchParams.set('login_hint', email)
      }

      return NextResponse.json({
        authUrl: authUrl.toString(),
        state
      })
    }

    if (action === 'test') {
      if (!connectionId) {
        return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
      }
      const result = await googleDriveConnector.testConnection(connectionId)
      return NextResponse.json(result)
    }

    if (action === 'finalize') {
      const { connectionId, parentFolderId } = body
      if (!connectionId || !parentFolderId) {
        return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
      }

      let userId: string | undefined
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
          (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        userId = user?.id
      }

      const { prisma } = require('@/lib/prisma')
      const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
      let stepOneOrgSlug: string | null = null
      let org = null

      if (connector) {
        org = await prisma.organization.findFirst({ where: { connectorId: connector.id } })
        stepOneOrgSlug = org?.slug ?? null
      }

      const detected = await googleDriveConnector.detectExistingStructure(connectionId, parentFolderId)
      const importRootId = detected.importRootFolderId ?? parentFolderId
      let result: { rootId: string, orgId: string, slug?: string }
      if (detected.detected && userId) {
        result = await googleDriveConnector.importStructureFromDrive(connectionId, importRootId, userId, stepOneOrgSlug)
      } else {
        result = await googleDriveConnector.setupOrgFolder(connectionId, parentFolderId, userId)
      }

      let orgSlug: string | null = result.slug ?? null
      if (!orgSlug && org) {
        orgSlug = org.slug
      }
      if (org) {
        orgSlug = org.slug
        if (connectionId) {
          const finalizeConnector = await prisma.connector.findUnique({ where: { id: connectionId } })
          if (finalizeConnector) {
            const currentSettings = (finalizeConnector.settings as any) || {}
            await prisma.connector.update({
              where: { id: connectionId },
              data: {
                settings: {
                  ...currentSettings,
                  onboarding: {
                    ...currentSettings.onboarding,
                    currentStep: 2,
                    isComplete: false,
                    driveConnected: true,
                    lastUpdated: new Date().toISOString()
                  }
                }
              }
            })
          }
        }
      }

      if (userId) {
        userSettingsPlus.invalidateUser(userId)
      }

      // Trigger Project Index Scan after successful setup
      // We prioritize the orgFolderId and any doc folders found in settings
      const finalizeConnector = await prisma.connector.findUnique({ where: { id: connectionId } })
      if (finalizeConnector) {
        const finalizeOrg = await prisma.organization.findFirst({ where: { connectorId: finalizeConnector.id } })
        if (finalizeOrg) {
          const settings = (finalizeConnector.settings as any) || {}
          const rootFolderIds: string[] = []
          if (settings.orgFolderId) rootFolderIds.push(settings.orgFolderId)

          // Also include project-specific folders if they were imported/detected
          if (settings.projectFolderSettings) {
            Object.values(settings.projectFolderSettings).forEach((ps: any) => {
              if (ps.generalFolderId) rootFolderIds.push(ps.generalFolderId)
              if (ps.confidentialFolderId) rootFolderIds.push(ps.confidentialFolderId)
              if (ps.stagingFolderId) rootFolderIds.push(ps.stagingFolderId)
            })
          }

          if (rootFolderIds.length > 0) {
            await safeInngestSend('project.index.scan.requested', {
              organizationId: finalizeOrg.id,
              connectorId: finalizeConnector.id,
              rootFolderIds: Array.from(new Set(rootFolderIds)) // deduplicate
            })
          }
        }
      }

      if (userId) {
        userSettingsPlus.invalidateUser(userId)
      }
      return NextResponse.json({ ...result, slug: orgSlug })
    }

    if (action === 'update-root-folder') {
      const { connectionId, rootFolderId } = body
      if (!connectionId || !rootFolderId) {
        return NextResponse.json({ error: 'Missing connectionId or rootFolderId' }, { status: 400 })
      }

      const { prisma } = require('@/lib/prisma')
      await prisma.connector.update({
        where: { id: connectionId },
        data: {
          settings: {
            ...(await prisma.connector.findUnique({ where: { id: connectionId } })).settings as any || {},
            rootFolderId
          }
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Google Drive connector error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // We need the user ID to check the default org
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    if (action === 'status') {
      const { prisma } = require('@/lib/prisma')

      // Query connector directly by userId — works even before org is fully linked
      const connector = await prisma.connector.findFirst({
        where: { userId: user.id, type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
      })

      return NextResponse.json({
        isConnected: !!connector,
        connector: connector ? {
          id: connector.id,
          name: connector.name,
          externalAccountId: connector.externalAccountId,
          rootFolderId: (connector.settings as any)?.rootFolderId,
          onboarding: (connector.settings as any)?.onboarding
        } : null
      })
    }

    if (action === 'token') {
      const { prisma } = require('@/lib/prisma')

      // Query connector directly by userId
      const connector = await prisma.connector.findFirst({
        where: { userId: user.id, type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
      })

      if (!connector) {
        return NextResponse.json({ error: 'No active connection' }, { status: 404 })
      }

      // Return token (refresh if needed is handled by connector normally, but here we just need raw token. 
      // Ideally we use a helper to ensure validity.
      // Let's use a quick inline check or call a helper if accessible.
      // Since we can't easily call instance method from here without initializing, let's just return what we have.
      // The Picker handles auth errors usually by re-prompting? No, we need a valid token.
      // Let's rely on the client refreshing OR duplicate refresh logic here? 
      // Better: Use the Connector class instance.

      // Use getAccessToken which handles refresh and decryption
      const accessToken = await googleDriveConnector.getAccessToken(connector.id)

      if (!accessToken) {
        return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
      }

      return NextResponse.json({
        accessToken: accessToken, // Decrypted plaintext token
        connectionId: connector.id,
        clientId: config.googleDrive.clientId
      })
    }

    if (action === 'drives') {
      const { prisma } = require('@/lib/prisma')

      // Query connector directly by userId
      const connector = await prisma.connector.findFirst({
        where: { userId: user.id, type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
      })

      if (!connector || !connector.accessToken) {
        return NextResponse.json({ error: 'No active connection' }, { status: 404 })
      }

      // Fetch Drives from Google - decrypt token first
      try {
        const accessToken = await googleDriveConnector.getAccessToken(connector.id)
        if (!accessToken) {
          return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
        }

        const driveRes = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=10', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (!driveRes.ok) {
          // If 401, we might need refresh but assuming fresh based on flow
          throw new Error(`Google API returned ${driveRes.status}`)
        }

        const data = await driveRes.json()
        return NextResponse.json({ drives: data.drives || [] })

      } catch (e: any) {
        console.error("Failed to list drives", e)
        return NextResponse.json({ drives: [] }) // Return empty on fail rather than 500 to keep UI usable
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Connector status check failed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


