import { NextRequest, NextResponse } from 'next/server'
import { registerClient, unregisterClient, broadcastDocumentUpdate, broadcastFolderUpdate, broadcastGenericUpdate } from '@/lib/sse-broadcast'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 SSE: New client connecting...')
    
    // Set up SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Register client using utility function
        registerClient(controller)
        
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connection_established',
          message: 'SSE connection established',
          timestamp: new Date().toISOString()
        })}\n\n`)
        
        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          } catch (error) {
            console.error('❌ SSE: Heartbeat failed, removing client')
            clearInterval(heartbeat)
            unregisterClient(controller)
          }
        }, 30000)
        
        // Clean up when client disconnects
        request.signal.addEventListener('abort', () => {
          console.log('🔄 SSE: Client disconnected')
          clearInterval(heartbeat)
          unregisterClient(controller)
        })
      }
    })

    return new Response(stream, { headers })

  } catch (error) {
    console.error('❌ SSE Error:', error)
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 }
    )
  }
}

// POST endpoint to trigger updates (for testing or external triggers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action, data } = body
    
    console.log(`🔄 SSE: Broadcasting ${action} for ${type}:`, data)
    
    if (type === 'document') {
      broadcastDocumentUpdate(action, data)
    } else if (type === 'folder') {
      broadcastFolderUpdate(action, data)
    } else {
      // Generic update
      broadcastGenericUpdate(type, action, data)
    }
    
    return NextResponse.json({ success: true, message: 'Update broadcasted' })
    
  } catch (error) {
    console.error('❌ SSE POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to broadcast update' },
      { status: 500 }
    )
  }
}
