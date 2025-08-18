"use client"

import { useEffect } from "react"

export default function SetupRedirect() {
  useEffect(() => {
    // Redirect /setup to /dashboard/connectors
    window.location.href = "/dashboard/connectors"
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Connectors...</p>
      </div>
    </div>
  )
}