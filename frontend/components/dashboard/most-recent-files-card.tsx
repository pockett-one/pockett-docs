
"use client"

import { useState } from "react"
import { MoreHorizontal, ExternalLink, FileText, Info, HardDrive, Filter, ChevronDown, Check, X, History } from "lucide-react"
import { DocumentIcon } from "@/components/ui/document-icon"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"

export interface DriveFile {
    id: string
    name: string
    mimeType: string
    webViewLink: string
    iconLink: string
    modifiedTime: string
    createdTime?: string
    lastModifyingUser?: {
        displayName: string
        photoLink?: string
    }
    owners?: {
        displayName: string
        photoLink?: string
    }[]
    parents?: string[]
    source?: string
}

interface MostRecentFilesCardProps {
    files: DriveFile[]
    limit: number
    onLimitChange: (limit: number) => void
}

function getFileTypeLabel(mimeType?: string) {
    if (!mimeType) return 'Other';
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentation';
    if (type.includes('word') || type.includes('document')) return 'Document';
    if (type.includes('image')) return 'Image';
    if (type.includes('video')) return 'Video';
    if (type.includes('audio')) return 'Audio';
    if (type.includes('archive') || type.includes('zip')) return 'Archive';
    if (type.includes('folder')) return 'Folder';
    return 'Other';
}

export function MostRecentFilesCard({ files, limit, onLimitChange }: MostRecentFilesCardProps) {
    const [filterTypes, setFilterTypes] = useState<string[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Get unique types from current files
    const availableTypes = Array.from(new Set(files.map(f => getFileTypeLabel(f.mimeType)))).sort()

    // Filter logic
    const filteredFiles = filterTypes.length > 0
        ? files.filter(f => filterTypes.includes(getFileTypeLabel(f.mimeType)))
        : files

    // Toggle logic
    const toggleFilter = (type: string) => {
        setFilterTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    // Insight Logic
    const filesInLast24h = files.filter(f => {
        const fileDate = new Date(f.modifiedTime)
        const now = new Date()
        const diffInHours = (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60)
        return diffInHours < 24
    }).length

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm relative">
            {/* Backdrop for simple dropdown closing */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
            )}

            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl relative z-20">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="text-base font-bold text-gray-900 whitespace-nowrap">Most Recent</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dynamic Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                            >
                                <Filter className="h-3 w-3 flex-shrink-0" />
                                <span>Filter</span>
                                {filterTypes.length > 0 && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                                )}
                                <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-2 py-1.5 border-b border-gray-100 mb-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Type</span>
                                    </div>
                                    <button
                                        onClick={() => { setFilterTypes([]); setIsFilterOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                        <span>All Files</span>
                                        {filterTypes.length === 0 && <Check className="h-4 w-4 text-blue-600" />}
                                    </button>
                                    {availableTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent closing
                                                toggleFilter(type);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
                                        >
                                            <span>{type}</span>
                                            {filterTypes.includes(type) && <Check className="h-4 w-4 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

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
                    </div>
                </div>

                {/* Derived Insight */}
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 inline-flex shadow-sm">
                    <Info className="h-3.5 w-3.5 text-blue-500" />
                    <span>
                        <span className="font-semibold text-gray-700">Daily Activity:</span> You worked on <span className="font-bold text-gray-900">{filesInLast24h} document(s)</span> in the past 24h
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto custom-scrollbar relative z-0">
                {filteredFiles.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 text-sm">
                        {files.length === 0 ? 'No recent activity found.' : `No matching files found.`}
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
                                        Modified {formatTime(file.modifiedTime)}
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

function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
}
