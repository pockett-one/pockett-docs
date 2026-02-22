"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Settings,
  User,
  Users,
  ChevronDown,
  Menu,
  ChevronLeft,
  LayoutDashboard,
  BookOpen,
  Briefcase,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Folder,
  Share2,
  BarChart3,
  Database,
  Eye,
  Check,
} from "lucide-react"
import { OrganizationSelector, type OrganizationOption } from "@/components/projects/organization-selector"
import { getUserOrganizations } from "@/lib/actions/organizations"
import { getOrganizationRole } from "@/lib/actions/organization"
import { ROLES } from "@/lib/roles"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileBubble, ProfileBubblePopupContent } from "@/components/ui/profile-bubble-popup"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useViewAs } from "@/lib/view-as-context"

interface AppSidebarProps {
  /** When "inline", sidebar fills its container (no fixed positioning). Used in 3-pane card layout. */
  variant?: 'fixed' | 'inline'
}

export function AppSidebar({ variant = 'fixed' }: AppSidebarProps = {}) {
  const { user, signOut } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { viewAsPersonaSlug, setViewAsPersonaSlug, effectivePermissions, isViewAsActive, personas } = useViewAs()
  const pathname = usePathname()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [viewAsSelectOpen, setViewAsSelectOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; width?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const updatePopupPosition = () => {
    if (!profileRef.current) return
    const rect = profileRef.current.getBoundingClientRect()
    const popupWidth = 192 // min-w-[12rem]
    let left = isCollapsed ? rect.left + rect.width / 2 - popupWidth / 2 : rect.left
    // Clamp so popup is never cut off on the left (or right) of the viewport
    const padding = 12
    left = Math.max(padding, Math.min(left, typeof window !== 'undefined' ? window.innerWidth - popupWidth - padding : left))
    const width = isCollapsed ? undefined : rect.width
    setPopupPosition({ top: rect.top - 8, left, width })
  }

  // Position profile popup in portal (avoids clipping in collapsed mode)
  useLayoutEffect(() => {
    if (!isProfileOpen || !profileRef.current) {
      setPopupPosition(null)
      return
    }
    updatePopupPosition()
  }, [isProfileOpen, isCollapsed])

  useEffect(() => {
    if (!isProfileOpen) return
    const onScrollOrResize = () => updatePopupPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isProfileOpen, isCollapsed])

  // Organization Selector State
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])
  const [selectedOrganizationSlug, setSelectedOrganizationSlug] = useState<string>('')
  
  // Permissions State
  const [orgPermissions, setOrgPermissions] = useState<{
    canView: boolean
    canEdit: boolean
    canManage: boolean
    canManageClients: boolean
    canEditClients: boolean
    canViewClients: boolean
    isOrgOwner?: boolean
  } | null>(null)

  // View As: show dropdown based on persona (can use RBAC admin), not page location
  const [canUseViewAs, setCanUseViewAs] = useState(false)

  // "More" Section Collapse State
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  // Projects Collapse State
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)
  // Project tab visibility (Members, Shares, Insights, Sources, Settings) when in a project
  const [projectTabPermissions, setProjectTabPermissions] = useState<{
    canViewInternalTabs: boolean
    canViewSettings: boolean
  } | null>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const el = target as Element
      const insidePopup = el.closest?.('[data-profile-popup]')
      if (profileRef.current && !profileRef.current.contains(target) && !insidePopup) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Extract user details from Google profile - ... existing code ...
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const getUserEmail = () => user?.email || 'user@example.com'

  // Extract organization slug (support both /d/o/[slug] and legacy /o/[slug])
  const getSlug = () => {
    const match = pathname.match(/\/(?:d\/)?o\/([^\/]+)/)
    return match ? match[1] : null
  }
  const slug = getSlug()
  
  // Extract client slug from URL
  const getClientSlug = () => {
    const match = pathname.match(/\/c\/([^\/]+)/)
    return match ? match[1] : null
  }
  const clientSlug = getClientSlug()
  
  // Extract Project Slug
  const getProjectSlug = () => {
    const match = pathname.match(/\/p\/([^\/]+)/)
    return match ? match[1] : null
  }
  const projectSlug = getProjectSlug()

  const baseUrl = slug ? `/d/o/${slug}` : '/d'

  // Fetch Data (Organizations, Role, and Permissions)
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Always fetch user's organizations
      const orgs = await getUserOrganizations()
      setOrganizations(orgs)
      
      // Set selected organization from URL slug
      if (slug) {
        setSelectedOrganizationSlug(slug)
        
        // Fetch role and permissions for current organization
        const [roleData] = await Promise.all([
          getOrganizationRole(slug)
        ])
        setRole(roleData)
        
        // Fetch permissions from cache (uses in-memory permissions)
        // Get orgId from organizations list
        const currentOrg = orgs.find(o => o.slug === slug)
        if (currentOrg) {
          try {
            const permResponse = await fetch(`/api/permissions/organization?orgId=${currentOrg.id}`)
            if (permResponse.ok) {
              const permData = await permResponse.json()
              setOrgPermissions(permData)
            }
          } catch (error) {
            console.error("Failed to fetch organization permissions", error)
          }
        }
      } else if (orgs.length > 0) {
        // If no slug in URL, select the default organization (isDefault: true)
        // or fallback to the first one if no default is set
        const defaultOrg = orgs.find(org => org.isDefault)
        setSelectedOrganizationSlug(defaultOrg?.slug || orgs[0].slug)
      }
    } catch (error) {
      console.error("Failed to fetch sidebar data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const handleRefresh = () => fetchData()
    window.addEventListener('pockett:refresh-organizations', handleRefresh)

    return () => {
      window.removeEventListener('pockett:refresh-organizations', handleRefresh)
    }
  }, [slug])

  // Fetch project tab permissions when in project context (for sidebar sub-menu visibility)
  useEffect(() => {
    if (!slug || !clientSlug || !projectSlug) {
      setProjectTabPermissions(null)
      return
    }
    const url = `/api/permissions/project-tabs?orgSlug=${encodeURIComponent(slug)}&clientSlug=${encodeURIComponent(clientSlug)}&projectSlug=${encodeURIComponent(projectSlug)}`
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.canViewInternalTabs === 'boolean' && typeof data.canViewSettings === 'boolean') {
          setProjectTabPermissions({ canViewInternalTabs: data.canViewInternalTabs, canViewSettings: data.canViewSettings })
        } else {
          setProjectTabPermissions(null)
        }
      })
      .catch(() => setProjectTabPermissions(null))
  }, [slug, clientSlug, projectSlug])

  // Determine active organization from URL or default
  useEffect(() => {
    if (slug) {
      setSelectedOrganizationSlug(slug)
    } else if (organizations.length > 0) {
      // If no slug in URL, select the default organization (isDefault: true)
      // or fallback to the first one if no default is set
      const defaultOrg = organizations.find(org => org.isDefault)
      setSelectedOrganizationSlug(defaultOrg?.slug || organizations[0].slug)
    }
  }, [pathname, slug, organizations])

  // Fetch "can use View As" (persona-based) so dropdown is shown on /d/ and legacy /o/ dashboard routes
  const isDashboardPath = pathname?.startsWith('/d') || pathname?.startsWith('/o/')
  useEffect(() => {
    if (!user || !isDashboardPath) {
      setCanUseViewAs(false)
      return
    }
    fetch('/api/permissions/can-use-view-as')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCanUseViewAs(data?.canUseViewAs === true))
      .catch(() => setCanUseViewAs(false))
  }, [user, isDashboardPath])

  // --- RBAC HELPER ---
  // When "View As" is active, use effective permissions for nav visibility; otherwise use real org permissions.
  const effective = isViewAsActive ? effectivePermissions : null
  const canManageOrg = effective ? effective.canManage : (orgPermissions?.canManage ?? false)
  const canEditOrg = effective ? effective.canEdit : (orgPermissions?.canEdit ?? false)
  const canViewOrg = effective ? effective.canView : (orgPermissions?.canView ?? true)
  const canManageClients = effective ? effective.canManageClients : (orgPermissions?.canManageClients ?? false)
  const canEditClients = effective ? effective.canEditClients : (orgPermissions?.canEditClients ?? false)
  const canViewClients = effective ? effective.canViewClients : (orgPermissions?.canViewClients ?? false)

  // Fallback to role-based checks if permissions not loaded yet (backward compatibility)
  const isOwner = role === ROLES.ORG_OWNER
  const isMember = role === ROLES.ORG_MEMBER

  // View As dropdown: show only when user can use it and current persona is not EC/Guest (they wouldn't have View As)
  const canShowViewAsDropdown =
    canUseViewAs &&
    viewAsPersonaSlug !== 'proj_ext_collaborator' &&
    viewAsPersonaSlug !== 'proj_guest'

  // Rules - use permission checks when available, fallback to role checks
  const showOrganizationWorkspace = canViewOrg || isOwner || isMember || organizations.length > 0
  const showDashboard = true
  const showResources = true
  const showSettings = canManageOrg || isOwner
  const showMore = canViewOrg || isOwner || isMember
  

  // One spacing rule: parent uses space-y-4 so every adjacent pair (section, separator) has the same gap. Title-to-content within each section.
  const spaceTitle = 'mb-4'
  const SeparatorLine = () => <div className="-mx-4 border-b border-slate-100" aria-hidden />

  const isInline = variant === 'inline'
  const outerClass = isInline
    ? 'h-full w-full flex flex-col bg-white overflow-visible rounded-2xl'
    : `fixed inset-y-0 left-0 z-40 bg-white border-r border-stone-200 transition-all duration-300 pt-16 overflow-x-hidden rounded-2xl ${isCollapsed ? 'w-16' : 'w-64'}`

  if (isLoading) {
    return (
      <div className={isInline ? `flex flex-col h-full ${isCollapsed ? 'w-16' : 'w-64'}` : `fixed inset-y-0 left-0 z-40 bg-white border-r border-stone-200 pt-16 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col h-full px-3 pt-6 gap-4">
          {!isCollapsed && (
            <>
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="mx-3 border-b border-slate-100 mb-2" />
              <Skeleton className="h-3 w-20" />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </>
          )}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-lg" />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={outerClass}>
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[500] w-6 h-6 rounded-full bg-black text-white hover:bg-black/90 flex items-center justify-center shadow-md border-0"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Scrollable: org, view as, nav — space-y-4 between sections */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 space-y-4 pt-4 pb-4">
        <div className="space-y-4">
          {showOrganizationWorkspace && !isCollapsed && (
            <>
              <OrganizationSelector
                organizations={organizations}
                selectedOrganizationSlug={selectedOrganizationSlug}
                onOrganizationChange={(orgSlug) => {
                  setSelectedOrganizationSlug(orgSlug)
                  router.push(`/d/o/${orgSlug}`)
                }}
                className="w-full"
              />
              <SeparatorLine />
            </>
          )}

          {canShowViewAsDropdown && !isCollapsed && (
            <>
              <div>
                <label className={`d-section ${spaceTitle} block`}>View as</label>
                <Select
                  value={viewAsPersonaSlug ?? 'org_admin'}
                  onValueChange={(slug) => {
                    setViewAsPersonaSlug(slug === 'org_admin' ? null : slug)
                    window.location.reload()
                  }}
                  open={viewAsSelectOpen}
                  onOpenChange={setViewAsSelectOpen}
                >
                  <SelectTrigger
                    className={`flex h-12 w-full items-center gap-2 rounded-xl border border-stone-200 bg-stone-100/80 px-4 text-stone-900 shadow-none transition-colors hover:bg-stone-200/80 focus:ring-2 focus:ring-stone-200 [&>svg]:ml-0 [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200 ${viewAsSelectOpen ? '[&>svg:last-child]:rotate-180' : ''}`}
                  >
                    <Eye className="h-4 w-4 shrink-0 text-stone-500" />
                    <SelectValue placeholder="View as..." />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-xl border border-slate-100 bg-white shadow-md py-2 min-w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)]"
                    data-view-as-select
                  >
                    {personas.map((p) => (
                      <SelectItem
                        key={p.slug}
                        value={p.slug}
                        className="cursor-pointer rounded-lg py-2.5 px-3 text-sm text-slate-700"
                      >
                        {p.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <SeparatorLine />
            </>
          )}

        </div>

        <nav className="space-y-0.5">

          {/* DASHBOARD */}
          {showDashboard && (
            <>
            <div className={isCollapsed ? 'w-full' : ''}>
              {!isCollapsed && <h3 className={`d-sidebar-section px-3 ${spaceTitle}`}>Dashboard</h3>}

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={clientSlug ? `${baseUrl}/c/${clientSlug}` : baseUrl}
                        className={`flex-1 flex items-center d-sidebar-nav rounded-xl transition-colors ${isCollapsed ? 'px-0 justify-center' : 'px-3'} py-2.5 ${(pathname.includes('/c/') || pathname.endsWith('/c')) && !projectSlug
                          ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <Briefcase className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${(pathname.includes('/c/') || pathname.endsWith('/c')) && !projectSlug ? 'text-slate-900' : 'text-slate-500'}`} />
                        {!isCollapsed && <span>Projects</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Projects</TooltipContent>}
                  </Tooltip>

                  {!isCollapsed && projectSlug && (
                    <button
                      onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Project sub-menus - modern: rounded-lg, soft active state */}
                {!isCollapsed && projectSlug && isProjectsOpen && (
                  <div className="ml-1 flex flex-col gap-0.5 pl-3 mt-1 border-l border-slate-100 animate-in slide-in-from-top-1 fade-in duration-200">
                    <Link
                      href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=files`}
                      className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes(projectSlug) && (pathname.includes('tab=files') || !pathname.includes('tab='))
                        ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <Folder className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes(projectSlug) && (pathname.includes('tab=files') || !pathname.includes('tab=')) ? 'text-slate-900' : 'text-slate-400'}`} />
                      Files
                    </Link>

                    {projectTabPermissions?.canViewInternalTabs && (
                      <>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=members`}
                          className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('tab=members')
                            ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <Users className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('tab=members') ? 'text-slate-900' : 'text-slate-400'}`} />
                          Members
                        </Link>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=shares`}
                          className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('tab=shares')
                            ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <Share2 className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('tab=shares') ? 'text-slate-900' : 'text-slate-400'}`} />
                          Shares
                        </Link>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=insights`}
                          className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('tab=insights')
                            ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <BarChart3 className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('tab=insights') ? 'text-slate-900' : 'text-slate-400'}`} />
                          Insights
                        </Link>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=sources`}
                          className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('tab=sources')
                            ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <Database className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('tab=sources') ? 'text-slate-900' : 'text-slate-400'}`} />
                          Sources
                        </Link>
                      </>
                    )}

                    {projectTabPermissions?.canViewSettings && (
                      <Link
                        href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=settings`}
                        className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('tab=settings')
                          ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        <Settings className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('tab=settings') ? 'text-slate-900' : 'text-slate-400'}`} />
                        Settings
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
            {!isCollapsed && <SeparatorLine />}
            </>
          )}

          {/* RESOURCES */}
          {showResources && (
            <>
            <div className={isCollapsed ? 'w-full flex items-center gap-0.5' : ''}>
              {!isCollapsed && <h3 className={`d-sidebar-section px-3 ${spaceTitle}`}>Resources</h3>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center d-sidebar-nav rounded-xl transition-colors ${isCollapsed ? 'flex-1 px-0 justify-center' : 'px-3'} py-2.5 ${pathname === '/docs' ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <BookOpen className={`h-4 w-4 shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${pathname === '/docs' ? 'text-slate-900' : 'text-slate-500'}`} />
                    {!isCollapsed && <span>User Guide</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">User Guide</TooltipContent>}
              </Tooltip>
            </div>
            {!isCollapsed && <SeparatorLine />}
            </>
          )}

          {/* OTHERS (Connectors) */}
          {showSettings && (
            <>
            <div className={isCollapsed ? 'w-full flex items-center gap-0.5' : ''}>
              {!isCollapsed && <h3 className={`d-sidebar-section px-3 ${spaceTitle}`}>Others</h3>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`${baseUrl}/connectors`}
                    className={`flex items-center d-sidebar-nav rounded-xl transition-colors ${isCollapsed ? 'flex-1 px-0 justify-center' : 'px-3'} py-2.5 ${pathname.includes('/connectors')
                      ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Settings className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${pathname.includes('/connectors') ? 'text-slate-900' : 'text-slate-500'}`} />
                    {!isCollapsed && <span>Connectors</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">Connectors</TooltipContent>}
              </Tooltip>
            </div>
            {!isCollapsed && <SeparatorLine />}
            </>
          )}

          {/* MORE */}
          {showMore && (
            <>
            <div className={isCollapsed ? 'w-full' : ''}>
              {!isCollapsed ? (
                <div>
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className="d-sidebar-section flex items-center w-full px-3 py-2 hover:text-slate-600 transition-colors rounded-xl"
                  >
                    <span>More</span>
                    <ChevronRight className={`h-3 w-3 ml-1 transition-transform duration-200 ${isMoreOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isMoreOpen && (
                    <div className="mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Link
                        href={`${baseUrl}/insights`}
                        className={`flex items-center d-sidebar-nav rounded-xl transition-colors px-3 py-2.5 ${pathname.includes('/insights')
                          ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <LayoutDashboard className={`h-4 w-4 mr-3 ${pathname.includes('/insights') ? 'text-slate-900' : 'text-slate-500'}`} />
                        <span>Insights</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex w-full items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`${baseUrl}/insights`}
                        className={`flex flex-1 items-center justify-center d-sidebar-nav rounded-xl transition-colors px-0 py-2.5 ${pathname.includes('/insights')
                          ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <LayoutDashboard className={`h-4 w-4 ${pathname.includes('/insights') ? 'text-slate-900' : 'text-slate-500'}`} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Insights</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            {!isCollapsed && <SeparatorLine />}
            </>
          )}

        </nav>

        </div>
        {/* Profile: fixed to bottom left */}
        <div className={`shrink-0 border-t border-slate-100 ${isCollapsed ? 'py-3 px-4' : 'p-4'}`} ref={profileRef}>
          <div className="relative w-full flex justify-center">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex w-full min-w-0 max-w-full items-center justify-center rounded-xl px-0 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ProfileBubble
                      name={getUserDisplayName()}
                      avatarUrl={user?.user_metadata?.avatar_url ?? (user?.user_metadata as Record<string, unknown>)?.picture ?? null}
                      size="default"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p className="font-medium text-slate-900">{getUserDisplayName()}</p>
                  <p className="text-xs text-slate-500">{getUserEmail()}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <ProfileBubble
                  name={getUserDisplayName()}
                  avatarUrl={user?.user_metadata?.avatar_url ?? (user?.user_metadata as Record<string, unknown>)?.picture ?? null}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {getUserEmail()}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            )}

            {/* Profile popup: rendered in portal when open so it is not clipped in collapsed mode */}
            {isProfileOpen && popupPosition && typeof document !== 'undefined' && createPortal(
              <div
                data-profile-popup=""
                className="fixed bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-[200]"
                style={{
                  top: popupPosition.top,
                  left: popupPosition.left,
                  width: popupPosition.width,
                  minWidth: popupPosition.width ? undefined : '12rem',
                  transform: 'translateY(-100%)',
                }}
              >
                <ProfileBubblePopupContent
                  name={getUserDisplayName()}
                  email={getUserEmail()}
                  avatarUrl={user?.user_metadata?.avatar_url ?? (user?.user_metadata as Record<string, unknown>)?.picture ?? null}
                  footer={
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="mt-2 flex items-center gap-2 w-full px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  }
                />
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
