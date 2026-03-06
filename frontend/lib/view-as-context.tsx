"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const VIEW_AS_COOKIE = "pockett_view_as"

export type EffectivePermissions = {
  canView: boolean
  canEdit: boolean
  canManage: boolean
  canViewClients: boolean
  canEditClients: boolean
  canManageClients: boolean
  viewAsPersona: string
}

export const RBAC_PERSONAS = [
  { slug: "sys_admin", displayName: "System Admin" },
  { slug: "org_owner", displayName: "Organization Owner" },
  { slug: "org_member", displayName: "Organization Member" },
  { slug: "project_admin", displayName: "Project Administrator" },
  { slug: "project_editor", displayName: "Project Editor" },
  { slug: "project_viewer", displayName: "Project Viewer" },
] as const

type ViewAsContextValue = {
  viewAsPersonaSlug: string | null
  setViewAsPersonaSlug: (slug: string | null) => void
  effectivePermissions: EffectivePermissions | null
  isViewAsActive: boolean
  personas: readonly { slug: string; displayName: string }[]
}

const ViewAsContext = createContext<ViewAsContextValue | null>(null)

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return
  const sameSite = "Lax"
  const path = "/"
  if (value) {
    // Session cookie only (no max-age) — resets when user logs out or closes browser
    document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`
  } else {
    document.cookie = `${name}=; path=${path}; max-age=0; SameSite=${sameSite}`
  }
}

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsPersonaSlug, setViewAsPersonaSlugState] = useState<string | null>(null)
  const [effectivePermissions, setEffectivePermissions] = useState<EffectivePermissions | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const setViewAsPersonaSlug = useCallback((slug: string | null) => {
    setViewAsPersonaSlugState(slug)
    setCookie(VIEW_AS_COOKIE, slug)
    if (slug) {
      fetch(`/api/rbac/effective-permissions?persona=${encodeURIComponent(slug)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setEffectivePermissions(data ?? null))
        .catch(() => setEffectivePermissions(null))
    } else {
      setEffectivePermissions(null)
    }
  }, [])

  useEffect(() => {
    const fromCookie = getCookie(VIEW_AS_COOKIE)
    if (fromCookie && RBAC_PERSONAS.some((p) => p.slug === fromCookie)) {
      setViewAsPersonaSlugState(fromCookie)
      fetch(`/api/rbac/effective-permissions?persona=${encodeURIComponent(fromCookie)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setEffectivePermissions(data ?? null))
        .catch(() => setEffectivePermissions(null))
    }
    setHydrated(true)
  }, [])

  const value: ViewAsContextValue = {
    viewAsPersonaSlug,
    setViewAsPersonaSlug,
    effectivePermissions,
    isViewAsActive: hydrated && viewAsPersonaSlug != null,
    personas: RBAC_PERSONAS,
  }

  return (
    <ViewAsContext.Provider value={value}>
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs(): ViewAsContextValue {
  const ctx = useContext(ViewAsContext)
  if (!ctx) {
    return {
      viewAsPersonaSlug: null,
      setViewAsPersonaSlug: () => { },
      effectivePermissions: null,
      isViewAsActive: false,
      personas: RBAC_PERSONAS,
    }
  }
  return ctx
}
