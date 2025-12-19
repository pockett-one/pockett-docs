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
        <div className="mb-6 px-2">
            <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${t.badgeBg} ${t.iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed pl-12">{description}</p>
        </div>
    )
}
