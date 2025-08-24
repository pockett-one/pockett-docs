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
  
  // Smart path display: show first 2 and last 1 segments for long paths
  const getDisplaySegments = () => {
    if (pathSegments.length <= 3) {
      return pathSegments.map((segment, index) => ({ segment, originalIndex: index }))
    }
    
    // For paths longer than 3 segments, show: My Documents > Finance > ... > Reports
    const firstSegments = pathSegments.slice(0, 2).map((segment, index) => ({ segment, originalIndex: index }))
    const lastSegment = { segment: pathSegments[pathSegments.length - 1], originalIndex: pathSegments.length - 1 }
    
    return [...firstSegments, { segment: '...', originalIndex: -1 }, lastSegment]
  }
  
  const displaySegments = getDisplaySegments()
  
  return (
    <div 
      className={`flex items-center space-x-1 mt-1 ${className}`}
      title={pathSegments.length > 3 ? `Full path: ${pathSegments.join(' > ')}` : undefined}
    >
      <FolderOpen className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
      <div className="flex items-center space-x-0.5 min-w-0 overflow-hidden">
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
                className="text-gray-400 hover:text-blue-600 hover:underline transition-all duration-150 text-xs truncate max-w-16 bg-gray-50 hover:bg-blue-50 px-1 py-0.5 rounded border border-transparent hover:border-blue-200"
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
