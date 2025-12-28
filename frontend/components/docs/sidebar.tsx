"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Shield,
    FileText,
    Home,
    LogIn,
    LogOut,
    UserPlus,
    LayoutDashboard,
    Plug,
    BarChart3,
    Menu as MenuIcon
} from "lucide-react"
import { useState } from "react"
import { DocsSearch } from "./docs-search"

interface SidebarItemProps {
    href: string
    icon: React.ElementType
    title: string
    indent?: boolean
}

function SidebarItem({ href, icon: Icon, title, indent = false }: SidebarItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors min-w-0",
                indent && "pl-6",
                isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
        >
            <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-gray-900" : "text-gray-500")} />
            <span className="truncate min-w-0">{title}</span>
        </Link>
    )
}

interface SidebarSectionProps {
    title: string
    children: React.ReactNode
}

function SidebarSection({ title, children }: SidebarSectionProps) {
    return (
        <div className="space-y-1">
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {title}
            </div>
            {children}
        </div>
    )
}

export function DocsSidebar() {
    return (
        <div className="w-full h-full border-r border-gray-200 bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
                {/* Search */}
                <div className="mb-6 min-w-0">
                    <DocsSearch />
                </div>

                <nav className="space-y-1 min-w-0">
                    <SidebarItem href="/docs" icon={Home} title="Introduction" />

                    <SidebarSection title="Authentication">
                        <SidebarItem href="/docs/authentication/signup" icon={UserPlus} title="Signup" indent />
                        <SidebarItem href="/docs/authentication/signin" icon={LogIn} title="Signin" indent />
                        <SidebarItem href="/docs/authentication/logout" icon={LogOut} title="Logout" indent />
                    </SidebarSection>

                    <SidebarSection title="Dashboard">
                        <SidebarItem href="/docs/dash/connectors" icon={Plug} title="Connectors" indent />
                        <SidebarItem href="/docs/dash/insights" icon={BarChart3} title="Insights" indent />
                        <SidebarItem href="/docs/dash/document-actions" icon={MenuIcon} title="Document Actions" indent />
                    </SidebarSection>

                    <SidebarSection title="Resources">
                        <SidebarItem href="/docs/security" icon={Shield} title="Security & Privacy" />
                    </SidebarSection>
                </nav>
            </div>
        </div>
    )
}
