"use client"

import { ChevronRight, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FolderPathBreadcrumbProps {
  path: string
  className?: string
}

export function FolderPathBreadcrumb({ path, className = "" }: FolderPathBreadcrumbProps) {
  const router = useRouter()
  
  // Parse the path (e.g., "/My Documents/Finance/Reports" -> ["My Documents", "Finance", "Reports"])
  const pathSegments = path.split('/').filter(segment => segment.trim() !== '')
  
  if (pathSegments.length === 0) {
    return null
  }
  
  // Don't show breadcrumb if it's just "My Documents" (root level)
  if (pathSegments.length === 1 && pathSegments[0] === 'My Documents') {
    return null
  }
  
  // Don't show breadcrumb if it's just the root path "/"
  if (path === '/' || path === '/My Documents') {
    return null
  }
  
  // Don't show breadcrumb for empty or invalid paths
  if (!path || path.trim() === '') {
    return null
  }
  
  const handleFolderClick = (folderName: string, index: number) => {
    // Navigate to the documents page with the folder context
    // For now, we'll navigate to the documents page and could filter by folder
    router.push(`/demo/app/documents?folder=${encodeURIComponent(folderName)}`)
  }
  
  return (
    <div className={`flex items-center space-x-1 mt-1 ${className}`}>
      <FolderOpen className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
      <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
        {pathSegments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-1 flex-shrink-0">
            {index > 0 && (
              <ChevronRight className="h-2.5 w-2.5 text-gray-300 flex-shrink-0" />
            )}
            <button
              onClick={() => handleFolderClick(segment, index)}
              className="text-gray-400 hover:text-blue-600 hover:underline transition-all duration-150 text-xs truncate max-w-20 bg-gray-50 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-transparent hover:border-blue-200"
              title={segment}
            >
              {segment}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
