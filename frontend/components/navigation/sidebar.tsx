"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  FolderOpen, 
  Settings, 
  BarChart3, 
  Users, 
  Share2, 
  Plus,
  ChevronDown,
  User,
  CheckCircle,
  AlertCircle,
  Plug
} from "lucide-react"

interface Connection {
  id: string
  name: string
  status: 'connected' | 'error' | 'disconnected'
  icon: string
  color: string
  documentCount?: number
}

const connections: Connection[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    status: "connected",
    icon: "G",
    color: "bg-blue-600",
    documentCount: 1247
  },
  {
    id: "box",
    name: "Box",
    status: "disconnected", 
    icon: "B",
    color: "bg-blue-700"
  },
  {
    id: "dropbox",
    name: "Dropbox",
    status: "disconnected",
    icon: "D", 
    color: "bg-blue-500"
  }
]

const navigationItems = [
  {
    href: "/dashboard",
    label: "Documents",
    icon: FolderOpen,
    description: "Browse and manage your documents"
  },
  {
    href: "/dashboard?tab=engagement", 
    label: "Engagement",
    icon: BarChart3,
    description: "View document activity and analytics"
  },
  {
    href: "/dashboard?tab=shared",
    label: "Shared",
    icon: Share2,
    description: "Manage shared documents and permissions"
  },
  {
    href: "/dashboard?tab=contributors",
    label: "Contributors", 
    icon: Users,
    description: "View team collaboration insights"
  },
  {
    href: "/setup",
    label: "Connectors",
    icon: Settings,
    description: "Manage your document connections"
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [connectionsExpanded, setConnectionsExpanded] = useState(true)

  const getConnectionStatusIcon = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getConnectionStatusText = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      case 'disconnected':
        return 'Not connected'
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-semibold text-gray-900">Pockett</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Navigation
          </div>
          
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href.includes('?tab=') && pathname === '/dashboard')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Connections Section */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setConnectionsExpanded(!connectionsExpanded)}
            className="flex items-center justify-between w-full text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 hover:text-gray-700"
          >
            <span>Connections</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${connectionsExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {connectionsExpanded && (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${connection.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                      {connection.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                      <div className="flex items-center space-x-1">
                        {getConnectionStatusIcon(connection.status)}
                        <span className="text-xs text-gray-500">
                          {getConnectionStatusText(connection.status)}
                        </span>
                      </div>
                      {connection.documentCount && (
                        <div className="text-xs text-gray-500">
                          {connection.documentCount.toLocaleString()} documents
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <Link href="/setup">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">Demo User</div>
            <div className="text-xs text-gray-500">demo@example.com</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
