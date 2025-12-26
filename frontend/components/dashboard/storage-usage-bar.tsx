import React from 'react';

interface StorageItem {
    label: string;
    percentage: number;
    color: string;
    size: string;
}

interface StorageUsageBarProps {
    totalUsed: string;
    totalCapacity: string;
    items: StorageItem[];
}

export function StorageUsageBar({ totalUsed, totalCapacity, items }: StorageUsageBarProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Storage Usage</h3>
                    <p className="text-sm text-gray-500">
                        {totalUsed} used of {totalCapacity} <span className="mx-2 text-gray-300 text-[10px]">•</span> <span className="text-xs">Updated just now</span>
                    </p>
                </div>
                <button className="text-sm font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                    Manage Storage
                </button>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-6 w-full bg-gray-100 rounded-lg overflow-hidden flex mb-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{ width: `${item.percentage}%` }}
                        className={`h-full ${item.color} relative group transition-all duration-300 hover:opacity-90`}
                    >
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20 shadow-lg">
                            {item.label}: {item.size} ({item.percentage.toFixed(2)}%)
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">{item.label}</span>
                            <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">{item.size} ({item.percentage.toFixed(2)}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
