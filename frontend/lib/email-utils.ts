/**
 * Email utility functions for authentication
 */

/**
 * Check if an email is a Google account (Gmail or Googlemail)
 * Note: Cannot reliably detect custom domain Google Workspace accounts
 * without making an API call
 */
export function isGoogleEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) return false

    // Common Google domains
    const googleDomains = ['gmail.com', 'googlemail.com']

    return googleDomains.includes(domain)
}

/**
 * Check if email is likely a Google Workspace account
 * This is a best-effort check and may not be 100% accurate
 */
export function isPotentiallyGoogleWorkspace(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) return false

    // If it's a known Google domain, it's not Workspace
    if (isGoogleEmail(email)) return false

    // Common non-Google domains that are unlikely to be Workspace
    const commonNonGoogleDomains = [
        'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk',
        'outlook.com', 'hotmail.com', 'live.com',
        'icloud.com', 'me.com', 'mac.com',
        'aol.com', 'protonmail.com', 'proton.me',
        'zoho.com', 'yandex.com', 'mail.com'
    ]

    if (commonNonGoogleDomains.includes(domain)) return false

    // For custom domains, we can't be sure without an API call
    // Return true to show both options (Google OAuth + OTP)
    return true
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Extract first name from full name
 */
export function extractFirstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] || ''
}

/**
 * Extract last name from full name
 */
export function extractLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    return parts.slice(1).join(' ') || ''
}

/**
 * Generate default organization name from first name
 */
export function generateDefaultOrgName(firstName: string): string {
    return firstName
}
