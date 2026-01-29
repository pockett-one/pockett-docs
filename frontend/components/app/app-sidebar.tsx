"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Settings,
  User,
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
import { ClientSelector } from "@/components/projects/client-selector"
import { AddClientModal } from "@/components/projects/add-client-modal"
import { type HierarchyClient, getOrganizationHierarchy } from "@/lib/actions/hierarchy"
import { getOrganizationRole } from "@/lib/actions/organization"
import { ROLES } from "@/lib/roles"

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Client Selector State
  const [clients, setClients] = useState<HierarchyClient[]>([])
  const [selectedClientSlug, setSelectedClientSlug] = useState<string>('')

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

  const getUserInitials = () => {
    const name = getUserDisplayName()
    if (name.includes('@')) return name.charAt(0).toUpperCase()
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    return name.charAt(0).toUpperCase()
  }

  // Extract slug
  const getSlug = () => {
    const match = pathname.match(/^\/o\/([^\/]+)/)
    return match ? match[1] : null
  }
  const slug = getSlug()
  // Extract Project Slug
  const getProjectSlug = () => {
    const match = pathname.match(/\/p\/([^\/]+)/)
    return match ? match[1] : null
  }
  const projectSlug = getProjectSlug()

  const baseUrl = slug ? `/o/${slug}` : '/dash'

  // Fetch Data (Clients & Role)
  const fetchData = async () => {
    if (slug) {
      try {
        const [hierarchyData, roleData] = await Promise.all([
          getOrganizationHierarchy(slug),
          getOrganizationRole(slug)
        ])
        setClients(hierarchyData)
        setRole(roleData)
      } catch (error) {
        console.error("Failed to fetch sidebar data", error)
      }
    }
  }

  useEffect(() => {
    fetchData()

    const handleRefresh = () => fetchData()
    window.addEventListener('pockett:refresh-clients', handleRefresh)

    return () => {
      window.removeEventListener('pockett:refresh-clients', handleRefresh)
    }
  }, [slug])

  // Determine active client from URL or LocalStorage
  useEffect(() => {
    const match = pathname.match(/\/c\/([^\/]+)/)
    if (match && match[1]) {
      setSelectedClientSlug(match[1])
    } else if (slug) {
      // Try to restore from local storage
      const saved = localStorage.getItem(`pockett-last-client-${slug}`)
      if (saved) setSelectedClientSlug(saved)
    }
  }, [pathname, slug])

  // Save to local storage when changed
  useEffect(() => {
    if (slug && selectedClientSlug) {
      localStorage.setItem(`pockett-last-client-${slug}`, selectedClientSlug)
    }
  }, [slug, selectedClientSlug])


  // --- RBAC HELPER ---
  const isOwner = role === ROLES.ORG_OWNER
  const isMember = role === ROLES.ORG_MEMBER
  const isGuest = role === ROLES.ORG_GUEST

  // Rules
  const showClientWorkspace = isOwner || isMember
  const showDashboard = true // Everyone sees dashboard/projects? (Org Owner, Member, Guest with access)
  const showResources = true // User Guide for everyone
  const showSettings = isOwner // Connectors
  const showMore = isOwner || isMember // Insights

  return (
    <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 pt-16 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">

        {/* 1. CLIENT WORKSPACE */}
        {showClientWorkspace && (!isCollapsed && (
          <div className="px-6 pt-6 pb-4">
            {/* Label updated: removed SELECT */}
            {/* <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Client Workspace</h3> */}
            {/* Client Selector has its own label, we can reuse it or hide it. 
                 The current ClientSelector has a hardcoded label "Select Client Workspace".
                 I should probably pass a prop to override it or accept the user request 
                 "Updates needed - update label ; remove the word SELECT" in the COMPONENT itself.
                 For now, I'll rely on the component update I can do later or assume I change it globally.
                 Wait, I can edit ClientSelector too.
                 Let's place it here.
             */}
            <ClientSelector
              clients={clients}
              selectedClientSlug={selectedClientSlug}
              onClientChange={(clientSlug) => {
                setSelectedClientSlug(clientSlug)
                if (slug) router.push(`/o/${slug}/c/${clientSlug}`)
              }}
              className="w-full"
            />

            {/* Add Client Button - Only for Org Owners */}
            {isOwner && slug && (
              <div className="mt-3">
                <AddClientModal
                  orgSlug={slug}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                      <Plus className="h-4 w-4" />
                      Add Client
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        ))}

        {/* Separator if visible */}
        {showClientWorkspace && !isCollapsed && <div className="mx-6 border-b border-slate-100 mb-4" />}


        {/* Navigation Segments */}
        <nav className="flex-1 px-3 space-y-1 mt-2">

          {/* 2. DASHBOARD */}
          {showDashboard && (
            <div className="mb-2">
              {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dashboard</h3>}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Link
                    href={selectedClientSlug ? `${baseUrl}/c/${selectedClientSlug}` : `${baseUrl}/c`}
                    className={`flex-1 flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${(pathname.includes('/c/') || pathname.endsWith('/c')) && !projectSlug
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Briefcase className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} text-slate-500`} />
                    {!isCollapsed && <span>Projects</span>}
                  </Link>
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
                    <Link
                      href={`${baseUrl}/c/${selectedClientSlug}/p/${projectSlug}?tab=files`}
                      className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes(projectSlug) && (pathname.includes('tab=files') || !pathname.includes('tab=')) /* Default */
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <Folder className="h-3.5 w-3.5 mr-2" />
                      Files
                    </Link>
                    {/* Sharing */}
                    <Link
                      href={`${baseUrl}/c/${selectedClientSlug}/p/${projectSlug}?tab=sharing`}
                      className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=sharing')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-2" />
                      Sharing
                    </Link>
                    {/* Insights */}
                    <Link
                      href={`${baseUrl}/c/${selectedClientSlug}/p/${projectSlug}?tab=insights`}
                      className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=insights')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <BarChart3 className="h-3.5 w-3.5 mr-2" />
                      Insights
                    </Link>
                    {/* Data Sources */}
                    <Link
                      href={`${baseUrl}/c/${selectedClientSlug}/p/${projectSlug}?tab=sources`}
                      className={`flex items-center text-xs font-medium rounded-md px-2 py-1.5 ${pathname.includes('tab=sources')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <Database className="h-3.5 w-3.5 mr-2" />
                      Data Sources
                    </Link>
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
              <Link
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
              >
                <BookOpen className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} text-slate-500`} />
                {!isCollapsed && <span>User Guide</span>}
              </Link>
            </div>
          )}

          {showResources && !isCollapsed && <div className="mx-3 border-b border-slate-100 my-2" />}

          {/* 4. SETTINGS */}
          {showSettings && (
            <div className="mb-2">
              {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Settings</h3>}
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
                    </div>
                  )}
                </div>
              ) : (
                // In collapsed sidebar, show icon directly? Or hide?
                // User said "collapsed", but if sidebar is collapsed, we usually show icons.
                // I will show the Insights icon if collapsed, or maybe put it in a menu. 
                // Let's just show the icon for simplicity.
                <Link
                  href={`${baseUrl}/insights`}
                  className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${pathname.includes('/insights')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  title="Insights"
                >
                  <LayoutDashboard className={`h-4 w-4 mx-auto text-slate-500`} />
                </Link>
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
                <div className="h-9 w-9 bg-slate-900 rounded-full text-white flex items-center justify-center text-sm font-medium shadow-sm border border-white ring-2 ring-slate-100 flex-shrink-0">
                  {getUserInitials()}
                </div>
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

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => signOut()}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
