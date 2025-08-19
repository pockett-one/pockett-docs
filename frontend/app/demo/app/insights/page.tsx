"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { getMockData, formatRelativeTime, formatFileSize, getFileIconComponent } from "@/lib/mock-data"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { GuidedTour } from "@/components/ui/guided-tour"
import { 
  FileText,
  File,
  Clock,
  HardDrive,
  Shield,
  Star,
  Lightbulb,
  FolderOpen
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
  const [activeCard, setActiveCard] = useState<string>('priority')
  const [activeTabs, setActiveTabs] = useState<{[key: string]: TabType}>({
    priority: 'most_recent',
    storage: 'stale',
    shares: 'expiry_alert'
  })
  const [typingMessages, setTypingMessages] = useState<{[key: string]: string}>({})
  const [showTyping, setShowTyping] = useState<{[key: string]: boolean}>({})
  const [hasShownTyping, setHasShownTyping] = useState<{[key: string]: boolean}>({})
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
      id: 'priority',
      title: 'Priority',
      icon: Star,
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
      'priority-most_recent': "Here are 5 docs that were most recently modified. These deserve priority attention.",
      'priority-most_accessed': "Here are 5 docs that were most accessed in the last week. These are your priority documents.",
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

  // Typing animation effect - only show once per tab per session
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []
    const timeouts: NodeJS.Timeout[] = []

    Object.entries(activeTabs).forEach(([cardId, tabId]) => {
      const messageKey = `${cardId}-${tabId}`
      const message = getPersonaMessage(cardId, tabId)

      // Check if we've already shown typing animation for this tab
      if (hasShownTyping[messageKey]) {
        // Skip typing animation, show full message immediately
        setTypingMessages(prev => ({ ...prev, [messageKey]: message }))
        setShowTyping(prev => ({ ...prev, [messageKey]: false }))
        return
      }

      // Mark this tab as having shown typing animation
      setHasShownTyping(prev => ({ ...prev, [messageKey]: true }))
      
      // Show typing animation
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
          const timeout = setTimeout(() => {
            setShowTyping(prev => ({ ...prev, [messageKey]: false }))
          }, 1000)
          timeouts.push(timeout)
        }
      }, 50)

      intervals.push(interval)
      
      // Safety timeout to ensure typing animation doesn't get stuck
      const safetyTimeout = setTimeout(() => {
        clearInterval(interval)
        setShowTyping(prev => ({ ...prev, [messageKey]: false }))
        setTypingMessages(prev => ({ ...prev, [messageKey]: message }))
      }, Math.max(message.length * 50 + 1000, 500)) // Max 500ms, min 1 second
      
      timeouts.push(safetyTimeout)
    })

    // Cleanup function to clear all intervals and timeouts
    return () => {
      intervals.forEach(clearInterval)
      timeouts.forEach(clearTimeout)
    }
  }, [activeTabs, hasShownTyping])

  const handleTabChange = (cardId: string, tabId: TabType) => {
    setActiveTabs(prev => ({ ...prev, [cardId]: tabId }))
  }

  const handleBookmarkDocument = (doc: any) => {
    console.log('Bookmarking document:', doc.name)
    // TODO: Implement bookmark functionality
  }

  const renderDocumentRow = (doc: any) => {
    const iconInfo = getFileIconComponent(doc.mimeType)
    const IconComponent = iconInfo.component === 'FileText' ? FileText : File

    const handleFolderClick = (folderName: string) => {
      // Navigate to the Documents page with the folder navigation
      const router = typeof window !== 'undefined' ? window : null
      if (router) {
        router.location.href = `/demo/app/documents?folder=${encodeURIComponent(folderName)}`
      }
    }

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
              {doc.folder?.name && (
                <div className="flex items-center space-x-1">
                  <FolderOpen className="h-3 w-3 text-gray-400" />
                  <button
                    onClick={() => handleFolderClick(doc.folder.name)}
                    className="text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {doc.folder.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2" data-tour="action-menu">
          <DocumentActionMenu
            document={doc}
            onBookmarkDocument={handleBookmarkDocument}
          />
        </div>
      </div>
    )
  }

  // Define tour steps for Insights page
  const tourSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Insights!',
      content: 'This page provides data-driven analysis of your documents. Let\'s explore the key features together.',
      target: 'h1',
      position: 'bottom' as const
    },
    {
      id: 'card-selector',
      title: 'Insight Categories',
      content: 'Switch between Priority, Storage, and Shares insights using these tabs. Each has a unique theme color and focus area.',
      target: '[data-tour="card-selector"]',
      position: 'bottom' as const
    },
    {
      id: 'pockett-pilot',
      title: 'Meet Pockett Pilot',
      content: 'Your data assistant analyzes each document category and provides personalized recommendations.',
      target: '[data-tour="pockett-pilot"]',
      position: 'right' as const
    },
    {
      id: 'document-list',
      title: 'Smart Document Lists',
      content: 'View filtered documents with quick actions. Click folder names to navigate directly to the Documents page.',
      target: '[data-tour="document-list"]',
      position: 'top' as const
    },
    {
      id: 'action-menu',
      title: 'Document Actions',
      content: 'Use the three-dot menu for quick actions like opening in Google Docs, downloading, or sharing documents.',
      target: '[data-tour="action-menu"]',
      position: 'left' as const
    },
    {
      id: 'recommendations',
      title: 'Actionable Recommendations',
      content: 'Each insight includes specific recommendations to help you optimize your document workflow.',
      target: '[data-tour="recommendations"]',
      position: 'top' as const
    }
  ]

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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Insights</h1>
                <p className="text-gray-600">Data-driven analysis of your document workspace</p>
              </div>

              {/* Card Selector Tabs - File bookmark style */}
              <div className="mb-0" data-tour="card-selector">
                <div className="flex space-x-1">
                  {insightsCards.map((card) => {
                    const IconComponent = card.icon
                    return (
                      <button
                        key={card.id}
                        onClick={() => setActiveCard(card.id)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg border border-gray-200 border-b-0 ${
                          activeCard === card.id
                            ? card.id === 'priority' ? 'bg-white text-blue-700 border-t-blue-600 border-t-2 relative z-10' :
                              card.id === 'storage' ? 'bg-white text-purple-700 border-t-purple-600 border-t-2 relative z-10' :
                              'bg-white text-green-700 border-t-green-600 border-t-2 relative z-10'
                            : card.id === 'priority' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300' :
                              card.id === 'storage' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300' :
                              'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{card.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeCard === card.id 
                            ? card.id === 'priority' ? 'bg-blue-100 text-blue-800' :
                              card.id === 'storage' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            : card.id === 'priority' ? 'bg-blue-200 text-blue-800' :
                              card.id === 'storage' ? 'bg-purple-200 text-purple-800' :
                              'bg-green-200 text-green-800'
                        }`}>
                          {card.totalCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Card Display */}
              {(() => {
                const currentCard = insightsCards.find(card => card.id === activeCard)
                if (!currentCard) return null
                
                const IconComponent = currentCard.icon
                const activeTab = activeTabs[currentCard.id]
                const currentTabData = currentCard.tabs.find(tab => tab.id === activeTab)
                const messageKey = `${currentCard.id}-${activeTab}`

                return (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Card Header */}
                    <div className={`${
                      currentCard.id === 'priority' ? 'bg-blue-50' :
                      currentCard.id === 'storage' ? 'bg-purple-50' :
                      'bg-green-50'
                    } px-6 py-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`h-6 w-6 ${
                            currentCard.id === 'priority' ? 'text-blue-600' :
                            currentCard.id === 'storage' ? 'text-purple-600' :
                            'text-green-600'
                          }`} />
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              {currentCard.title} [{currentCard.totalCount}]
                            </h2>
                          </div>
                        </div>
                      </div>

                      {/* Tabs - File bookmark style */}
                      <div className="flex space-x-1 mt-4 -mb-4">
                        {currentCard.tabs.map((tab) => (
                          <Button
                            key={tab.id}
                            variant={activeTabs[currentCard.id] === tab.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTabChange(currentCard.id, tab.id)}
                            className={`flex items-center space-x-2 rounded-b-none border-b-0 ${
                              activeTabs[currentCard.id] === tab.id 
                                ? currentCard.id === 'priority' ? 'bg-white text-blue-700 border-blue-300 border-t-blue-600 border-t-2 relative z-10 hover:bg-white hover:text-blue-700' :
                                  currentCard.id === 'storage' ? 'bg-white text-purple-700 border-purple-300 border-t-purple-600 border-t-2 relative z-10 hover:bg-white hover:text-purple-700' :
                                  'bg-white text-green-700 border-green-300 border-t-green-600 border-t-2 relative z-10 hover:bg-white hover:text-green-700'
                                : currentCard.id === 'priority' ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200' :
                                  currentCard.id === 'storage' ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' :
                                  'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                              activeTabs[currentCard.id] === tab.id
                                ? currentCard.id === 'priority' ? 'bg-blue-100 text-blue-800' :
                                  currentCard.id === 'storage' ? 'bg-purple-100 text-purple-800' :
                                  'bg-green-100 text-green-800'
                                : 'bg-white bg-opacity-50'
                            }`}>
                              {tab.count}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* LLM Persona Message */}
                    {currentTabData && (
                      <div className={`${
                        currentCard.id === 'priority' ? 'bg-blue-25 border-b border-blue-100' :
                        currentCard.id === 'storage' ? 'bg-purple-25 border-b border-purple-100' :
                        'bg-green-25 border-b border-green-100'
                      } px-6 py-3`} data-tour="pockett-pilot">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 ${
                            currentCard.id === 'priority' ? 'bg-blue-600' :
                            currentCard.id === 'storage' ? 'bg-purple-600' :
                            'bg-green-600'
                          } rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-bold">PP</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs font-semibold ${
                                currentCard.id === 'priority' ? 'text-blue-800' :
                                currentCard.id === 'storage' ? 'text-purple-800' :
                                'text-green-800'
                              }`}>Pockett Pilot</span>
                            </div>
                            <p className={`text-sm ${
                              currentCard.id === 'priority' ? 'text-blue-800' :
                              currentCard.id === 'storage' ? 'text-purple-800' :
                              'text-green-800'
                            }`}>
                              {typingMessages[messageKey] || getPersonaMessage(currentCard.id, activeTab)}
                              {showTyping[messageKey] && (
                                <span className="animate-pulse">|</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Document List */}
                    <div className="p-6" data-tour="document-list">
                      {currentTabData && currentTabData.documents.length > 0 ? (
                        <>
                          {/* Loading State - Show while typing animation is in progress */}
                          {showTyping[messageKey] && (
                            <div className="space-y-3 animate-pulse">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                                  <div className="h-3 bg-gray-200 rounded w-2/5"></div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Document List - Show after typing animation completes OR if typing gets stuck */}
                          {(!showTyping[messageKey] || !typingMessages[messageKey]) && (
                            <div className="space-y-2">
                              {currentTabData.documents.map((doc) => 
                                renderDocumentRow(doc)
                              )}
                            </div>
                          )}
                        </>
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
                        currentCard.id === 'priority' ? 'bg-blue-100 border-t border-blue-200' :
                        currentCard.id === 'storage' ? 'bg-purple-100 border-t border-purple-200' :
                        'bg-green-100 border-t border-green-200'
                      } px-6 py-4`} data-tour="recommendations">
                        <div>
                          <h4 className={`text-sm font-semibold ${
                            currentCard.id === 'priority' ? 'text-blue-900' :
                            currentCard.id === 'storage' ? 'text-purple-900' :
                            'text-green-900'
                          } mb-1 flex items-center space-x-2`}>
                            <Lightbulb className={`h-4 w-4 ${
                              currentCard.id === 'priority' ? 'text-blue-600' :
                              currentCard.id === 'storage' ? 'text-purple-600' :
                              'text-green-600'
                            }`} />
                            <span>Recommended Action</span>
                          </h4>
                          <p className={`text-sm ${
                            currentCard.id === 'priority' ? 'text-blue-800' :
                            currentCard.id === 'storage' ? 'text-purple-800' :
                            'text-green-800'
                          }`}>
                            {currentCard.id === 'priority' && activeTab === 'most_recent' && 
                              "These recently modified documents deserve priority attention. Bookmark them for quick access during your current work sessions."
                            }
                            {currentCard.id === 'priority' && activeTab === 'most_accessed' && 
                              "These are your high-priority documents. Consider bookmarking them or organizing them into a 'Priority Access' folder."
                            }
                            {currentCard.id === 'storage' && activeTab === 'stale' && 
                              "Archive these unused documents to Google Drive's archive folder to free up workspace clutter."
                            }
                            {currentCard.id === 'storage' && activeTab === 'large' && 
                              "Review these large files - consider compressing, splitting, or moving to long-term storage."
                            }
                            {currentCard.id === 'storage' && activeTab === 'abandoned' && 
                              "Delete or merge these small, incomplete files to clean up your workspace."
                            }
                            {currentCard.id === 'storage' && activeTab === 'duplicates' && 
                              "Merge duplicate files and keep the most recent version to eliminate confusion."
                            }
                            {currentCard.id === 'shares' && activeTab === 'expiry_alert' && 
                              "Review and extend sharing permissions for active collaborations, or disable for completed projects."
                            }
                            {currentCard.id === 'shares' && activeTab === 'sensitive_docs' && 
                              "Restrict access to sensitive documents - change from 'Anyone with link' to specific people only."
                            }
                            {currentCard.id === 'shares' && activeTab === 'risky_shares' && 
                              "Downgrade edit permissions to 'Can comment' or 'Can view' to prevent unauthorized changes."
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
        
        {/* Guided Tour */}
        {hasConnections && (
          <GuidedTour
            steps={tourSteps}
            tourKey="insights-tour"
            autoStart={true}
            showStartButton={true}
          />
        )}
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