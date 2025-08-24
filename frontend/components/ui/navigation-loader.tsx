"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface NavigationLoaderProps {
  children: React.ReactNode
  className?: string
}

export function NavigationLoader({ children, className = "" }: NavigationLoaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Show loader when pathname changes
    setIsLoading(true)
    
    // Hide loader after a short delay to allow content to render
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Navigation Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-700">Loading page...</p>
          </div>
        </div>
      )}
    </div>
  )
}
