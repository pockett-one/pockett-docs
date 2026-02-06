"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { DocumentIcon } from "@/components/ui/document-icon"
import { FolderPathBreadcrumb } from "@/components/ui/folder-path-breadcrumb"
import { RecentSessionsModal } from "@/components/ui/recent-sessions-modal"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { getMockData } from "@/lib/mock-data"
import { formatFileSize } from "@/lib/utils"
import { chatStorage } from "@/lib/chat-storage"
import {
  Send,
  Bot,
  User,
  FileText,
  FolderOpen,
  Sparkles,
  // Loader2,
  Search,
  MessageSquare,
  File,
  Clock,
  Star,
  X,
  Lock,
  RefreshCw,
  HelpCircle
} from "lucide-react"

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  results?: DocumentResult[]
}

interface DocumentResult {
  id: string
  name: string
  type: 'document' | 'folder'
  mimeType?: string
  path: string
  score: number
  size?: number
  modifiedTime?: string
  folder?: {
    name: string
  }
  highlighted?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResults, setSelectedResults] = useState<DocumentResult[]>([])
  const [currentQuery, setCurrentQuery] = useState("")
  const [searchableData, setSearchableData] = useState<any[]>([])
  const [isSemanticReady, setIsSemanticReady] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const [searchStatus, setSearchStatus] = useState("")
  const [isSearchCancelled, setIsSearchCancelled] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false)
  const [isResultsLoading, setIsResultsLoading] = useState(false)
  const [showResultsLoaded, setShowResultsLoaded] = useState(false)
  const [topBarHeight, setTopBarHeight] = useState(49) // Default fallback height
  const searchProgressRef = useRef(0)

  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour, forceStartTour } = useTourGuide('Chat')

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Chat',
      content: 'This is your intelligent chat assistant that can understand natural language queries about your documents.',
      target: '.chat-header',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'chat-interface',
      title: 'Natural Language Chat',
      content: 'Ask questions in plain English like "Show me financial reports from last month" or "Find audit documents".',
      target: '.chat-input',
      position: 'top',
      action: 'hover',
      actionText: 'Try typing a question'
    },
    {
      id: 'search-results',
      title: 'Smart Results',
      content: 'Results are ranked by relevance and show document details with clickable breadcrumbs for easy navigation.',
      target: '.results-section',
      position: 'left',
      action: 'hover',
      actionText: 'Hover over results to see details'
    },
    {
      id: 'recent-sessions',
      title: 'Chat History',
      content: 'Access your recent search sessions to continue conversations or review previous queries.',
      target: '.recent-button',
      position: 'bottom',
      action: 'click',
      actionText: 'Click to view recent sessions'
    },
    {
      id: 'document-actions',
      title: 'Quick Actions',
      content: 'Each result has quick actions like open, share, or download for immediate access to documents.',
      target: '.document-actions',
      position: 'right',
      action: 'hover',
      actionText: 'Hover over a result to see actions'
    }
  ]

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize semantic search, load searchable data, and load recent chat sessions
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        console.log('🚀 Initializing Chat...')

        // Initialize chat storage
        await chatStorage.initialize()

        // Load recent chat sessions
        const recentSessions = await chatStorage.getRecentChatSessions()
        if (recentSessions.length > 0) {
          const latestSession = recentSessions[0]
          setMessages(latestSession.messages)
          console.log(`📚 Loaded ${latestSession.messages.length} messages from recent session`)
        }

        // Load mock data for search
        const mockData = getMockData()
        console.log('📊 Loaded mock data:', {
          documents: mockData.documents?.length || 0,
          folders: mockData.folders?.length || 0
        })

        // Prepare searchable data
        const allItems = [
          ...(mockData.documents || []).map(doc => ({
            ...doc,
            type: 'document',
            path: doc.folder?.path || '/',
            folder: doc.folder
          })),
          ...(mockData.folders || []).map(folder => ({
            ...folder,
            type: 'folder',
            mimeType: 'application/vnd.google-apps.folder',
            path: folder.path || '/',
            folder: { name: folder.name }
          }))
        ]

        setSearchableData(allItems)
        console.log(`🔍 Chat: Loaded ${allItems.length} searchable items`)

        // DEBUG: Show sample of cleaned paths
        console.log('🔍 Sample of cleaned paths:')
        allItems.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.name}: ${item.path}`)
        })

        // Check for any remaining corrupted paths
        const corruptedPaths = allItems.filter(item =>
          item.path.includes('//') || item.path.includes('\\\\')
        )
        if (corruptedPaths.length > 0) {
          console.warn(`⚠️ Found ${corruptedPaths.length} items with corrupted paths:`, corruptedPaths.slice(0, 3))
        } else {
          console.log('✅ All paths are clean')
        }

        // DEBUG: Show all unique folder paths to understand the structure
        const uniquePaths = Array.from(new Set(allItems.map(item => item.path))).sort()
        console.log('🔍 All unique folder paths in data:')
        uniquePaths.forEach(path => console.log(`  - ${path}`))

        // DEBUG: Check specifically for Audit folder
        const auditItems = allItems.filter(item =>
          item.path.toLowerCase().includes('audit') ||
          item.folder?.name?.toLowerCase().includes('audit')
        )
        console.log(`🔍 Found ${auditItems.length} items related to Audit:`)
        auditItems.forEach(item => {
          console.log(`  - ${item.name}: ${item.path} (${item.folder?.name})`)
        })

        setIsSemanticReady(true) // Always ready for simple search
      } catch (error) {
        console.warn('Failed to initialize search:', error)
        setIsSemanticReady(false)
      }
    }

    initializeSearch()
  }, [])

  // Measure top bar height dynamically
  useEffect(() => {
    const measureTopBarHeight = () => {
      const topBar = document.querySelector('[data-top-bar]') ||
        document.querySelector('.sticky.top-0.z-40') ||
        document.querySelector('header') ||
        document.querySelector('[role="banner"]')

      if (topBar && topBar instanceof HTMLElement) {
        const height = topBar.offsetHeight
        console.log(`📏 Measured top bar height: ${height}px`)
        setTopBarHeight(height)
      } else {
        console.log('⚠️ Could not find top bar element, using default height')
      }
    }

    // Measure on mount
    measureTopBarHeight()

    // Measure on window resize
    const handleResize = () => {
      measureTopBarHeight()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cancel search function
  const cancelSearch = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsLoading(false)
    setIsSearchCancelled(true)
    setSearchProgress(0)
    setSearchStatus("")
    console.log('🚫 Search cancelled by user')
  }, [abortController])

  // Simple name-based search filter
  const performSearch = useCallback(async (query: string): Promise<DocumentResult[]> => {
    if (!searchableData.length) {
      console.warn('No searchable data available')
      return []
    }

    try {
      console.log(`🔍 Chat: Searching for "${query}"`)
      
      // Simple name-based filter
      const queryLower = query.trim().toLowerCase()
      const filtered = searchableData
        .filter(item => {
          const name = (item.name || item.title || '').toLowerCase()
          return name.includes(queryLower)
        })
        .slice(0, 20) // Limit results

      const documentResults: DocumentResult[] = filtered.map(item => ({
        id: item.id || item.name,
        name: item.name || item.title || 'Untitled',
        type: item.type === 'folder' ? 'folder' : 'document',
        mimeType: item.mimeType,
        path: item.folder?.path || item.path || '/',
        score: 100, // Simple match = 100%
        size: item.size,
        modifiedTime: item.modifiedTime,
        folder: item.folder
      }))

      console.log(`📝 Chat: Found ${documentResults.length} results`)
      return documentResults

    } catch (error: any) {
      console.error('Search failed:', error)
      return []
    }
  }, [searchableData])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentQuery(inputValue)
    setInputValue("")
    setIsLoading(true)
    setIsSearchCancelled(false)

    try {
      // Perform actual search
      const searchResults = await performSearch(inputValue)

      // Check if search was cancelled
      if (searchResults.length === 0 && isSearchCancelled) {
        const cancelledMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Search for "${inputValue}" was cancelled.`,
          timestamp: new Date(),
          type: 'ai'
        }
        setMessages(prev => [...prev, cancelledMessage])
        setSelectedResults([])
        return
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: searchResults.length > 0
          ? `I found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${inputValue}". Here's what I discovered in your documents:`
          : `I couldn't find any documents matching "${inputValue}". The folder path you specified may not exist or may not contain any documents. Please check the folder path and try again.`,
        timestamp: new Date(),
        type: 'ai',
        results: searchResults
      }

      setMessages(prev => [...prev, aiMessage])
      setSelectedResults(searchResults)

      // Save chat session to storage
      try {
        const updatedMessages = [...messages, userMessage, aiMessage]
        await chatStorage.saveChatSession(updatedMessages)
        console.log('💾 Chat session saved to storage')
      } catch (error) {
        console.warn('Failed to save chat session:', error)
      }
    } catch (error) {
      console.error('Failed to process search:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error while searching for "${inputValue}". Please try again.`,
        timestamp: new Date(),
        type: 'ai'
      }

      setMessages(prev => [...prev, errorMessage])
      setSelectedResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLoadSession = (sessionMessages: ChatMessage[]) => {
    setMessages(sessionMessages)
    // Clear current search results when loading a session
    setSelectedResults([])
    setCurrentQuery("")
    console.log('📚 Loaded chat session with', sessionMessages.length, 'messages')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <DocumentIcon mimeType="unknown" size={16} />
    return <DocumentIcon mimeType={mimeType} size={16} />
  }



  return (
    <AppLayout
      showTopBar={true}
      topBarProps={{
        onStartTour: forceStartTour,
        showTourButton: true,
        tourButtonText: "Take Tour"
      }}
    >
      <div className="flex bg-gray-50" style={{ height: `calc(100vh - ${topBarHeight}px)` }}>
        {/* Left Pane - Chat Interface */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white chat-header">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
              {isSemanticReady && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <Sparkles className="h-3 w-3" />
                  <span>Semantic Ready</span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1 max-w-xs">
                Ask questions about your documents in natural language. Try: &ldquo;Show me financial reports from last month&rdquo; or &ldquo;Find audit documents&rdquo;
              </div>
            </div>



            {/* Chat History Button */}
            <button
              onClick={() => setIsRecentModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="View chat history"
            >
              <Clock className="h-4 w-4" />
              <span>History</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      {message.results && message.results.length > 0 && (
                        <button
                          onClick={async () => {
                            // Find the user message that preceded this AI response
                            const messageIndex = messages.findIndex(m => m.id === message.id)
                            if (messageIndex > 0) {
                              const userMessage = messages[messageIndex - 1]
                              if (userMessage.type === 'user') {
                                // Set loading state
                                setIsResultsLoading(true)
                                setCurrentQuery(userMessage.content)

                                // Simulate real-time data fetching with delay
                                await new Promise(resolve => setTimeout(resolve, 800))

                                // Set results and stop loading
                                setSelectedResults(message.results || [])
                                setIsResultsLoading(false)

                                // Show "Results loaded!" message briefly
                                setShowResultsLoaded(true)
                                setTimeout(() => setShowResultsLoaded(false), 2000)

                                // Scroll to results
                                setTimeout(() => {
                                  const resultsSection = document.querySelector('.results-section')
                                  if (resultsSection) {
                                    resultsSection.scrollIntoView({ behavior: 'smooth' })
                                  }
                                }, 100)
                              }
                            }
                          }}
                          className={`text-xs mt-2 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 hover:border-blue-300 ${isResultsLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                          title="Click to view results again"
                          disabled={isResultsLoading}
                        >
                          {isResultsLoading ? (
                            <LoadingSpinner size="sm" className="inline mr-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 inline mr-1" />
                          )}
                          Found {message.results.length} matching document{message.results.length !== 1 ? 's' : ''}
                          <span className="block text-xs text-blue-500 mt-1 font-medium">
                            {isResultsLoading ? 'Loading results...' : `Click to re-run: &ldquo;${messages.findIndex(m => m.id === message.id) > 0 ? messages[messages.findIndex(m => m.id === message.id) - 1]?.content : ''}&rdquo;`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-gray-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-gray-600">Searching...</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${searchProgress}%` }}
                        ></div>
                      </div>

                      {/* Status Message */}
                      <p className="text-xs text-gray-500">{searchStatus}</p>

                      {/* Cancel Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelSearch}
                        className="mt-2 h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel Search
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your documents..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Pane - Document Results */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
              {isLoading && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <Lock className="h-3 w-3" />
                  <span>Searching...</span>
                </div>
              )}
            </div>
            {selectedResults.length > 0 && (
              <span className="text-sm text-gray-500">
                {selectedResults.length} result{selectedResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Results Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              /* Loading State - Lock both panes */
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search in Progress</h3>
                  <p className="text-gray-500 mb-4">Both panes are locked while searching</p>

                  {/* Progress Bar */}
                  <div className="w-64 bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${searchProgress}%` }}
                    ></div>
                  </div>

                  {/* Status */}
                  <p className="text-sm text-gray-600 mb-4">{searchStatus}</p>

                  {/* Cancel Button */}
                  <Button
                    variant="outline"
                    onClick={cancelSearch}
                    className="px-6"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Search
                  </Button>
                </div>
              </div>
            ) : isResultsLoading ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <LoadingSpinner size="md" className="mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fetching Results...</h3>
                <p className="text-gray-500 max-w-md">
                  Searching through your documents for &ldquo;{currentQuery}&rdquo;
                </p>
                <div className="mt-6 w-64 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : selectedResults.length > 0 ? (
              /* Results Display */
              <div className="space-y-3 results-section">
                {/* Results Loaded Message */}
                {showResultsLoaded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">
                        ✅ Results loaded successfully!
                      </span>
                    </div>
                  </div>
                )}

                {selectedResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {result.type === 'folder' ? (
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600" />
                          )}
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {result.name}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {result.score}%
                          </span>
                        </div>



                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{result.modifiedTime ? new Date(result.modifiedTime).toLocaleDateString() : 'Unknown'}</span>
                          </span>
                          {result.size && (
                            <span className="flex items-center space-x-1">
                              <File className="h-3 w-3" />
                              <span>{formatFileSize(result.size)}</span>
                            </span>
                          )}
                        </div>

                        {/* Folder Path Breadcrumb */}
                        {result.path && result.path !== '' ? (
                          <FolderPathBreadcrumb path={result.path} />
                        ) : null}
                      </div>

                      <DocumentActionMenu document={result} />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentQuery ? (
              /* No Results */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-500 max-w-md">
                  We couldn&apos;t find any documents matching &ldquo;{currentQuery}&rdquo;.
                  Try rephrasing your query or using different keywords.
                </p>
              </div>
            ) : (
              /* Initial State */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ask About Your Documents</h3>
                <p className="text-gray-500 max-w-md">
                  Use natural language to search through your documents.
                  Try queries like &ldquo;Show me top 5 financial reports&rdquo; or &ldquo;Find marketing materials from last month&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions Modal */}
      <RecentSessionsModal
        isOpen={isRecentModalOpen}
        onClose={() => setIsRecentModalOpen(false)}
        onLoadSession={handleLoadSession}
      />

      {/* Tour Guide */}
      <TourGuide
        isOpen={isTourOpen}
        onClose={closeTour}
        steps={tourSteps}
        pageName="Chat"
        onComplete={() => console.log('🎯 Chat tour completed!')}
      />


    </AppLayout>
  )
}

