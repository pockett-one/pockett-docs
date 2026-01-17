"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Logo from "@/components/Logo"
import {
    LogOut,
    Home,
    LayoutDashboard,
    ChevronDown,
    Wrench,
    ExternalLink
} from "lucide-react"

export function InternalSidebar() {
    const { user, signOut } = useAuth()
    const pathname = usePathname()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const getUserDisplayName = () => {
        if (user?.user_metadata?.full_name) return user.user_metadata.full_name
        if (user?.user_metadata?.name) return user.user_metadata.name
        if (user?.email) return user.email.split('@')[0]
        return 'User'
    }

    const getUserInitials = () => {
        const name = getUserDisplayName()
        if (name.includes('@')) return name.charAt(0).toUpperCase()
        const parts = name.split(' ')
        if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
        return name.charAt(0).toUpperCase()
    }

    const navigation = [
        { name: 'Home', href: '/', icon: Home, external: true },
        { name: 'Dashboard', href: '/dash', icon: LayoutDashboard, external: true },
        { name: 'Tools', href: '/internal', icon: Wrench, external: false },
    ]

    return (
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Logo size="sm" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto p-4">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        // Exact match for '/' or '/dash', startsWith for '/internal' to cover subpages
                        let isCurrent = false;
                        // Only check active state for internal links, external ones don't need active state in this context usually, 
                        // but if we want to show active if we are strictly on that path (which we won't be if it opens in new tab generally)
                        if (item.href === '/internal') {
                            isCurrent = pathname.startsWith('/internal')
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                target={item.external ? "_blank" : undefined}
                                rel={item.external ? "noopener noreferrer" : undefined}
                                className={`flex items-center text-sm font-medium rounded-lg px-3 py-2 transition-colors ${isCurrent
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 group'
                                    }`}
                            >
                                <Icon className={`h-4 w-4 mr-3 ${isCurrent ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                <span className="flex-1">{item.name}</span>
                                {item.external && (
                                    <ExternalLink className="h-3 w-3 ml-2 text-gray-300 group-hover:text-gray-500" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="mt-auto pt-4 border-t border-gray-100" ref={profileRef}>
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="h-9 w-9 bg-black rounded-full text-white flex items-center justify-center text-sm font-medium shadow-sm border border-white ring-2 ring-gray-100 flex-shrink-0">
                                {getUserInitials()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {getUserDisplayName()}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    Super Admin
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
