import { useEffect, useRef, useCallback, useState } from 'react'

export interface SSEEvent {
  type: string
  action?: string
  document?: any
  folder?: any
  data?: any
  message?: string
  timestamp: string
}

export interface SSEConnection {
  isConnected: boolean
  lastEvent: SSEEvent | null
  error: string | null
  reconnect: () => void
  disconnect: () => void
}

export function useSSE(url: string, options?: {
  autoConnect?: boolean
  onMessage?: (event: SSEEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}): SSEConnection {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      console.log('🔄 SSE: Connecting to:', url)
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('✅ SSE: Connection established')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        options?.onConnect?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data)
          console.log('📡 SSE: Received event:', data.type, data.action || '')
          
          setLastEvent(data)
          options?.onMessage?.(data)
        } catch (parseError) {
          console.error('❌ SSE: Failed to parse event data:', parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error('❌ SSE: Connection error:', event)
        setIsConnected(false)
        setError('Connection error occurred')
        options?.onError?.('Connection error occurred')
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current)
          console.log(`🔄 SSE: Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.error('❌ SSE: Max reconnection attempts reached')
          setError('Failed to reconnect after multiple attempts')
        }
      }

    } catch (err) {
      console.error('❌ SSE: Failed to create EventSource:', err)
      setError('Failed to establish connection')
      options?.onError?.('Failed to establish connection')
    }
  }, [url, options])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔄 SSE: Disconnecting...')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    options?.onDisconnect?.()
  }, [options])

  const reconnect = useCallback(() => {
    console.log('🔄 SSE: Manual reconnection requested')
    reconnectAttempts.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    if (options?.autoConnect !== false) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, options?.autoConnect])

  return {
    isConnected,
    lastEvent,
    error,
    reconnect,
    disconnect
  }
}
