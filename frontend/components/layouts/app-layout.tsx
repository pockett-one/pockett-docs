"use client"

import { Sidebar } from "@/components/navigation/sidebar"
import { TopBar } from "@/components/ui/top-bar"
import { NavigationLoader } from "@/components/ui/navigation-loader"

interface AppLayoutProps {
  children: React.ReactNode
  showTopBar?: boolean
  topBarProps?: {
    searchQuery?: string
    onSearchChange?: (query: string) => void
    // New props for local search
    searchableData?: any[]
    searchFields?: string[]
    onLocalResults?: (results: any[], query: string) => void
    enableLocalSearch?: boolean
    placeholder?: string
    showGlobalSearchOption?: boolean
    // Tour functionality props
    onStartTour?: () => void
    showTourButton?: boolean
    tourButtonText?: string
  }
}

export function AppLayout({ children, showTopBar = true, topBarProps = {} }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {showTopBar && <TopBar {...topBarProps} />}
        <main className="flex-1 overflow-auto">
          <NavigationLoader>
            {children}
          </NavigationLoader>
        </main>
      </div>
    </div>
  )
}
