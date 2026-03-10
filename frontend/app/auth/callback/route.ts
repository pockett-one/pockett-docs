import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDeploymentVersion, DEPLOYMENT_VERSION_COOKIE } from '@/lib/deployment-version'
import { OrganizationService } from '@/lib/organization-service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const requestedNext = searchParams.get('next')
  let next = requestedNext ?? '/d'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      const userId = data.session.user.id

      // If a specific redirect was requested (e.g. from an invite link), honour it
      // and skip the org-based redirect logic.
      if (!requestedNext) {
        // Check if user has a default organization
        const defaultOrg = await OrganizationService.getDefaultOrganization(userId)

        if (defaultOrg) {
          // Invited members (non-owners) bypass onboarding entirely — it's the owner's flow.
          const userMembership = defaultOrg.members.find(m => m.userId === userId)
          const isOwner = userMembership?.role === 'org_owner'

          if (!isOwner) {
            // Non-owner (invited member) — go directly to the org workspace
            next = `/d/o/${defaultOrg.slug}`
          } else {
            const onboardingComplete = defaultOrg.settings != null &&
              (defaultOrg.settings as any)?.onboarding?.isComplete === true

            if (onboardingComplete) {
              next = `/d/o/${defaultOrg.slug}`
            } else {
              next = '/d/onboarding'
            }
          }
        } else {
          // No organization found: send to onboarding to create one
          next = '/d/onboarding'
        }
      }

      // Set deployment version cookie on successful login
      // This ensures session is invalidated if server restarts
      const deploymentVersion = getDeploymentVersion()

      // Determine redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isDevelopment = process.env.NODE_ENV === 'development'
      let redirectUrl = `${origin}${next}`

      if (!isDevelopment && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      }

      const response = NextResponse.redirect(redirectUrl)

      // Set deployment version cookie on the redirect response
      // This ensures it's available when middleware runs on the redirected request
      response.cookies.set(DEPLOYMENT_VERSION_COOKIE, deploymentVersion, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // secure in production/preview
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })

      return response
    } else {
      console.error('Exchange Code Error', error)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_code_error`)
}
