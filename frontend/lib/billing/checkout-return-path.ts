const ALLOWED_PREFIX = '/d/'

/**
 * Validates a post-checkout return path (pathname, optional ?query).
 * Only same-app dashboard paths under /d/ are allowed (open-redirect safe).
 */
export function validateCheckoutReturnTo(raw: string | null | undefined): string | null {
    if (raw == null || typeof raw !== 'string') return null
    let path = raw.trim()
    if (!path) return null
    try {
        path = decodeURIComponent(path)
    } catch {
        return null
    }
    path = path.trim()
    if (!path.startsWith(ALLOWED_PREFIX)) return null
    if (path.includes('//')) return null
    if (path.includes('@') || path.includes('\\')) return null

    const [pathname, ...rest] = path.split('?')
    if (!pathname || pathname.length > 512) return null
    if (!pathname.startsWith(ALLOWED_PREFIX)) return null

    const search = rest.length > 0 ? rest.join('?') : ''
    if (search) {
        if (search.length > 512) return null
        return `${pathname}?${search}`
    }
    return pathname
}
