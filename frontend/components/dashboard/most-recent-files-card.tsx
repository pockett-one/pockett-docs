"use client"

import { useState, useRef, useEffect } from "react"
import { Clock, ChevronDown, Lightbulb } from "lucide-react"
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

    // Backdrop controls closing

    const options = [5, 10, 20, 50]

    const LimitAction = (
        <div className="flex items-center gap-2" ref={dropdownRef}>
            <span className="text-xs font-medium text-gray-500">Show</span>
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

    const insight = generateInsight(files)

    const InsightBanner = insight && (
        <div className="p-2 bg-white border border-blue-100 rounded-xl flex items-start gap-2 shadow-sm">
            <div className="mt-0.5 p-1 bg-white rounded-lg shadow-sm border border-blue-100">
                <Lightbulb className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
            </div>
            <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-bold block mb-0.5 text-blue-700">{insight.title}</span>
                {insight.message}
            </div>
        </div>
    )

    return (
        <div className="h-auto">
            <InsightCard title="Most Recent" icon={Clock} theme="blue" action={LimitAction} headerExtra={InsightBanner}>
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {files.map(file => (
                        <div key={file.id} className="group/item bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all flex items-start justify-between cursor-pointer relative overflow-hidden">
                            <div className="flex items-start space-x-3 overflow-hidden relative z-10">
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
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity relative z-20">
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

function generateInsight(files: DriveFile[]) {
    if (files.length === 0) return null

    const now = new Date()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    // Filter files in time windows to get the specific arrays
    const recentFiles24h = files.filter(f => (now.getTime() - new Date(f.modifiedTime).getTime()) < oneDay)
    const recentFilesWeek = files.filter(f => (now.getTime() - new Date(f.modifiedTime).getTime()) < oneWeek)
    const recentFilesMonth = files.filter(f => (now.getTime() - new Date(f.modifiedTime).getTime()) < oneMonth)

    if (recentFiles24h.length > 1) {
        // Find the oldest file in this 24h batch to verify the span
        const oldestInBatch = recentFiles24h.reduce((res, obj) => (new Date(obj.modifiedTime) < new Date(res.modifiedTime) ? obj : res))
        const diffHours = Math.ceil((now.getTime() - new Date(oldestInBatch.modifiedTime).getTime()) / (1000 * 60 * 60))

        // Define High Velocity as significant activity (e.g., 5+ files)
        if (recentFiles24h.length >= 5) {
            return {
                title: "High Velocity",
                message: <>You worked on <strong>{recentFiles24h.length} documents</strong> in the last <strong>{diffHours} hours</strong>.</>
            }
        }

        // Otherwise, it's just standard daily activity
        return {
            title: "Daily Activity",
            message: <>You worked on <strong>{recentFiles24h.length} documents</strong> in the last <strong>{diffHours} hours</strong>.</>
        }
    }

    if (recentFilesWeek.length > 1) {
        const oldestInBatch = recentFilesWeek.reduce((res, obj) => (new Date(obj.modifiedTime) < new Date(res.modifiedTime) ? obj : res))
        const diffDays = Math.ceil((now.getTime() - new Date(oldestInBatch.modifiedTime).getTime()) / oneDay)

        return {
            title: "Steady Momentum",
            message: <>You worked on <strong>{recentFilesWeek.length} documents</strong> in the last <strong>{diffDays} days</strong>.</>
        }
    }

    if (recentFilesMonth.length > 1) {
        const oldestInBatch = recentFilesMonth.reduce((res, obj) => (new Date(obj.modifiedTime) < new Date(res.modifiedTime) ? obj : res))
        const diffDays = Math.ceil((now.getTime() - new Date(oldestInBatch.modifiedTime).getTime()) / oneDay)

        // If roughly a month, just say month, else say days if relevant
        const timeText = diffDays > 25 ? "month" : `${diffDays} days`

        return {
            title: "Monthly Activity",
            message: <>You worked on <strong>{recentFilesMonth.length} documents</strong> in the last <strong>{timeText}</strong>.</>
        }
    }

    return {
        title: "Recent History",
        message: <>You viewed <strong>{files.length} documents</strong> recently.</>
    }
}
