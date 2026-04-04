/**
 * Tear down GA4/gtag injection and clear first-party Google Analytics cookies.
 * Call when the user withdraws analytics consent (banner, settings, or other tabs).
 */

function expireCookie(name: string, path: string, domain?: string) {
  const enc = encodeURIComponent(name)
  const base = `${enc}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=${path};SameSite=Lax`
  document.cookie = domain ? `${base};domain=${domain}` : base
}

/** Clear `_ga`, `_ga_*`, `_gid`, `_gat` style cookies for common path/domain combos. */
export function clearGoogleAnalyticsCookies(): void {
  if (typeof document === "undefined") return

  const names = document.cookie.split(";").map((c) => c.split("=")[0]?.trim()).filter(Boolean) as string[]
  const gaNames = names.filter((n) => n.startsWith("_ga") || n === "_gid" || n.startsWith("_gat"))

  const host = window.location.hostname
  const domains = [undefined, host, host.startsWith(".") ? host : `.${host}`]

  for (const name of gaNames) {
    for (const path of ["/", window.location.pathname || "/"]) {
      for (const domain of domains) {
        try {
          expireCookie(name, path, domain)
        } catch {
          /* ignore */
        }
      }
    }
  }
}

/** Remove loader + inline gtag snippets we injected (see `data-fm-ga`). */
export function removeFirmaGoogleAnalyticsScripts(): void {
  document.querySelectorAll("script[data-fm-ga]").forEach((el) => el.remove())
}

/**
 * If gtag is still on window, signal denied storage before scripts go away.
 */
export function denyGoogleAnalyticsConsent(): void {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    if (typeof w.gtag === "function") {
      w.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      })
    }
  } catch {
    /* ignore */
  }
}

export function revokeGoogleAnalyticsClientSide(_gaId: string): void {
  denyGoogleAnalyticsConsent()
  removeFirmaGoogleAnalyticsScripts()
  clearGoogleAnalyticsCookies()
}
