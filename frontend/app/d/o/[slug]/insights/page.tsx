"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
    Minus,
    X
} from "lucide-react"
import { getFileTypeLabel } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MostRecentFilesCard } from "@/components/dashboard/most-recent-files-card"
import { MostAccessedFilesCard } from "@/components/dashboard/most-accessed-files-card"
import { DocumentListCard } from "@/components/dashboard/document-list-card"
import { DriveFile } from "@/lib/types"
import { FileReviewModal } from "@/components/dashboard/file-review-modal"
import { DuplicateReviewModal } from "@/components/dashboard/duplicate-review-modal"
import { RiskyShareReviewModal } from "@/components/dashboard/risky-share-review-modal"

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

function FeedItem({ title, subtext, severity, onClick, loading, tooltip }: { title: string, subtext: string, severity: 'critical' | 'warning' | 'info', onClick?: () => void, loading?: boolean, tooltip?: string }) {
    if (loading) {
        return (
            <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex gap-3 animate-pulse">
                <div className="p-2 h-8 w-8 rounded-lg bg-gray-200"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        )
    }
    const styles = {
        critical: { border: 'border-red-100', bg: 'bg-red-50', icon: AlertTriangle, iconColor: 'text-red-600' },
        warning: { border: 'border-amber-100', bg: 'bg-amber-50', icon: FileWarning, iconColor: 'text-amber-600' },
        info: { border: 'border-blue-100', bg: 'bg-blue-50', icon: CheckCircle, iconColor: 'text-blue-600' }
    }
    const style = styles[severity]
    // Use Archive icon for Stale Data Review / Stale Files
    const Icon = title.includes('Stale') ? Archive : style.icon
    // Use purple styling for Stale items to match summary card
    const iconBg = title.includes('Stale') ? 'bg-purple-50' : style.bg
    const iconColor = title.includes('Stale') ? 'text-purple-600' : style.iconColor

    return (
        <div
            className={`p-4 rounded-xl border ${style.border} bg-white shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={onClick}
            title={tooltip}
        >
            <div className={`p-2 h-fit rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{title}</h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{subtext}</p>
            </div>
            {onClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick()
                    }}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${title.includes('Stale') ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                    Review
                </button>
            )}
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
                    <span>Type</span>
                    {!isAllSelected && !isNoneSelected && (
                        <span className="flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1">
                            {filterTypes.length}
                        </span>
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
                                    ? 'bg-gray-900 border-gray-900'
                                    : isNoneSelected
                                        ? 'bg-white border-gray-300'
                                        : 'bg-gray-900 border-gray-900'
                                    }`}>
                                    {isAllSelected && <Check className="h-3 w-3 text-white" />}
                                    {!isAllSelected && !isNoneSelected && <Minus className="h-3 w-3 text-white" />}
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
                                            ? 'bg-gray-900 border-gray-900'
                                            : 'bg-white border-gray-300 group-hover:border-gray-500'
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
    const [summaryMetrics, setSummaryMetrics] = useState({ stale: 0, large: 0, sensitive: 0, risky: 0 })
    const [summaryLoaded, setSummaryLoaded] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)

    // Initialize activeTab from URL or default to 'recent'
    const tabFromUrl = (searchParams?.get('tab') as 'recent' | 'trending' | 'storage' | 'sharing') || 'recent'
    const [activeTab, setActiveTab] = useState<'recent' | 'trending' | 'storage' | 'sharing'>(tabFromUrl)

    // Storage tab filters
    const [storageTimeRange, setStorageTimeRange] = useState<'4w' | 'all'>('4w') // Timeframe filter
    const [storageSizeRanges, setStorageSizeRanges] = useState<('0.5-1' | '1-5' | '5-10' | '10+')[]>(['0.5-1']) // Size range filter (multi-select)
    const [storageSortBy, setStorageSortBy] = useState<'size' | 'oldest'>('size') // Sort by size or last accessed
    const [displayedCount, setDisplayedCount] = useState(10) // For lazy loading in Storage tab

    // Lazy loading for Recent and Trending tabs (cap at 50)
    const [displayedCountRecent, setDisplayedCountRecent] = useState(10)
    const [displayedCountTrending, setDisplayedCountTrending] = useState(10)

    // Sharing tab filters and lazy loading (no cap)
    const [displayedCountSharing, setDisplayedCountSharing] = useState(10)
    const [sharingTimeRange, setSharingTimeRange] = useState<'4w' | 'all'>('4w')
    const [sharingRiskLevels, setSharingRiskLevels] = useState<('risk' | 'attention' | 'sensitive' | 'no_risk')[]>(['risk', 'attention', 'sensitive', 'no_risk']) // All selected by default
    const [sharingDirections, setSharingDirections] = useState<('shared_by_you' | 'shared_with_you')[]>(['shared_by_you', 'shared_with_you']) // Multi-select with both selected
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isSizeFilterOpen, setIsSizeFilterOpen] = useState(false)
    const [isRiskFilterOpen, setIsRiskFilterOpen] = useState(false)
    const [isDirectionFilterOpen, setIsDirectionFilterOpen] = useState(false)

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

    // Action Center State
    const [isStaleReviewOpen, setIsStaleReviewOpen] = useState(false)

    const staleFiles = useMemo(() => {
        // Filter storage files for 'stale' badge
        return storageFiles.filter(f => f.badges?.some(b => b.type === 'stale'))
    }, [storageFiles])

    // Specific stale files for the modal (fetched on open)
    const [staleDetailFiles, setStaleDetailFiles] = useState<DriveFile[]>([])
    const [isStaleLoading, setIsStaleLoading] = useState(false)

    const fetchStaleFiles = () => {
        if (staleDetailFiles.length === 0 && !isStaleLoading && session?.access_token) {
            setIsStaleLoading(true)
            fetch('/api/drive-action', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'stale_search', limit: 100 })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.files) setStaleDetailFiles(data.files)
                })
                .catch(e => console.error("Stale fetch failed", e))
                .finally(() => setIsStaleLoading(false))
        }
    }

    const handleTrashFiles = async (fileIds: string[]) => {
        try {
            await Promise.allSettled(fileIds.map(id =>
                fetch('/api/drive-action', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'trash', fileId: id })
                })
            ))

            // Refresh local state
            setStorageFiles(prev => prev.filter(f => !fileIds.includes(f.id)))
            setSummaryMetrics(prev => ({ ...prev, stale: Math.max(0, prev.stale - fileIds.length) }))
        } catch (e) {
            console.error("Failed to trash files", e)
        }
    }

    // Duplicate Review State
    const [isDuplicateReviewOpen, setIsDuplicateReviewOpen] = useState(false)
    const [duplicateGroups, setDuplicateGroups] = useState<any[]>([])

    // Fetch Duplicates when Storage tab action is active
    useEffect(() => {
        if (actionTab === 'storage' && session?.access_token && duplicateGroups.length === 0) {
            fetch('/api/drive-action', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'duplicate_search', limit: 20 })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.duplicates) setDuplicateGroups(data.duplicates)
                })
                .catch(e => console.error("Duplicate fetch failed", e))
        }
    }, [actionTab, session, duplicateGroups.length])

    // Risky Share Review State
    const [isRiskyReviewOpen, setIsRiskyReviewOpen] = useState(false)
    const riskyFiles = useMemo(() => {
        return sharedFiles.filter(f => f.badges?.some(b => b.type === 'risk' || b.type === 'sensitive'))
    }, [sharedFiles])


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
                // BLOCKED: Legacy Global Insights (Moving to Project Scope)
                // if (!quota) {
                // const res = await fetch(`/api/drive-metrics?limit=${limit}&range=${recentTimeRange}`, { headers })
                // if (res.ok) {
                //     const data = await res.json()
                //     setIsConnected(!!data.isConnected)
                // ...
                // }
                // }

                // Check for active Google Drive connector
                const connectorRes = await fetch('/api/connectors/google-drive?action=status', { headers })
                if (connectorRes.ok) {
                    const connectorData = await connectorRes.json()
                    setIsConnected(!!connectorData.isConnected)
                } else {
                    console.warn('Failed to check connector status')
                    setIsConnected(false)
                }

                setIsRefreshing(false)

            } catch (err) {
                console.error('Failed to load insights data', err)
                setIsRefreshing(false)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [session, limit, recentTimeRange, accessedTimeRange, activeTab, storageSizeRanges, storageTimeRange, refreshTrigger])

    // Fetch summary metrics from dedicated API endpoint (/api/drive-summary)
    // Fetches comprehensive Drive data (1000 files) and calculates metrics server-side
    // Lazy-loaded with 5-minute caching to avoid performance impact
    useEffect(() => {
        async function loadSummaryMetrics() {
            if (!session?.access_token || !isConnected) return

            // Check cache first (valid for 5 minutes)
            const cacheKey = 'insights_summary_metrics'
            const cacheTimestampKey = 'insights_summary_metrics_timestamp'
            const cachedData = localStorage.getItem(cacheKey)
            const cachedTimestamp = localStorage.getItem(cacheTimestampKey)

            if (cachedData && cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp)
                const fiveMinutes = 5 * 60 * 1000

                // Only use cache if NOT refreshing manually and cache is fresh
                if (refreshTrigger === 0 && age < fiveMinutes) {
                    // Use cached data
                    console.log('[Frontend] Using cached summary metrics:', JSON.parse(cachedData))
                    setSummaryMetrics(JSON.parse(cachedData))
                    setSummaryLoaded(true)
                    return
                }
            }

            try {
                console.log('[Frontend] Fetching fresh summary metrics from /api/drive-summary')
                const headers = { 'Authorization': `Bearer ${session.access_token}` }
                const res = await fetch(`/api/drive-summary`, { headers })

                if (res.ok) {
                    const data = await res.json()
                    console.log('[Frontend] Received summary metrics:', data)
                    const metrics = {
                        stale: data.stale || 0,
                        large: data.large || 0,
                        sensitive: data.sensitive || 0,
                        risky: data.risky || 0
                    }
                    setSummaryMetrics(metrics)
                    setSummaryLoaded(true)

                    // Cache the results
                    localStorage.setItem(cacheKey, JSON.stringify(metrics))
                    localStorage.setItem(cacheTimestampKey, Date.now().toString())
                } else {
                    console.error('[Frontend] Failed to fetch summary metrics:', res.status, res.statusText)
                }
            } catch (err) {
                console.error('Failed to load summary metrics', err)
            }
        }

        // Lazy load after 2 seconds to not block initial render
        if (isConnected) {
            const timer = setTimeout(() => {
                loadSummaryMetrics()
            }, 2000)

            return () => clearTimeout(timer)
        }
    }, [session, isConnected, refreshTrigger])

    // Memoized filtered shared files for Sharing tab (Client-side filtering)
    const filteredSharedFiles = useMemo(() => {
        let filtered = [...sharedFiles]

        // Debug: Check what lastAction values exist
        console.log('[Sharing Filter] Total shared files:', sharedFiles.length)
        console.log('[Sharing Filter] Sample lastAction values:', sharedFiles.slice(0, 5).map(f => ({ name: f.name, lastAction: f.lastAction })))
        console.log('[Sharing Filter] Selected directions:', sharingDirections)

        // 1. Timeframe Filter
        if (sharingTimeRange === '4w') {
            const fourWeeksAgo = new Date()
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
            filtered = filtered.filter(f => {
                const date = f.sharedTime || f.modifiedTime
                return date && new Date(date) > fourWeeksAgo
            })
        }

        // 2. Risk Level Filter (multi-select with no_risk option)
        if (sharingRiskLevels.length > 0) {
            filtered = filtered.filter(f => {
                const hasRiskBadge = f.badges?.some(b => b.type === 'risk')
                const hasAttentionBadge = f.badges?.some(b => b.type === 'attention')
                const hasSensitiveBadge = f.badges?.some(b => b.type === 'sensitive')
                const hasNoRiskBadge = !hasRiskBadge && !hasAttentionBadge && !hasSensitiveBadge

                // Check if file matches any selected risk level
                if (sharingRiskLevels.includes('risk') && hasRiskBadge) return true
                if (sharingRiskLevels.includes('attention') && hasAttentionBadge) return true
                if (sharingRiskLevels.includes('sensitive') && hasSensitiveBadge) return true
                if (sharingRiskLevels.includes('no_risk') && hasNoRiskBadge) return true

                return false
            })
        }

        // 3. Sharing Direction Filter (multi-select)
        // Only filter if both directions are not selected (when both selected, show all)
        if (sharingDirections.length > 0 && sharingDirections.length < 2) {
            filtered = filtered.filter(f => {
                // Note: lastAction values from API are "Shared By You" and "Shared With You" (with capitals and spaces)
                if (sharingDirections.includes('shared_by_you') && f.lastAction === 'Shared By You') return true
                if (sharingDirections.includes('shared_with_you') && f.lastAction === 'Shared With You') return true
                return false
            })
        }

        console.log('[Sharing Filter] After direction filter:', filtered.length)

        return filtered
    }, [sharedFiles, sharingTimeRange, sharingRiskLevels, sharingDirections])

    // Initialize filterTypes with all available types by default

    // Initialize filterTypes with all available types by default
    useEffect(() => {
        if (filterTypes.length === 0 && (recentFiles.length > 0 || accessedFiles.length > 0 || storageFiles.length > 0 || sharedFiles.length > 0)) {
            const allFiles = [...recentFiles, ...accessedFiles, ...storageFiles, ...sharedFiles]
            const availableTypes = Array.from(new Set(allFiles.map(f => getFileTypeLabel(f.mimeType)))).sort()
            if (availableTypes.length > 0) {
                setFilterTypes(availableTypes)
            }
        }
    }, [recentFiles, accessedFiles, storageFiles, sharedFiles])

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

    // Lazy loading for Recent and Trending tabs (cap at 50)
    useEffect(() => {
        if (activeTab !== 'recent' && activeTab !== 'trending') return

        const files = activeTab === 'recent' ? recentFiles : accessedFiles
        const displayedCount = activeTab === 'recent' ? displayedCountRecent : displayedCountTrending
        const setDisplayedCount = activeTab === 'recent' ? setDisplayedCountRecent : setDisplayedCountTrending

        // Create intersection observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayedCount < Math.min(files.length, 50)) {
                    setDisplayedCount(prev => Math.min(prev + 10, Math.min(files.length, 50)))
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
    }, [activeTab, displayedCountRecent, displayedCountTrending, recentFiles.length, accessedFiles.length])

    // Lazy loading for Sharing tab (no cap)
    useEffect(() => {
        if (activeTab !== 'sharing') return

        // Create intersection observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayedCountSharing < filteredSharedFiles.length) {
                    setDisplayedCountSharing(prev => Math.min(prev + 10, filteredSharedFiles.length))
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
    }, [activeTab, displayedCountSharing, filteredSharedFiles.length])

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
        return (
            <div className="min-h-screen bg-white p-8 flex items-center justify-center">
                <LoadingSpinner size="lg" message="Loading insights..." />
            </div>
        )
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

                {/* 1. Storage Usage Visualization */}
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

                {/* 2. Health Check Row - Summary Cards with slide-in animation */}
                {summaryLoaded && (
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
                        style={{ animationDelay: '100ms' }}
                    >
                        {/* Stale Documents */}
                        <div
                            onClick={() => setIsStaleReviewOpen(true)}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer hover:bg-gray-50 transition-colors group"
                            style={{ animationDelay: '200ms' }}
                            title="Files not accessed in over 6 months"
                        >
                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                <Archive className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{summaryMetrics.stale}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-500 font-medium">Stale Documents</p>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Review</span>
                                </div>
                            </div>
                        </div>

                        {/* Large Files */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '300ms' }}>
                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                <BarChart className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{summaryMetrics.large}</p>
                                <p className="text-xs text-gray-500 font-medium mt-1">Large Files</p>
                            </div>
                        </div>

                        {/* Sensitive Content */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '400ms' }}>
                            <div className="p-3 rounded-xl bg-green-50 text-green-600">
                                <FileWarning className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{summaryMetrics.sensitive}</p>
                                <p className="text-xs text-gray-500 font-medium mt-1">Sensitive Content</p>
                            </div>
                        </div>

                        {/* Risky Shares */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '500ms' }}>
                            <div className="p-3 rounded-xl bg-green-50 text-green-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{summaryMetrics.risky}</p>
                                <p className="text-xs text-gray-500 font-medium mt-1">Risky Shares</p>
                            </div>
                        </div>
                    </div>
                )}

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
                        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm flex flex-col">
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
                                    ) : activeTab === 'sharing' ? (
                                        <div className="flex gap-2">
                                            {/* Timeframe Filter */}
                                            <div className="flex bg-gray-200/50 p-0.5 rounded-lg">
                                                <button
                                                    onClick={() => setSharingTimeRange('4w')}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${sharingTimeRange === '4w'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    4w
                                                </button>
                                                <button
                                                    onClick={() => setSharingTimeRange('all')}
                                                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${sharingTimeRange === 'all'
                                                        ? 'bg-white text-purple-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    All Time
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
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
                                        // Custom Filter UI for Storage tab
                                        <div className="flex gap-2 items-center">
                                            {/* Standalone Filter Icon */}
                                            <Filter className="h-4 w-4 text-gray-500" />

                                            {/* Type Filter Dropdown */}
                                            <div className="relative">
                                                {isFilterOpen && <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>}

                                                <button
                                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                                                >
                                                    <span>Type</span>
                                                    {filterTypes.length > 0 && filterTypes.length < Array.from(new Set(storageFiles.map(f => getFileTypeLabel(f.mimeType)))).length && (
                                                        <span className="flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1">
                                                            {filterTypes.length}
                                                        </span>
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
                                                            {(() => {
                                                                const availableTypes = Array.from(new Set(storageFiles.map(f => getFileTypeLabel(f.mimeType)))).sort()
                                                                const isAllSelected = availableTypes.length > 0 && filterTypes.length === availableTypes.length
                                                                const isNoneSelected = filterTypes.length === 0

                                                                return (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setFilterTypes(isAllSelected ? [] : availableTypes)}
                                                                            className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                        >
                                                                            <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllSelected
                                                                                ? 'bg-gray-900 border-gray-900'
                                                                                : isNoneSelected
                                                                                    ? 'bg-white border-gray-300'
                                                                                    : 'bg-gray-900 border-gray-900'
                                                                                }`}>
                                                                                {isAllSelected && <Check className="h-3 w-3 text-white" />}
                                                                                {!isAllSelected && !isNoneSelected && <Minus className="h-3 w-3 text-white" />}
                                                                            </div>
                                                                            <span className="text-gray-700">All Files</span>
                                                                        </button>
                                                                        {availableTypes.map(type => {
                                                                            const isSelected = filterTypes.includes(type)
                                                                            return (
                                                                                <button
                                                                                    key={type}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setFilterTypes(
                                                                                            isSelected
                                                                                                ? filterTypes.filter(t => t !== type)
                                                                                                : [...filterTypes, type]
                                                                                        )
                                                                                    }}
                                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 group transition-colors"
                                                                                >
                                                                                    <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected
                                                                                        ? 'bg-gray-900 border-gray-900'
                                                                                        : 'bg-white border-gray-300 group-hover:border-gray-500'
                                                                                        }`}>
                                                                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                                    </div>
                                                                                    <span className={isSelected ? "font-medium text-gray-900" : ""}>{type}</span>
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Size Range Multi-Select */}
                                            <div className="relative">
                                                {isSizeFilterOpen && <div className="fixed inset-0 z-10" onClick={() => setIsSizeFilterOpen(false)}></div>}

                                                <button
                                                    onClick={() => setIsSizeFilterOpen(!isSizeFilterOpen)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                                                >
                                                    <span>Size</span>
                                                    {storageSizeRanges.length > 0 && storageSizeRanges.length < 4 && (
                                                        <span className="flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1">
                                                            {storageSizeRanges.length}
                                                        </span>
                                                    )}
                                                    <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isSizeFilterOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isSizeFilterOpen && (
                                                    <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100">
                                                        <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Size Range</span>
                                                            <button
                                                                onClick={() => setIsSizeFilterOpen(false)}
                                                                className="text-[10px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-2 py-0.5 rounded transition-colors"
                                                            >
                                                                Done
                                                            </button>
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                            {(() => {
                                                                const allSizeRanges: ('0.5-1' | '1-5' | '5-10' | '10+')[] = ['0.5-1', '1-5', '5-10', '10+']
                                                                const sizeLabels = {
                                                                    '0.5-1': '0.5GB - 1GB',
                                                                    '1-5': '1GB - 5GB',
                                                                    '5-10': '5GB - 10GB',
                                                                    '10+': '> 10GB'
                                                                }
                                                                const isAllSelected = storageSizeRanges.length === allSizeRanges.length
                                                                const isNoneSelected = storageSizeRanges.length === 0

                                                                return (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setStorageSizeRanges(isAllSelected ? [] : allSizeRanges)}
                                                                            className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                        >
                                                                            <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllSelected
                                                                                ? 'bg-gray-900 border-gray-900'
                                                                                : isNoneSelected
                                                                                    ? 'bg-white border-gray-300'
                                                                                    : 'bg-gray-900 border-gray-900'
                                                                                }`}>
                                                                                {isAllSelected && <Check className="h-3 w-3 text-white" />}
                                                                                {!isAllSelected && !isNoneSelected && <Minus className="h-3 w-3 text-white" />}
                                                                            </div>
                                                                            <span className="text-gray-700">All Sizes</span>
                                                                        </button>
                                                                        <div className="h-px bg-gray-100 my-1"></div>
                                                                        {allSizeRanges.map(range => {
                                                                            const isSelected = storageSizeRanges.includes(range)
                                                                            return (
                                                                                <button
                                                                                    key={range}
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            setStorageSizeRanges(storageSizeRanges.filter(r => r !== range))
                                                                                        } else {
                                                                                            setStorageSizeRanges([...storageSizeRanges, range])
                                                                                        }
                                                                                    }}
                                                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                                >
                                                                                    <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'
                                                                                        }`}>
                                                                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                                    </div>
                                                                                    <span className="text-gray-700">{sizeLabels[range]}</span>
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular filter controls for other tabs (Recent, Trending, Sharing)
                                        <div className="flex gap-2 items-center">
                                            {/* Standalone Filter Icon */}
                                            <Filter className="h-4 w-4 text-gray-500" />

                                            <ActivityFilterControls
                                                limit={limit}
                                                onLimitChange={handleLimitChange}
                                                activeFiles={activeTab === 'recent' ? recentFiles : (activeTab === 'sharing' ? sharedFiles : accessedFiles)}
                                                filterTypes={filterTypes}
                                                onFilterChange={setFilterTypes}
                                            />

                                            {/* Sharing Tab Extra Filters */}
                                            {activeTab === 'sharing' && (
                                                <>
                                                    {/* Risk Level Dropdown */}
                                                    <div className="relative">
                                                        {isRiskFilterOpen && <div className="fixed inset-0 z-10" onClick={() => setIsRiskFilterOpen(false)}></div>}
                                                        <button
                                                            onClick={() => setIsRiskFilterOpen(!isRiskFilterOpen)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                                                        >
                                                            <span>Risk Level</span>
                                                            {sharingRiskLevels.length > 0 && sharingRiskLevels.length < 4 && (
                                                                <span className="flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1">
                                                                    {sharingRiskLevels.length}
                                                                </span>
                                                            )}
                                                            <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isRiskFilterOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {isRiskFilterOpen && (
                                                            <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100">
                                                                <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Level</span>
                                                                    <button
                                                                        onClick={() => setIsRiskFilterOpen(false)}
                                                                        className="text-[10px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-2 py-0.5 rounded transition-colors"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                    <button
                                                                        onClick={() => {
                                                                            const isSelected = sharingRiskLevels.includes('risk')
                                                                            // Prevent deselecting if it's the only one selected
                                                                            if (isSelected && sharingRiskLevels.length === 1) return

                                                                            if (isSelected) {
                                                                                setSharingRiskLevels(sharingRiskLevels.filter(r => r !== 'risk'))
                                                                            } else {
                                                                                setSharingRiskLevels([...sharingRiskLevels, 'risk'])
                                                                            }
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sharingRiskLevels.includes('risk') ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                                                            {sharingRiskLevels.includes('risk') && <Check className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-medium">RISK</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const isSelected = sharingRiskLevels.includes('attention')
                                                                            // Prevent deselecting if it's the only one selected
                                                                            if (isSelected && sharingRiskLevels.length === 1) return

                                                                            if (isSelected) {
                                                                                setSharingRiskLevels(sharingRiskLevels.filter(r => r !== 'attention'))
                                                                            } else {
                                                                                setSharingRiskLevels([...sharingRiskLevels, 'attention'])
                                                                            }
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sharingRiskLevels.includes('attention') ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                                                            {sharingRiskLevels.includes('attention') && <Check className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium">ATTENTION</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const isSelected = sharingRiskLevels.includes('sensitive')
                                                                            // Prevent deselecting if it's the only one selected
                                                                            if (isSelected && sharingRiskLevels.length === 1) return

                                                                            if (isSelected) {
                                                                                setSharingRiskLevels(sharingRiskLevels.filter(r => r !== 'sensitive'))
                                                                            } else {
                                                                                setSharingRiskLevels([...sharingRiskLevels, 'sensitive'])
                                                                            }
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sharingRiskLevels.includes('sensitive') ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                                                            {sharingRiskLevels.includes('sensitive') && <Check className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-medium">SENSITIVE</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const isSelected = sharingRiskLevels.includes('no_risk')
                                                                            // Prevent deselecting if it's the only one selected
                                                                            if (isSelected && sharingRiskLevels.length === 1) return

                                                                            if (isSelected) {
                                                                                setSharingRiskLevels(sharingRiskLevels.filter(r => r !== 'no_risk'))
                                                                            } else {
                                                                                setSharingRiskLevels([...sharingRiskLevels, 'no_risk'])
                                                                            }
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sharingRiskLevels.includes('no_risk') ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                                                            {sharingRiskLevels.includes('no_risk') && <Check className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">NO RISK</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Direction Dropdown */}
                                                    <div className="relative">
                                                        {isDirectionFilterOpen && <div className="fixed inset-0 z-10" onClick={() => setIsDirectionFilterOpen(false)}></div>}
                                                        <button
                                                            onClick={() => setIsDirectionFilterOpen(!isDirectionFilterOpen)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                                                        >
                                                            <span>Direction</span>
                                                            {sharingDirections.length > 0 && sharingDirections.length < 2 && (
                                                                <span className="flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1">
                                                                    {sharingDirections.length}
                                                                </span>
                                                            )}
                                                            <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isDirectionFilterOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {isDirectionFilterOpen && (
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100">
                                                                <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direction</span>
                                                                    <button
                                                                        onClick={() => setIsDirectionFilterOpen(false)}
                                                                        className="text-[10px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-2 py-0.5 rounded transition-colors"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                    <button
                                                                        onClick={() => {
                                                                            const isSelected = sharingDirections.includes('shared_by_you')
                                                                            // Prevent deselecting if it's the only one selected
                                                                            if (isSelected && sharingDirections.length === 1) return

                                                                            if (isSelected) {
                                                                                setSharingDirections(sharingDirections.filter(d => d !== 'shared_by_you'))
                                                                            } else {
                                                                                setSharingDirections([...sharingDirections, 'shared_by_you'])
                                                                            }
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sharingDirections.includes('shared_by_you') ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                                                            {sharingDirections.includes('shared_by_you') && <Check className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className="text-gray-700">Shared By You</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const isSelected = sharingDirections.includes('shared_with_you')
                                                                            // Prevent deselecting if it's the only one selected
                                                                            if (isSelected && sharingDirections.length === 1) return

                                                                            if (isSelected) {
                                                                                setSharingDirections(sharingDirections.filter(d => d !== 'shared_with_you'))
                                                                            } else {
                                                                                setSharingDirections([...sharingDirections, 'shared_with_you'])
                                                                            }
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sharingDirections.includes('shared_with_you') ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                                                                            {sharingDirections.includes('shared_with_you') && <Check className="h-3 w-3 text-white" />}
                                                                        </div>
                                                                        <span className="text-gray-700">Shared With You</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
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
                                                <span>{storageFiles.length} large file(s)</span>
                                            </>
                                        ) : activeTab === 'sharing' ? (
                                            <>
                                                <Users className="h-3 w-3" />
                                                <span>{filteredSharedFiles.length} shared file(s)</span>
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
                                                const sizeA = Number(a.size || 0)
                                                const sizeB = Number(b.size || 0)
                                                return sizeB - sizeA // Largest first
                                            })
                                        }

                                        // Apply lazy loading - only show first N items
                                        currentFiles = currentFiles.slice(0, displayedCount)
                                    } else if (activeTab === 'trending') {
                                        // Filter out files with 0 activity from the Trending tab
                                        currentFiles = accessedFiles.filter(f => (f.activityCount || 0) > 0)
                                        // Apply lazy loading - cap at 50, show first N items
                                        currentFiles = currentFiles.slice(0, Math.min(displayedCountTrending, 50))
                                    } else if (activeTab === 'sharing') {
                                        currentFiles = filteredSharedFiles
                                        // 3. Lazy Loading (No Cap)
                                        currentFiles = currentFiles.slice(0, displayedCountSharing)
                                    } else {
                                        // Recent tab
                                        currentFiles = recentFiles
                                        // Apply lazy loading - cap at 50, show first N items
                                        currentFiles = currentFiles.slice(0, Math.min(displayedCountRecent, 50))
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

                                {/* Lazy loading trigger for Storage, Recent, and Trending tabs */}
                                {activeTab === 'storage' && displayedCount < storageFiles.length && (
                                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center text-sm text-gray-500">
                                        Loading more...
                                    </div>
                                )}
                                {activeTab === 'recent' && displayedCountRecent < Math.min(recentFiles.length, 50) && (
                                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center text-sm text-gray-500">
                                        Loading more... (max 50)
                                    </div>
                                )}
                                {activeTab === 'trending' && displayedCountTrending < Math.min(accessedFiles.filter(f => (f.activityCount || 0) > 0).length, 50) && (
                                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center text-sm text-gray-500">
                                        Loading more... (max 50)
                                    </div>
                                )}
                                {activeTab === 'sharing' && displayedCountSharing < filteredSharedFiles.length && (
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
                                        title="Stale Files"
                                        subtext={`${summaryMetrics.stale} documents haven't been accessed in > 6 months.`}
                                        severity="info"
                                        onClick={() => {
                                            setIsStaleReviewOpen(true)
                                            fetchStaleFiles()
                                        }}
                                        loading={!summaryLoaded}
                                        tooltip="Files inactive for more than 6 months"
                                    />
                                    {duplicateGroups.length > 0 && (
                                        <FeedItem
                                            title="Duplicate Files Detected"
                                            subtext={`Found ${duplicateGroups.length} groups of duplicates. Potentially save space.`}
                                            severity="warning"
                                            onClick={() => setIsDuplicateReviewOpen(true)}
                                        />
                                    )}
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
                                        title="Critical: PII & Risks"
                                        subtext={`${summaryMetrics.risky} files have public access or sensitive data.`}
                                        severity="critical"
                                        onClick={() => setIsRiskyReviewOpen(true)}
                                        loading={!summaryLoaded}
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

            <FileReviewModal
                isOpen={isStaleReviewOpen}
                onClose={() => setIsStaleReviewOpen(false)}
                title="Stale Files"
                description="The following files haven't been accessed in over 6 months. Review and move them to trash to save space."
                isLoading={isStaleLoading}
                files={staleDetailFiles.map(f => ({
                    id: f.id,
                    name: f.name,
                    size: parseInt(String(f.size || '0')),
                    modifiedTime: f.modifiedTime,
                    iconLink: f.iconLink,
                    mimeType: f.mimeType,
                    reason: 'Inactive > 90 days',
                    owner: f.owners?.[0]?.emailAddress || f.owners?.[0]?.displayName || f.lastModifyingUser?.displayName,
                    location: f.parentName,
                    badges: f.badges,
                    activityTimestamp: f.activityTimestamp
                }))}
                onConfirm={async (ids) => {
                    await handleTrashFiles(ids)
                    // Update local list
                    setStaleDetailFiles(prev => prev.filter(f => !ids.includes(f.id)))
                }}
                confirmLabel="Move to Trash"
            />

            <DuplicateReviewModal
                isOpen={isDuplicateReviewOpen}
                onClose={() => setIsDuplicateReviewOpen(false)}
                groups={duplicateGroups}
                onTrash={handleTrashFiles}
            />

            <RiskyShareReviewModal
                isOpen={isRiskyReviewOpen}
                onClose={() => setIsRiskyReviewOpen(false)}
                files={riskyFiles}
                onUpdate={() => {
                    // Ideally trigger a refresh of shared files
                    setRefreshTrigger(prev => prev + 1)
                }}
            />
        </div>
    )
}

