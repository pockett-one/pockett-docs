import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { prisma } from '@/lib/prisma'
import { config, getRedirectUrl } from '@/lib/config'
import { logger } from '@/lib/logger'

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(getRedirectUrl('/d?error=oauth_error'))
    }

    if (!code) {
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

    if (!userId) {
      logger.error('No user ID in state parameter')
      return NextResponse.redirect(getRedirectUrl('/d?error=no_user_id'))
    }

    let organization: any = null

    if (organizationId) {
      // 1. Try to find membership for this specific org
      const membership = await prisma.organizationMember.findUnique({
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
      const membership = await prisma.organizationMember.findFirst({
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
        rootFolderId
      )

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

      // Determine redirect path
      let redirectUrl = `${redirectPath}?success=google_drive_connected&email=${encodeURIComponent(userInfo.email)}&connectionId=${connector.id}`
      if (organization) {
        redirectUrl += `&organizationId=${organization.id}`
      }

      // Redirect to the determined path
      return NextResponse.redirect(getRedirectUrl(redirectUrl))

    } catch (dbError) {
      logger.error('Google Drive Database error during connection', dbError instanceof Error ? dbError : new Error(String(dbError)))
      return NextResponse.redirect(getRedirectUrl(`${redirectPath}?error=database_error`))
    }

  } catch (error) {
    logger.error('Google Drive callback error', error instanceof Error ? error : new Error(String(error)))
    // Try to redirect to organizations list if everything fails
    return NextResponse.redirect(getRedirectUrl('/d?error=callback_error'))
  }
}
