'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  analyticsConsentGranted,
  COOKIE_CONSENT_UPDATED_EVENT,
  FM_COOKIE_CONSENT_KEY,
} from '@/lib/cookie-consent-storage'

/**
 * Loads gtag only when analytics consent is present in localStorage.
 * Subscribes to consent updates and the storage event (other tabs).
 */
export function ConsentAwareGoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const isDevelopment = process.env.NODE_ENV === 'development'
  const [allow, setAllow] = useState(false)

  const refresh = useCallback(() => {
    setAllow(analyticsConsentGranted())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onUpdated = () => refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === FM_COOKIE_CONSENT_KEY) refresh()
    }
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [refresh])

  useEffect(() => {
    if (!gaId || isDevelopment || !allow) return

    const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return

    const s1 = document.createElement('script')
    s1.async = true
    s1.src = src
    document.head.appendChild(s1)

    const s2 = document.createElement('script')
    s2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', ${JSON.stringify(gaId)});
    `
    document.head.appendChild(s2)

    return () => {
      s1.remove()
      s2.remove()
    }
  }, [gaId, isDevelopment, allow])

  return null
}
