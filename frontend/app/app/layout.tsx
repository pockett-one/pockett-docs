"use client"

import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  
  // Public routes that don't need authentication
  const publicRoutes = ['/app/signin', '/app/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <AppTopbar />
        
        <div className="flex">
          {/* Sidebar */}
          <AppSidebar />
          
          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${
            isCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppLayoutContent>
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  )
}
