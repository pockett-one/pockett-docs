import { FAQItem } from "@/data/faq-data"
import Fuse from 'fuse.js'

export interface FAQSearchResult {
    item: FAQItem
    score: number
    matchType: 'semantic' | 'keyword'
}

export class FAQSearchService {
    private embedder: any = null
    private isLoading = false
    private isInitialized = false
    private questionEmbeddings: number[][] = []
    private fuse: Fuse<FAQItem> | null = null

    // Cosine similarity
    private cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
        const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
        const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
        return dotProduct / (magA * magB)
    }

    async initialize(faqs: FAQItem[]): Promise<boolean> {
        console.log(`🔌 Initializing Search Service with ${faqs.length} items`)

        // Always recreate Fuse to ensure latest config applies (fixes HMR staleness)
        this.fuse = new Fuse(faqs, {
            // Equal weights: matches in Answer are just as important as Question
            keys: [
                { name: 'question', weight: 1 },
                { name: 'answer', weight: 1 }
            ],
            includeScore: true,
            // Strict threshold (0.3) filters out weak 'fuzzy' noise (0.7 scores)
            threshold: 0.3,
            // IMPORTANT: ignoreFieldNorm ensures "price" found in a long Answer isn't penalized
            ignoreFieldNorm: true,
            ignoreLocation: true,
            minMatchCharLength: 3
        })

        if (typeof window === 'undefined') return false
        if (this.isInitialized) return true

        try {
            console.log('🚀 Starting AI Model load...')
            this.isLoading = true

            // Dynamic import for transformers.js
            // @ts-ignore
            const { pipeline } = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

            this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

            const texts = faqs.map(f => `${f.question} ${f.answer}`)
            for (const text of texts) {
                const output = await this.embedder(text, { pooling: 'mean', normalize: true })
                this.questionEmbeddings.push(Array.from(output.data))
            }

            this.isInitialized = true
            this.isLoading = false
            console.log('✅ AI Model Ready')
            return true
        } catch (e) {
            console.error('❌ AI Model failed to load:', e)
            // Even if AI fails, Fuse is ready
            return false
        }
    }

    async search(query: string, faqs: FAQItem[]): Promise<FAQSearchResult[]> {
        if (!query.trim()) return []

        // 1. Fuse.js Check
        if (!this.fuse) {
            // Initialize synchronously creates Fuse instance
            this.initialize(faqs)
        }

        // Safety check
        if (!this.fuse) return []

        const fused = this.fuse.search(query)

        // BOOST LOGIC: Prioritize matches that contain the query stem
        // e.g. "price" -> stem "pric" matches "pricing" but NOT "enterprise".
        const stem = query.length > 3 ? query.toLowerCase().slice(0, -1) : query.toLowerCase()

        const keywordResults = fused.map(res => {
            const rawScore = res.score ?? 1
            let finalFuseScore = rawScore

            // Check for stem matches to strictly prioritize semantic roots
            const textContent = (res.item.question + " " + res.item.answer).toLowerCase()
            const lowerQuery = query.toLowerCase()

            if (textContent.includes(lowerQuery)) {
                // Perfect substring match (e.g. "cost" -> "cost")
                finalFuseScore = 0.01
            } else if (textContent.includes(stem)) {
                // Stem match (e.g. "pric" -> "pricing")
                // This effectively filters out "enterprise" (which has 'pris' not 'pric')
                finalFuseScore = 0.05
            }

            return {
                item: res.item,
                // Convert to Similarity Score (1=best)
                score: 1 - finalFuseScore,
                matchType: 'keyword' as const
            }
        }).sort((a, b) => b.score - a.score) // Re-sort based on boosted scores

        // Return immediately if semantic not ready
        if (!this.isInitialized) {
            return keywordResults
        }

        // 2. Semantic Search
        try {
            const output = await this.embedder(query, { pooling: 'mean', normalize: true })
            const queryEmbedding = Array.from(output.data) as number[]

            const semanticResults = faqs.map((item, index) => {
                const score = this.cosineSimilarity(queryEmbedding, this.questionEmbeddings[index])
                return {
                    item,
                    score,
                    matchType: 'semantic' as const
                }
            })

            // Threshold: 0.2 filters out weak matches
            const validSemantic = semanticResults
                .filter(r => r.score > 0.2)
                .sort((a, b) => b.score - a.score)

            // --- MERGER: Semantic First ---
            // If AI is ready, we trust it more than Fuse.
            // We only keep Fuse results if they are "exceptional" (e.g. exact substring/stem matches).

            const combinedMap = new Map<string, FAQSearchResult>()

            // 1. Add ALL valid semantic results
            validSemantic.forEach(r => combinedMap.set(r.item.question, r))

            // 2. Add Keyword results ONLY if they are very strong (Stem/Exact match OR High-quality typo)
            // This filters out the "erratic" fuzzy matches (e.g. "enterprise" for "price" score ~0.2)
            // But allows "priceing" for "pricing" (score ~0.13)
            keywordResults.forEach(r => {
                // Threshold 0.82 corresponds to Fuse score < 0.18
                if (r.score > 0.82) {
                    const existing = combinedMap.get(r.item.question)
                    if (!existing || r.score > existing.score) {
                        combinedMap.set(r.item.question, r)
                    }
                }
            })

            const final = Array.from(combinedMap.values()).sort((a, b) => b.score - a.score)
            return final

        } catch (e) {
            console.error('[SearchService] Semantic search error:', e)
            return keywordResults
        }
    }

    isReady() {
        return this.isInitialized
    }
}

export const faqSearch = new FAQSearchService()
