'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRightPane } from '@/lib/right-pane-context'
import { logger } from '@/lib/logger'
import type { DriveFile } from '@/lib/types'

const RECENT_SEARCH_KEY = (projectId: string) => `pockett_search_recent_${projectId}`
const RECENT_SEARCH_MAX = 8

function getRecentSearches(projectId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCH_KEY(projectId))
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_SEARCH_MAX) : []
  } catch {
    return []
  }
}

function pushRecentSearch(projectId: string, query: string) {
  if (typeof window === 'undefined' || !query.trim()) return
  const prev = getRecentSearches(projectId).filter((q) => q.trim().toLowerCase() !== query.trim().toLowerCase())
  const next = [query.trim(), ...prev].slice(0, RECENT_SEARCH_MAX)
  try {
    sessionStorage.setItem(RECENT_SEARCH_KEY(projectId), JSON.stringify(next))
  } catch {
    // ignore
  }
}

type ProjectSearchContextValue = {
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: DriveFile[]
  setSearchResults: (r: DriveFile[]) => void
  isSearching: boolean
  setIsSearching: (v: boolean) => void
  closeSearchPanel: () => void
  recentSearches: string[]
  addRecentSearch: (q: string) => void
  clearRecentSearches: () => void
  /** When search is scoped, e.g. "General", "Confidential", "Staging". */
  searchRootLabel: string | null
}

const ProjectSearchContext = createContext<ProjectSearchContextValue | null>(null)

const DEBOUNCE_MS = 400

interface ProjectSearchProviderProps {
  projectId: string
  children: ReactNode
  /** Optional viewAs for EC/Guest filtering when API supports it */
  viewAsPersonaSlug?: string | null
  /** When set, search is scoped to this folder and its descendants (e.g. General, Confidential, or Staging root). */
  searchRootFolderId?: string | null
  /** Human-readable scope label, e.g. "General", "Confidential", "Staging". */
  searchRootLabel?: string | null
}

export function ProjectSearchProvider({ projectId, children, viewAsPersonaSlug, searchRootFolderId, searchRootLabel: searchRootLabelProp }: ProjectSearchProviderProps) {
  const { session } = useAuth()
  const rightPane = useRightPane()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DriveFile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches(projectId))
  const closeSearchPanel = useCallback(() => {
    rightPane.clearPane()
  }, [rightPane])
  const addRecentSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return
      pushRecentSearch(projectId, q)
      setRecentSearches(getRecentSearches(projectId))
    },
    [projectId]
  )
  const clearRecentSearches = useCallback(() => {
    try {
      sessionStorage.removeItem(RECENT_SEARCH_KEY(projectId))
      setRecentSearches([])
    } catch {
      setRecentSearches([])
    }
  }, [projectId])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        try {
          const params = new URLSearchParams({ q: searchQuery.trim() })
          if (viewAsPersonaSlug === 'proj_ext_collaborator' || viewAsPersonaSlug === 'proj_viewer') {
            params.set('viewAs', viewAsPersonaSlug)
          }
          if (searchRootFolderId) {
            params.set('rootFolderId', searchRootFolderId)
          }
          const res = await fetch(`/api/projects/${projectId}/search?${params}`, {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            setSearchResults(data.files || [])
            pushRecentSearch(projectId, searchQuery.trim())
            setRecentSearches(getRecentSearches(projectId))
          } else {
            logger.error('Search API failed', new Error(await res.text()))
            setSearchResults([])
          }
        } catch (e) {
          logger.error('Search failed', e as Error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery, projectId, session?.access_token, viewAsPersonaSlug, searchRootFolderId])

  const value: ProjectSearchContextValue = {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    closeSearchPanel,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    searchRootLabel: searchRootLabelProp ?? null,
  }

  return (
    <ProjectSearchContext.Provider value={value}>
      {children}
    </ProjectSearchContext.Provider>
  )
}

export function useProjectSearch(): ProjectSearchContextValue {
  const ctx = useContext(ProjectSearchContext)
  if (!ctx) {
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      searchResults: [],
      setSearchResults: () => {},
      isSearching: false,
      setIsSearching: () => {},
      closeSearchPanel: () => {},
      recentSearches: [],
      addRecentSearch: () => {},
      clearRecentSearches: () => {},
      searchRootLabel: null,
    }
  }
  return ctx
}
