"use client"

import { useState, useRef, useEffect } from "react"
import { Clock, ChevronDown } from "lucide-react"
import { InsightCard } from "./insight-card"
import { DocumentIcon } from "@/components/ui/document-icon"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"

export interface DriveFile {
    id: string
    name: string
    mimeType: string
    modifiedTime: string
    size?: string
    webViewLink?: string
    iconLink?: string
    source?: string
}

interface MostRecentFilesCardProps {
    files: DriveFile[]
    limit: number
    onLimitChange: (limit: number) => void
}

function formatShortTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function MostRecentFilesCard({ files, limit, onLimitChange }: MostRecentFilesCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Backdrop controls closing, no more manual event listeners needed

    const options = [5, 10, 20, 50]

    const LimitAction = (
        <div className="flex items-center gap-2" ref={dropdownRef}>
            <span className="text-xs font-medium text-gray-500">Show Recent</span>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100/50 relative z-20"
                >
                    {limit}
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu & Backdrop */}
                {isOpen && (
                    <>
                        {/* Invisible Backdrop to lock down the page and handle outside clicks */}
                        <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setIsOpen(false)}
                        />

                        <div className="absolute right-0 top-full mt-1 w-20 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-40 overflow-y-auto py-1">
                                {options.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => {
                                            onLimitChange(opt)
                                            setIsOpen(false)
                                        }}
                                        className={`w-full text-center px-3 py-2 text-xs font-medium transition-colors hover:bg-blue-50 hover:text-blue-600 ${limit === opt ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )

    return (
        <div className="h-auto">
            <InsightCard title="Most Recent" icon={Clock} theme="blue" action={LimitAction}>
                <div className="space-y-3 mt-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {files.map(file => (
                        <div key={file.id} className="group/item bg-white/60 hover:bg-white border border-transparent hover:border-blue-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-start justify-between backdrop-blur-sm cursor-pointer">
                            <div className="flex items-start space-x-3 overflow-hidden">
                                <div className="mt-1 flex-shrink-0">
                                    <DocumentIcon mimeType={file.mimeType} className="h-8 w-8" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate" title={file.name}>
                                        {file.name}
                                    </h4>
                                    <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
                                        <span className="font-medium text-blue-600/80 whitespace-nowrap">{formatShortTime(file.modifiedTime)}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="truncate opacity-70" title={file.source || 'Google Drive'}>
                                            {file.source || 'Google Drive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <DocumentActionMenu document={file} />
                            </div>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm italic">
                            No recent files found.
                        </div>
                    )}
                </div>
            </InsightCard>
        </div>
    )
}
