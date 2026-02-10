"use client"

import { useState, useEffect, useRef } from "react"
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
  Database
} from "lucide-react"
import { OrganizationSelector, type OrganizationOption } from "@/components/projects/organization-selector"
import { getUserOrganizations } from "@/lib/actions/organizations"
import { getOrganizationRole } from "@/lib/actions/organization"
import { ROLES } from "@/lib/roles"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ProfileBubble, ProfileBubblePopupContent } from "@/components/ui/profile-bubble-popup"

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

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
  } | null>(null)

  // "More" Section Collapse State
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  // Projects Collapse State
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
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

  // Extract organization slug
  const getSlug = () => {
    const match = pathname.match(/^\/o\/([^\/]+)/)
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

  const baseUrl = slug ? `/o/${slug}` : '/dash'

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


  // --- RBAC HELPER ---
  // Use permission-based checks instead of role-based checks
  // This ensures UI reflects actual permissions from in-memory cache
  const canManageOrg = orgPermissions?.canManage ?? false
  const canEditOrg = orgPermissions?.canEdit ?? false
  const canViewOrg = orgPermissions?.canView ?? true // Default to true if not loaded yet
  
  // Client scope permissions (for creating/managing clients)
  const canManageClients = orgPermissions?.canManageClients ?? false
  const canEditClients = orgPermissions?.canEditClients ?? false
  
  // Fallback to role-based checks if permissions not loaded yet (backward compatibility)
  const isOwner = role === ROLES.ORG_OWNER
  const isMember = role === ROLES.ORG_MEMBER
  
  // Rules - use permission checks when available, fallback to role checks
  const showOrganizationWorkspace = canViewOrg || isOwner || isMember || organizations.length > 0
  const showDashboard = true // Everyone sees dashboard/projects? (Org Owner, Member, Guest with access)
  const showResources = true // User Guide for everyone
  const showSettings = canManageOrg || isOwner // Connectors - requires can_manage permission
  const showMore = canViewOrg || isOwner || isMember // Insights
  

  if (isLoading) {
    return (
      <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 pt-16 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="sm" showDots={false} message="" />
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 pt-16 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">

        {/* 1. ORGANIZATION WORKSPACE */}
        {showOrganizationWorkspace && (!isCollapsed && (
          <div className="px-6 pt-6 pb-4">
            <OrganizationSelector
              organizations={organizations}
              selectedOrganizationSlug={selectedOrganizationSlug}
              onOrganizationChange={(orgSlug) => {
                setSelectedOrganizationSlug(orgSlug)
                router.push(`/o/${orgSlug}`)
              }}
              className="w-full"
            />
          </div>
        ))}

        {/* Separator if visible */}
        {showOrganizationWorkspace && !isCollapsed && <div className="mx-6 border-b border-slate-100 mb-4" />}


        {/* Navigation Segments */}
        <nav className="flex-1 px-3 space-y-1 mt-2">

          {/* 2. DASHBOARD */}
          {showDashboard && (
            <div className="mb-2">
              {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dashboard</h3>}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={clientSlug ? `${baseUrl}/c/${clientSlug}` : baseUrl}
                        className={`flex-1 flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${(pathname.includes('/c/') || pathname.endsWith('/c')) && !projectSlug
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <Briefcase className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} text-slate-500`} />
                        {!isCollapsed && <span>Projects</span>}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Projects</TooltipContent>
                  </Tooltip>

                  {/* Projects Logic: Only Show Chevron if Project is Active */}
                  {!isCollapsed && projectSlug && (
                    <button
                      onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isProjectsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Collapsible Project Tabs */}
                {!isCollapsed && projectSlug && isProjectsOpen && (
                  <div className="ml-9 flex flex-col gap-1 border-l-2 border-slate-100 pl-2 mt-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                    {/* Files */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=files`}
                          className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes(projectSlug) && (pathname.includes('tab=files') || !pathname.includes('tab=')) /* Default */
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                          <Folder className="h-3.5 w-3.5 mr-2" />
                          Files
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Files</TooltipContent>
                    </Tooltip>

                    {/* Members */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=members`}
                          className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=members')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                          <Users className="h-3.5 w-3.5 mr-2" />
                          Members
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Members</TooltipContent>
                    </Tooltip>

                    {/* Shares */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=shares`}
                          className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=shares')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-2" />
                          Shares
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Shares</TooltipContent>
                    </Tooltip>

                    {/* Insights */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=insights`}
                          className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=insights')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                          <BarChart3 className="h-3.5 w-3.5 mr-2" />
                          Insights
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Insights</TooltipContent>
                    </Tooltip>

                    {/* Sources */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`${baseUrl}/c/${clientSlug}/p/${projectSlug}?tab=sources`}
                          className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=sources')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                          <Database className="h-3.5 w-3.5 mr-2" />
                          Sources
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Sources</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          )}

          {showDashboard && !isCollapsed && <div className="mx-3 border-b border-slate-100 my-2" />}

          {/* 3. RESOURCES */}
          {showResources && (
            <div className="mb-2">
              {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Resources</h3>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
                  >
                    <BookOpen className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} text-slate-500`} />
                    {!isCollapsed && <span>User Guide</span>}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">User Guide</TooltipContent>
              </Tooltip>
            </div>
          )}

          {showResources && !isCollapsed && <div className="mx-3 border-b border-slate-100 my-2" />}

          {/* 4. SETTINGS */}
          {showSettings && (
            <div className="mb-2">
              {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Settings</h3>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`${baseUrl}/connectors`}
                    className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${pathname.includes('/connectors')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Settings className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} text-slate-500`} />
                    {!isCollapsed && <span>Connectors</span>}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Connectors</TooltipContent>
              </Tooltip>
            </div>
          )}

          {showSettings && !isCollapsed && <div className="mx-3 border-b border-slate-100 my-2" />}

          {/* 5. MORE (Collapsed) */}
          {showMore && (
            <div>
              {!isCollapsed ? (
                <div>
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className="flex items-center w-full px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                  >
                    <span>More</span>
                    <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${isMoreOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isMoreOpen && (
                    <div className="mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`${baseUrl}/insights`}
                            className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${pathname.includes('/insights')
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                          >
                            <LayoutDashboard className={`h-4 w-4 mr-3 text-slate-500`} />
                            <span>Insights</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">Insights</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`${baseUrl}/insights`}
                      className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${pathname.includes('/insights')
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      title=""
                    >
                      <LayoutDashboard className={`h-4 w-4 mx-auto text-slate-500`} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Insights</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

        </nav>

        {/* Bottom Section - User Profile */}
        {!isCollapsed && (
          <div className="p-4 mt-auto border-t border-slate-100" ref={profileRef}>
            <div className="relative">
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
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {/* Profile Dropdown - same popup style as project cards */}
              {isProfileOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-[100]">
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
