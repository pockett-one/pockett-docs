interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  results?: any[]
}

interface ChatSession {
  id: string
  messages: ChatMessage[]
  lastUpdated: Date
}

class ChatStorageService {
  private dbName = 'PockettChatDB'
  private dbVersion = 1
  private storeName = 'chatSessions'
  private maxSessions = 5
  private db: IDBDatabase | null = null

  async initialize(): Promise<boolean> {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('IndexedDB not available, falling back to localStorage')
        return false
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion)

        request.onerror = () => {
          console.error('Failed to open IndexedDB:', request.error)
          reject(request.error)
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log('IndexedDB initialized successfully')
          resolve(true)
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
            store.createIndex('lastUpdated', 'lastUpdated', { unique: false })
            console.log('Created chat sessions store')
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      return false
    }
  }

  async saveChatSession(messages: ChatMessage[]): Promise<void> {
    if (!this.db) {
      // Fallback to localStorage
      this.saveToLocalStorage(messages)
      return
    }

    try {
      const session: ChatSession = {
        id: this.generateSessionId(),
        messages: messages.slice(-10), // Keep last 10 messages to avoid huge storage
        lastUpdated: new Date()
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      // Delete oldest sessions if we exceed maxSessions
      await this.cleanupOldSessions()

      // Save new session
      await store.put(session)
      console.log('Chat session saved to IndexedDB')
    } catch (error) {
      console.error('Failed to save to IndexedDB, falling back to localStorage:', error)
      this.saveToLocalStorage(messages)
    }
  }

  async getRecentChatSessions(): Promise<ChatSession[]> {
    if (!this.db) {
      return this.getFromLocalStorage()
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('lastUpdated')

      return new Promise((resolve, reject) => {
        const request = index.getAll()
        
        request.onsuccess = () => {
          const sessions = request.result
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
            .slice(0, this.maxSessions)
          
          // Convert timestamp strings back to Date objects
          sessions.forEach(session => {
            session.lastUpdated = new Date(session.lastUpdated)
            session.messages.forEach((msg: ChatMessage) => {
              msg.timestamp = new Date(msg.timestamp)
            })
          })
          
          resolve(sessions)
        }

        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('Failed to get from IndexedDB, falling back to localStorage:', error)
      return this.getFromLocalStorage()
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    if (!this.db) {
      this.deleteFromLocalStorage(sessionId)
      return
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await store.delete(sessionId)
      console.log('Chat session deleted from IndexedDB')
    } catch (error) {
      console.error('Failed to delete from IndexedDB:', error)
    }
  }

  async clearAllSessions(): Promise<void> {
    if (!this.db) {
      this.clearLocalStorage()
      return
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await store.clear()
      console.log('All chat sessions cleared from IndexedDB')
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
    }
  }

  private async cleanupOldSessions(): Promise<void> {
    if (!this.db) return

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('lastUpdated')

      const request = index.getAllKeys()
      
      request.onsuccess = () => {
        const keys = request.result
        if (keys.length >= this.maxSessions) {
          // Sort by lastUpdated and delete oldest
          const sessionsToDelete = keys
            .map(key => ({ key, lastUpdated: this.getLastUpdated(key) }))
            .sort((a, b) => a.lastUpdated - b.lastUpdated)
            .slice(0, keys.length - this.maxSessions + 1)

          sessionsToDelete.forEach(({ key }) => {
            store.delete(key)
          })
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error)
    }
  }

  private getLastUpdated(key: IDBValidKey): number {
    // This is a simplified approach - in a real implementation,
    // you'd want to get the actual lastUpdated value
    return Date.now()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // LocalStorage fallback methods
  private saveToLocalStorage(messages: ChatMessage[]): void {
    try {
      const sessions = this.getFromLocalStorage()
      const newSession: ChatSession = {
        id: this.generateSessionId(),
        messages: messages.slice(-10),
        lastUpdated: new Date()
      }

      sessions.unshift(newSession)
      sessions.splice(this.maxSessions) // Keep only maxSessions

      localStorage.setItem('pockett_chat_sessions', JSON.stringify(sessions))
      console.log('Chat session saved to localStorage')
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  private getFromLocalStorage(): ChatSession[] {
    try {
      const stored = localStorage.getItem('pockett_chat_sessions')
      if (!stored) return []

      const sessions = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      sessions.forEach((session: ChatSession) => {
        session.lastUpdated = new Date(session.lastUpdated)
        session.messages.forEach((msg: ChatMessage) => {
          msg.timestamp = new Date(msg.timestamp)
        })
      })

      return sessions
    } catch (error) {
      console.error('Failed to get from localStorage:', error)
      return []
    }
  }

  private deleteFromLocalStorage(sessionId: string): void {
    try {
      const sessions = this.getFromLocalStorage()
      const filtered = sessions.filter(session => session.id !== sessionId)
      localStorage.setItem('pockett_chat_sessions', JSON.stringify(filtered))
      console.log('Chat session deleted from localStorage')
    } catch (error) {
      console.error('Failed to delete from localStorage:', error)
    }
  }

  private clearLocalStorage(): void {
    try {
      localStorage.removeItem('pockett_chat_sessions')
      console.log('All chat sessions cleared from localStorage')
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// Export singleton instance
export const chatStorage = new ChatStorageService()
