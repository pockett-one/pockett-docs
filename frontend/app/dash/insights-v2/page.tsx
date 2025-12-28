"use client"

import { useState, useEffect, useRef } from "react"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { StorageUsageBar } from '@/components/dashboard/storage-usage-bar'
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
    Share2,
    LayoutDashboard,
    Clock,
    RefreshCw,
    CheckCircle,
    Filter,
    ChevronDown,
    Check,
    X
} from "lucide-react"
import { getFileTypeLabel } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { MostRecentFilesCard } from "@/components/dashboard/most-recent-files-card"
import { MostAccessedFilesCard } from "@/components/dashboard/most-accessed-files-card"
import { DocumentListCard } from "@/components/dashboard/document-list-card"
import { DriveFile } from "@/lib/types"

// --- Helper Components for V2 Layout ---

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    const colorClasses: Record<string, string> = {
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600",
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
    }
    const bgClass = colorClasses[color] || colorClasses.blue

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${bgClass}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
            </div>
        </div>
    )
}

function FeedItem({ title, subtext, severity }: { title: string, subtext: string, severity: 'critical' | 'warning' | 'info' }) {
    const styles = {
        critical: { border: 'border-red-100', bg: 'bg-red-50', icon: AlertTriangle, iconColor: 'text-red-600' },
        warning: { border: 'border-amber-100', bg: 'bg-amber-50', icon: FileWarning, iconColor: 'text-amber-600' },
        info: { border: 'border-blue-100', bg: 'bg-blue-50', icon: CheckCircle, iconColor: 'text-blue-600' }
    }
    const style = styles[severity]
    const Icon = style.icon

    return (
        <div className={`p-4 rounded-xl border ${style.border} bg-white shadow-sm flex gap-3 hover:shadow-md transition-shadow`}>
            <div className={`p-2 h-fit rounded-lg ${style.bg}`}>
                <Icon className={`h-4 w-4 ${style.iconColor}`} />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500 mt-1">{subtext}</p>
                {severity === 'critical' && (
                    <button className="mt-2 text-xs font-medium text-red-600 hover:text-red-700">Review Now &rarr;</button>
                )}
            </div>
        </div>
    )
}

// --- Filter Component ---
function ActivityFilterControls({ limit, onLimitChange, activeFiles, filterTypes, onFilterChange }: {
    limit: number,
    onLimitChange: (n: number) => void,
    activeFiles: DriveFile[],
    filterTypes: string[],
    onFilterChange: (types: string[]) => void
}) {
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const availableTypes = Array.from(new Set(activeFiles.map(f => getFileTypeLabel(f.mimeType)))).sort()

    const toggleFilter = (type: string) => {
        onFilterChange(
            filterTypes.includes(type)
                ? filterTypes.filter(t => t !== type)
                : [...filterTypes, type]
        )
    }

    const isAllSelected = availableTypes.length > 0 && filterTypes.length === availableTypes.length
    const isNoneSelected = filterTypes.length === 0

    return (
        <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
                {isFilterOpen && <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>}

                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                    <Filter className="h-3 w-3 flex-shrink-0" />
                    <span>Filter</span>
                    {!isAllSelected && !isNoneSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                    <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Type</span>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="text-[10px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-2 py-0.5 rounded transition-colors"
                            >
                                Done
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => onFilterChange(isAllSelected ? [] : availableTypes)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 group"
                            >
                                <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-gray-300'
                                    }`}>
                                    {isAllSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="font-medium text-gray-900">All Files</span>
                            </button>
                            {availableTypes.map(type => {
                                const isSelected = filterTypes.includes(type)
                                return (
                                    <button
                                        key={type}
                                        onClick={(e) => { e.stopPropagation(); toggleFilter(type); }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 group transition-colors"
                                    >
                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-gray-300 group-hover:border-blue-400'
                                            }`}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <span className={isSelected ? "font-medium text-gray-900" : ""}>{type}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Limit Selector */}
            <div className="relative inline-block">
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="appearance-none pl-2 pr-7 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-100 transition-all shadow-sm"
                >
                    <option value={5}>Show 5</option>
                    <option value={10}>Show 10</option>
                    <option value={20}>Show 20</option>
                    <option value={50}>Show 50</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        </div>
    )
}

