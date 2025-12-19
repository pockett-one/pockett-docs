"use client"

import { LucideIcon } from "lucide-react"
import { INSIGHT_THEMES, InsightTheme } from "./insight-card"

interface SectionHeaderProps {
    icon: LucideIcon
    title: string
    description: string
    theme: InsightTheme
}

export function SectionHeader({ icon: Icon, title, description, theme }: SectionHeaderProps) {
    const t = INSIGHT_THEMES[theme]

    return (
        <div className="mb-3 px-1">
            <div className="flex items-center space-x-2.5 mb-1.5">
                <div className={`p-1.5 rounded-lg ${t.badgeBg} ${t.iconColor}`}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pl-10 pr-2">{description}</p>
        </div>
    )
}
