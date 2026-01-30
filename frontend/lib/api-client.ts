import { DocumentItem, FolderItem, DocumentsResponse } from '@/lib/types'
import { logger } from '@/lib/logger'

// API Client for document operations
export class DocumentAPIClient {
  private baseURL: string
  private sseConnection: EventSource | null = null
  private sseListeners: Map<string, Set<(data: any) => void>> = new Map()

  // constructor() {
  //   this.baseURL = process.env.NODE_ENV === 'production' 
  //     ? 'https://your-domain.com/api' 
  //     : 'http://localhost:3000/api'
  // }

  constructor() {
    this.baseURL = '/api'  // Works in all environments!
  }

  // Fetch all documents and folders
  async fetchDocuments(): Promise<DocumentsResponse> {
    try {
      logger.debug('🔄 API Client: Fetching documents...')

      const response = await fetch(`${this.baseURL}/demo/documents`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      logger.debug('✅ API Client: Documents fetched successfully')

      return data
    } catch (error) {
      logger.error('❌ API Client: Failed to fetch documents:', error as Error)
      throw error
    }
  }

  // Create a new document
  async createDocument(documentData: Partial<DocumentItem>): Promise<{ success: boolean; message: string }> {
    try {
      logger.debug('🔄 API Client: Creating document...')

      const response = await fetch(`${this.baseURL}/demo/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          documentData
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.debug('✅ API Client: Document created successfully')

      return result
    } catch (error) {
      logger.error('❌ API Client: Failed to create document:', error as Error)
      throw error
    }
  }

  // Update an existing document
  async updateDocument(documentId: string, documentData: Partial<DocumentItem>): Promise<{ success: boolean; message: string }> {
    try {
      logger.debug('🔄 API Client: Updating document...')

      const response = await fetch(`${this.baseURL}/demo/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          documentData: { id: documentId, ...documentData }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.debug('✅ API Client: Document updated successfully')

      return result
    } catch (error) {
      logger.error('❌ API Client: Failed to update document:', error as Error)
      throw error
    }
  }

  // Delete a document
  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    try {
      logger.debug('🔄 API Client: Deleting document...')

      const response = await fetch(`${this.baseURL}/demo/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          documentData: { id: documentId }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.debug('✅ API Client: Document deleted successfully')

      return result
    } catch (error) {
      logger.error('❌ API Client: Failed to delete document:', error as Error)
      throw error
    }
  }

  // Connect to Server-Sent Events stream
  connectToSSE(): void {
    if (this.sseConnection) {
      logger.debug('🔄 API Client: SSE connection already exists')
      return
    }

    try {
      logger.debug('🔄 API Client: Connecting to SSE stream...')

      this.sseConnection = new EventSource(`${this.baseURL}/demo/documents/stream`)

      this.sseConnection.onopen = () => {
        logger.debug('✅ API Client: SSE connection established')
      }

      this.sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          logger.debug('📡 API Client: SSE message received:', data.type)

          // Notify all listeners for this event type
          const listeners = this.sseListeners.get(data.type)
          if (listeners) {
            listeners.forEach(listener => listener(data))
          }

          // Also notify general listeners
          const generalListeners = this.sseListeners.get('*')
          if (generalListeners) {
            generalListeners.forEach(listener => listener(data))
          }
        } catch (error) {
          logger.error('❌ API Client: Failed to parse SSE message:', error as Error)
        }
      }

      this.sseConnection.onerror = (error) => {
        logger.error('❌ API Client: SSE connection error:', new Error('SSE connection failed'))
        this.disconnectFromSSE()
      }

    } catch (error) {
      logger.error('❌ API Client: Failed to connect to SSE:', error as Error)
    }
  }

  // Disconnect from SSE stream
  disconnectFromSSE(): void {
    if (this.sseConnection) {
      logger.debug('🔄 API Client: Disconnecting from SSE stream...')
      this.sseConnection.close()
      this.sseConnection = null
    }
  }

  // Add event listener for SSE messages
  addEventListener(eventType: string, listener: (data: any) => void): void {
    if (!this.sseListeners.has(eventType)) {
      this.sseListeners.set(eventType, new Set())
    }
    this.sseListeners.get(eventType)!.add(listener)
  }

  // Remove event listener
  removeEventListener(eventType: string, listener: (data: any) => void): void {
    const listeners = this.sseListeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  // Trigger manual SSE update (for testing)
  async triggerManualUpdate(action: string, data?: any): Promise<{ success: boolean; message: string }> {
    try {
      logger.debug(`🔄 API Client: Triggering manual ${action}...`)

      const response = await fetch(`${this.baseURL}/demo/documents/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.debug('✅ API Client: Manual update triggered successfully')

      return result
    } catch (error) {
      logger.error('❌ API Client: Failed to trigger manual update:', error as Error)
      throw error
    }
  }

  // Get connection status
  getConnectionStatus(): { sseConnected: boolean; lastError?: string } {
    return {
      sseConnected: this.sseConnection !== null && this.sseConnection.readyState === EventSource.OPEN,
      lastError: this.sseConnection?.readyState === EventSource.CLOSED ? 'Connection closed' : undefined
    }
  }

  // Search documents and folders with advanced filtering
  async searchDocuments(options: {
    query?: string
    type?: 'all' | 'documents' | 'folders'
    fileType?: string
    dateFrom?: string
    dateTo?: string
    sizeMin?: number
    sizeMax?: number
    parentFolder?: string
    limit?: number
    offset?: number
  }): Promise<any> {
    try {
      logger.debug('🔍 API Client: Searching documents with options:', options)

      const params = new URLSearchParams()

      if (options.query) params.append('q', options.query)
      if (options.type) params.append('type', options.type)
      if (options.fileType) params.append('fileType', options.fileType)
      if (options.dateFrom) params.append('dateFrom', options.dateFrom)
      if (options.dateTo) params.append('dateTo', options.dateTo)
      if (options.sizeMin !== undefined) params.append('sizeMin', options.sizeMin.toString())
      if (options.sizeMax !== undefined) params.append('sizeMax', options.sizeMax.toString())
      if (options.parentFolder) params.append('parentFolder', options.parentFolder)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`${this.baseURL}/demo/documents/search?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.debug('✅ API Client: Search completed successfully')

      return result
    } catch (error) {
      logger.error('❌ API Client: Search failed:', error as Error)
      throw error
    }
  }
}

// Export singleton instance
export const documentAPIClient = new DocumentAPIClient()

// Export types for convenience
export type { DocumentItem, FolderItem, DocumentsResponse }