// --- Main Page Component ---

export default function InsightsPageV2() {
    const { session } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [recentFiles, setRecentFiles] = useState<DriveFile[]>([])
    const [accessedFiles, setAccessedFiles] = useState<DriveFile[]>([])
    const [storageFiles, setStorageFiles] = useState<DriveFile[]>([])
    const [sharedFiles, setSharedFiles] = useState<DriveFile[]>([])
    const [loading, setLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)

    // Initialize activeTab from URL or default to 'recent'
    const tabFromUrl = (searchParams?.get('tab') as 'recent' | 'trending' | 'storage' | 'sharing') || 'recent'
    const [activeTab, setActiveTab] = useState<'recent' | 'trending' | 'storage' | 'sharing'>(tabFromUrl)

    // Storage tab filters
    const [storageTimeRange, setStorageTimeRange] = useState<'4w' | 'all'>('4w') // Timeframe filter
    const [storageSizeRange, setStorageSizeRange] = useState<'0.5-1' | '1-5' | '5-10' | '10+'>('0.5-1') // Size range filter
    const [storageSortBy, setStorageSortBy] = useState<'size' | 'oldest'>('size') // Sort by size or last accessed
    const [displayedCount, setDisplayedCount] = useState(10) // For lazy loading
    const [refreshTrigger, setRefreshTrigger] = useState(0) // Used to trigger manual refresh

    interface QuotaState {
        limit: number
        used: number
        accounts: { id: string, email: string, limit: number, used: number }[]
    }
    const [quota, setQuota] = useState<QuotaState | null>(null)
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]) // Array of Account IDs

    // State for existing functionality
    const [limit, setLimit] = useState(10)
    const [recentTimeRange, setRecentTimeRange] = useState('24h') // Default to 24h as requested

    const [accessedTimeRange, setAccessedTimeRange] = useState('24h') // Changed to 24h for consistency
    const [filterTypes, setFilterTypes] = useState<string[]>([]) // Lifted Filter State
    const [actionTab, setActionTab] = useState<'storage' | 'security' | 'sharing'>('storage')

    // Refresh state for filter/timeframe changes
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Load limit
    useEffect(() => {
        const savedLimit = localStorage.getItem('insights_limit')
        if (savedLimit) {
            const parsed = parseInt(savedLimit)
            if (!isNaN(parsed) && [5, 10, 20, 50].includes(parsed)) setLimit(parsed)
        }
    }, [])

    // Data Fetching (Reused logic)
    useEffect(() => {
        async function loadData() {
            if (!session?.access_token) return

            // Optimistic loading state (Initial full load)
            const isInitialLoad = (activeTab === 'recent' && recentFiles.length === 0) ||
                (activeTab === 'trending' && accessedFiles.length === 0) ||
                (activeTab === 'storage' && storageFiles.length === 0) ||
                (activeTab === 'sharing' && sharedFiles.length === 0)

            // Always show loading state when fetching data
            if (isInitialLoad && !isConnected) {
                setLoading(true) // Full page loader for initial connection
            } else if (isInitialLoad || !quota) {
                setIsRefreshing(true) // Tab loader for first-time tab loads
            } else {
                setIsRefreshing(true) // Tab loader for refreshes
            }


            try {
                const headers = { 'Authorization': `Bearer ${session.access_token}` }

                // 1. Initial Load (Quota + Recent for Health)
                if (!quota) {
                    const res = await fetch(`/api/drive-metrics?limit=${limit}&range=${recentTimeRange}`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        setIsConnected(!!data.isConnected)
                        if (data.isConnected) {
                            if (activeTab === 'recent') setRecentFiles(data.data as DriveFile[])
                            if (data.storageUsage) {
                                const q = data.storageUsage as QuotaState
                                setQuota(q)
                                if (q.accounts && q.accounts.length > 0) setSelectedAccounts(q.accounts.map(a => a.id))
                            }
                        }
                    }
                }

                // 2. Tab Specific Load (if not just loaded)
                if (activeTab === 'recent' && quota) {
                    const res = await fetch(`/api/drive-metrics?limit=${limit}&range=${recentTimeRange}`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.data) {
                            setRecentFiles(data.data as DriveFile[])
                        }
                    }
                    setIsRefreshing(false)
                } else if (activeTab === 'trending') {
                    const res = await fetch(`/api/drive-metrics?limit=${limit}&sort=accessed&range=${accessedTimeRange}`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.data) {
                            setAccessedFiles(data.data as DriveFile[])
                        }
                    }
                    setIsRefreshing(false)
                } else if (activeTab === 'storage') {
                    // Fetch with size range and timeframe
                    const res = await fetch(`/api/drive-metrics?limit=100&sizeRange=${storageSizeRange}&timeRange=${storageTimeRange}`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.data) {
                            setStorageFiles(data.data as DriveFile[])
                            setDisplayedCount(10) // Reset displayed count when data changes
                        }
                    }
                    setIsRefreshing(false)
                } else if (activeTab === 'sharing') {
                    const res = await fetch(`/api/drive-metrics?limit=${limit}&sort=shared`, { headers })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.data) {
                            setSharedFiles(data.data as DriveFile[])
                        }
                    }
                    setIsRefreshing(false)
                }

            } catch (err) {
                console.error('Failed to load insights data', err)
                setIsRefreshing(false)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [session, limit, recentTimeRange, accessedTimeRange, activeTab, storageSizeRange, storageTimeRange, refreshTrigger])

    // Helper to change tab and update URL
    const handleTabChange = (tab: 'recent' | 'trending' | 'storage' | 'sharing') => {
        setActiveTab(tab)
        router.push(`?tab=${tab}`, { scroll: false })
    }

    // Manual refresh function
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1) // Increment to trigger useEffect
    }

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit)
        localStorage.setItem('insights_limit', newLimit.toString())
    }

    // Lazy loading for Storage tab
    const loadMoreRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        if (activeTab !== 'storage') return

        // Create intersection observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayedCount < storageFiles.length) {
                    setDisplayedCount(prev => Math.min(prev + 10, storageFiles.length))
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [activeTab, displayedCount, storageFiles.length])



    // Format helper
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Filter Logic for Multi-Account
    const getFilteredQuota = () => {
        if (!quota || !quota.accounts) {
            return { used: 0, limit: 0, showFilter: false, accounts: [] }
        }

        // Only show filter if > 1 account
        const showFilter = quota.accounts.length > 1

        const filtered = quota.accounts.filter(a => selectedAccounts.includes(a.id))
        const used = filtered.reduce((acc, curr) => acc + curr.used, 0)
        const limit = filtered.reduce((acc, curr) => acc + curr.limit, 0)

        return { used, limit, showFilter, accounts: quota.accounts }
    }

    const { used: filteredUsed, limit: filteredLimit, showFilter, accounts: availableAccounts } = getFilteredQuota()

    const realTotal = quota ? formatSize(filteredLimit) : '100 GB'
    const realUsed = quota
        ? `${formatSize(filteredUsed)} (${filteredLimit > 0 ? ((filteredUsed / filteredLimit) * 100).toFixed(2) : '0.00'}%)`
        : '50 GB'

    // Recalculate distribution based on real usage if available (Estimated breakdown)
    const baseUsage = quota ? filteredUsed : (50 * 1024 * 1024 * 1024)
    const baseLimit = quota ? filteredLimit : (100 * 1024 * 1024 * 1024)
    const usageRatio = baseLimit > 0 ? baseUsage / baseLimit : 0

    // If quota is available, scale the percentages so they represent the % of Total Capacity
    // Example: If used is 10% of total, Video (45% of usage) becomes 4.5% of total bar width
    const scaleFactor = quota ? usageRatio : 0.5 // Default to 50% for mock data

    const freeBytes = baseLimit - baseUsage
    const freePercentage = 100 - (usageRatio * 100)

    const storageDistribution = [
        { label: 'Videos', percentage: 45 * scaleFactor, size: formatSize(baseUsage * 0.45), color: 'bg-purple-500' },
        { label: 'Images', percentage: 25 * scaleFactor, size: formatSize(baseUsage * 0.25), color: 'bg-indigo-400' },
        { label: 'Documents', percentage: 15 * scaleFactor, size: formatSize(baseUsage * 0.15), color: 'bg-blue-300' },
        { label: 'Audio', percentage: 10 * scaleFactor, size: formatSize(baseUsage * 0.10), color: 'bg-teal-300' },
        { label: 'Other', percentage: 5 * scaleFactor, size: formatSize(baseUsage * 0.05), color: 'bg-gray-200' },
        { label: 'Free', percentage: quota ? freePercentage : 50, size: formatSize(freeBytes), color: 'bg-gray-50 border border-gray-200 text-gray-400' },
    ]



    // Loading State
    if (loading) {
        return <div className="min-h-screen bg-white p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                    <Zap className="h-12 w-12 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Google Drive</h2>
                <Link href="/dash/connectors" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                    Go to Connectors
                </Link>
            </div>
        )
    }

    return (

        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Document Insights</h1>
                        <p className="text-gray-500 mt-1">Optimization & Security Intelligence</p>
                    </div>
                </div>

                {/* 1. Health Check Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* ... existing cards ... */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                            <Archive className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">12</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Stale Documents</p>
                        </div>
                    </div>
                    {/* ... (other stats) ... */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                            <BarChart className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">5</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Large Files</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-green-50 text-green-600">
                            <FileWarning className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">4</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Sensitive Content</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-green-50 text-green-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">3</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Risky Shares</p>
                        </div>
                    </div>
                </div>

                {/* 2. Storage Usage Visualization */}


                <StorageUsageBar
                    totalUsed={realUsed}
                    totalCapacity={realTotal}
                    items={storageDistribution}
                    accounts={availableAccounts}
                    selectedAccounts={selectedAccounts}
                    onAccountToggle={(id) => {
                        if (selectedAccounts.includes(id)) {
                            if (selectedAccounts.length > 1) {
                                setSelectedAccounts(selectedAccounts.filter(accId => accId !== id))
                            }
                        } else {
                            setSelectedAccounts([...selectedAccounts, id])
                        }
                    }}
                    onSelectAll={() => {
                        const allIds = availableAccounts.map(a => a.id)
                        if (selectedAccounts.length === allIds.length) {
                            // No-op if already all selected
                        } else {
                            setSelectedAccounts(allIds)
                        }
                    }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* 2. Activity Hub (Left - 66% width) */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <div className="flex items-center gap-2 px-1">
                            <h3 className="text-lg font-bold text-gray-900">Activity Hub</h3>
                            <button
                                onClick={handleRefresh}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Refresh data"
                            >
                                <RefreshCw className="h-4 w-4 text-gray-700" />
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden flex flex-col">
                            {/* Hub Header & Tabs */}
                            <div className="p-4 border-b border-gray-200 flex flex-col gap-4 w-full bg-gray-50/50">

                                {/* Single Row: Tabs & Filters */}
                                <div className="flex items-center justify-between gap-4">
                                    {/* Tabs */}
                                    <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit">
                                        <button
                                            onClick={() => handleTabChange('recent')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'recent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Recent
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('trending')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'trending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Trending
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('storage')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'storage' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Storage
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('sharing')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'sharing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Sharing
                                        </button>
                                    </div>

                                    {/* Timeframe OR Size Range for Storage */}
                                    {activeTab === 'storage' ? (
                                        <div className="flex gap-2">
                                            {/* Timeframe Filter */}
                                            <div className="flex bg-gray-200/50 p-0.5 rounded-lg">
                                                <button
                                                    onClick={() => setStorageTimeRange('4w')}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${storageTimeRange === '4w'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    4w
                                                </button>
                                                <button
                                                    onClick={() => setStorageTimeRange('all')}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${storageTimeRange === 'all'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    All Time
                                                </button>
                                            </div>
                                            {/* Sort Toggle */}
                                            <div className="flex bg-gray-200/50 p-0.5 rounded-lg">
                                                <button
                                                    onClick={() => setStorageSortBy('size')}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${storageSortBy === 'size'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    Largest
                                                </button>
                                                <button
                                                    onClick={() => setStorageSortBy('oldest')}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${storageSortBy === 'oldest'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    Oldest
                                                </button>
                                            </div>
                                        </div>
                                    ) : activeTab === 'sharing' ? null : (
                                        <div className="flex bg-gray-200/50 p-0.5 rounded-lg">
                                            {['24h', '1w', '2w', '4w'].map((range) => (
                                                <button
                                                    key={range}
                                                    onClick={() => activeTab === 'recent' ? setRecentTimeRange(range) : setAccessedTimeRange(range)}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${(activeTab === 'recent' ? recentTimeRange : accessedTimeRange) === range
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {range}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Row 2: Filters & Summary */}
                                <div className="flex items-center justify-between">
                                    {activeTab === 'storage' ? (
                                        // Size Range Filter for Storage tab
                                        <div className="flex gap-2 items-center">
                                            <Filter className="h-4 w-4 text-gray-500" />
                                            <div className="flex bg-gray-200/50 p-0.5 rounded-lg">
                                                {[
                                                    { value: '0.5-1', label: '0.5GB-1GB' },
                                                    { value: '1-5', label: '1GB-5GB' },
                                                    { value: '5-10', label: '5GB-10GB' },
                                                    { value: '10+', label: '>10GB' }
                                                ].map((range) => (
                                                    <button
                                                        key={range.value}
                                                        onClick={() => setStorageSizeRange(range.value as any)}
                                                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${storageSizeRange === range.value
                                                            ? 'bg-white text-purple-600 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        {range.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular filter controls for other tabs
                                        <ActivityFilterControls
                                            limit={limit}
                                            onLimitChange={handleLimitChange}
                                            activeFiles={activeTab === 'recent' ? recentFiles : (activeTab === 'sharing' ? sharedFiles : accessedFiles)}
                                            filterTypes={filterTypes}
                                            onFilterChange={setFilterTypes}
                                        />
                                    )}

                                    {/* Info Badge */}
                                    <div className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-md border border-indigo-100 font-medium">
                                        {activeTab === 'recent' ? (
                                            <>
                                                <Clock className="h-3 w-3" />
                                                <span>{recentFiles.length} modified</span>
                                            </>
                                        ) : activeTab === 'storage' ? (
                                            <>
                                                <HardDrive className="h-3 w-3" />
                                                <span>{storageFiles.length} large files</span>
                                            </>
                                        ) : activeTab === 'sharing' ? (
                                            <>
                                                <Users className="h-3 w-3" />
                                                <span>{sharedFiles.length} shared files</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="h-3 w-3" />
                                                <span>
                                                    {accessedFiles.reduce((acc, file) => acc + (file.activityCount || 0), 0)} actions
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* Row 2 for Storage: Badge only? */}

                            </div>

                            {/* Hub Content (Headless Lists) */}
                            <div className="p-0">
                                {/* We filter the files HERE before passing explicitly */}
                                {(() => {
                                    let currentFiles: DriveFile[] = []
                                    let displayList: DriveFile[] = []

                                    if (activeTab === 'storage') {
                                        // Filter by size logic (Client side double check)
                                        currentFiles = [...storageFiles]

                                        // Sort based on user selection
                                        if (storageSortBy === 'oldest') {
                                            currentFiles.sort((a, b) => {
                                                const aTime = a.lastViewedTime ? new Date(a.lastViewedTime).getTime() : 0
                                                const bTime = b.lastViewedTime ? new Date(b.lastViewedTime).getTime() : 0
                                                return aTime - bTime // Oldest first
                                            })
                                        } else {
                                            // Sort by size (largest first)
                                            currentFiles.sort((a, b) => {
                                                const sizeA = parseInt(a.size || '0')
                                                const sizeB = parseInt(b.size || '0')
                                                return sizeB - sizeA // Largest first
                                            })
                                        }

                                        // Apply lazy loading - only show first N items
                                        currentFiles = currentFiles.slice(0, displayedCount)
                                    } else if (activeTab === 'trending') {
                                        // Filter out files with 0 activity from the Trending tab
                                        currentFiles = accessedFiles.filter(f => (f.activityCount || 0) > 0)
                                    } else if (activeTab === 'sharing') {
                                        currentFiles = sharedFiles
                                    } else {
                                        currentFiles = recentFiles
                                    }

                                    // Apply common Type Filter
                                    displayList = filterTypes.length > 0
                                        ? currentFiles.filter(f => filterTypes.includes(getFileTypeLabel(f.mimeType)))
                                        : currentFiles

                                    return activeTab === 'storage' ? (
                                        <DocumentListCard
                                            title="Large Files"
                                            icon={<HardDrive className="h-5 w-5" />}
                                            files={displayList}
                                            limit={limit}
                                            variant="flat"
                                            hideTitle={true}
                                            enableFilter={false}
                                            className="!rounded-t-none !border-none"
                                            primaryDate="modified" // or we could add 'size' support to card later
                                            isLoading={isRefreshing}
                                        />
                                    ) : activeTab === 'recent' ? (
                                        <DocumentListCard
                                            title="Recent"
                                            icon={<Clock className="h-5 w-5" />}
                                            files={displayList}
                                            limit={limit} // Just for ensuring consistency if needed, but UI is external
                                            variant="flat"
                                            hideTitle={true}
                                            enableFilter={false} // Disable internal UI
                                            className="!rounded-t-none !border-none"
                                            isLoading={isRefreshing}
                                        />
                                    ) : activeTab === 'sharing' ? (
                                        <DocumentListCard
                                            title="Sharing"
                                            icon={<Users className="h-5 w-5" />}
                                            files={displayList}
                                            limit={limit}
                                            variant="flat"
                                            hideTitle={true}
                                            enableFilter={false}
                                            showRank={false}
                                            primaryDate="modified"
                                            className="!rounded-t-none !border-none"
                                            isLoading={isRefreshing}
                                        />
                                    ) : (
                                        <DocumentListCard
                                            title="Trending"
                                            icon={<TrendingUp className="h-5 w-5" />}
                                            files={displayList}
                                            limit={limit}
                                            variant="flat"
                                            hideTitle={true}
                                            enableFilter={false} // Disable internal UI
                                            showRank={false}
                                            primaryDate="viewed"
                                            className="!rounded-t-none !border-none"
                                            isLoading={isRefreshing}
                                        />
                                    )
                                })()}

                                {/* Lazy loading trigger for Storage tab */}
                                {activeTab === 'storage' && displayedCount < storageFiles.length && (
                                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center text-sm text-gray-500">
                                        Loading more...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* 3. Action Center (Right - 33% width) */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 px-1">Action Center</h3>
                            {/* Action Tabs - Small & Pill-like */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {(['storage', 'security', 'sharing'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActionTab(tab)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${actionTab === tab
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Storage Tab Content */}
                            {actionTab === 'storage' && (
                                <>
                                    {/* Large File Upload REMOVED and moved to hub */}
                                    <FeedItem
                                        title="Stale Data Review"
                                        subtext="12 documents haven't been accessed in > 1 year."
                                        severity="info"
                                    />
                                    <FeedItem
                                        title="Space Warning"
                                        subtext="Team folder 'Marketing' is nearing quota (95%)."
                                        severity="warning"
                                    />
                                </>
                            )}

                            {/* Security Tab Content */}
                            {actionTab === 'security' && (
                                <>
                                    <FeedItem
                                        title="Critical: PII Detected"
                                        subtext="Financial_Report_2024.xlsx contains credit card numbers."
                                        severity="critical"
                                    />
                                    <FeedItem
                                        title="Public Link Access"
                                        subtext="Unusual traffic detected on 'Project_Alpha' folder."
                                        severity="warning"
                                    />
                                </>
                            )}

                            {/* Sharing Tab Content */}
                            {actionTab === 'sharing' && (
                                <>
                                    <FeedItem
                                        title="External Share Request"
                                        subtext="External user requesting access to 'Q4_Roadmap'."
                                        severity="info"
                                    />
                                    <FeedItem
                                        title="Link Expiration"
                                        subtext="Public link for 'Client_Pitch' expires in 24h."
                                        severity="info"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

