"use client"

import { useState } from "react"
import { ExternalLink, HardDrive, Filter, ChevronDown, Check, X } from "lucide-react"
import { DocumentIcon } from "@/components/ui/document-icon"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { cn, formatRelativeTime, getFileTypeLabel } from "@/lib/utils"
import { DriveFile } from "@/lib/types"

interface DocumentListCardProps {
    title: string
    icon: React.ReactNode
    files: DriveFile[]
    limit?: number
    onLimitChange?: (limit: number) => void
    headerContent?: React.ReactNode
    className?: string
    enableFilter?: boolean
}

export function DocumentListCard({
    title,
    icon,
    files,
    limit,
    onLimitChange,
    headerContent,
    className,
    enableFilter = true
}: DocumentListCardProps) {
    // Get unique types from current files (Derived first for state init)
    const availableTypes = Array.from(new Set(files.map(f => getFileTypeLabel(f.mimeType)))).sort()

    const [filterTypes, setFilterTypes] = useState<string[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [hasInitialized, setHasInitialized] = useState(false)

    // Initialize with All Selected once availableTypes are ready
    if (!hasInitialized && availableTypes.length > 0) {
        setFilterTypes(availableTypes)
        setHasInitialized(true)
    }

    // Filter logic
    const filteredFiles = filterTypes.length > 0
        ? files.filter(f => filterTypes.includes(getFileTypeLabel(f.mimeType)))
        : [] // Empty filter = Show None

    // Toggle logic
    const toggleFilter = (type: string) => {
        setFilterTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const isAllSelected = availableTypes.length > 0 && filterTypes.length === availableTypes.length
    const isNoneSelected = filterTypes.length === 0
    const isIndeterminate = !isAllSelected && !isNoneSelected

    return (
        <div className={cn("bg-white border border-gray-200 rounded-2xl shadow-sm relative", className)}>
            {/* Backdrop for simple dropdown closing */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
            )}

            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl relative z-20">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {icon}
                        <h3 className="text-base font-bold text-gray-900 whitespace-nowrap">{title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dynamic Filter Dropdown */}
                        {enableFilter && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                                >
                                    <Filter className="h-3 w-3 flex-shrink-0" />
                                    <span>Filter</span>
                                    {!isAllSelected && !isNoneSelected && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                                    )}
                                    <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isFilterOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Type</span>
                                            <button
                                                onClick={() => setIsFilterOpen(false)}
                                                className="text-[10px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-2 py-0.5 rounded transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            <button
                                                onClick={() => {
                                                    if (isAllSelected) {
                                                        setFilterTypes([]) // Unselect All
                                                    } else {
                                                        setFilterTypes(availableTypes) // Select All
                                                    }
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 group"
                                            >
                                                <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllSelected || isIndeterminate
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white border-gray-300'
                                                    }`}>
                                                    {isAllSelected && <Check className="h-3 w-3 text-white" />}
                                                    {isIndeterminate && <div className="h-0.5 w-2 bg-white rounded-full" />}
                                                </div>
                                                <span className="font-medium text-gray-900">All Files</span>
                                            </button>
                                            {availableTypes.map(type => {
                                                const isSelected = filterTypes.includes(type)
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent closing
                                                            toggleFilter(type);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 group transition-colors"
                                                    >
                                                        {/* Checkbox Representation */}
                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'bg-white border-gray-300 group-hover:border-blue-400'
                                                            }`}>
                                                            {isSelected && (
                                                                <>
                                                                    <Check className="h-3 w-3 text-white group-hover:hidden" />
                                                                    <X className="h-3 w-3 text-white hidden group-hover:block" />
                                                                </>
                                                            )}
                                                        </div>

                                                        <span className={isSelected ? "font-medium text-gray-900" : ""}>{type}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {onLimitChange && limit && (
                            <div className="relative inline-block">
                                <select
                                    value={limit}
                                    onChange={(e) => onLimitChange(Number(e.target.value))}
                                    className="appearance-none pl-2 pr-7 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-100 transition-all shadow-sm"
                                >
                                    <option value={5}>Show 5</option>
                                    <option value={10}>Show 10</option>
                                    <option value={20}>Show 20</option>
                                    <option value={50}>Show 50</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Header Content (e.g. Insights) */}
                {headerContent}
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto custom-scrollbar relative z-0">
                {filteredFiles.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 text-sm">
                        {files.length === 0 ? 'No documents found.' : `No matching files found.`}
                    </div>
                ) : (
                    filteredFiles.map((file) => (
                        <div key={file.id} className="group relative flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-all">

                            {/* Icon */}
                            <div className="flex-shrink-0">
                                <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm group-hover:border-gray-200 transition-colors">
                                    <DocumentIcon mimeType={file.mimeType} className="h-6 w-6" />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate pr-8" title={file.name}>
                                        {file.name}
                                    </h4>

                                    {/* Action Menu */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2">
                                        <DocumentActionMenu document={file} />
                                    </div>
                                </div>

                                <div className="flex items-center flex-nowrap overflow-hidden gap-2 mt-1.5 min-w-0">
                                    {/* Source Pill */}
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100 text-[11px] font-medium min-w-0 flex-shrink max-w-[180px]" title={file.source || 'Drive'}>
                                        <HardDrive className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                        <span className="truncate">{file.source || 'Google Drive'}</span>
                                    </span>

                                    <span className="text-gray-300 text-[10px] flex-shrink-0">•</span>

                                    {/* Time */}
                                    <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                                        Modified {formatRelativeTime(file.modifiedTime)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
                <div className="text-xs text-gray-400 font-medium">
                    Showing {filteredFiles.length} {filterTypes.length === 1 ? filterTypes[0] : filterTypes.length > 1 ? 'Filtered' : ''} documents
                </div>
                <button className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-gray-100">
                    View All <ExternalLink className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}
