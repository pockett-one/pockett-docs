"use client"

import { History, Info } from "lucide-react"
import { DriveFile } from "@/lib/types"
import { DocumentListCard } from "@/components/dashboard/document-list-card"

interface MostRecentFilesCardProps {
    files: DriveFile[]
    limit: number
    onLimitChange: (limit: number) => void
}

export function MostRecentFilesCard({ files, limit, onLimitChange }: MostRecentFilesCardProps) {
    // Insight Logic: Calculate files worked on in last 24h
    const filesInLast24h = files.filter(f => {
        const fileDate = new Date(f.modifiedTime)
        const now = new Date()
        const diffInHours = (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60)
        return diffInHours < 24
    }).length

    const headerContent = (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 inline-flex shadow-sm">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            <span>
                <span className="font-semibold text-gray-700">Daily Activity:</span> You worked on <span className="font-bold text-gray-900">{filesInLast24h} document(s)</span> in the past 24h
            </span>
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
