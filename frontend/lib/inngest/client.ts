import { Inngest } from "inngest"
import { logger } from "@/lib/logger"

// Create a client to send and receive events
// In development, we use a dummy event key and will handle send errors gracefully
export const inngest = new Inngest({
    id: "pockett",
    eventKey: process.env.INNGEST_EVENT_KEY,
    baseUrl: process.env.INNGEST_EVENT_KEY === 'local' ? 'http://localhost:8288' : undefined
})

/**
 * Safely send an Inngest event, with graceful error handling
 * In development with invalid event key, errors are logged but don't crash
 * In production, errors are thrown to ensure visibility
 */
export async function safeInngestSend(
    name: string,
    data: Record<string, any>
): Promise<void> {
    try {
        await inngest.send({
            name,
            data
        })
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        logger.error(`Failed to send Inngest event '${name}': ${errorMsg}`)

        // In development, swallow the error (probably invalid key like 'local')
        // In production, propagate it so you know Inngest isn't configured
        if (process.env.NODE_ENV === 'production') {
            throw error
        }
    }
}
