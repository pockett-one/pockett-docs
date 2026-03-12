import { Inngest } from "inngest"
import { logger } from "@/lib/logger"

// Create a client to send and receive events
// In development, we use a dummy event key and will handle send errors gracefully
export const inngest = new Inngest({
    id: "pockett",
    eventKey: process.env.INNGEST_EVENT_KEY,
    baseUrl: (process.env.INNGEST_DEV === '1' || process.env.INNGEST_EVENT_KEY === 'local')
        ? 'http://localhost:8288'
        : undefined
})

/**
 * Safely send an Inngest event — never throws.
 * Errors are logged but never propagated, so a background job failure
 * never breaks the user-facing action that triggered it.
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
        // Intentionally swallowed — Inngest events are fire-and-forget background tasks
    }
}
