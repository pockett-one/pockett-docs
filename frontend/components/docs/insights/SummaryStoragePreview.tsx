"use client"

import { Archive, BarChart, FileWarning, Users, Filter, ChevronDown, Check, ExternalLink } from "lucide-react"

// --- Static Components ---

function MetricCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: 'purple' | 'green' }) {
    const colorClasses = {
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600",
    }

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4 min-w-[200px] flex-1">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
            </div>
        </div>
    )
}

function StorageBar() {
    // Mock Data - values aligned with visual bar proportions
    const totalUsed = "1.85 TB"
    const totalCapacity = "2.06 TB"
    const percentageUsed = 89.81

    const items = [
        { label: "Videos", size: "858 GB", textPercentage: "41.65%", width: 45, color: "bg-purple-500" },
        { label: "Images", size: "477 GB", textPercentage: "23.16%", width: 25, color: "bg-blue-500" },
        { label: "Documents", size: "286 GB", textPercentage: "13.88%", width: 15, color: "bg-sky-400" },
        { label: "Audio", size: "191 GB", textPercentage: "9.27%", width: 10, color: "bg-teal-400" },
        { label: "Other", size: "97.5 GB", textPercentage: "4.73%", width: 5, color: "bg-gray-200" },
    ]

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Storage Usage</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <span>{totalUsed} ({percentageUsed.toFixed(2)}%) used of {totalCapacity}</span>
                        <span className="mx-2 text-gray-300 text-[10px]">•</span>
                        <span className="text-xs">Updated just now</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Fake Filter Button */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg shadow-sm bg-white border-gray-200 text-gray-700 opacity-60 cursor-not-allowed">
                        <Filter className="h-3 w-3 flex-shrink-0" />
                        <span>Filter</span>
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    </div>

                    {/* Manage Storage Link */}
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 bg-purple-50/50 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                        <span>Manage Storage</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-6 w-full bg-gray-100 rounded-lg overflow-hidden flex mb-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{ width: `${item.width}%` }}
                        className={`h-full ${item.color} relative group`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">{item.label}</span>
                            <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">
                                {item.size} ({item.textPercentage})
                            </span>
                        </div>
                    </div>
                ))}
                {/* Free space legend */}
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border border-gray-200 bg-white" />
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Free</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">210 GB (10.19%)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function SummaryStoragePreview() {
    return (
        <div className="flex flex-col gap-6 my-8">
            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Archive}
                    label="Stale Documents"
                    value="12"
                    color="purple"
                />
                <MetricCard
                    icon={BarChart}
                    label="Large Files"
                    value="5"
                    color="purple"
                />
                <MetricCard
                    icon={FileWarning}
                    label="Sensitive Content"
                    value="4"
                    color="green"
                />
                <MetricCard
                    icon={Users}
                    label="Risky Shares"
                    value="3"
                    color="green"
                />
            </div>

            {/* Storage Bar */}
            <StorageBar />

            <div className="bg-gray-50 p-3 text-center border border-gray-100 rounded-lg -mt-2">
                <p className="text-xs text-gray-500 italic">Data in this preview is for demonstration purposes.</p>
            </div>
        </div>
    )
}
