"use client"

import { Sidebar } from "@/components/navigation/sidebar"
import { TopBar } from "@/components/ui/top-bar"

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
  }
}

export function AppLayout({ children, showTopBar = true, topBarProps = {} }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {showTopBar && <TopBar {...topBarProps} />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
