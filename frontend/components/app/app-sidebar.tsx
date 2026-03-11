"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { Button } from "@/components/ui/button"
import {
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
import { ProfileSection } from "@/components/ui/profile-section"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useViewAs } from "@/lib/view-as-context"
import { StorageWidget } from "@/components/ui/storage-widget"
import { useSidebarOrganizations } from "@/lib/sidebar-organizations-context"

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
  const initialOrganizations = useSidebarOrganizations()
  const [viewAsSelectOpen, setViewAsSelectOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  // Initial loading should only be true if we don't have initialOrganizations and need to fetch them
  const [isLoading, setIsLoading] = useState(!initialOrganizations || initialOrganizations.length === 0)


  // Organization Selector State
  const [organizations, setOrganizations] = useState<OrganizationOption[]>(initialOrganizations as OrganizationOption[] || [])
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

  // Fetch Data (Organizations — always fetch fresh so dropdown has complete list for switching)
  const fetchData = async () => {
    const hasCachedData = organizations.length > 0 && (slug ? organizations.some(o => o.slug === slug) : true)
    if (!hasCachedData) {
      setIsLoading(true)
    }

    try {
      // Always fetch fresh org list so Custom/Sandbox/Import orgs all appear in dropdown after switching
      const orgs = await getUserOrganizations()
      setOrganizations(orgs)

      if (slug) {
        setSelectedOrganizationSlug(slug)
        const currentOrg = orgs.find(o => o.slug === slug)
        if (currentOrg) {
          const [roleData, permResponse] = await Promise.all([
            getOrganizationRole(slug),
            fetch(`/api/permissions/organization?orgId=${currentOrg.id}`)
          ])
          setRole(roleData)
          if (permResponse.ok) {
            try {
              const permData = await permResponse.json()
              setOrgPermissions(permData)
            } catch (error) {
              console.error("Failed to fetch organization permissions", error)
            }
          }
        }
      } else if (orgs.length > 0) {
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
  const spaceTitle = 'mb-3'
  const SeparatorLine = () => <div className="-mx-4 border-b border-slate-100 my-10" aria-hidden />

  const isInline = variant === 'inline'
  const outerClass = isInline
    ? 'h-full w-full flex flex-col bg-white overflow-visible rounded-2xl'
    : `fixed inset-y-0 left-0 z-40 bg-white border-r border-stone-200 transition-all duration-300 pt-16 overflow-x-hidden rounded-2xl ${isCollapsed ? 'w-16' : 'w-64'}`


  if (isLoading) {
    return (
      <div className={outerClass}>
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
      {/* Sidebar Content */}
      <div className="flex flex-col h-full">
        {/* Workspace Selector at the very top (prominent) */}
        {!isCollapsed && slug && (
          <div className="px-3 py-6 border-b border-slate-100 bg-slate-50/30">
            <OrganizationSelector
              organizations={organizations}
              selectedOrganizationSlug={selectedOrganizationSlug}
              onOrganizationChange={(orgSlug) => {
                setSelectedOrganizationSlug(orgSlug)
                router.push(`/d/o/${orgSlug}`)
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[500] w-6 h-6 rounded-full bg-black text-white hover:bg-black/90 flex items-center justify-center shadow-md border-0"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Scrollable: view as, nav — space-y-6 between sections */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 space-y-6 pt-4 pb-4">
            <div className="space-y-6">

              {canShowViewAsDropdown && !isCollapsed && (
                <>
                  <div className="pt-2">
                    <label className={`d-section ${spaceTitle} block px-1`}>View as</label>
                    <Select
                      value={viewAsPersonaSlug ?? (user?.app_metadata as any)?.active_persona ?? role?.toLowerCase() ?? personas[0]?.slug}
                      onValueChange={(newSlug) => {
                        const currentPersona = (user?.app_metadata as any)?.active_persona || role?.toLowerCase()
                        setViewAsPersonaSlug(newSlug === currentPersona ? null : newSlug)
                        window.location.reload()
                      }}
                      open={viewAsSelectOpen}
                      onOpenChange={setViewAsSelectOpen}
                    >
                      <SelectTrigger
                        className={`flex h-12 w-full items-center gap-2 rounded-xl border border-stone-200 bg-stone-100/80 px-4 text-stone-900 shadow-none transition-colors hover:bg-stone-200/80 focus:ring-2 focus:ring-200 [&>svg]:ml-0 [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200 ${viewAsSelectOpen ? '[&>svg:last-child]:rotate-180' : ''}`}
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

            <nav className="space-y-1">

              {/* DASHBOARD */}
              {showDashboard && (
                <>
                  <div className={isCollapsed ? 'w-full' : ''}>

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

                      {/* Project sub-menus - path-based URLs (no query tab) */}
                      {!isCollapsed && projectSlug && isProjectsOpen && (
                        <div className="ml-1 flex flex-col gap-0.5 pl-3 mt-1 border-l border-slate-100 animate-in slide-in-from-top-1 fade-in duration-200">
                          <Link
                            href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}/files`}
                            className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes(projectSlug) && (pathname.endsWith('/files') || pathname.match(/\/p\/[^/]+\/files(\/|$)/))
                              ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            <Folder className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes(projectSlug) && (pathname.endsWith('/files') || pathname.match(/\/p\/[^/]+\/files(\/|$)/)) ? 'text-slate-900' : 'text-slate-400'}`} />
                            Files
                          </Link>

                          {projectTabPermissions?.canViewInternalTabs && (
                            <>
                              <Link
                                href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}/members`}
                                className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('/members')
                                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                              >
                                <Users className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('/members') ? 'text-slate-900' : 'text-slate-400'}`} />
                                Members
                              </Link>
                              <Link
                                href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}/shares`}
                                className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('/shares')
                                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                              >
                                <Share2 className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('/shares') ? 'text-slate-900' : 'text-slate-400'}`} />
                                Shares
                              </Link>
                              <Link
                                href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}/insights`}
                                className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('/insights')
                                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                              >
                                <BarChart3 className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('/insights') ? 'text-slate-900' : 'text-slate-400'}`} />
                                Insights
                              </Link>
                              <Link
                                href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}/sources`}
                                className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('/sources')
                                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                              >
                                <Database className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('/sources') ? 'text-slate-900' : 'text-slate-400'}`} />
                                Sources
                              </Link>
                            </>
                          )}

                          {projectTabPermissions?.canViewSettings && (
                            <Link
                              href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}/settings`}
                              className={`flex items-center d-sidebar-nav rounded-lg py-2 px-3 transition-colors ${pathname.includes('/settings')
                                ? 'bg-slate-100 text-slate-900 hover:bg-slate-100/90'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                              <Settings className={`h-3.5 w-3.5 mr-2.5 ${pathname.includes('/settings') ? 'text-slate-900' : 'text-slate-400'}`} />
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
                  <div className={isCollapsed ? 'w-full flex items-center gap-0.5' : 'pt-2'}>
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
                  <div className={isCollapsed ? 'w-full flex items-center gap-0.5' : 'pt-2'}>
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

            {/* Storage: used vs quota for connected Drive (current org) */}
            {!isCollapsed && (
              <>
                <div className="px-1">
                  <StorageWidget orgSlug={slug ?? selectedOrganizationSlug} collapsed={isCollapsed} />
                </div>
                <SeparatorLine />
              </>
            )}

          </div>
        </div>
        {/* Profile: fixed to bottom left */}
        <ProfileSection user={user} signOut={signOut} isCollapsed={isCollapsed} />
      </div>
    </div>
  )
}
