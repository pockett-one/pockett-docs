import { NextRequest } from 'next/server'

// Force dynamic rendering for SSE endpoint
export const dynamic = 'force-dynamic'

// SSE endpoint for real-time document updates
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 SSE: Client connecting to document stream...')

    // Set up SSE headers
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to document stream',
          timestamp: new Date().toISOString()
        })}\n\n`
        
        controller.enqueue(encoder.encode(initialMessage))

        // Simulate document updates every 30 seconds
        // In real implementation, this would be triggered by actual Google Drive webhooks
        const updateInterval = setInterval(() => {
          const updateMessage = `data: ${JSON.stringify({
            type: 'document_update',
            message: 'Document data has been updated',
            timestamp: new Date().toISOString(),
            changes: {
              type: 'sync',
              description: 'Periodic sync with Google Drive'
            }
          })}\n\n`
          
          controller.enqueue(encoder.encode(updateMessage))
        }, 30000)

        // Simulate folder changes every 60 seconds
        const folderUpdateInterval = setInterval(() => {
          const folderMessage = `data: ${JSON.stringify({
            type: 'folder_update',
            message: 'Folder structure has been updated',
            timestamp: new Date().toISOString(),
            changes: {
              type: 'structure_change',
              description: 'New folders or documents detected'
            }
          })}\n\n`
          
          controller.enqueue(encoder.encode(folderMessage))
        }, 60000)

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('🔄 SSE: Client disconnected')
          clearInterval(updateInterval)
          clearInterval(folderUpdateInterval)
          controller.close()
        })

        // Keep connection alive with heartbeat
        const heartbeatInterval = setInterval(() => {
          const heartbeatMessage = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`
          
          controller.enqueue(encoder.encode(heartbeatMessage))
        }, 25000)

        // Clean up on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('❌ SSE Error:', error)
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Failed to establish SSE connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// POST endpoint to trigger manual updates (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    console.log(`🔄 SSE: Manual trigger for ${action}`)

    // In a real implementation, this would:
    // 1. Process the action (e.g., document created, updated, deleted)
    // 2. Broadcast the change to all connected SSE clients
    // 3. Update any internal state or databases

    return new Response(JSON.stringify({
      success: true,
      message: `Manual ${action} triggered successfully`,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ SSE POST Error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to process SSE trigger',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
