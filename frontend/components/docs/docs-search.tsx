"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchResult {
    title: string
    path: string
    section: string
    snippet: string
}

const DOCUMENTATION_PAGES: SearchResult[] = [
    // Authentication
    { title: "Signup", path: "/docs/authentication/signup", section: "Authentication", snippet: "Create your account with email code or sign in with Google" },
    { title: "Email Code Signup", path: "/docs/authentication/signup", section: "Authentication", snippet: "Sign up without creating a password using a one-time code" },
    { title: "Sign in with Google", path: "/docs/authentication/signup", section: "Authentication", snippet: "Sign up instantly using your existing Google account" },
    { title: "Signin", path: "/docs/authentication/signin", section: "Authentication", snippet: "Access your account securely with email code or Google" },
    { title: "Email Code Signin", path: "/docs/authentication/signin", section: "Authentication", snippet: "Sign in without a password using a one-time code" },
    { title: "Session Management", path: "/docs/authentication/signin", section: "Authentication", snippet: "Sessions remain active for 7 days and auto-renew" },
    { title: "Logout", path: "/docs/authentication/logout", section: "Authentication", snippet: "Securely end your session and protect your account" },

    // Dashboard - Connectors
    { title: "Connectors", path: "/docs/dashboard/connectors", section: "Dashboard", snippet: "Connect your Google Drive and start monitoring documents" },
    { title: "Connecting Google Drive", path: "/docs/dashboard/connectors", section: "Dashboard", snippet: "Connect your Google Drive account in just a few clicks" },
    { title: "Permissions", path: "/docs/dashboard/connectors", section: "Dashboard", snippet: "What Pockett can and cannot access in your Drive" },
    { title: "Connector Status", path: "/docs/dashboard/connectors", section: "Dashboard", snippet: "Active, Warning, and Syncing connector states" },

    // Dashboard - Insights
    { title: "Insights", path: "/docs/dashboard/insights", section: "Dashboard", snippet: "Security insights and analytics about your Google Drive" },
    { title: "Security Alerts", path: "/docs/dashboard/insights", section: "Dashboard", snippet: "Identify security risks and potential issues" },
    { title: "File Sharing Analytics", path: "/docs/dashboard/insights", section: "Dashboard", snippet: "Understand how your files are being shared" },
    { title: "Public Files", path: "/docs/dashboard/insights", section: "Dashboard", snippet: "Identify files that are publicly accessible" },
    { title: "Expiring Shares", path: "/docs/dashboard/insights", section: "Dashboard", snippet: "Track share links that are about to expire" },

    // Dashboard - Document Actions
    { title: "Document Actions", path: "/docs/dashboard/document-actions", section: "Dashboard", snippet: "Preview, download, and manage your documents" },
    { title: "Document Preview", path: "/docs/dashboard/document-actions", section: "Dashboard", snippet: "Preview Google Docs, Sheets, and Slides directly" },
    { title: "Version History", path: "/docs/dashboard/document-actions", section: "Dashboard", snippet: "Track all changes with activity timeline and version history" },
    { title: "Downloads", path: "/docs/dashboard/document-actions", section: "Dashboard", snippet: "Download documents and specific versions securely" },
    { title: "File Information", path: "/docs/dashboard/document-actions", section: "Dashboard", snippet: "View detailed information about each document" },

    // Security
    { title: "Security & Privacy", path: "/docs/security", section: "Resources", snippet: "How Pockett protects your data and maintains privacy" },
]

export function DocsSearch() {
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const results = query.trim().length > 0
        ? DOCUMENTATION_PAGES.filter(page => {
            const searchText = `${page.title} ${page.snippet} ${page.section}`.toLowerCase()
            return searchText.includes(query.toLowerCase())
        }).slice(0, 8) // Limit to 8 results
        : []

    const handleResultClick = (path: string) => {
        setQuery("")
        setIsOpen(false)
        router.push(path)
    }

    return (
        <div className="relative max-w-full">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full pl-7 pr-7 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-sm"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery("")
                            setIsOpen(false)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                        <button
                            key={index}
                            onClick={() => handleResultClick(result.path)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {result.title}
                                    </div>
                                    <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                                        {result.snippet}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                    {result.section}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query.trim().length > 0 && results.length === 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-6 text-center">
                    <p className="text-gray-600">No results found for "{query}"</p>
                    <p className="text-sm text-gray-500 mt-1">Try different keywords</p>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
