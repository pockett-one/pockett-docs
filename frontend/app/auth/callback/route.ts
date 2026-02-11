import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDeploymentVersion, DEPLOYMENT_VERSION_COOKIE } from '@/lib/deployment-version'
import { OrganizationService } from '@/lib/organization-service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/d'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
      // When landing on /d, redirect to default organization so user goes to /d/o/[slug]
      if (next === '/d') {
        const defaultOrg = await OrganizationService.getDefaultOrganization(data.session.user.id)
        if (defaultOrg?.slug) next = `/d/o/${defaultOrg.slug}`
      }

      // Set deployment version cookie on successful login
      // This ensures session is invalidated if server restarts
      const deploymentVersion = getDeploymentVersion()
      
      // Determine redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      let redirectUrl = `${origin}${next}`
      
      if (!isLocalEnv && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      }
      
      const response = NextResponse.redirect(redirectUrl)
      
      // Set deployment version cookie on the redirect response
      // This ensures it's available when middleware runs on the redirected request
      response.cookies.set(DEPLOYMENT_VERSION_COOKIE, deploymentVersion, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
