"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardRedirect() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  useEffect(() => {
    if (isClient) {
      // Redirect /demo/app to /demo/app/insights (the new landing page)
      router.replace("/demo/app/insights")
    }
  }, [router, isClient])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Insights...</p>
      </div>
    </div>
  )
}