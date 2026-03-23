import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDeploymentVersion, DEPLOYMENT_VERSION_COOKIE } from '@/lib/deployment-version'
import { FirmService } from '@/lib/firm-service'
import { BRAND_NAME, PLATFORM_BRAND_COOKIE } from '@/config/brand'

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
      const user = data.session.user
      const userId = user.id

      if (!requestedNext) {
        const defaultFirm = await FirmService.getDefaultFirm(userId)

        if (defaultFirm) {
          const userMembership = defaultFirm.members.find(m => m.userId === userId)
          const isOwner = userMembership?.role === 'firm_admin'

          if (!isOwner) {
            next = `/d/f/${defaultFirm.slug}`
          } else {
            const onboardingComplete = defaultFirm.settings != null &&
              (defaultFirm.settings as any)?.onboarding?.isComplete === true

            if (onboardingComplete) {
              next = `/d/f/${defaultFirm.slug}`
            } else {
              next = '/d/onboarding'
            }
          }
        } else {
          // No firm yet: full onboarding creates the sandbox (sync DB + async sample files via Inngest).
          next = '/d/onboarding'
        }
      }

      // Set deployment version cookie on successful login
      // This ensures session is invalidated if server restarts
      const deploymentVersion = getDeploymentVersion()

      // Determine redirect URL — force http when running locally (e.g. dev_as_prod) to avoid ERR_SSL_PROTOCOL_ERROR
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isDevelopment = process.env.NODE_ENV === 'development'
      const url = new URL(origin)
      const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      const runningLocally = process.env.RUNNING_LOCALLY === 'true'

      let redirectUrl: string
      if ((isDevelopment || runningLocally) && isLocalhost) {
        redirectUrl = `http://${url.host}${next}`
      } else if (!isDevelopment && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
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

      // Cache platform brand name for SSR/CSR consistency
      response.cookies.set(PLATFORM_BRAND_COOKIE, BRAND_NAME, {
        httpOnly: false,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })

      return response
    } else {
      console.error('Exchange Code Error', error)
    }
  }

  // return the user to an error page — force http when running locally
  const url = new URL(origin)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  const runningLocally = process.env.RUNNING_LOCALLY === 'true'
  const base = (process.env.NODE_ENV === 'development' || runningLocally) && isLocalhost ? `http://${url.host}` : origin
  return NextResponse.redirect(`${base}/signin?error=auth_code_error`)
}
