"use client"

import { TrendingUp, Eye, Zap } from "lucide-react"
import { DriveFile } from "@/lib/types"
import { DocumentListCard } from "@/components/dashboard/document-list-card"
import { formatRelativeTime } from "@/lib/utils"

interface MostAccessedFilesCardProps {
    files: DriveFile[]
    limit: number
    onLimitChange: (limit: number) => void
    timeRange: string
    onTimeRangeChange: (range: string) => void
    variant?: 'default' | 'flat'
}

export function MostAccessedFilesCard({ files, limit, onLimitChange, timeRange, onTimeRangeChange, variant = 'default' }: MostAccessedFilesCardProps) {
    // Calculate total actions from the visible files
    const totalActions = files.reduce((acc, file) => acc + (file.activityCount || 0), 0)

    // Header with Range Selector
    const headerContent = (
        <div className="flex items-center justify-between w-full">
            {/* Range Selector */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                {['24h', '7d', '30d', '1y'].map((range) => (
                    <button
                        key={range}
                        onClick={() => onTimeRangeChange(range)}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${timeRange === range
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {range}
                    </button>
                ))}
            </div>

            {/* Total Activity Summary */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 ml-1">
                <Zap className="h-3 w-3" />
                <span className="font-semibold">{totalActions} actions</span>
            </div>
        </div>
    )

    return (
        <DocumentListCard
            title="Trending Files"
            icon={<TrendingUp className="h-5 w-5 text-indigo-600 flex-shrink-0" />}
            files={files}
            limit={limit}
            onLimitChange={onLimitChange}
            headerContent={headerContent}
            showRank={false}
            primaryDate="viewed"
            variant={variant}
        />
    )
}
