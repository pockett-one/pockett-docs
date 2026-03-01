import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { prisma } from '@/lib/prisma'
import { config, getRedirectUrl } from '@/lib/config'

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
      console.error('Token exchange failed:', txt)
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
      console.error('User info fetch failed:', await userResponse.text())
      return NextResponse.redirect(getRedirectUrl('/d?error=user_info_failed'))
    }

    const userInfo = await userResponse.json()

    // Decode state parameter
    let userId: string
    let nextPath: string | null = null
    let organizationId = ''

    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
        userId = decodedState.userId
        organizationId = decodedState.organizationId
        nextPath = decodedState.next || null
      } else {
        throw new Error('No state provided')
      }
    } catch (e) {
      console.error('Failed to parse state, falling back to raw state as userId', e)
      userId = state || ''
      // Fallback for backward compatibility if state was just userId
    }

    if (!userId) {
      console.error('No user ID in state parameter')
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
    // (created in auth/callback/route.ts if it doesn't exist)
    if (!organization) {
      console.error('No default organization found for user:', userId)
      return NextResponse.redirect(getRedirectUrl(`${redirectPath}?error=no_organization`))
    }

    try {
      // Store the Google Drive connection
      const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      const connector = await googleDriveConnector.storeConnection(
        organization.id,
        userId,          // Supabase user ID (owner of the connector)
        userInfo.id,     // Google's unique account ID (externalAccountId)
        userInfo.name,
        tokens.access_token,
        tokens.refresh_token,
        tokenExpiresAt,
        userInfo.picture
      )

      // Update Onboarding Progress (Step 1 -> 2)
      // We merge with existing settings to avoid data loss
      const currentSettings = (organization.settings as any) || {}
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          settings: {
            ...currentSettings,
            onboarding: {
              ...currentSettings.onboarding,
              currentStep: 2, // Move to Test Data Setup (Sandbox)
              driveConnected: true,
              isComplete: false,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      })

      // Initialize App Folder Structure
      // REMOVED: We now wait for the User to select the folder via the Picker (Auto-open flow)
      // await googleDriveConnector.ensureAppFolderStructure(connector.id)

      // Redirect to the determined path
      return NextResponse.redirect(getRedirectUrl(`${redirectPath}?success=google_drive_connected&email=${encodeURIComponent(userInfo.email)}`))

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(getRedirectUrl(`${redirectPath}?error=database_error`))
    }

  } catch (error) {
    console.error('Google Drive callback error:', error)
    // Try to redirect to organizations list if everything fails
    return NextResponse.redirect(getRedirectUrl('/d?error=callback_error'))
  }
}
