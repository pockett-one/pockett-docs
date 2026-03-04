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
  if (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321") {
    return (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321")
  }

  if (!isDevelopment) {
    return 'https://your-project.supabase.co' // Replace with your production Supabase URL (will be overridden by NEXT_PUBLIC_SUPABASE_PROXY_URL for preview)
  }

  return 'http://127.0.0.1:54321'
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
