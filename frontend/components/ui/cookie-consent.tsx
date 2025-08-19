"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie, X, Shield, Eye, BarChart3 } from "lucide-react"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be changed
    analytics: false,
    marketing: false,
    personalization: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('pockett_cookie_consent')
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1500)
    }
  }, [])

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('pockett_cookie_consent', JSON.stringify(consentData))
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    const consentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('pockett_cookie_consent', JSON.stringify(consentData))
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('pockett_cookie_consent', JSON.stringify(consentData))
    setShowBanner(false)
  }

  const handleCustomize = () => {
    setShowDetails(true)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-50 pointer-events-none" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className={showDetails ? "max-w-md mx-auto" : "max-w-6xl mx-auto"}>
          <div className={`bg-white border border-gray-200 rounded-2xl shadow-2xl relative overflow-hidden ${showDetails ? 'p-4' : 'p-6'}`}>
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 pointer-events-none" />
            
            {showDetails ? (
              // Detailed preferences view
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Cookie className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Cookie Settings</h3>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {/* Necessary cookies */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Necessary</h4>
                        <p className="text-xs text-gray-500">Required for basic functionality</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Always On</span>
                  </div>

                  {/* Analytics cookies */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Analytics</h4>
                        <p className="text-xs text-gray-500">Usage tracking and insights</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                    </label>
                  </div>

                  {/* Marketing cookies */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Marketing</h4>
                        <p className="text-xs text-gray-500">Personalized advertisements</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                    </label>
                  </div>

                  {/* Personalization cookies */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <Cookie className="h-4 w-4 text-orange-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Personalization</h4>
                        <p className="text-xs text-gray-500">Custom preferences</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.personalization}
                        onChange={(e) => setPreferences(prev => ({ ...prev, personalization: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSavePreferences}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                    className="border-gray-300"
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              // Simple banner view
              <div className="relative">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Cookie className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">We value your privacy</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                      By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or learn more in our{" "}
                      <button className="text-blue-600 hover:text-blue-700 font-medium underline">
                        Privacy Policy
                      </button>.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        Accept All Cookies
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCustomize}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Customize Settings
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleRejectAll}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Reject All
                      </Button>
                    </div>
                  </div>
                  <button
                    onClick={handleRejectAll}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}