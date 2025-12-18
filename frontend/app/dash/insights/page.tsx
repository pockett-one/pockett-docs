"use client"

import { useState, useEffect } from "react"
import Link from 'next/link'
import {
    TrendingUp,
    Clock,
    MoreHorizontal,
    Zap,
    ArrowRight,
    HardDrive,
    Shield,
    Archive,
    BarChart,
    FileQuestion,
    Copy,
    AlertTriangle,
    FileWarning,
    Users
} from "lucide-react"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { DocumentIcon } from "@/components/ui/document-icon"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"

interface DriveFile {
    id: string
    name: string
    mimeType: string
    modifiedTime: string
    size?: string
    webViewLink?: string
    iconLink?: string
}

export default function InsightsPage() {
    const { session } = useAuth()
    const [recentFiles, setRecentFiles] = useState<DriveFile[]>([])
    const [loading, setLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [connectorEmail, setConnectorEmail] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            if (!session?.access_token) return

            try {
                const response = await fetch('/api/drive-insights', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (response.ok) {
                    const result = await response.json()
                    setIsConnected(!!result.isConnected)
                    if (result.isConnected && result.data) {
                        setRecentFiles(result.data as DriveFile[])
                        setConnectorEmail(result.connectorEmail || null)
                    }
                } else {
                    console.error("Failed response from API")
                }

            } catch (e) {
                console.error("Failed to load insights", e)
            } finally {
                setLoading(false)
            }
        }

        if (session) {
            loadData()
        }
    }, [session])

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-6">
                <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="h-96 bg-gray-100 rounded-3xl w-full"></div>
                    <div className="h-96 bg-gray-100 rounded-3xl w-full"></div>
                    <div className="h-96 bg-gray-100 rounded-3xl w-full"></div>
                </div>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <Zap className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Google Drive</h2>
                <p className="text-gray-500 max-w-md mb-8">Connect your Google Drive to see insights about your most recent and frequent documents.</p>
                <Link href="/dash/connectors" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                    Go to Connectors
                </Link>
            </div>
        )
    }

    // Theme Configuration matching Pricing Tiers
    const themes = {
        blue: {
            outerBorder: 'border-blue-100',
            outerShadow: 'shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_-5px_rgba(59,130,246,0.2)]',
            innerBg: 'bg-blue-50/50', // Paler
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

    const InsightCard = ({ title, icon: Icon, theme, count, children, subtext }: { title: string, icon: any, theme: 'blue' | 'purple' | 'green', count?: number, subtext?: string, children?: React.ReactNode }) => {
        const t = themes[theme]
        return (
            <div className={`relative bg-white rounded-3xl border ${t.outerBorder} ${t.outerShadow} transition-all duration-300 flex flex-col p-2 group h-full`}>
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
                            {count !== undefined && (
                                <span className={`px-2.5 py-1 ${t.badgeBg} ${t.badgeText} text-xs font-bold rounded-full border border-white/50 shadow-sm`}>
                                    {count}
                                </span>
                            )}
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

    const SectionHeader = ({ icon: Icon, title, description, theme }: { icon: any, title: string, description: string, theme: 'blue' | 'purple' | 'green' }) => {
        const t = themes[theme]
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

    return (
        <div className="min-h-screen bg-white">

            {/* Page Header */}
            <div className="mb-10 px-2">
                <div className="flex items-center space-x-4 mb-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Document Insights</h1>
                        <p className="text-lg text-gray-500 font-medium">Optimization & Security Intelligence</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Column 1: Activity Stream */}
                <div className="flex flex-col gap-6">
                    <SectionHeader
                        icon={TrendingUp}
                        title="Activity Stream"
                        description="Track recent modifications and access patterns across your workspace."
                        theme="blue"
                    />

                    <div className="h-auto">
                        <InsightCard title="Most Recent" icon={Clock} theme="blue" count={recentFiles.length}>
                            <div className="space-y-3 mt-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {recentFiles.map(file => (
                                    <div key={file.id} className="group/item bg-white/60 hover:bg-white border border-transparent hover:border-blue-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-start justify-between backdrop-blur-sm cursor-pointer">
                                        <div className="flex items-start space-x-3 overflow-hidden">
                                            <div className="mt-1 flex-shrink-0">
                                                <DocumentIcon mimeType={file.mimeType} className="h-8 w-8" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 truncate" title={file.name}>
                                                    {file.name}
                                                </h4>
                                                <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
                                                    <span className="font-medium text-blue-600/80">{formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true })}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="truncate opacity-70">Google Drive</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <DocumentActionMenu document={file} />
                                        </div>
                                    </div>
                                ))}
                                {recentFiles.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm italic">
                                        No recent files found.
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 pt-4 border-t border-blue-200/30 flex items-center justify-between text-xs text-blue-600/80">
                                <div className="flex items-center space-x-1.5 cursor-pointer hover:text-blue-700 font-medium">
                                    <Zap className="h-3 w-3" />
                                    <span>Quick Bookmark</span>
                                </div>
                                <ArrowRight className="h-3 w-3 opacity-50" />
                            </div>
                        </InsightCard>
                    </div>

                    <div className="h-64">
                        <InsightCard title="Most Accessed" icon={TrendingUp} theme="blue" subtext="Top documents by view count" />
                    </div>
                </div>

                {/* Column 2: Storage Optimization */}
                <div className="flex flex-col gap-6">
                    <SectionHeader
                        icon={HardDrive}
                        title="Storage Optimization"
                        description="Clean up cluttered storage by identifying stale, large, or abandoned files."
                        theme="purple"
                    />
                    <div className="h-48">
                        <InsightCard title="Stale Documents" icon={Archive} theme="purple" count={12} subtext="Modified > 1 year ago" />
                    </div>
                    <div className="h-48">
                        <InsightCard title="Large Files" icon={BarChart} theme="purple" count={5} subtext="Files larger than 100MB" />
                    </div>
                    <div className="h-48">
                        <InsightCard title="Abandoned Files" icon={FileQuestion} theme="purple" count={8} subtext="Owned by deactivated users" />
                    </div>
                    <div className="h-48">
                        <InsightCard title="Duplicates" icon={Copy} theme="purple" count={0} subtext="Exact content matches" />
                    </div>
                </div>

                {/* Column 3: Sharing & Security */}
                <div className="flex flex-col gap-6">
                    <SectionHeader
                        icon={Shield}
                        title="Sharing & Security"
                        description="Audit external access and secure sensitive information."
                        theme="green"
                    />
                    <div className="h-48">
                        <InsightCard title="Expiry Alerts" icon={AlertTriangle} theme="green" count={2} subtext="Links expiring in 24h" />
                    </div>
                    <div className="h-48">
                        <InsightCard title="Sensitive Content" icon={FileWarning} theme="green" count={4} subtext="PII or financial data detected" />
                    </div>
                    <div className="h-48">
                        <InsightCard title="Risky Shares" icon={Users} theme="green" count={3} subtext="Publicly accessible links" />
                    </div>
                </div>
            </div>
        </div>
    )
}
