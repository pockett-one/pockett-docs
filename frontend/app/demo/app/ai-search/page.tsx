"use client"

import { useState, useRef, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  FolderOpen,
  Sparkles,
  Loader2,
  Search,
  MessageSquare,
  File,
  Clock,
  Star
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

export default function AISearchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI document assistant. Ask me anything about your documents, like 'Show me all financial reports from last quarter' or 'Find documents related to marketing campaigns'.",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResults, setSelectedResults] = useState<DocumentResult[]>([])
  const [currentQuery, setCurrentQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

    // Simulate AI response with realistic document results
    setTimeout(() => {
      const mockResults: DocumentResult[] = [
        {
          id: '1',
          name: 'Q4 Financial Report 2024',
          type: 'document',
          mimeType: 'application/pdf',
          path: '/Finance/Reports',
          score: 95,
          size: 2048576,
          modifiedTime: '2024-12-15T10:30:00Z',
          folder: { name: 'Finance/Reports' }
        },
        {
          id: '2',
          name: 'Budget Planning 2024-2025',
          type: 'document',
          mimeType: 'application/vnd.google-apps.spreadsheet',
          path: '/Finance/Budget',
          score: 88,
          size: 1048576,
          modifiedTime: '2024-12-10T14:20:00Z',
          folder: { name: 'Finance/Budget' }
        },
        {
          id: '3',
          name: 'Annual Revenue Analysis',
          type: 'document',
          mimeType: 'application/vnd.google-apps.document',
          path: '/Finance/Analysis',
          score: 92,
          size: 1572864,
          modifiedTime: '2024-12-12T09:15:00Z',
          folder: { name: 'Finance/Analysis' }
        },
        {
          id: '4',
          name: 'Finance',
          type: 'folder',
          mimeType: 'application/vnd.google-apps.folder',
          path: '/Finance',
          score: 90,
          folder: { name: 'Finance' }
        },
        {
          id: '5',
          name: 'Marketing Campaign Q4',
          type: 'document',
          mimeType: 'application/vnd.google-apps.presentation',
          path: '/Marketing/Campaigns',
          score: 85,
          size: 3145728,
          modifiedTime: '2024-12-08T16:45:00Z',
          folder: { name: 'Marketing/Campaigns' }
        },
        {
          id: '6',
          name: 'Customer Feedback Summary',
          type: 'document',
          mimeType: 'application/vnd.google-apps.document',
          path: '/Marketing/Feedback',
          score: 78,
          size: 524288,
          modifiedTime: '2024-12-05T11:30:00Z',
          folder: { name: 'Marketing/Feedback' }
        }
      ]

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I found ${mockResults.length} results for "${currentQuery}". Here's what I discovered in your documents:`,
        timestamp: new Date(),
        type: 'ai',
        results: mockResults
      }

      setMessages(prev => [...prev, aiMessage])
      setSelectedResults(mockResults)
      setIsLoading(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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
    if (!mimeType) return <File className="h-4 w-4" />
    if (mimeType.includes('folder')) return <FolderOpen className="h-4 w-4" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('spreadsheet')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('presentation')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('document')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  return (
    <AppLayout showTopBar={false}>
      <div className="flex h-screen bg-gray-50">
        {/* Left Pane - Chat Conversation (50%) */}
        <div className="w-1/2 flex flex-col bg-white border-r border-gray-200">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Document Assistant</h1>
                <p className="text-sm text-gray-600">Chat with your documents using natural language</p>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-500 ml-3' : 'bg-gray-500 mr-3'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-lg px-4 py-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Results Count Only */}
                    {message.results && message.results.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Search className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Found {message.results.length} matching documents
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Check the right pane to view all results with actions
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-md">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 mr-3 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-600">Searching your documents...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex space-x-3">
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
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Try: &ldquo;Show me all documents from the Finance folder&rdquo; or &ldquo;Find reports from last month&rdquo;
            </p>
          </div>
        </div>

        {/* Right Pane - Document Results (50%) */}
        <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col">
          {/* Results Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Search className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
                {currentQuery && (
                  <p className="text-sm text-gray-600">&ldquo;{currentQuery}&rdquo;</p>
                )}
                {selectedResults.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedResults.length} document{selectedResults.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              // Loading State for Fresh Results
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="relative">
                  <Search className="h-12 w-12 text-blue-400 mb-4 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Searching Documents...</h3>
                <p className="text-sm text-gray-500">
                  Finding the most relevant results for &ldquo;{currentQuery}&rdquo;
                </p>
                <div className="mt-4 flex items-center space-x-2 text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : selectedResults.length > 0 ? (
              <div className="p-4 space-y-3">
                {selectedResults.map((result) => (
                  <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start space-x-3">
                      {/* File Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        result.type === 'folder' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {getFileIcon(result.mimeType)}
                      </div>

                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{result.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{result.path}</p>
                            
                            {/* Metadata */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              {result.type === 'document' && (
                                <>
                                  <span className="flex items-center space-x-1">
                                    <File className="h-3 w-3" />
                                    <span>{formatFileSize(result.size)}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDate(result.modifiedTime)}</span>
                                  </span>
                                </>
                              )}
                              <span className="flex items-center space-x-1">
                                <Star className="h-3 w-3" />
                                <span>{result.score}% match</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Menu */}
                          {result.type === 'document' && (
                            <DocumentActionMenu
                              document={{
                                id: result.id,
                                name: result.name,
                                mimeType: result.mimeType,
                                size: result.size,
                                modifiedTime: result.modifiedTime,
                                folder: result.folder
                              }}
                              onBookmarkDocument={() => console.log('Bookmark:', result.name)}
                              onOpenDocument={() => console.log('Open:', result.name)}
                              onDownloadDocument={() => console.log('Download:', result.name)}
                              onShareDocument={() => console.log('Share:', result.name)}
                              onRenameDocument={() => console.log('Rename:', result.name)}
                              onCopyDocument={() => console.log('Copy:', result.name)}
                              onMoveDocument={() => console.log('Move:', result.name)}
                              onVersionHistory={() => console.log('Version History:', result.name)}
                              onDeleteDocument={() => console.log('Delete:', result.name)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-sm text-gray-500">
                  Start a conversation with your AI assistant to search through your documents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

