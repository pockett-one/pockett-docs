import { useEffect, useRef, useCallback, useState } from 'react'
import { logger } from './logger'

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
      logger.info('SSE connecting', 'SSE', { url })
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        logger.info('SSE connection established', 'SSE')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        options?.onConnect?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data)
          logger.debug('SSE event received', 'SSE', { type: data.type, action: data.action })

          setLastEvent(data)
          options?.onMessage?.(data)
        } catch (parseError) {
          logger.error('Failed to parse SSE event data', parseError instanceof Error ? parseError : new Error(String(parseError)), 'SSE')
        }
      }

      eventSource.onerror = (event) => {
        logger.warn('SSE connection error', 'SSE', { event })
        setIsConnected(false)
        setError('Connection error occurred')
        options?.onError?.('Connection error occurred')

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current)
          logger.info('SSE reconnecting', 'SSE', { delay, attempt: reconnectAttempts.current + 1, maxAttempts: maxReconnectAttempts })

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          logger.error('SSE max reconnection attempts reached', new Error('Max reconnection attempts reached'), 'SSE', { maxAttempts: maxReconnectAttempts })
          setError('Failed to reconnect after multiple attempts')
        }
      }

    } catch (err) {
      logger.error('Failed to create SSE EventSource', err instanceof Error ? err : new Error(String(err)), 'SSE')
      setError('Failed to establish connection')
      options?.onError?.('Failed to establish connection')
    }
  }, [url, options])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      logger.info('SSE disconnecting', 'SSE')
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
    logger.info('SSE manual reconnection requested', 'SSE')
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
