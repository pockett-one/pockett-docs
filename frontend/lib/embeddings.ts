import { logger } from './logger'

// We use Transformers.js for free, local embeddings.
// Model 'all-MiniLM-L6-v2' is 384-dimensional and highly optimized for retrieval.
let pipelineInstance: any = null

async function getPipeline() {
    if (!pipelineInstance) {
        const { pipeline } = await import('@xenova/transformers')
        pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    }
    return pipelineInstance
}

/**
 * Generate a vector embedding for the given text using local Transformers.js.
 * @param text The text to embed (e.g., a filename)
 * @returns An array of numbers representing the embedding vector (384 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const generate = await getPipeline()
        // Compute features
        const output = await generate(text.replace(/\n/g, ' '), {
            pooling: 'mean',
            normalize: true
        })

        // output is a Tensor. Converting to plain array.
        return Array.from(output.data)
    } catch (error) {
        logger.error('Failed to generate local embedding:', error as Error)
        throw error
    }
}

/**
 * Clean and combine file name and other metadata for better embedding.
 */
export function prepareTextForEmbedding(fileName: string): string {
    // Currently just the filename, but could be expanded to include tags or summary
    return fileName.trim()
}
