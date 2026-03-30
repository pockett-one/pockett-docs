"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Cookie, Shield, BarChart3 } from "lucide-react"
import {
  dispatchCookieConsentUpdated,
  OPEN_COOKIE_SETTINGS_EVENT,
  FM_COOKIE_CONSENT_KEY,
  preferencesFromStorageOrDefaults,
  type CookieConsentUIPreferences,
} from "@/lib/cookie-consent-storage"

const DEFAULT_PREFERENCES: CookieConsentUIPreferences = {
  necessary: true,
  analytics: false,
  personalization: false,
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const openedViaFooterRef = useRef(false)

  useEffect(() => {
    const consent = localStorage.getItem(FM_COOKIE_CONSENT_KEY)
    if (!consent) {
      const t = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const openSettings = () => {
      openedViaFooterRef.current = true
      setPreferences(preferencesFromStorageOrDefaults())
      setShowDetails(true)
      setShowBanner(true)
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings)
  }, [])

  const dismissBanner = () => {
    openedViaFooterRef.current = false
    setShowBanner(false)
    setShowDetails(false)
  }

  const persistAndClose = (consentData: Record<string, unknown>) => {
    localStorage.setItem(FM_COOKIE_CONSENT_KEY, JSON.stringify(consentData))
    dispatchCookieConsentUpdated()
    dismissBanner()
  }

  const handleAcceptAll = () => {
    persistAndClose({
      necessary: true,
      analytics: true,
      personalization: true,
      timestamp: new Date().toISOString(),
    })
  }

  const handleRejectAll = () => {
    persistAndClose({
      necessary: true,
      analytics: false,
      personalization: false,
      timestamp: new Date().toISOString(),
    })
  }

  const handleSavePreferences = () => {
    persistAndClose({
      ...preferences,
      timestamp: new Date().toISOString(),
    })
  }

  const handleCustomize = () => {
    openedViaFooterRef.current = false
    setPreferences(preferencesFromStorageOrDefaults())
    setShowDetails(true)
  }

  const handleBackFromDetails = () => {
    if (openedViaFooterRef.current) {
      dismissBanner()
    } else {
      setShowDetails(false)
    }
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 pointer-events-none" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className={showDetails ? "max-w-md mx-auto" : "max-w-6xl mx-auto"}>
          <div className={`bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-purple-900/10 relative overflow-hidden ${showDetails ? 'p-4' : 'p-6'}`}>
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-white pointer-events-none" />

            {showDetails ? (
              // Detailed preferences view
              <div className="relative">
                <div className="flex items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Cookie className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Cookie Settings</h3>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {/* Necessary cookies */}
                  <div className="flex items-center justify-between p-3 bg-purple-50/40 border border-purple-100/80 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-purple-700" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Necessary</h4>
                        <p className="text-xs text-slate-500">Required for basic functionality</p>
                      </div>
                    </div>
                    <span className="text-xs text-purple-900 font-bold bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200/80">Always on</span>
                  </div>

                  {/* Analytics cookies */}
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-purple-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Analytics</h4>
                        <p className="text-xs text-slate-500">Usage tracking and insights</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-slate-100 accent-purple-900 focus:ring-1 focus:ring-purple-500"
                      />
                    </label>
                  </div>

                  {/* Personalization cookies */}
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-purple-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Cookie className="h-4 w-4 text-purple-600" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Personalization</h4>
                        <p className="text-xs text-slate-500">Custom preferences</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.personalization}
                        onChange={(e) => setPreferences(prev => ({ ...prev, personalization: e.target.checked }))}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-slate-100 accent-purple-900 focus:ring-1 focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSavePreferences}
                    size="sm"
                    className="flex-1 bg-purple-900 hover:bg-black text-white font-bold"
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackFromDetails}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              // Simple banner view
              <div className="relative">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/20">
                    <Cookie className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">We value your privacy</h3>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium">
                      We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                      By clicking &quot;Accept All&quot;, you consent to our use of cookies. You can customize your preferences or learn more in our{" "}
                      <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-bold underline decoration-2 underline-offset-2">
                        Privacy Policy
                      </Link>.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-purple-900 hover:bg-black text-white font-bold shadow-lg shadow-purple-900/10"
                      >
                        Accept All Cookies
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCustomize}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        Customize Settings
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRejectAll}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                      >
                        Reject All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
