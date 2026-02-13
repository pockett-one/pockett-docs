'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shared skeleton for Org, Client & Project list pages.
 * Matches the real layout: breadcrumb, header panel, card grid.
 * Use in loading.tsx so the right pane has consistent layout with no extra white space.
 */
export function ListPageSkeleton() {
    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-6 w-32 rounded-md" />
            </div>

            {/* Header panel (title, count, view toggle, button) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    </div>
                    <div className="ml-auto">
                        <Skeleton className="h-9 w-32 rounded-md" />
                    </div>
                </div>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-48"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                        </div>
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-3 w-28 mt-auto pt-3" />
                    </div>
                ))}
            </div>
        </div>
    )
}
