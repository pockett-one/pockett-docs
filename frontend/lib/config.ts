/**
 * Application configuration utilities
 * Provides dynamic URL construction and environment detection
 */

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV !== 'development' // production OR preview

/**
 * Get the base application URL dynamically
 * Uses environment variables with fallbacks based on environment
 */
export const getAppUrl = (): string => {
  // Always check environment variable first (works on both client and server)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // If running in browser and no env var, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side fallback: use Vercel deployment URL when available, else NEXT_PUBLIC_APP_URL
  if (!isDevelopment) {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  }

  return 'http://localhost:3000'
}

/**
 * Get the API base URL
 */
export const getApiUrl = (): string => {
  return `${getAppUrl()}/api`
}

/**
 * Construct a redirect URL for a given path
 */
export const getRedirectUrl = (path: string): string => {
  const baseUrl = getAppUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Get Supabase URL with proper fallbacks
 */
export const getSupabaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  }

  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL
  }

  return 'http://127.0.0.1:54321'
}

/**
 * Server-only: Google Drive OAuth client id + secret for token exchange and refresh.
 * Many deployments set GOOGLE_CLIENT_* for Supabase but only duplicate GOOGLE_DRIVE_CLIENT_ID.
 * When both env client IDs are the same Web client, reuse GOOGLE_CLIENT_SECRET so refresh
 * does not hit Google's token endpoint with a missing/wrong secret (401 unauthorized_client).
 */
export function getGoogleDriveOAuthServerCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim()
  const driveSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim()
  const supabaseClientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const supabaseSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

  if (!clientId) {
    throw new Error('GOOGLE_DRIVE_CLIENT_ID is not configured')
  }

  let clientSecret = driveSecret
  if (!clientSecret && supabaseSecret && clientId === supabaseClientId) {
    clientSecret = supabaseSecret
  }

  if (!clientSecret) {
    throw new Error(
      'GOOGLE_DRIVE_CLIENT_SECRET is not set. Use the Web client secret from Google Cloud Console, or when GOOGLE_DRIVE_CLIENT_ID matches GOOGLE_CLIENT_ID, set GOOGLE_DRIVE_CLIENT_SECRET to the same value as GOOGLE_CLIENT_SECRET.'
    )
  }

  return { clientId, clientSecret }
}

/**
 * Application configuration object
 */
export const config = {
  appUrl: getAppUrl(),
  apiUrl: getApiUrl(),
  supabaseUrl: getSupabaseUrl(),
  isDevelopment,
  isProduction,

  // OAuth Configuration
  googleDrive: {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    developerKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_DEVELOPER_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    appId: process.env.NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER,
    redirectUri: getRedirectUrl('/api/connectors/google-drive/callback'),
  },

  // Supabase Configuration
  supabase: {
    url: getSupabaseUrl(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' : ''),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
} as const
