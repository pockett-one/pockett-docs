"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { getMockData, formatRelativeTime } from "@/lib/mock-data"
import { formatFileSize } from "@/lib/utils"
import { DocumentIcon } from "@/components/ui/document-icon"
import { FolderPathBreadcrumb } from "@/components/ui/folder-path-breadcrumb"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"

import { searchInsights, highlightSearchTerms, generateUniformSearchableData, getUniformSearchFields, getUniformSearchPlaceholder } from "@/lib/search-utils"
import {
  FileText,
  File,
  Clock,
  HardDrive,
  Shield,
  Star,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Archive,
  Users,
  Eye,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  ChevronRight,
  Calendar,
  BarChart3,
  Zap,
  Copy as CopyIcon,
  HelpCircle
} from "lucide-react"

type TabType = 'most_recent' | 'most_accessed' | 'stale' | 'large' | 'abandoned' | 'duplicates' | 'expiry_alert' | 'sensitive_docs' | 'risky_shares'

interface InsightsCard {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  totalCount: number
  tabs: {
    id: TabType
    label: string
    count: number
    documents: any[]
    action: string
    icon: React.ElementType
  }[]
}

function InsightsPageContent() {
  const router = useRouter()
  const [hasConnections, setHasConnections] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour, forceStartTour } = useTourGuide('Insights')

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Insights',
      content: 'This page provides intelligent analysis of your documents, helping you understand usage patterns and identify opportunities.',
      target: '.insights-header',
      position: 'bottom' as const,
      action: 'none' as const
    },
    {
      id: 'insight-cards',
      title: 'Insight Cards',
      content: 'Each card represents a different type of analysis - from recent activity to security risks. Click to explore deeper.',
      target: '.insight-card:first-child',
      position: 'bottom' as const,
      action: 'hover' as const,
      actionText: 'Hover over an insight card'
    },
    {
      id: 'tabs',
      title: 'Detailed Analysis',
      content: 'Use the tabs within each insight card to see specific documents and take action on them.',
      target: '.insight-tabs',
      position: 'top' as const,
      action: 'hover' as const,
      actionText: 'Hover over the tabs'
    },
    {
      id: 'document-actions',
      title: 'Quick Actions',
      content: 'Each document has quick actions like open, share, or archive for immediate management.',
      target: '.document-actions',
      position: 'right' as const,
      action: 'hover' as const,
      actionText: 'Hover over a document to see actions'
    },
    {
      id: 'breadcrumb-navigation',
      title: 'Smart Navigation',
      content: 'Use the breadcrumb trails to navigate to specific folders and see documents in context.',
      target: '.breadcrumb-section',
      position: 'bottom' as const,
      action: 'hover' as const,
      actionText: 'Hover over breadcrumb items'
    }
  ]

  // Ensure client-side rendering for dynamic content
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check connection status on mount and when connections change
  useEffect(() => {
    const checkConnections = () => {
      setHasConnections(shouldLoadMockData())
    }

    checkConnections()

    // Listen for connection updates
    window.addEventListener('pockett-connections-updated', checkConnections)
    window.addEventListener('storage', checkConnections)

    return () => {
      window.removeEventListener('pockett-connections-updated', checkConnections)
      window.removeEventListener('storage', checkConnections)
    }
  }, [])

  const mockData = getMockData()
  const allDocuments = mockData.documents

  // Debug: Log all security documents we added
  console.log('🔍 Debug: All security documents:', allDocuments.filter(doc =>
    doc.name.includes('SECURE_') ||
    doc.name.includes('Confidential') ||
    doc.name.includes('Payment') ||
    doc.name.includes('Salary')
  ).map(doc => ({
    name: doc.name,
    id: doc.id,
    modifiedTime: doc.modifiedTime,
    permissions: doc.permissions,
    sharing: doc.sharing,
    expiryDates: (doc.permissions || doc.sharing?.permissions || []).map((p: any) => ({
      type: (p as any).type,
      role: (p as any).role,
      expires: (p as any).expires,
      expirationTime: (p as any).expirationTime
    }))
  })))

  // Helper functions for document filtering
  const isModifiedInDays = (doc: any, days: number) => {
    const modifiedTime = new Date(doc.modifiedTime)
    const now = new Date()
    const daysDiff = (now.getTime() - modifiedTime.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= days
  }

  const isModifiedAtLeastDays = (doc: any, days: number) => {
    const modifiedTime = new Date(doc.modifiedTime)
    const now = new Date()
    const daysDiff = (now.getTime() - modifiedTime.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff >= days
  }

  const getWordCount = (doc: any) => {
    // Mock word count based on size
    return Math.floor((doc.size || 0) / 6) // Approximate 6 bytes per word
  }

  const isSmallFile = (doc: any) => {
    const wordCount = getWordCount(doc)
    const sizeKB = (doc.size || 0) / 1024
    return wordCount < 200 || sizeKB < 200
  }

  const containsSensitiveContent = (doc: any) => {
    const sensitiveKeywords = ['invoice', 'contract', 'confidential', 'payment', 'salary', 'private']
    const filename = doc.name.toLowerCase()
    return sensitiveKeywords.some(keyword => filename.includes(keyword))
  }

  // Filter documents for each category
  const getMostRecentDocs = () => {
    // Debug: Log document dates to understand the issue
    console.log('🔍 Debug: Document modified times:', allDocuments.slice(0, 5).map(doc => ({
      name: doc.name,
      modifiedTime: doc.modifiedTime,
      daysAgo: (new Date().getTime() - new Date(doc.modifiedTime).getTime()) / (1000 * 60 * 60 * 24),
      isRecent: isModifiedInDays(doc, 30)
    })))

    let recentDocs = allDocuments
      .filter(doc => isModifiedInDays(doc, 30)) // Increased from 7 to 30 days to catch more documents
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
      .slice(0, 5)

    // Fallback: if no recent docs, show the most recently modified docs regardless of date
    if (recentDocs.length === 0) {
      recentDocs = allDocuments
        .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
        .slice(0, 5)
    }

    return recentDocs
  }

  const getMostAccessedDocs = () => {
    let accessedDocs = allDocuments
      .filter(doc => (doc.accessCount > 0 || doc.engagement?.views > 0) && isModifiedInDays(doc, 30)) // Increased from 7 to 30 days
      .sort((a, b) => (b.accessCount || b.engagement?.views || 0) - (a.accessCount || a.engagement?.views || 0))
      .slice(0, 5)

    // Fallback: if no accessed docs, show docs with highest engagement regardless of date
    if (accessedDocs.length === 0) {
      accessedDocs = allDocuments
        .filter(doc => doc.accessCount > 0 || doc.engagement?.views > 0)
        .sort((a, b) => (b.accessCount || b.engagement?.views || 0) - (a.accessCount || a.engagement?.views || 0))
        .slice(0, 5)
    }

    // Final fallback: if still no docs, show any docs sorted by engagement
    if (accessedDocs.length === 0) {
      accessedDocs = allDocuments
        .sort((a, b) => (b.engagement?.views || 0) - (a.engagement?.views || 0))
        .slice(0, 5)
    }

    return accessedDocs
  }

  const getStaleDocs = () => {
    return allDocuments
      .filter(doc => isModifiedAtLeastDays(doc, 120))
      .sort((a, b) => new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime())
      .slice(0, 5)
  }

  const getLargeDocs = () => {
    return allDocuments
      .filter(doc => isModifiedAtLeastDays(doc, 90) && (doc.size || 0) > 0)
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 5)
  }

  const getAbandonedDocs = () => {
    return allDocuments
      .filter(doc => isSmallFile(doc) && isModifiedAtLeastDays(doc, 30))
      .sort((a, b) => new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime())
      .slice(0, 5)
  }

  const getDuplicateDocs = () => {
    const nameGroups: { [key: string]: any[] } = {}
    allDocuments.forEach(doc => {
      const name = doc.name.toLowerCase()
      if (!nameGroups[name]) nameGroups[name] = []
      nameGroups[name].push(doc)
    })

    const duplicates: any[] = []
    Object.values(nameGroups).forEach(group => {
      if (group.length > 1) {
        duplicates.push(...group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()))
      }
    })

    return duplicates.slice(0, 5)
  }

  const getExpiringSharedDocs = () => {
    // Debug: Log documents with permissions to understand the structure
    console.log('🔍 Debug: Documents with permissions:', allDocuments.slice(0, 5).map(doc => ({
      name: doc.name,
      permissions: doc.permissions,
      sharing: doc.sharing,
      hasExpiringPermission: (doc.permissions || doc.sharing?.permissions || []).some((p: any) => {
        const expiryField = (p as any).expires || (p as any).expirationTime
        return expiryField && new Date(expiryField) > new Date()
      }),
      expiringPermissions: (doc.permissions || doc.sharing?.permissions || []).filter((p: any) => {
        const expiryField = (p as any).expires || (p as any).expirationTime
        return expiryField && new Date(expiryField) > new Date()
      }),
      // Detailed permission breakdown
      permissionDetails: (doc.permissions || doc.sharing?.permissions || []).map((p: any) => ({
        type: (p as any).type,
        role: (p as any).role,
        expires: (p as any).expires,
        expirationTime: (p as any).expirationTime,
        hasExpiry: !!(p as any).expires || !!(p as any).expirationTime,
        expiryDate: (p as any).expires || (p as any).expirationTime
      })),
      // Check both permission arrays
      originalPermissions: doc.permissions,
      transformedPermissions: doc.sharing?.permissions
    })))

    return allDocuments
      .filter(doc => {
        // Check if document has expiring permissions - look in both permissions array and sharing.permissions
        const permissions = doc.permissions || doc.sharing?.permissions || []
        const hasExpiringPermission = permissions.some((p: any) => {
          console.log(`🔍 Checking permission for ${doc.name}:`, {
            type: (p as any).type,
            role: (p as any).role,
            expires: (p as any).expires,
            expirationTime: (p as any).expirationTime,
            allKeys: Object.keys(p as any)
          })
          const expiryField = (p as any).expires || (p as any).expirationTime
          if (expiryField) {
            const expiryDate = new Date(expiryField)
            const now = new Date()
            const isFuture = expiryDate > now
            console.log(`🔍 Expiry field check for ${doc.name}:`, {
              expiryField,
              expiryDate: expiryDate.toISOString(),
              now: now.toISOString(),
              isFuture
            })
            return isFuture
          }
          return false
        })
        const isExpiringSoon = permissions.some((p: any) => {
          const expiryField = (p as any).expires || (p as any).expirationTime
          if (expiryField) {
            const expiryDate = new Date(expiryField)
            const now = new Date()
            const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            return daysUntilExpiry <= 90 && daysUntilExpiry > 0 // Increased to 90 days to catch more expiring permissions
          }
          return false
        })
        // Also check the sharing.expiryDate field
        const hasExpiryDate = doc.sharing?.expiryDate && new Date(doc.sharing.expiryDate) > new Date()
        const isExpiryDateSoon = doc.sharing?.expiryDate && (() => {
          const expiryDate = new Date(doc.sharing.expiryDate)
          const now = new Date()
          const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          return daysUntilExpiry <= 90 && daysUntilExpiry > 0
        })()

        const result = doc.sharing?.shared && (hasExpiringPermission || isExpiringSoon || hasExpiryDate || isExpiryDateSoon)
        if (doc.name.includes('SECURE_') || doc.name.includes('Confidential') || doc.name.includes('Payment') || doc.name.includes('Salary')) {
          console.log(`🔍 Expiry check for ${doc.name}:`, {
            shared: doc.sharing?.shared,
            hasExpiringPermission,
            isExpiringSoon,
            hasExpiryDate,
            isExpiryDateSoon,
            sharingExpiryDate: doc.sharing?.expiryDate,
            result
          })
        }
        return result
      })
      .sort((a, b) => {
        // Sort by closest expiry date
        const permissionsA = a.permissions || a.sharing?.permissions || []
        const permissionsB = b.permissions || b.sharing?.permissions || []
        const aExpiry = permissionsA.find((p: any) => (p as any).expires || (p as any).expirationTime) as any
        const bExpiry = permissionsB.find((p: any) => (p as any).expires || (p as any).expirationTime) as any
        const aExpiryDate = aExpiry?.expires || aExpiry?.expirationTime
        const bExpiryDate = bExpiry?.expires || bExpiry?.expirationTime
        if (aExpiryDate && bExpiryDate) {
          return new Date(aExpiryDate).getTime() - new Date(bExpiryDate).getTime()
        }
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      })
      .slice(0, 5)
  }

  const getSensitiveDocs = () => {
    // Debug: Log sensitive documents to understand the filtering
    console.log('🔍 Debug: Sensitive documents check:', allDocuments.slice(0, 5).map(doc => ({
      name: doc.name,
      isSensitive: containsSensitiveContent(doc),
      isShared: doc.sharing?.shared,
      modifiedDaysAgo: (new Date().getTime() - new Date(doc.modifiedTime).getTime()) / (1000 * 60 * 60 * 24),
      isRecent: isModifiedInDays(doc, 30),
      wouldShow: containsSensitiveContent(doc) && doc.sharing?.shared
    })))

    return allDocuments
      .filter(doc => containsSensitiveContent(doc) && doc.sharing?.shared) // Removed time restriction - security concerns should always be shown
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
      .slice(0, 5)
  }

  const getRiskySharedDocs = () => {
    return allDocuments
      .filter(doc => doc.sharing?.permissions?.some((p: any) => p.role === 'writer' && p.type === 'anyone'))
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
      .slice(0, 5)
  }

  // Build insights cards with client-side data
  const getMostRecentDocsClient = () => isClient ? getMostRecentDocs() : []
  const getMostAccessedDocsClient = () => isClient ? getMostAccessedDocs() : []
  const getStaleDocsClient = () => isClient ? getStaleDocs() : []
  const getLargeDocsClient = () => isClient ? getLargeDocs() : []
  const getAbandonedDocsClient = () => isClient ? getAbandonedDocs() : []
  const getDuplicateDocsClient = () => isClient ? getDuplicateDocs() : []
  const getExpiringSharedDocsClient = () => isClient ? getExpiringSharedDocs() : []
  const getSensitiveDocsClient = () => isClient ? getSensitiveDocs() : []
  const getRiskySharedDocsClient = () => isClient ? getRiskySharedDocs() : []

  // Debug: Log the actual results of each security function
  if (isClient) {
    console.log('🔍 Debug: Expiry Alerts Results:', getExpiringSharedDocs().map(doc => doc.name))
    console.log('🔍 Debug: Sensitive Documents Results:', getSensitiveDocs().map(doc => doc.name))
    console.log('🔍 Debug: Risky Shares Results:', getRiskySharedDocs().map(doc => doc.name))
  }

  const insightsCards: InsightsCard[] = [
    {
      id: 'priority',
      title: 'Activity Stream',
      description: 'Recently modified and frequently accessed documents that need your attention',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      totalCount: getMostRecentDocsClient().length + getMostAccessedDocsClient().length,
      tabs: [
        {
          id: 'most_recent',
          label: 'Most Recent',
          count: getMostRecentDocsClient().length,
          documents: getMostRecentDocsClient(),
          action: 'Bookmark for quick access',
          icon: Clock
        },
        {
          id: 'most_accessed',
          label: 'Most Accessed',
          count: getMostAccessedDocsClient().length,
          documents: getMostAccessedDocsClient(),
          action: 'Bookmark for quick access',
          icon: TrendingUp
        }
      ]
    },
    {
      id: 'storage',
      title: 'Storage Optimization',
      description: 'Identify opportunities to clean up and optimize your document storage',
      icon: HardDrive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      totalCount: getStaleDocsClient().length + getLargeDocsClient().length + getAbandonedDocsClient().length + getDuplicateDocsClient().length,
      tabs: [
        {
          id: 'stale',
          label: 'Stale Documents',
          count: getStaleDocsClient().length,
          documents: getStaleDocsClient(),
          action: 'Review or archive',
          icon: Archive
        },
        {
          id: 'large',
          label: 'Large Files',
          count: getLargeDocsClient().length,
          documents: getLargeDocsClient(),
          action: 'Review to delete/archive',
          icon: BarChart3
        },
        {
          id: 'abandoned',
          label: 'Abandoned Files',
          count: getAbandonedDocsClient().length,
          documents: getAbandonedDocsClient(),
          action: 'Review to delete/archive',
          icon: Trash2
        },
        {
          id: 'duplicates',
          label: 'Duplicates',
          count: getDuplicateDocsClient().length,
          documents: getDuplicateDocsClient(),
          action: 'Merge/clean-up',
          icon: CopyIcon
        }
      ]
    },
    {
      id: 'shares',
      title: 'Sharing & Security',
      description: 'Monitor document sharing permissions and identify security risks',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      totalCount: getExpiringSharedDocsClient().length + getSensitiveDocsClient().length + getRiskySharedDocsClient().length,
      tabs: [
        {
          id: 'expiry_alert',
          label: 'Expiry Alerts',
          count: getExpiringSharedDocsClient().length,
          documents: getExpiringSharedDocsClient(),
          action: 'Extend or disable sharing',
          icon: AlertTriangle
        },
        {
          id: 'sensitive_docs',
          label: 'Sensitive Documents',
          count: getSensitiveDocsClient().length,
          documents: getSensitiveDocsClient(),
          action: 'Review/Restrict',
          icon: Eye
        },
        {
          id: 'risky_shares',
          label: 'Risky Shares',
          count: getRiskySharedDocsClient().length,
          documents: getRiskySharedDocsClient(),
          action: 'Downgrade permissions',
          icon: Users
        }
      ]
    }
  ]



  const handleBookmarkDocument = (doc: any) => {
    console.log('Bookmarking document:', doc.name)
    // TODO: Implement bookmark functionality
  }





  return (
    <AppLayout
      showTopBar={true}
      topBarProps={{
        searchableData: [
          ...insightsCards.map(card => ({
            id: card.id,
            type: 'insight_card',
            name: card.title,
            tabs: card.tabs.map((tab: any) => tab.label).join(' ')
          })),
          ...generateUniformSearchableData(mockData)
        ],
        searchFields: getUniformSearchFields(),
        enableLocalSearch: true,
        placeholder: getUniformSearchPlaceholder('insights'),
        showGlobalSearchOption: true,
        onStartTour: forceStartTour,
        showTourButton: true,
        tourButtonText: "Take Tour"
      }}
    >
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
        {/* Background Ambience */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Dot Grid */}
          <div className="absolute inset-0 opacity-[0.4]"
            style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
          </div>
          {/* Subtle Purple Haze */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="px-6 py-6 relative z-10">
          {!hasConnections ? (
            <EmptyState type="documents" />
          ) : (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Zap className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Document Insights</h1>
                      <p className="text-gray-600 text-lg">Data-driven analysis to optimize your document workspace</p>
                    </div>
                  </div>


                </div>
              </div>

              {/* Insights Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" data-tour="insight-cards">
                {insightsCards.map((card) => {
                  const IconComponent = card.icon
                  return (
                    <div
                      key={card.id}
                      className={`${card.bgColor} ${card.borderColor} border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-3 ${card.color} bg-white rounded-xl shadow-sm`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                          <p className="text-sm text-gray-600 h-12 leading-5 mb-2">{card.description}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {card.tabs.map((tab) => {
                          const TabIcon = tab.icon
                          return (
                            <div key={tab.id} className="note-card p-4 border border-gray-300 hover:border-gray-400 transition-all duration-200">
                              <div className="flex items-center justify-between mb-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                                <div className="flex items-center space-x-2">
                                  <TabIcon className={`h-4 w-4 ${card.color}`} />
                                  <span className="text-sm font-medium text-gray-700">{tab.label}</span>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.bgColor} ${card.color} border border-gray-300 shadow-sm`}>
                                  {tab.count}
                                </span>
                              </div>

                              {tab.documents.length > 0 && (
                                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 insights-scrollbar">
                                  {tab.documents.map((doc) => {
                                    return (
                                      <div key={doc.id} className="group hover:bg-gray-50 rounded-lg p-2 transition-all duration-200">
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                                            <DocumentIcon mimeType={doc.mimeType} size={12} />
                                            <div className="flex-1 min-w-0">
                                              <div className="truncate font-medium">{doc.name}</div>
                                              {doc.path && doc.path !== '/' && (
                                                <FolderPathBreadcrumb path={doc.path} />
                                              )}
                                            </div>
                                          </div>
                                          <div className="opacity-50 group-hover:opacity-100 transition-opacity duration-200 ml-2 relative">
                                            <DocumentActionMenu
                                              document={doc}
                                              onBookmarkDocument={handleBookmarkDocument}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <div className="flex items-center space-x-2">
                                  <Lightbulb className={`h-3 w-3 ${card.color}`} />
                                  <p className="text-xs text-gray-600">{tab.action}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>


            </>
          )}
        </div>



        {/* Tour Guide */}
        <TourGuide
          isOpen={isTourOpen}
          onClose={closeTour}
          steps={tourSteps}
          pageName="Insights"
          onComplete={() => console.log('🎯 Insights tour completed!')}
        />


      </div>
    </AppLayout >
  )
}

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <AppLayout
        showTopBar={true}
        topBarProps={{
          searchableData: [],
          searchFields: getUniformSearchFields(),
          enableLocalSearch: false,
          placeholder: getUniformSearchPlaceholder('insights'),
          showGlobalSearchOption: true
        }}
      >
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
          {/* Background Ambience */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.4]"
              style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="px-6 py-6 relative z-10">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    }>
      <InsightsPageContent />
    </Suspense>
  )
}