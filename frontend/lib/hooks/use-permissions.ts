/**
 * Client-Side Permission Hooks
 * 
 * For client components that need to check permissions
 * Uses server actions to fetch from cache (no DB queries)
 */

'use client'

import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'

export interface ProjectPermissions {
  canView: boolean
  canEdit: boolean
  canManage: boolean
  canComment: boolean
  persona: string | null
}

/**
 * Hook to get project permissions
 * Fetches from cached permissions (server action)
 */
export function useProjectPermissions(
  orgId: string,
  clientId: string,
  projectId: string
) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !orgId || !clientId || !projectId) {
      setLoading(false)
      return
    }

    // Fetch permissions from server action (uses cache)
    fetch(`/api/permissions/project?orgId=${orgId}&clientId=${clientId}&projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        setPermissions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch permissions', err)
        setLoading(false)
      })
  }, [user, orgId, clientId, projectId])

  return { permissions, loading }
}
