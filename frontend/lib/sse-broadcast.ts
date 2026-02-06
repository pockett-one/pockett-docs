// SSE Broadcast utility functions
// These functions can be called from anywhere to broadcast updates to connected SSE clients
import { logger } from "@/lib/logger"

// Store connected clients (this would be in a proper database in production)
let clients: Set<ReadableStreamDefaultController> = new Set()

// Function to register a new client
export function registerClient(controller: ReadableStreamDefaultController) {
  clients.add(controller)
  logger.debug('✅ SSE: Client registered', { totalClients: clients.size })
}

// Function to unregister a client
export function unregisterClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller)
  logger.debug('🔄 SSE: Client unregistered', { totalClients: clients.size })
}

// Helper function to send data to all connected clients
function sendToAllClients(data: any) {
  const clientsToRemove: ReadableStreamDefaultController[] = []

  clients.forEach(client => {
    try {
      client.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      logger.error('❌ Error sending to client', error as Error)
      clientsToRemove.push(client)
    }
  })

  // Remove failed clients
  clientsToRemove.forEach(client => {
    clients.delete(client)
  })
}

// Function to broadcast document updates
export function broadcastDocumentUpdate(type: 'created' | 'updated' | 'deleted', document: any) {
  const update = {
    type: 'document_update',
    action: type,
    document,
    timestamp: new Date().toISOString()
  }
  sendToAllClients(update)
  logger.debug(`📡 SSE: Broadcasted document ${type}: ${document.name}`)
}

// Function to broadcast folder updates
export function broadcastFolderUpdate(type: 'created' | 'updated' | 'deleted', folder: any) {
  const update = {
    type: 'folder_update',
    action: type,
    folder,
    timestamp: new Date().toISOString()
  }
  sendToAllClients(update)
  logger.debug(`📡 SSE: Broadcasted folder ${type}: ${folder.name}`)
}

// Function to broadcast generic updates
export function broadcastGenericUpdate(type: string, action: string, data: any) {
  const update = {
    type: 'generic_update',
    action,
    data,
    timestamp: new Date().toISOString()
  }
  sendToAllClients(update)
  logger.debug(`📡 SSE: Broadcasted ${type} ${action}`, { data })
}

// Function to get current client count
export function getClientCount(): number {
  return clients.size
}

// Function to clear all clients (useful for testing)
export function clearAllClients() {
  clients.clear()
  logger.debug('🔄 SSE: All clients cleared')
}
