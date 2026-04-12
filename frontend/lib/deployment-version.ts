/**
 * Deployment Version Management
 * 
 * Tracks CODE deployment version (not server restart).
 * Sessions are invalidated only when CODE changes (new deployment),
 * not when server restarts with the same code.
 * 
 * Key distinction:
 * - Deployment (new code) → Invalidate sessions ✅
 * - Server restart (same code) → Keep sessions ❌ (cache already lost in memory)
 */

// TypeScript declaration for global fallback variable
declare global {
  var __DEV_SERVER_START_VERSION__: string | undefined
}

/**
 * Get the current deployment version
 * Uses build-time version that only changes when CODE is built/deployed
 * 
 * Priority:
 * 1. DEPLOYMENT_VERSION (set by CI/CD, e.g., git commit SHA) - BEST
 * 2. NEXT_PUBLIC_BUILD_TIMESTAMP (set at build time) - GOOD
 * 3. DEV_SERVER_START_VERSION (set at dev server start) - DEV ONLY
 * 4. Fallback: package version (static) - PRODUCTION FALLBACK
 * 
 * Note: In development, we use DEV_SERVER_START_VERSION env var set at server start.
 * This ensures consistency across all Next.js execution contexts (route handlers, middleware, etc.).
 * In production, we intentionally DON'T use server start timestamp because:
 * - Server restart with same code should NOT invalidate sessions
 * - Cache is already lost on restart (in-memory Map)
 * - Cache rebuilds naturally on next request (cache miss)
 */
export function getDeploymentVersion(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 1. Explicit deployment version (set by CI/CD or manually for testing)
  // Example: git commit SHA, semantic version, etc.
  // This changes ONLY when code is deployed
  if (process.env.DEPLOYMENT_VERSION) {
    return process.env.DEPLOYMENT_VERSION
  }

  // 2. Build timestamp (set during npm run build)
  // This changes ONLY when code is built
  // Same build = same timestamp, even across server restarts
  if (process.env.NEXT_PUBLIC_BUILD_TIMESTAMP) {
    return process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
  }

  // 3. Development mode: Use DEV_SERVER_START_VERSION env var
  // This is set at server start and shared across all execution contexts
  // Each dev server restart gets a new version, simulating a deployment
  // IMPORTANT: This must be set in package.json dev script to ensure consistency
  if (isDevelopment) {
    if (process.env.DEV_SERVER_START_VERSION) {
      return process.env.DEV_SERVER_START_VERSION
    }
    // Fallback: Generate once per process (less ideal, but better than per-module)
    // This is a fallback if DEV_SERVER_START_VERSION is not set
    if (!global.__DEV_SERVER_START_VERSION__) {
      global.__DEV_SERVER_START_VERSION__ = `dev-${Date.now()}`
    }
    return global.__DEV_SERVER_START_VERSION__
  }

  // 4. Production fallback: Use package version (static)
  // This is the same for all server restarts of the same build
  // Won't detect code changes, but won't invalidate unnecessarily
  // Note: This means sessions won't be invalidated if code changes
  // but version stays same (e.g., hotfix without version bump)
  // For production, always use option 1 or 2
  return process.env.npm_package_version || '0.1.0'
}

/**
 * Deployment version cookie name
 */
export const DEPLOYMENT_VERSION_COOKIE = 'fm-deployment-version'

/**
 * Check if the session's deployment version matches current deployment
 */
export function isDeploymentVersionValid(sessionVersion: string | undefined): boolean {
  if (!sessionVersion) {
    return false // No version stored = invalid
  }

  const currentVersion = getDeploymentVersion()
  return sessionVersion === currentVersion
}
