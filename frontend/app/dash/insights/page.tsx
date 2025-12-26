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
    Users,
    LayoutDashboard
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { InsightCard } from "@/components/dashboard/insight-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { MostRecentFilesCard } from "@/components/dashboard/most-recent-files-card"
import { MostAccessedFilesCard } from "@/components/dashboard/most-accessed-files-card"
import { DriveFile } from "@/lib/types"

export default function InsightsPage() {
    const { session } = useAuth()
    const [recentFiles, setRecentFiles] = useState<DriveFile[]>([])
    const [accessedFiles, setAccessedFiles] = useState<DriveFile[]>([])
    const [loading, setLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [connectorEmail, setConnectorEmail] = useState<string | null>(null)
    const [limit, setLimit] = useState(10)
    const [recentTimeRange, setRecentTimeRange] = useState('7d')
    const [accessedTimeRange, setAccessedTimeRange] = useState('7d')

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
                // Fetch Recent Files
                const recentRes = fetch(`/api/drive-metrics?limit=${limit}&range=${recentTimeRange}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                })

                // Fetch Accessed Files
                const accessedRes = fetch(`/api/drive-metrics?limit=${limit}&sort=accessed&range=${accessedTimeRange}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                })

                const [recentResponse, accessedResponse] = await Promise.all([recentRes, accessedRes])

                if (recentResponse.ok) {
                    const result = await recentResponse.json()
                    setIsConnected(!!result.isConnected)
                    if (result.isConnected && result.data) {
                        setRecentFiles(result.data as DriveFile[])
                        setConnectorEmail(result.connectorEmail || null)
                    }
                }

                if (accessedResponse.ok) {
                    const result = await accessedResponse.json()
                    if (result.isConnected && result.data) {
                        setAccessedFiles(result.data as DriveFile[])
                    }
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
    }, [session, limit, recentTimeRange, accessedTimeRange])

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
        // ... existing not connected UI ...
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
            <div className="mb-8 border-b border-gray-100 pb-6">
                <div className="px-1 flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                        <LayoutDashboard className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Document Insights</h1>
                        <p className="text-sm text-gray-500 font-medium">Optimization & Security Intelligence</p>
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

                    {/* Most Recent Files */}
                    <MostRecentFilesCard
                        files={recentFiles}
                        limit={limit}
                        onLimitChange={handleLimitChange}
                        timeRange={recentTimeRange}
                        onTimeRangeChange={setRecentTimeRange}
                    />

                    {/* Most Accessed Files */}
                    <MostAccessedFilesCard
                        files={accessedFiles}
                        limit={limit}
                        onLimitChange={handleLimitChange}
                        timeRange={accessedTimeRange}
                        onTimeRangeChange={setAccessedTimeRange}
                    />
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
