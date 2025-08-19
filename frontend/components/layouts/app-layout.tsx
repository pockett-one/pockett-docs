"use client"

import { Sidebar } from "@/components/navigation/sidebar"
import { TopBar } from "@/components/ui/top-bar"

interface AppLayoutProps {
  children: React.ReactNode
  showTopBar?: boolean
  topBarProps?: {
    searchQuery?: string
    onSearchChange?: (query: string) => void
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
