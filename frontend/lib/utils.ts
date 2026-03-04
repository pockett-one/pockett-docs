import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number | string | null | undefined): string {
  if (bytes === undefined || bytes === null || bytes === '') return 'Unknown size'
  const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes
  if (isNaN(numBytes)) return 'Unknown size'
  if (numBytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(numBytes) / Math.log(k))
  if (i < 0 || i >= sizes.length) return numBytes + ' Bytes'
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Full date in unambiguous format: "MMM dd, yyyy" (e.g. "Feb 16, 2026").
 * Use wherever a full date is shown to avoid US vs non-US locale confusion.
 */
export function formatFullDate(date: Date | string | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
}

export function formatSmartDateTime(date: Date | string): string {
  return formatFullDate(date)
}

export function formatSmartDateTime(date: Date | string): string {
  return formatFullDate(date)
}

export function getFileTypeLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('image')) return 'Image'
  if (mimeType.includes('folder')) return 'Folder'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Doc'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Sheet'
  return 'File'
}

export function formatDate(date: string | Date | undefined): string {
  return formatFullDate(date)
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatFullDate(d)
}
