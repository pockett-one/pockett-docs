export interface Connection {
  id: string
  name: string
  status: 'connected' | 'error' | 'disconnected'
  icon: string
  color: string
  documentCount?: number
}

const CONNECTIONS_STORAGE_KEY = 'pockett_connections'

// Get connections from localStorage
export const getConnections = (): Connection[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(CONNECTIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading connections from localStorage:', error)
  }

  // Always return at least Google Drive as connected if nothing is stored
  return [
    {
      id: 'google-drive',
      name: 'Google Drive',
      status: 'connected',
      icon: 'google-drive',
      color: 'bg-white',
      documentCount: undefined
    }
  ]
}

// Save connections to localStorage
export const saveConnections = (connections: Connection[]): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections))
  } catch (error) {
    console.error('Error saving connections to localStorage:', error)
  }
}

// Update connection status
export const updateConnectionStatus = (connectionId: string, status: Connection['status']): void => {
  const connections = getConnections()
  const updatedConnections = connections.map(conn =>
    conn.id === connectionId ? { ...conn, status } : conn
  )
  saveConnections(updatedConnections)
}

// Disconnect a service
export const disconnectService = (connectionId: string): void => {
  updateConnectionStatus(connectionId, 'disconnected')
}

// Connect a service
export const connectService = (connectionId: string): void => {
  updateConnectionStatus(connectionId, 'connected')
}

// Get connected service IDs
export const getConnectedServiceIds = (): string[] => {
  const connections = getConnections()
  return connections
    .filter(conn => conn.status === 'connected')
    .map(conn => conn.id)
}

// Check if a service is connected
export const isServiceConnected = (connectionId: string): boolean => {
  const connections = getConnections()
  const connection = connections.find(conn => conn.id === connectionId)
  return connection?.status === 'connected'
}

// Check if any services are connected
export const hasAnyConnections = (): boolean => {
  const connections = getConnections()
  return connections.some(conn => conn.status === 'connected')
}

// Check if Google Drive is connected
export const isGoogleDriveConnected = (): boolean => {
  const connections = getConnections()
  const googleDrive = connections.find(conn => conn.id === 'google-drive')
  return googleDrive?.status === 'connected'
}

// Check if mock data should be loaded (only when connections exist)
export const shouldLoadMockData = (): boolean => {
  // Always return true for now to ensure API calls work
  // TODO: In production, this should check actual connection status
  return true
}
