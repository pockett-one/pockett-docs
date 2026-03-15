import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { prisma } from '@/lib/prisma'
import { config, getRedirectUrl, getAppUrl } from '@/lib/config'
import { logger } from '@/lib/logger'

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey!
)

function parseStateFlow(state: string | null): { flow?: string; nonce?: string; openerOrigin?: string } {
  if (!state) return {}
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    return { flow: decoded.flow, nonce: decoded.nonce, openerOrigin: decoded.openerOrigin }
  } catch {
    return {}
  }
}

/** Use opener origin from state if it matches our app or is localhost; otherwise fall back to getAppUrl(). */
function getPostMessageOrigin(stateOpenerOrigin: string | undefined): string {
  const appUrl = getAppUrl()
  if (!stateOpenerOrigin || typeof stateOpenerOrigin !== 'string') return appUrl
  try {
    const u = new URL(stateOpenerOrigin)
    const app = new URL(appUrl)
    if (u.origin === app.origin) return stateOpenerOrigin
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return stateOpenerOrigin
  } catch {
    /* ignore */
  }
  return appUrl
}

function popupHtml(openerOrigin: string, payload: { ok: boolean; error?: string; connectionId?: string; organizationId?: string; email?: string; nonce?: string }) {
  const payloadStr = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
(function() {
  var payload = ${payloadStr};
  var origin = ${JSON.stringify(openerOrigin)};
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'google_drive_oauth', ok: payload.ok, error: payload.error, connectionId: payload.connectionId, organizationId: payload.organizationId, email: payload.email, nonce: payload.nonce }, origin);
  }
  window.close();
})();
</script><p>Closing window…</p></body></html>`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const { flow: stateFlow, nonce: stateNonce, openerOrigin: stateOpenerOrigin } = parseStateFlow(state)
    const isPopup = stateFlow === 'popup'
    const appOrigin = getPostMessageOrigin(stateOpenerOrigin)

    if (error) {
      if (isPopup) {
        const html = popupHtml(appOrigin, { ok: false, error: 'oauth_error', nonce: stateNonce })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
      return NextResponse.redirect(getRedirectUrl('/d?error=oauth_error'))
    }

    if (!code) {
      if (isPopup) {
        const html = popupHtml(appOrigin, { ok: false, error: 'no_code', nonce: stateNonce })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
      return NextResponse.redirect(getRedirectUrl('/d?error=no_code'))
    }

    // Exchange code for tokens
    const clientId = config.googleDrive.clientId
    const clientSecret = config.googleDrive.clientSecret
    const redirectUri = config.googleDrive.redirectUri

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const txt = await tokenResponse.text()
      logger.error('Token exchange failed', new Error(txt))
      if (isPopup) {
        const html = popupHtml(appOrigin, { ok: false, error: 'token_exchange_failed', nonce: stateNonce })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
      return NextResponse.redirect(getRedirectUrl('/d?error=token_exchange_failed'))
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const txt = await userResponse.text()
      logger.error('User info fetch failed', new Error(txt))
      if (isPopup) {
        const html = popupHtml(appOrigin, { ok: false, error: 'user_info_failed', nonce: stateNonce })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
      return NextResponse.redirect(getRedirectUrl('/d?error=user_info_failed'))
    }

    const userInfo = await userResponse.json()

    // Decode state parameter
    let userId: string
    let nextPath: string | null = null
    let organizationId = ''
    let rootFolderId: string | undefined = undefined

    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
        userId = decodedState.userId
        organizationId = decodedState.organizationId
        nextPath = decodedState.next || null
        rootFolderId = decodedState.rootFolderId || undefined
      } else {
        throw new Error('No state provided')
      }
    } catch (e) {
      logger.error('Failed to parse state, falling back to raw state as userId', e instanceof Error ? e : new Error(String(e)))
      userId = state || ''
      // Fallback for backward compatibility if state was just userId
    }

    logger.info('Google Drive OAuth user info fetched', {
      isPopup,
      email: userInfo?.email,
      hasOrganizationId: !!organizationId
    })

    if (!userId) {
      logger.error('No user ID in state parameter')
      if (isPopup) {
        const html = popupHtml(appOrigin, { ok: false, error: 'no_user_id', nonce: stateNonce })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
      return NextResponse.redirect(getRedirectUrl('/d?error=no_user_id'))
    }

    let organization: any = null

    if (organizationId) {
      // 1. Try to find membership for this specific org
      const membership = await (prisma as any).orgMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId
          }
        },
        include: { organization: true }
      })
      if (membership) {
        organization = membership.organization
      }
    }

    // 2. Fallback to default organization
    if (!organization) {
      const membership = await (prisma as any).orgMember.findFirst({
        where: {
          userId: userId,
          isDefault: true
        },
        include: {
          organization: true
        }
      })
      if (membership) {
        organization = membership.organization
      }
    }

    // Determine redirect path
    let redirectPath: string
    if (nextPath && nextPath.startsWith('/')) {
      // Use custom next path if provided
      redirectPath = nextPath
    } else {
      // During onboarding, redirect back to onboarding page (not to dashboard)
      redirectPath = '/d/onboarding'
    }

    // User should always have a default organization after auth callback
    try {
      // Store the Google Drive connection
      // Note: If no organization exists yet (DB reset or fresh onboarding),
      // we still store the connection. The organization will be linked later.
      const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      const connector = await googleDriveConnector.storeConnection(
        organization?.id, // Might be undefined
        userId,          // Supabase user ID (owner of the connector)
        userInfo.id,     // Google's unique account ID (externalAccountId)
        userInfo.name,
        tokens.access_token,
        tokens.refresh_token,
        tokenExpiresAt,
        userInfo.picture,
        rootFolderId ?? undefined // Use existing if reconnecting with picker; otherwise set below
      )

      // Simplified onboarding: if no root folder was provided (e.g. from picker), create default
      // Default workspace folder at My Drive root (_Pockett_Workspace_ or _Pockett_Workspace_<WORKSPACE_ENV>_ when set) and set as rootFolderId to skip Configure Workspace Home.
      if (!rootFolderId) {
        try {
          await googleDriveConnector.ensureDefaultWorkspaceRoot(connector.id, tokens.access_token)
        } catch (workspaceErr) {
          logger.error('Failed to create default workspace folder', workspaceErr instanceof Error ? workspaceErr : new Error(String(workspaceErr)))
          // Onboarding will still show Configure Workspace Home as fallback
        }
      }

      if (organization) {
        logger.info('Google Drive connected for organization', {
          organizationId: organization.id,
          connectorId: connector.id
        })

        // Update Onboarding Progress (Step 1 -> 2)
        const currentConnectorSettings = (connector.settings as any) || {}
        await prisma.connector.update({
          where: { id: connector.id },
          data: {
            settings: {
              ...currentConnectorSettings,
              onboarding: {
                ...currentConnectorSettings.onboarding,
                currentStep: 2, // Move to Test Data Setup (Sandbox)
                driveConnected: true,
                isComplete: false,
                lastUpdated: new Date().toISOString()
              }
            }
          }
        })
      } else {
        logger.info('Google Drive connected for user (no organization yet)', {
          userId,
          connectorId: connector.id
        })
      }

      // Popup flow: return HTML that posts to opener and closes
      if (isPopup) {
        const html = popupHtml(appOrigin, {
          ok: true,
          connectionId: connector.id,
          organizationId: organization?.id,
          email: userInfo.email,
          nonce: stateNonce
        })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }

      // Redirect flow
      let redirectUrl = `${redirectPath}?success=google_drive_connected&email=${encodeURIComponent(userInfo.email)}&connectionId=${connector.id}`
      if (organization) {
        redirectUrl += `&organizationId=${organization.id}`
      }
      return NextResponse.redirect(getRedirectUrl(redirectUrl))

    } catch (dbError) {
      logger.error('Google Drive Database error during connection', dbError instanceof Error ? dbError : new Error(String(dbError)))
      if (isPopup) {
        const html = popupHtml(appOrigin, { ok: false, error: 'database_error', nonce: stateNonce })
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
      return NextResponse.redirect(getRedirectUrl(`${redirectPath}?error=database_error`))
    }

  } catch (error) {
    logger.error('Google Drive callback error', error instanceof Error ? error : new Error(String(error)))
    const { flow: errFlow, nonce: errNonce } = parseStateFlow(new URL(request.url).searchParams.get('state'))
    if (errFlow === 'popup') {
      const html = popupHtml(getAppUrl(), { ok: false, error: 'callback_error', nonce: errNonce })
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
    return NextResponse.redirect(getRedirectUrl('/d?error=callback_error'))
  }
}
