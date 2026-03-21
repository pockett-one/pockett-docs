/**
 * Central brand configuration. Change the brand name in one place to rebrand across the app.
 */
export const PLATFORM_BRAND_COOKIE = 'platform_brand_name'

const DEFAULT_BRAND_NAME = 'Pockett'
const DEFAULT_BRAND_COLOR = '#A961EE'

const resolveBrandName = (): string => {
  // Use NEXT_PUBLIC_* only so server and client resolve the same value.
  // Falling back to server-only env vars here can cause hydration mismatches.
  const candidates = [
    process.env.NEXT_PUBLIC_PLATFORM_BRAND_NAME,
    process.env.NEXT_PUBLIC_BRAND_NAME,
  ]
  const first = candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
  return (first ?? DEFAULT_BRAND_NAME).trim() || DEFAULT_BRAND_NAME
}

const resolveBrandColor = (): string => {
  const candidates = [
    process.env.NEXT_PUBLIC_PLATFORM_BRAND_COLOR,
    process.env.PLATFORM_BRAND_COLOR,
    process.env.NEXT_PUBLIC_BRAND_COLOR,
    process.env.BRAND_COLOR,
  ]
  const first = candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
  const trimmed = (first ?? DEFAULT_BRAND_COLOR).trim()
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : DEFAULT_BRAND_COLOR
}

export const BRAND_NAME = resolveBrandName()
export const BRAND_PRIMARY_COLOR = resolveBrandColor()

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Safe HTML snippet for rich text (e.g. FAQ `displayAnswer`) — matches default BrandName styling.
 */
export function brandNameInlineHtml(): string {
  return `<span data-brand-name style="color:${BRAND_PRIMARY_COLOR};font-weight:600">${escapeHtml(BRAND_NAME)}</span>`
}

/** e.g. "Pockett Team" for metadata authors */
export const BRAND_NAME_TEAM = `${BRAND_NAME} Team`
