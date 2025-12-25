"use client"

import { History } from "lucide-react"
import { DriveFile } from "@/lib/types"
import { DocumentListCard } from "@/components/dashboard/document-list-card"

interface MostRecentFilesCardProps {
    files: DriveFile[]
    limit: number
    onLimitChange: (limit: number) => void
    timeRange: string
    onTimeRangeChange: (range: string) => void
}

export function MostRecentFilesCard({ files, limit, onLimitChange, timeRange, onTimeRangeChange }: MostRecentFilesCardProps) {

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

            {/* Recent Activity Summary */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 ml-1">
                <History className="h-3 w-3" />
                <span className="font-semibold">{files.length} modified</span>
            </div>
        </div>
    )

    return (
        <DocumentListCard
            title="Most Recent"
            icon={<History className="h-5 w-5 text-blue-600 flex-shrink-0" />}
            files={files}
            limit={limit}
            onLimitChange={onLimitChange}
            headerContent={headerContent}
        />
    )
}
