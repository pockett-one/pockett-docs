"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, FileText, FolderOpen, Search, Users } from "lucide-react"

export interface SearchResult {
  id: string
  type: string
  name: string
  description?: string
  matchedFields: string[]
  highlights: { field: string; value: string; indices: number[] }[]
  metadata?: Record<string, any>
}

interface SearchDropdownProps {
  isOpen: boolean
  searchQuery: string
  results: SearchResult[]
  onSelectResult?: (result: SearchResult) => void
  onClose: () => void
  onShowMore?: () => void
  totalResults?: number
}

export default function SearchDropdown({
  isOpen,
  searchQuery,
  results,
  onSelectResult,
  onClose,
  onShowMore,
  totalResults
}: SearchDropdownProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleOpenInGoogleDrive = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation()
    // Extract Google Drive ID from metadata or construct URL
    const driveId = result.metadata?.driveId || result.id
    const driveUrl = `https://drive.google.com/file/d/${driveId}/view`
    window.open(driveUrl, '_blank')
  }

  const handleSelectResult = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result)
    } else {
      // Default navigation to documents page with search
      router.push(`/demo/app/documents?search=${encodeURIComponent(result.name)}`)
    }
    onClose()
  }

  const handleSearchAll = () => {
    router.push(`/demo/app/documents?search=${encodeURIComponent(searchQuery)}`)
    onClose()
  }

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore()
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-100 px-0.5 rounded font-medium">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  const getResultIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'folder':
        return <FolderOpen className="h-4 w-4 text-green-500" />
      case 'insight':
      case 'insight_card':
        return <Search className="h-4 w-4 text-purple-500" />
      case 'metric':
        return <Search className="h-4 w-4 text-indigo-500" />
      case 'shared_document':
        return <FileText className="h-4 w-4 text-orange-500" />
      case 'shared_folder':
        return <FolderOpen className="h-4 w-4 text-green-500" />
      case 'contributor':
        return <Users className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
        return 'Document'
      case 'folder':
        return 'Folder'
      case 'insight':
      case 'insight_card':
        return 'Insight'
      case 'metric':
        return 'Metric'
      case 'shared_document':
        return 'Shared Doc'
      case 'shared_folder':
        return 'Folder'
      case 'contributor':
        return 'Contributor'
      default:
        return 'Item'
    }
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {results.length === 0 ? (
        <div className="p-4 text-center border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-3">
            No results found for &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={handleSearchAll}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            <Search className="h-3 w-3 mr-1" />
            Search all documents
          </button>
        </div>
      ) : (
        <>
          {/* Results */}
          <div className="py-1">
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 group"
                onClick={() => handleSelectResult(result)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getResultIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {highlightText(result.name, searchQuery)}
                      </p>
                      <div className="flex items-center space-x-2">
                        {/* Relevance indicator */}
                        {result.matchedFields && result.matchedFields.length > 0 && (
                          <span className="text-xs text-blue-600 font-medium">
                            {result.matchedFields.includes('semantic') ? 'AI Match' : 
                             result.matchedFields.includes('name') ? 'Name' : 
                             result.matchedFields.includes('path') ? 'Path' : 
                             result.matchedFields.includes('folder') ? 'Folder' : 'Matched'}
                          </span>
                        )}
                        {/* Match percentage - always show */}
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          {result.metadata?.semanticScore || result.metadata?.score || 0}%
                        </span>
                        {/* Semantic reasoning */}
                        {result.metadata?.semanticReason && (
                          <span className="text-xs text-purple-600 font-medium" title={result.metadata.semanticReason}>
                            {result.metadata.semanticReason.length > 20 
                              ? result.metadata.semanticReason.substring(0, 20) + '...' 
                              : result.metadata.semanticReason}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Additional info for different types */}
                    {result.type === 'insight_card' && result.metadata?.tabs && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {result.metadata.tabs}
                      </p>
                    )}
                    {(result.type === 'document' || result.type === 'shared_document') && (result.metadata?.path || result.metadata?.folder) && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {result.metadata.path || `/${result.metadata.folder}`}
                      </p>
                    )}
                    {(result.type === 'folder' || result.type === 'shared_folder') && result.metadata?.path && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {result.metadata.path}
                      </p>
                    )}
                    {(result.type === 'folder' || result.type === 'shared_folder') && result.metadata?.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {result.metadata.description}
                      </p>
                    )}

                  </div>

                  {/* Google Drive button - only show on hover */}
                  <button
                    onClick={(e) => handleOpenInGoogleDrive(result, e)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-all"
                    title="Open in Google Drive"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            
            {(totalResults || results.length) > results.length && (
              <div className="px-4 py-2 text-center border-t border-gray-100">
                <button
                  onClick={handleShowMore}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show more
                </button>
              </div>
            )}
          </div>

          {/* Footer with search all option */}
          {results.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <button
                onClick={handleSearchAll}
                className="w-full text-left flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Search className="h-3 w-3" />
                <span>Search all documents for &quot;{searchQuery}&quot;</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
