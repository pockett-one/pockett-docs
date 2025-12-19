"use client"

import { Clock, Zap, ArrowRight } from "lucide-react"
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

export function MostRecentFilesCard({ files }: MostRecentFilesCardProps) {
    return (
        <div className="h-auto">
            <InsightCard title="Most Recent" icon={Clock} theme="blue" count={files.length}>
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
