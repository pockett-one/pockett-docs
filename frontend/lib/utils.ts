import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffInDays > 365 ? 'numeric' : undefined
  })
}

export function formatSmartDateTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  // Smart Relative: Show relative if less than 24 hours
  if (diffInHours < 24) {
    return formatRelativeTime(dateString)
  }

  // Absolute: MMM dd, HH:MM
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '') // remove comma from default string if needed, but toLocaleString format might need tweaking to match "MMM dd, HH:MM" exactly. 
  // actually standard is "Oct 22, 12:30". default might be "Oct 22, 12:30 PM".
  // User asked for "MMM dd, HH:MM" (24h format likely inferred from HH:MM).
  // Let's build it manually to be safe or use options.

  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${hours}:${minutes}`;
}

export function getFileTypeLabel(mimeType?: string) {
  if (!mimeType) return 'Other';
  const type = mimeType.toLowerCase();
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'Spreadsheet';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentation';
  if (type.includes('word') || type.includes('document')) return 'Document';
  if (type.includes('image')) return 'Image';
  if (type.includes('video')) return 'Video';
  if (type.includes('audio')) return 'Audio';
  if (type.includes('archive') || type.includes('zip')) return 'Archive';
  if (type.includes('folder')) return 'Folder';
  return 'Other';
}