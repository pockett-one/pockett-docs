export interface SearchOptions {
  fields: string[]
  caseSensitive?: boolean
  exactMatch?: boolean
  minLength?: number
}

export interface SearchResult<T> {
  item: T
  score: number
  matchedFields: string[]
  highlights: { field: string; value: string; indices: number[] }[]
}

/**
 * Universal search function for documents and other data
 */
export function searchDocuments<T>(
  items: T[],
  query: string,
  options: SearchOptions = { fields: ['name'], caseSensitive: false, exactMatch: false, minLength: 1 }
): SearchResult<T>[] {
  if (!query || query.length < (options.minLength || 1) || !items.length) {
    return []
  }

  const searchQuery = options.caseSensitive ? query : query.toLowerCase()
  const results: SearchResult<T>[] = []

  for (const item of items) {
    let score = 0
    const matchedFields: string[] = []
    const highlights: { field: string; value: string; indices: number[] }[] = []

    for (const field of options.fields) {
      const fieldValue = (item as any)[field]
      if (!fieldValue) continue

      const fieldStr = String(fieldValue)
      const fieldLower = options.caseSensitive ? fieldStr : fieldStr.toLowerCase()

      if (options.exactMatch) {
        if (fieldLower === searchQuery) {
          score += 100
          matchedFields.push(field)
          highlights.push({
            field,
            value: fieldStr,
            indices: [0, fieldStr.length]
          })
        }
      } else {
        // Partial match with scoring
        if (fieldLower.includes(searchQuery)) {
          const matchIndex = fieldLower.indexOf(searchQuery)
          const matchLength = searchQuery.length
          
          // Higher score for matches at the beginning
          const positionScore = matchIndex === 0 ? 50 : 25
          const lengthScore = Math.min(matchLength * 2, 30)
          
          score += positionScore + lengthScore
          matchedFields.push(field)
          highlights.push({
            field,
            value: fieldStr,
            indices: [matchIndex, matchIndex + matchLength]
          })
        }
      }
    }

    if (score > 0) {
      results.push({
        item,
        score,
        matchedFields,
        highlights
      })
    }
  }

  // Sort by relevance score (highest first)
  return results.sort((a, b) => b.score - a.score)
}

/**
 * Search through insights data specifically
 */
export function searchInsights(
  insightsCards: any[],
  documents: any[],
  query: string
): {
  matchingCards: any[]
  matchingDocuments: any[]
  totalResults: number
} {
  if (!query || query.length < 2) {
    return { matchingCards: [], matchingDocuments: [], totalResults: 0 }
  }

  // Search through insights cards
  const matchingCards = insightsCards.filter(card => {
    const cardText = `${card.title} ${card.tabs.map((tab: any) => tab.label).join(' ')}`
    return cardText.toLowerCase().includes(query.toLowerCase())
  })

  // Search through documents
  const matchingDocuments = searchDocuments(documents, query, {
    fields: ['name', 'mimeType'],
    caseSensitive: false,
    minLength: 2
  }).map(result => result.item)

  return {
    matchingCards,
    matchingDocuments,
    totalResults: matchingCards.length + matchingDocuments.length
  }
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

/**
 * Debounced search hook for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate uniform searchable data for any page
 */
export function generateUniformSearchableData(data: any): any[] {
  if (!data) return []
  
  // If data has documents, use them
  if (data.documents && Array.isArray(data.documents)) {
    return data.documents.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      type: 'document',
      path: doc.path,
      size: doc.size,
      modifiedTime: doc.modifiedTime,
      mimeType: doc.mimeType
    }))
  }
  
  // If data has folders, use them
  if (data.folders && Array.isArray(data.folders)) {
    return data.folders.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      path: folder.path,
      documentCount: folder.documentCount
    }))
  }
  
  // If data is an array, use it directly
  if (Array.isArray(data)) {
    return data
  }
  
  return []
}

/**
 * Get uniform search fields for any page
 */
export function getUniformSearchFields(): string[] {
  return ['name', 'path', 'type']
}

/**
 * Get uniform search placeholder for any page
 */
export function getUniformSearchPlaceholder(page: string = 'general'): string {
  const placeholders: { [key: string]: string } = {
    analytics: 'Search analytics data...',
    documents: 'Search documents...',
    insights: 'Search insights...',
    chat: 'Search chat history...',
    shared: 'Search shared documents...',
    contributors: 'Search contributors...',
    general: 'Search...'
  }
  
  return placeholders[page] || placeholders.general
}
