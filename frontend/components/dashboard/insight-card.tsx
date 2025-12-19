"use client"

import { Zap, ArrowRight, LucideIcon } from "lucide-react"

export type InsightTheme = 'blue' | 'purple' | 'green'

interface InsightThemeConfig {
    outerBorder: string
    outerShadow: string
    innerBg: string
    patternColor: string
    iconColor: string
    iconBg: string
    badgeBg: string
    badgeText: string
}

export const INSIGHT_THEMES: Record<InsightTheme, InsightThemeConfig> = {
    blue: {
        outerBorder: 'border-blue-100',
        outerShadow: 'shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_-5px_rgba(59,130,246,0.2)]',
        innerBg: 'bg-blue-50/50',
        patternColor: '#bfdbfe', // blue-200
        iconColor: 'text-blue-600',
        iconBg: 'bg-white',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700'
    },
    purple: {
        outerBorder: 'border-purple-100',
        outerShadow: 'shadow-[0_0_40px_-10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.2)]',
        innerBg: 'bg-purple-50/50',
        patternColor: '#e9d5ff', // purple-200
        iconColor: 'text-purple-600',
        iconBg: 'bg-white',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-700'
    },
    green: {
        outerBorder: 'border-green-100',
        outerShadow: 'shadow-[0_0_40px_-10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_50px_-5px_rgba(34,197,94,0.2)]',
        innerBg: 'bg-green-50/50',
        patternColor: '#bbf7d0', // green-200
        iconColor: 'text-green-600',
        iconBg: 'bg-white',
        badgeBg: 'bg-green-100',
        badgeText: 'text-green-700'
    }
}

interface InsightCardProps {
    title: string
    icon: LucideIcon
    theme: InsightTheme
    count?: number
    subtext?: string
    children?: React.ReactNode
    className?: string
    action?: React.ReactNode
}

export function InsightCard({
    title,
    icon: Icon,
    theme,
    count,
    subtext,
    children,
    className,
    action
}: InsightCardProps) {
    const t = INSIGHT_THEMES[theme]

    return (
        <div className={`relative bg-white rounded-3xl border ${t.outerBorder} ${t.outerShadow} transition-all duration-300 flex flex-col p-2 group h-full ${className || ''}`}>
            <div className={`rounded-2xl p-6 flex flex-col h-full relative z-10 overflow-hidden ${t.innerBg}`}>
                {/* Dotted Pattern */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: `radial-gradient(${t.patternColor} 1px, transparent 1px)`, backgroundSize: '16px 16px' }}></div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl shadow-sm border border-white/50 ${t.iconBg} ${t.iconColor}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 tracking-tight">{title}</h3>
                                {subtext && <p className="text-xs text-gray-500 font-medium">{subtext}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {action}
                            {count !== undefined && (
                                <span className={`px-2.5 py-1 ${t.badgeBg} ${t.badgeText} text-xs font-bold rounded-full border border-white/50 shadow-sm`}>
                                    {count}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 mt-2">
                        {children ? children : (
                            <div className="h-32 border-2 border-dashed border-gray-200/60 rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-white/30 backdrop-blur-sm">
                                <span className="text-xs font-medium text-gray-400">Analysis Pending</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Action */}
                    {!children && (
                        <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1 font-medium group-hover:text-gray-800 transition-colors">
                                <Zap className="h-3 w-3" /> View Details
                            </span>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
