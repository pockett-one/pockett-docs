'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { Search, Folder, Sparkles, Clock, CornerDownLeft, ArrowUpDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DocumentIcon } from '@/components/ui/document-icon'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useProjectSearch } from './project-search-context'
import type { DriveFile } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'

function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>
  const escaped = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-indigo-100 text-indigo-900 font-medium rounded-[2px] px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
}

function getMatchTypePillLabel(matchType?: string): string {
  switch (matchType) {
    case 'keyword':
      return 'Keyword'
    case 'name':
      return 'Filename'
    case 'semantic':
      return 'Semantic'
    default:
      return 'Match'
  }
}

export interface ProjectSearchPanelProps {
  projectId: string
  generalFolderId: string | null
  confidentialFolderId: string | null
  stagingFolderId: string | null
  navigateToItem: (file: DriveFile) => Promise<void>
  onClose?: () => void
}

export function ProjectSearchPanel({
  generalFolderId,
  confidentialFolderId,
  stagingFolderId,
  navigateToItem,
  onClose,
}: ProjectSearchPanelProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    closeSearchPanel,
    recentSearches,
    clearRecentSearches,
    searchRootLabel,
  } = useProjectSearch()
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  const handleClose = useCallback(() => {
    onClose?.()
    closeSearchPanel()
  }, [onClose, closeSearchPanel])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [handleClose])

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => (i < searchResults.length - 1 ? i + 1 : i))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1))
      } else if (e.key === 'Enter' && highlightedIndex >= 0 && searchResults[highlightedIndex]) {
        e.preventDefault()
        handleSelect(searchResults[highlightedIndex])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [highlightedIndex, searchResults])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [searchQuery, searchResults.length])

  const getLocationLabel = (file: DriveFile) => {
    if (!file.parents?.length) return 'Project'
    if (generalFolderId && file.parents.includes(generalFolderId)) return 'General'
    if (confidentialFolderId && file.parents.includes(confidentialFolderId)) return 'Confidential'
    if (stagingFolderId && file.parents.includes(stagingFolderId)) return 'Staging'
    return 'Project'
  }

  const handleSelect = async (file: DriveFile) => {
    await navigateToItem(file)
    handleClose()
  }

  const handleRecentClick = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-0 bg-slate-50/50">
        {/* Search input - full width, rounded, light grey */}
        <div className="shrink-0 p-3 pb-2">
          <label htmlFor="project-search-panel-input" className="sr-only">
            Search project files
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
            <Input
              id="project-search-panel-input"
              name="project-search-panel"
              placeholder="Search for files, folders, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 bg-white border-slate-200 rounded-xl text-sm shadow-sm placeholder:text-slate-400"
              autoFocus
              aria-label="Search project files"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 flex items-center gap-0.5" title="Press Enter to select">
              <CornerDownLeft className="h-3 w-3" />
            </span>
          </div>
          {searchRootLabel && (
            <p className="text-[10px] text-slate-500 mt-1 px-0.5" aria-live="polite">
              Searching in <span className="font-medium text-slate-600">{searchRootLabel}</span>
            </p>
          )}
        </div>

        {/* Scrollable content: Recent Search + File results */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2">
          {/* Recent Search */}
          {recentSearches.length > 0 && searchQuery.trim().length < 2 && (
            <section className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Recent Search</span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[10px] text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-0.5">
                {recentSearches.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => handleRecentClick(q)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm text-slate-700 hover:bg-white hover:shadow-sm transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* File results */}
          {searchQuery.trim().length >= 2 && (
            <section>
              {searchResults.length > 0 ? (
                <>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                    File
                  </span>
                  <ul ref={listRef} className="space-y-0.5">
                    {searchResults.map((file, index) => (
                      <li key={file.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(file)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-start gap-3 group border border-transparent',
                            highlightedIndex === index
                              ? 'bg-white shadow-sm border-slate-200'
                              : 'hover:bg-white hover:shadow-sm hover:border-slate-200'
                          )}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {file.mimeType === 'application/vnd.google-apps.folder' ? (
                              <Folder className="h-4 w-4 text-purple-500 fill-purple-100" />
                            ) : (
                              <DocumentIcon mimeType={file.mimeType} className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800 truncate group-hover:text-slate-900">
                                <HighlightText text={file.name} highlight={searchQuery} />
                              </span>
                              {/* Qualifier pills */}
                              <span className="inline-flex items-center gap-1 shrink-0 flex-wrap">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                                  #{getMatchTypePillLabel(file.matchType)}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                                  {getLocationLabel(file)}
                                </span>
                                {file.matchType === 'semantic' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        Semantic
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                                      Matched by meaning, using file name and summary
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              {formatRelativeTime(file.modifiedTime)}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : !isSearching ? (
                <div className="py-8 text-center">
                  <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">No results found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    No files match &quot;{searchQuery}&quot; in this project.
                  </p>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-10 w-10 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Sparkles className="h-4 w-4 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Scanning with AI context...</p>
                </div>
              )}
            </section>
          )}

          {searchQuery.trim().length < 2 && !recentSearches.length && (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-500">Type at least 2 characters to search.</p>
            </div>
          )}
        </div>

        {/* Sticky footer - keyboard shortcuts */}
        <div className="shrink-0 px-3 py-2.5 bg-slate-100/80 border-t border-slate-200 rounded-b-xl flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-600 shadow-sm">
            <CornerDownLeft className="h-3 w-3" />
            Select
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-600 shadow-sm">
            <ArrowUpDown className="h-3 w-3" />
            Move
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-200/80 text-[10px] font-medium text-slate-700">
            <X className="h-3 w-3" />
            Exit
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
