/**
 * Browser-only cookie preference storage (localStorage).
 * Used by the cookie banner, footer "Cookie settings", and consent-gated analytics.
 */

export const FM_COOKIE_CONSENT_KEY = 'fm_cookie_consent'

export const OPEN_COOKIE_SETTINGS_EVENT = 'fm-open-cookie-settings'
export const COOKIE_CONSENT_UPDATED_EVENT = 'fm-cookie-consent-updated'

export type StoredCookieConsent = {
  necessary: boolean
  analytics: boolean
  personalization: boolean
  timestamp?: string
}

/** Banner UI state — necessary cookies are always on. */
export type CookieConsentUIPreferences = {
  necessary: true
  analytics: boolean
  personalization: boolean
}

const DEFAULTS: StoredCookieConsent = {
  necessary: true,
  analytics: false,
  personalization: false,
}

export function parseStoredCookieConsent(raw: string | null): StoredCookieConsent | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Record<string, unknown>
    if (typeof v !== 'object' || v === null) return null
    return {
      necessary: true,
      analytics: Boolean(v.analytics),
      personalization: Boolean(v.personalization),
      timestamp: typeof v.timestamp === 'string' ? v.timestamp : undefined,
    }
  } catch {
    return null
  }
}

export function readCookieConsentFromStorage(): StoredCookieConsent | null {
  if (typeof window === 'undefined') return null
  return parseStoredCookieConsent(localStorage.getItem(FM_COOKIE_CONSENT_KEY))
}

/** Treat missing consent as no analytics (do not load GA until user opts in). */
export function analyticsConsentGranted(): boolean {
  const c = readCookieConsentFromStorage()
  return Boolean(c?.analytics)
}

export function preferencesFromStorageOrDefaults(): CookieConsentUIPreferences {
  const c = readCookieConsentFromStorage()
  if (!c) {
    return { necessary: true, analytics: false, personalization: false }
  }
  return {
    necessary: true,
    analytics: c.analytics,
    personalization: c.personalization,
  }
}

export function dispatchCookieConsentUpdated(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT))
}

export function requestOpenCookieSettings(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
}
