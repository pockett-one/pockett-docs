/**
 * Public site hostname and contact email domain from env (NEXT_PUBLIC_* so client + server match).
 *
 * NEXT_PUBLIC_PLATFORM_BRAND_DOMAIN — bare host, e.g. firma.bz
 * NEXT_PUBLIC_PLATFORM_BRAND_DOMAIN_EMAIL — suffix with @, e.g. @firmaone.com (or firmaone.com)
 */

const DEFAULT_BRAND_DOMAIN = 'firma.bz'
const DEFAULT_EMAIL_SUFFIX = '@firmaone.com'

export function getPlatformBrandDomain(): string {
    const v = process.env.NEXT_PUBLIC_PLATFORM_BRAND_DOMAIN?.trim()
    return v || DEFAULT_BRAND_DOMAIN
}

/** https://{brandDomain} */
export function getPlatformSiteOrigin(): string {
    return `https://${getPlatformBrandDomain()}`
}

/** e.g. @firmaone.com */
export function getPlatformEmailSuffix(): string {
    const v = process.env.NEXT_PUBLIC_PLATFORM_BRAND_DOMAIN_EMAIL?.trim()
    const raw = v || DEFAULT_EMAIL_SUFFIX
    return raw.startsWith('@') ? raw : `@${raw}`
}

/** localPart only, e.g. platformEmail('sales') -> sales@… */
export function platformEmail(localPart: string): string {
    const part = localPart.replace(/@.+$/, '').trim()
    return `${part}${getPlatformEmailSuffix()}`
}

/** Display host for app workspace, e.g. app.firma.bz */
export function getAppHostDisplay(): string {
    return `app.${getPlatformBrandDomain()}`
}

/** Subdomain example for marketing copy, e.g. yourcompany.firma.bz */
export function getSubdomainExampleHost(subdomain = 'yourcompany'): string {
    return `${subdomain}.${getPlatformBrandDomain()}`
}
