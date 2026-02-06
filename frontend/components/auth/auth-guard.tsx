"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { logger } from '@/lib/logger'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    logger.debug('AuthGuard: checking auth state', 'AuthGuard', { loading, hasUser: !!user, userId: user?.id })

    if (!loading && !user) {
      logger.debug('AuthGuard: No user found, redirecting to /signin')
      router.push('/signin')
    } else if (!loading && user) {
      logger.debug('AuthGuard: User authenticated, allowing access to protected route')
    }
  }, [user, loading, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="md" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return <>{children}</>
}
