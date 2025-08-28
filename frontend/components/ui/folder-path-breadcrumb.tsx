"use client"

import { ChevronRight, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FolderPathBreadcrumbProps {
  path: string
  className?: string
}

export function FolderPathBreadcrumb({ path, className = "" }: FolderPathBreadcrumbProps) {
  const router = useRouter()
  
  const handleFolderClick = (folderName: string, index: number) => {
    // Navigate to the documents page with the folder context
    // For now, we'll navigate to the documents page and could filter by folder
            router.push(`/demo/documents?folder=${encodeURIComponent(folderName)}`)
  }
  
  // Parse the path (e.g., "/My Documents/Finance/Reports" -> ["My Documents", "Finance", "Reports"])
  const pathSegments = path.split('/').filter(segment => segment.trim() !== '')
  
  if (pathSegments.length === 0) {
    return null
  }
  
  // Don't show breadcrumb for empty or invalid paths
  if (!path || path.trim() === '') {
    return null
  }
  
  // For root-level files (no folder hierarchy), show "My Documents"
  if (pathSegments.length === 0 || path === '/' || path === '/My Documents') {
    return (
      <div className={`flex items-center space-x-1 mt-1 ${className}`}>
        <FolderOpen className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
        <button
          onClick={() => handleFolderClick('My Documents', 0)}
          className="text-gray-400 hover:text-blue-600 hover:underline transition-all duration-150 text-xs bg-gray-50 hover:bg-blue-50 px-1 py-0.5 rounded border border-gray-300 hover:border-blue-400"
          title="My Documents"
        >
          My Documents
        </button>
      </div>
    )
  }
  
  // Smart path display: show more segments for better navigation
  const getDisplaySegments = () => {
    if (pathSegments.length <= 4) {
      return pathSegments.map((segment, index) => ({ segment, originalIndex: index }))
    }
    
    // For paths longer than 4 segments, show: My Documents > Finance > ... > Reports
    const firstSegments = pathSegments.slice(0, 2).map((segment, index) => ({ segment, originalIndex: index }))
    const lastSegments = pathSegments.slice(-2).map((segment, index) => ({ 
      segment, 
      originalIndex: pathSegments.length - 2 + index 
    }))
    
    return [...firstSegments, { segment: '...', originalIndex: -1 }, ...lastSegments]
  }
  
  const displaySegments = getDisplaySegments()
  
  return (
    <div 
      className={`flex items-center space-x-1 mt-1 ${className}`}
      title={`Full path: ${pathSegments.join(' > ')}`}
    >
      <FolderOpen className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
      <div className="flex items-center space-x-0.5 min-w-0 overflow-x-auto scrollbar-hide">
        {displaySegments.map((item, index) => (
          <div key={index} className="flex items-center space-x-0.5 flex-shrink-0">
            {index > 0 && (
              <ChevronRight className="h-2.5 w-2.5 text-gray-300 flex-shrink-0" />
            )}
            {item.segment === '...' ? (
              <span className="text-gray-400 text-xs px-0.5">...</span>
            ) : (
              <button
                onClick={() => handleFolderClick(item.segment, item.originalIndex)}
                className="text-gray-400 hover:text-blue-600 hover:underline transition-all duration-150 text-xs bg-gray-50 hover:bg-blue-50 px-1 py-0.5 rounded border border-gray-300 hover:border-blue-400 min-w-0"
                title={item.segment}
              >
                {item.segment}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
