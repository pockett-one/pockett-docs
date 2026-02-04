// Client-safe text extraction utilities
// This file can be imported in client components

// Extract plain text from markdown content
// Preserves headings (with #) for text-to-speech pause detection
export function extractPlainText(content: string | undefined): string {
  if (!content) return ''
  
  // Remove markdown syntax and extract text
  // Keep headings (# ## ### etc.) for text-to-speech pause detection
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Replace markdown links with text
    .replace(/[*\-_]/g, '') // Remove markdown formatting (but keep # for headings)
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // Replace image alt text
    // Keep headings with # markers - they'll be processed by text-to-speech
    .replace(/\n+/g, '\n') // Normalize newlines (keep them for heading detection)
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .trim()
  
  return text
}
