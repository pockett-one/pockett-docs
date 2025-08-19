"use client"

import { useEffect } from "react"

export default function DashboardRedirect() {
  useEffect(() => {
    // Redirect /demo/app to /demo/app/overview
    window.location.href = "/demo/app/overview"
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Overview...</p>
      </div>
    </div>
  )
}