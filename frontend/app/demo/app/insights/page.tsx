"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { getMockData, formatRelativeTime, formatFileSize, getFileIconComponent } from "@/lib/mock-data"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { 
  FileText,
  File,
  Pin,
  Clock,
  HardDrive,
  Shield,
  Bookmark,
  Eye,
  Archive,
  UserRound,
  Lightbulb
} from "lucide-react"

type TabType = 'most_recent' | 'most_accessed' | 'stale' | 'large' | 'abandoned' | 'duplicates' | 'expiry_alert' | 'sensitive_docs' | 'risky_shares'

interface InsightsCard {
  id: string
  title: string
  icon: React.ElementType
  totalCount: number
  tabs: {
    id: TabType
    label: string
    count: number
    documents: any[]
    action: string
  }[]
}

function InsightsPageContent() {
  const [hasConnections, setHasConnections] = useState(true)
  const [activeTabs, setActiveTabs] = useState<{[key: string]: TabType}>({
    focus: 'most_recent',
    storage: 'stale',
    shares: 'expiry_alert'
  })
  const [typingMessages, setTypingMessages] = useState<{[key: string]: string}>({})
  const [showTyping, setShowTyping] = useState<{[key: string]: boolean}>({})
  const [isClient, setIsClient] = useState(false)

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
    return allDocuments
      .filter(doc => isModifiedInDays(doc, 7))
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
      .slice(0, 5)
  }

  const getMostAccessedDocs = () => {
    return allDocuments
      .filter(doc => (doc.accessCount > 0 || doc.engagement?.viewCount > 0) && isModifiedInDays(doc, 7))
      .sort((a, b) => (b.accessCount || b.engagement?.viewCount || 0) - (a.accessCount || a.engagement?.viewCount || 0))
      .slice(0, 5)
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
      .slice(0, 10)
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
    // Mock expiring docs (documents shared in the past that might expire soon)
    return allDocuments
      .filter(doc => doc.sharing?.shared && isModifiedInDays(doc, 30))
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
      .slice(0, 5)
  }

  const getSensitiveDocs = () => {
    return allDocuments
      .filter(doc => containsSensitiveContent(doc) && doc.sharing?.shared && isModifiedInDays(doc, 7))
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

  const insightsCards: InsightsCard[] = [
    {
      id: 'focus',
      title: 'Focus',
      icon: Bookmark,
      totalCount: getMostRecentDocsClient().length + getMostAccessedDocsClient().length,
      tabs: [
        {
          id: 'most_recent',
          label: 'Most Recent',
          count: getMostRecentDocsClient().length,
          documents: getMostRecentDocsClient(),
          action: 'Bookmark for quick access'
        },
        {
          id: 'most_accessed',
          label: 'Most Accessed',
          count: getMostAccessedDocsClient().length,
          documents: getMostAccessedDocsClient(),
          action: 'Bookmark for quick access'
        }
      ]
    },
    {
      id: 'storage',
      title: 'Storage',
      icon: HardDrive,
      totalCount: getStaleDocsClient().length + getLargeDocsClient().length + getAbandonedDocsClient().length + getDuplicateDocsClient().length,
      tabs: [
        {
          id: 'stale',
          label: 'Stale',
          count: getStaleDocsClient().length,
          documents: getStaleDocsClient(),
          action: 'Review or archive'
        },
        {
          id: 'large',
          label: 'Large',
          count: getLargeDocsClient().length,
          documents: getLargeDocsClient(),
          action: 'Review to delete/archive'
        },
        {
          id: 'abandoned',
          label: 'Abandoned',
          count: getAbandonedDocsClient().length,
          documents: getAbandonedDocsClient(),
          action: 'Review to delete/archive'
        },
        {
          id: 'duplicates',
          label: 'Duplicates',
          count: getDuplicateDocsClient().length,
          documents: getDuplicateDocsClient(),
          action: 'Merge/clean-up'
        }
      ]
    },
    {
      id: 'shares',
      title: 'Shares',
      icon: Shield,
      totalCount: getExpiringSharedDocsClient().length + getSensitiveDocsClient().length + getRiskySharedDocsClient().length,
      tabs: [
        {
          id: 'expiry_alert',
          label: 'Expiry Alert',
          count: getExpiringSharedDocsClient().length,
          documents: getExpiringSharedDocsClient(),
          action: 'Extend or disable sharing'
        },
        {
          id: 'sensitive_docs',
          label: 'Sensitive Docs',
          count: getSensitiveDocsClient().length,
          documents: getSensitiveDocsClient(),
          action: 'Review/Restrict'
        },
        {
          id: 'risky_shares',
          label: 'Risky Shares',
          count: getRiskySharedDocsClient().length,
          documents: getRiskySharedDocsClient(),
          action: 'Downgrade to viewer/commenter'
        }
      ]
    }
  ]

  // LLM persona messages
  const getPersonaMessage = (cardId: string, tabId: TabType) => {
    const messages: {[key: string]: string} = {
      'focus-most_recent': "Here are 5 docs that were most recently modified. Would you like to Pin them for quick access?",
      'focus-most_accessed': "Here are 5 docs that were most accessed in the last week. Would you like to Pin them for quick access?",
      'storage-stale': "I found documents that haven't been touched in over 120 days. Consider archiving these to free up space.",
      'storage-large': "These are your largest files that haven't been accessed in 90+ days. Review them for cleanup opportunities.",
      'storage-abandoned': "These small files seem abandoned - less than 200 words or 200KB. Time to declutter?",
      'storage-duplicates': "I detected files with similar names. These might be duplicates worth cleaning up.",
      'shares-expiry_alert': "Some shared documents may be expiring soon or have already expired. Review the sharing settings.",
      'shares-sensitive_docs': "I found documents with sensitive content that are currently shared. Please review their permissions.",
      'shares-risky_shares': "These documents have risky sharing settings (anyone with link can edit). Consider downgrading permissions."
    }
    return messages[`${cardId}-${tabId}`] || "Let me analyze these documents for you..."
  }

  // Typing animation effect
  useEffect(() => {
    Object.entries(activeTabs).forEach(([cardId, tabId]) => {
      const messageKey = `${cardId}-${tabId}`
      const message = getPersonaMessage(cardId, tabId)

      setShowTyping(prev => ({ ...prev, [messageKey]: true }))
      setTypingMessages(prev => ({ ...prev, [messageKey]: '' }))

      let index = 0
      const interval = setInterval(() => {
        if (index < message.length) {
          setTypingMessages(prev => ({ 
            ...prev, 
            [messageKey]: message.substring(0, index + 1) 
          }))
          index++
        } else {
          clearInterval(interval)
          setTimeout(() => {
            setShowTyping(prev => ({ ...prev, [messageKey]: false }))
          }, 1000)
        }
      }, 50)

      // Cleanup function for this specific interval
      setTimeout(() => clearInterval(interval), message.length * 50 + 1000)
    })
  }, [activeTabs])

  const handleTabChange = (cardId: string, tabId: TabType) => {
    setActiveTabs(prev => ({ ...prev, [cardId]: tabId }))
  }

  const handleBookmarkDocument = (doc: any) => {
    console.log('Bookmarking document:', doc.name)
    // TODO: Implement bookmark functionality
  }

  const handleReviewDocument = (doc: any) => {
    console.log('Reviewing document:', doc.name)
    // TODO: Implement review functionality
  }

  const handleArchiveDocument = (doc: any) => {
    console.log('Archiving document:', doc.name)
    // TODO: Implement archive functionality
  }

  const handleRestrictDocument = (doc: any) => {
    console.log('Restricting document:', doc.name)
    // TODO: Implement restrict sharing functionality
  }

  const renderDocumentRow = (doc: any, action: string) => {
    const iconInfo = getFileIconComponent(doc.mimeType)
    const IconComponent = iconInfo.component === 'FileText' ? FileText : File

    return (
      <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-center space-x-3 flex-1">
          <IconComponent className={`h-4 w-4 ${iconInfo.color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{formatRelativeTime(doc.modifiedTime)}</span>
              <span>{formatFileSize(doc.size)}</span>
              {doc.accessCount > 0 && <span>{doc.accessCount} accesses</span>}
              {doc.folder?.name && <span>📁 {doc.folder.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {action.includes('Bookmark') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleBookmarkDocument(doc)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Bookmark className="h-4 w-4 mr-1" />
              Bookmark
            </Button>
          )}
          {action.includes('Review') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReviewDocument(doc)}
              className="text-orange-600 hover:text-orange-800"
            >
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Button>
          )}
          {action.includes('archive') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleArchiveDocument(doc)}
              className="text-gray-600 hover:text-gray-800"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          )}
          {action.includes('Restrict') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRestrictDocument(doc)}
              className="text-red-600 hover:text-red-800"
            >
              <Shield className="h-4 w-4 mr-1" />
              Restrict
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <AppLayout showTopBar={true}>
      <div className="min-h-screen bg-white">
        <div className="px-6 py-6">
          {!hasConnections ? (
            <EmptyState type="documents" />
          ) : (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Insights</h1>
                <p className="text-gray-600">Data driven analysis of your document workspace</p>
              </div>

              {/* Insights Cards */}
              <div className="space-y-8">
                {insightsCards.map((card) => {
                  const IconComponent = card.icon
                  const activeTab = activeTabs[card.id]
                  const currentTabData = card.tabs.find(tab => tab.id === activeTab)
                  const messageKey = `${card.id}-${activeTab}`

                  return (
                    <div key={card.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {/* Card Header */}
                      <div className={`${
                        card.id === 'focus' ? 'bg-blue-50 border-b border-blue-200' :
                        card.id === 'storage' ? 'bg-purple-50 border-b border-purple-200' :
                        'bg-green-50 border-b border-green-200'
                      } px-6 py-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconComponent className={`h-6 w-6 ${
                              card.id === 'focus' ? 'text-blue-600' :
                              card.id === 'storage' ? 'text-purple-600' :
                              'text-green-600'
                            }`} />
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">
                                {card.title} [{card.totalCount}]
                              </h2>
                            </div>
                          </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-1 mt-4">
                          {card.tabs.map((tab) => (
                            <Button
                              key={tab.id}
                              variant={activeTabs[card.id] === tab.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTabChange(card.id, tab.id)}
                              className={`flex items-center space-x-2 ${
                                activeTabs[card.id] === tab.id 
                                  ? card.id === 'focus' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' :
                                    card.id === 'storage' ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' :
                                    'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                  : card.id === 'focus' ? 'border-blue-300 text-blue-700 hover:bg-blue-50' :
                                    card.id === 'storage' ? 'border-purple-300 text-purple-700 hover:bg-purple-50' :
                                    'border-green-300 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              <span>{tab.label}</span>
                              <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs">
                                {tab.count}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* LLM Persona Message */}
                      {currentTabData && (
                        <div className={`${
                          card.id === 'focus' ? 'bg-blue-25 border-b border-blue-100' :
                          card.id === 'storage' ? 'bg-purple-25 border-b border-purple-100' :
                          'bg-green-25 border-b border-green-100'
                        } px-6 py-3`}>
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 ${
                              card.id === 'focus' ? 'bg-blue-600' :
                              card.id === 'storage' ? 'bg-purple-600' :
                              'bg-green-600'
                            } rounded-full flex items-center justify-center flex-shrink-0`}>
                              <UserRound className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${
                                card.id === 'focus' ? 'text-blue-800' :
                                card.id === 'storage' ? 'text-purple-800' :
                                'text-green-800'
                              }`}>
                                {typingMessages[messageKey] || getPersonaMessage(card.id, activeTab)}
                                {showTyping[messageKey] && (
                                  <span className="animate-pulse">|</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document List */}
                      <div className="p-6">
                        {currentTabData && currentTabData.documents.length > 0 ? (
                          <div className="space-y-2">
                            {currentTabData.documents.map((doc) => 
                              renderDocumentRow(doc, currentTabData.action)
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No documents found for this category</p>
                          </div>
                        )}
                      </div>

                      {/* Actionable Highlights */}
                      {currentTabData && currentTabData.documents.length > 0 && (
                        <div className={`${
                          card.id === 'focus' ? 'bg-blue-100 border-t border-blue-200' :
                          card.id === 'storage' ? 'bg-purple-100 border-t border-purple-200' :
                          'bg-green-100 border-t border-green-200'
                        } px-6 py-4`}>
                          <div>
                            <h4 className={`text-sm font-semibold ${
                              card.id === 'focus' ? 'text-blue-900' :
                              card.id === 'storage' ? 'text-purple-900' :
                              'text-green-900'
                            } mb-1 flex items-center space-x-2`}>
                              <Lightbulb className={`h-4 w-4 ${
                                card.id === 'focus' ? 'text-blue-600' :
                                card.id === 'storage' ? 'text-purple-600' :
                                'text-green-600'
                              }`} />
                              <span>Recommended Action</span>
                            </h4>
                            <p className={`text-sm ${
                              card.id === 'focus' ? 'text-blue-800' :
                              card.id === 'storage' ? 'text-purple-800' :
                              'text-green-800'
                            }`}>
                              {card.id === 'focus' && activeTab === 'most_recent' && 
                                "Bookmark these recently modified documents to your dashboard for quick access during your current work sessions."
                              }
                              {card.id === 'focus' && activeTab === 'most_accessed' && 
                                "These are your go-to documents. Consider bookmarking them or organizing them into a 'Frequently Used' folder."
                              }
                              {card.id === 'storage' && activeTab === 'stale' && 
                                "Archive these unused documents to Google Drive's archive folder to free up workspace clutter."
                              }
                              {card.id === 'storage' && activeTab === 'large' && 
                                "Review these large files - consider compressing, splitting, or moving to long-term storage."
                              }
                              {card.id === 'storage' && activeTab === 'abandoned' && 
                                "Delete or merge these small, incomplete files to clean up your workspace."
                              }
                              {card.id === 'storage' && activeTab === 'duplicates' && 
                                "Merge duplicate files and keep the most recent version to eliminate confusion."
                              }
                              {card.id === 'shares' && activeTab === 'expiry_alert' && 
                                "Review and extend sharing permissions for active collaborations, or disable for completed projects."
                              }
                              {card.id === 'shares' && activeTab === 'sensitive_docs' && 
                                "Restrict access to sensitive documents - change from 'Anyone with link' to specific people only."
                              }
                              {card.id === 'shares' && activeTab === 'risky_shares' && 
                                "Downgrade edit permissions to 'Can comment' or 'Can view' to prevent unauthorized changes."
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <AppLayout showTopBar={true}>
        <div className="min-h-screen bg-white">
          <div className="px-6 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
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