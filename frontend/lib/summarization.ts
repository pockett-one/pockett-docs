import { logger } from './logger'

// We use Transformers.js for free, local summarization.
// Model 'Xenova/distilbart-cnn-6-6' is ~250MB and performs well on M2 Macs.
let pipelineInstance: any = null

async function getPipeline() {
    if (!pipelineInstance) {
        try {
            const { pipeline } = await import('@xenova/transformers')
            pipelineInstance = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6')
        } catch (error) {
            logger.error('Failed to initialize summarization pipeline:', error as Error)
            return null
        }
    }
    return pipelineInstance
}

/**
 * Generate a concise summary for the given text using local Transformers.js.
 * @param text The source text to summarize
 * @returns A string summary or null if failed
 */
export async function generateSummary(text: string): Promise<string | null> {
    if (!text || text.length < 100) return null // Too short to summarize meaningfully

    try {
        const summarizer = await getPipeline()
        if (!summarizer) return null

        // Limit input length to avoid memory spikes (BART max is 1024 tokens)
        const truncatedText = text.substring(0, 3000)

        const output = await summarizer(truncatedText, {
            max_new_tokens: 50,
            min_new_tokens: 15,
            do_sample: false
        })

        if (output && output[0] && output[0].summary_text) {
            return output[0].summary_text as string
        }

        return null
    } catch (error) {
        logger.error('Local summarization failed:', error as Error)
        return null
    }
}
