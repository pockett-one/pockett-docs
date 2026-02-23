import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getDeploymentVersion, DEPLOYMENT_VERSION_COOKIE, isDeploymentVersionValid } from "@/lib/deployment-version";
import { logger } from "@/lib/logger";

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components.
    // getSession() triggers token refresh and updates cookies via setAll();
    // without this, expired tokens (e.g. first request of the day) can cause
    // server to see no user / no orgs and incorrectly show onboarding.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    // Skip deployment version check for auth callback route (where cookie is set)
    const isAuthCallback = request.nextUrl.pathname === '/auth/callback'
    
    // Skip deployment version check for signin/signup pages (to avoid redirect loops)
    const isAuthPage = request.nextUrl.pathname.startsWith('/signin') || 
                       request.nextUrl.pathname.startsWith('/signup')

    // Redirect /dash (legacy) to /d so we never render the dash route
    const pathname = request.nextUrl.pathname
    if (pathname === '/dash' || pathname.startsWith('/dash/')) {
        const rest = pathname === '/dash' ? '' : pathname.slice(5) // '/dash/foo' -> '/foo'
        return NextResponse.redirect(new URL('/d' + rest + request.nextUrl.search, request.url))
    }

    // Check deployment version - invalidate session if CODE changed (new deployment)
    // Note: Server restart with same code does NOT invalidate sessions
    // (cache is already lost in memory and rebuilds naturally)
    if (user && !isAuthCallback && !isAuthPage) {
        const sessionDeploymentVersion = request.cookies.get(DEPLOYMENT_VERSION_COOKIE)?.value
        const currentDeploymentVersion = getDeploymentVersion()

        // If no deployment version cookie exists, this is a new sign-in
        // Set the cookie and allow the request to proceed
        // IMPORTANT: We check for missing cookie FIRST to avoid redirect loops
        if (!sessionDeploymentVersion) {
            // New sign-in - set deployment version cookie
            logger.debug('Setting deployment version cookie for new sign-in', 'Middleware', {
                userId: user.id,
                version: currentDeploymentVersion,
                path: request.nextUrl.pathname
            })
            response.cookies.set(DEPLOYMENT_VERSION_COOKIE, currentDeploymentVersion, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development', // secure in production/preview
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            })
            // Cookie is now set - continue with normal flow (don't return early)
            // The cookie will be available on subsequent requests
        } else if (!isDeploymentVersionValid(sessionDeploymentVersion)) {
            // Cookie exists but version mismatch - CODE changed (new deployment)
            logger.info('Deployment version mismatch - invalidating session', 'Middleware', {
                userId: user.id,
                sessionVersion: sessionDeploymentVersion,
                currentVersion: currentDeploymentVersion,
                path: request.nextUrl.pathname
            })
            // Clear session and redirect to login to rebuild cache with new code
            await supabase.auth.signOut()
            
            // Create redirect response (normalize /dash to /d so post-login goes to /d)
            const loginUrl = new URL('/signin', request.url)
            const redirectPath = pathname === '/dash' || pathname.startsWith('/dash/')
                ? '/d' + (pathname === '/dash' ? '' : pathname.slice(5))
                : pathname
            loginUrl.searchParams.set('redirect', redirectPath)
            loginUrl.searchParams.set('reason', 'deployment')
            const redirectResponse = NextResponse.redirect(loginUrl)
            
            // Clear deployment version cookie
            redirectResponse.cookies.delete(DEPLOYMENT_VERSION_COOKIE)
            
            // Clear all Supabase auth cookies explicitly
            // Supabase uses cookies like: sb-{project-ref}-auth-token, etc.
            const allCookies = request.cookies.getAll()
            allCookies.forEach(cookie => {
                // Delete any cookie that looks like a Supabase auth cookie
                if (cookie.name.startsWith('sb-') || 
                    cookie.name.includes('auth') ||
                    cookie.name.includes('supabase')) {
                    redirectResponse.cookies.delete(cookie.name)
                }
            })

            return redirectResponse
        } else if (sessionDeploymentVersion !== currentDeploymentVersion) {
            // Version exists but needs update (shouldn't happen, but handle gracefully)
            logger.debug('Updating deployment version cookie', 'Middleware', {
                userId: user.id,
                oldVersion: sessionDeploymentVersion,
                newVersion: currentDeploymentVersion
            })
            response.cookies.set(DEPLOYMENT_VERSION_COOKIE, currentDeploymentVersion, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development', // secure in production/preview
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            })
        }
    }

    // Redirect authenticated users away from auth pages
    // BUT: Skip this if reason=deployment (user was just invalidated, let them sign in)
    // ALSO: Skip if user doesn't have deployment version cookie (they're in the process of signing in)
    const isSigninPage = request.nextUrl.pathname.startsWith('/signin')
    const isSignupPage = request.nextUrl.pathname.startsWith('/signup')
    const isSignupCallback = request.nextUrl.pathname === '/signup/callback'
    const isDeploymentRedirect = request.nextUrl.searchParams.get('reason') === 'deployment'
    const hasDeploymentCookie = request.cookies.get(DEPLOYMENT_VERSION_COOKIE)?.value
    
    // Only redirect away from auth pages if:
    // 1. User is authenticated AND
    // 2. Not a deployment redirect AND
    // 3. Has deployment version cookie (fully signed in) AND
    // 4. Not on /signup/callback (let callback run so it can redirect to /onboarding or org)
    if ((isSigninPage || isSignupPage) && user && !isDeploymentRedirect && hasDeploymentCookie && !isSignupCallback) {
        // Try to get default organization slug (this is async, so we'll redirect to /d and let it handle)
        // Actually, we can't do async DB calls in middleware easily, so redirect to /d
        // The /d page or a client-side redirect can handle going to default org
        return NextResponse.redirect(new URL('/d', request.url))
    }

    // Protect /d/o/* routes logic
    if (request.nextUrl.pathname.startsWith('/d/o/')) {
        if (!user) {
            const loginUrl = new URL('/signin', request.url)
            loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl)
        }
    }
    
    // Redirect old /o/* routes to /d/o/* for backward compatibility
    if (request.nextUrl.pathname.startsWith('/o/')) {
        const newPath = request.nextUrl.pathname.replace(/^\/o\//, '/d/o/')
        return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url))
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
