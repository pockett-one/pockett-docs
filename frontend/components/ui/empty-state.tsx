"use client"

import { Button } from "@/components/ui/button"
import { FileX, Users, Database, Link as LinkIcon } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  type: 'documents' | 'overview' | 'analytics' | 'shared' | 'contributors'
  title?: string
  description?: string
}

export function EmptyState({ type, title, description }: EmptyStateProps) {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'documents':
        return {
          icon: FileX,
          title: title || "No Documents Available",
          description: description || "Connect your cloud storage to view and manage documents.",
          actionText: "Connect Google Drive"
        }
      case 'overview':
        return {
          icon: Database,
          title: title || "No Data to Display",
          description: description || "Connect your cloud storage to view analytics and insights.",
          actionText: "Connect Google Drive"
        }
      case 'analytics':
        return {
          icon: Database,
          title: title || "No Analytics Data",
          description: description || "Connect your cloud storage to view detailed analytics and visualizations.",
          actionText: "Connect Google Drive"
        }
      case 'shared':
        return {
          icon: FileX,
          title: title || "No Shared Documents",
          description: description || "Connect your cloud storage to view shared documents and permissions.",
          actionText: "Connect Google Drive"
        }
      case 'contributors':
        return {
          icon: Users,
          title: title || "No Collaboration Data",
          description: description || "Connect your cloud storage to view team collaboration insights.",
          actionText: "Connect Google Drive"
        }
      default:
        return {
          icon: LinkIcon,
          title: title || "No Connection",
          description: description || "Connect your cloud storage to get started.",
          actionText: "Connect Service"
        }
    }
  }

  const config = getEmptyStateConfig()
  const IconComponent = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <IconComponent className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {config.title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md">
        {config.description}
      </p>
      
              <Link href="/demo/connectors">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <LinkIcon className="h-4 w-4 mr-2" />
          {config.actionText}
        </Button>
      </Link>
    </div>
  )
}
