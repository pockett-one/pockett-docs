"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Shield,
    FileText,
    Share2,
    Cloud,
    ChevronRight,
    Home
} from "lucide-react"

interface SidebarItemProps {
    href: string
    icon: React.ElementType
    title: string
}

function SidebarItem({ href, icon: Icon, title }: SidebarItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
        >
            <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")} />
            {title}
        </Link>
    )
}

export function DocsSidebar() {
    return (
        <div className="w-64 border-r border-gray-200 bg-gray-50/50 min-h-[calc(100vh-4rem)]">
            <div className="p-4">
                <div className="flex items-center gap-2 px-2 mb-6">
                    <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                        P
                    </div>
                    <span className="font-semibold text-gray-900">Pockett Docs</span>
                </div>

                <nav className="space-y-1">
                    <SidebarItem href="/docs" icon={Home} title="Introduction" />

                    <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Features
                    </div>
                    <SidebarItem href="/docs/security" icon={Shield} title="Security & Privacy" />
                    <SidebarItem href="/docs/connections" icon={Cloud} title="Connections" />
                    <SidebarItem href="/docs/sharing" icon={Share2} title="Sharing & Collab" />
                </nav>
            </div>
        </div>
    )
}
