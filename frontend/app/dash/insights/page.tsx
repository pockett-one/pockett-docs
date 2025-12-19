"use client"

import { useState, useEffect } from "react"
import Link from 'next/link'
import {
    TrendingUp,
    Zap,
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
import { useAuth } from "@/lib/auth-context"
import { InsightCard } from "@/components/dashboard/insight-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { MostRecentFilesCard, DriveFile } from "@/components/dashboard/most-recent-files-card"

export default function InsightsPage() {
    const { session } = useAuth()
    const [recentFiles, setRecentFiles] = useState<DriveFile[]>([])
    const [loading, setLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [connectorEmail, setConnectorEmail] = useState<string | null>(null)
    const [limit, setLimit] = useState(10)

    // Load limit from localStorage on mount
    useEffect(() => {
        const savedLimit = localStorage.getItem('insights_limit')
        if (savedLimit) {
            const parsed = parseInt(savedLimit)
            if (!isNaN(parsed) && [5, 10, 20, 50].includes(parsed)) {
                setLimit(parsed)
            }
        }
    }, [])

    useEffect(() => {
        async function loadData() {
            if (!session?.access_token) return

            // Only show full page loader if we don't have data yet
            if (recentFiles.length === 0) {
                setLoading(true)
            }

            try {
                const response = await fetch(`/api/drive-insights?limit=${limit}`, {
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
    }, [session, limit])

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit)
        localStorage.setItem('insights_limit', newLimit.toString())
    }

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

    return (
        <div className="min-h-screen bg-white">

            {/* Page Header */}
            {/* Page Header */}
            <div className="mb-6 px-2">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Document Insights</h1>
                        <p className="text-sm text-gray-500 font-medium">Optimization & Security Intelligence</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                {/* Column 1: Activity Stream */}
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        icon={TrendingUp}
                        title="Activity Stream"
                        description="Track recent modifications and access patterns across your workspace."
                        theme="blue"
                    />

                    <MostRecentFilesCard files={recentFiles} limit={limit} onLimitChange={handleLimitChange} />

                    <div className="h-64">
                        <InsightCard title="Most Accessed" icon={TrendingUp} theme="blue" subtext="Top documents by view count" />
                    </div>
                </div>

                {/* Column 2: Storage Optimization */}
                <div className="flex flex-col gap-3">
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
                <div className="flex flex-col gap-3">
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
