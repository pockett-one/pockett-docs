/**
 * Application configuration utilities
 * Provides dynamic URL construction and environment detection
 */

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Get the base application URL dynamically
 * Uses environment variables with fallbacks based on environment
 */
export const getAppUrl = (): string => {
  // If running in browser, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side: use environment variable or fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback based on environment
  if (isProduction) {
    return 'https://yourdomain.com' // Replace with your production domain
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
  
  if (isProduction) {
    return 'https://your-project.supabase.co' // Replace with your production Supabase URL
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
