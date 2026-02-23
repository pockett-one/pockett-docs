"use client"

import {
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio,
  FileCode,
  File
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Google Drive icon component
function GoogleDriveIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 23.8z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  )
}

// Google Docs – blue, three horizontal lines
function GoogleDocIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#4285F4" fillOpacity={0.2} stroke="#4285F4" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="#4285F4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13h8M8 16h8M8 10h4" stroke="#4285F4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Google Sheets – green, grid
function GoogleSheetsIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#0F9D58" fillOpacity={0.2} stroke="#0F9D58" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="#0F9D58" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10v8h3v-8H8zm5 0v8h3v-8h-3zm5 0v8h3v-8h-3zM8 7h3V4H8v3zm5 0h3V4h-3v3zm5 0h3V4h-3v3z" fill="#0F9D58" />
    </svg>
  )
}

// Google Slides – yellow/amber
function GoogleSlidesIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#F4B400" fillOpacity={0.3} stroke="#F4B400" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="#F4B400" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14h8v-4H8v4z" fill="#F4B400" />
      <path d="M8 10h8" stroke="#F4B400" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  )
}

interface DocumentIconProps {
  mimeType?: string
  size?: number
  className?: string
  name?: string
}

export function DocumentIcon({ mimeType, size = 20, className = "", name = "" }: DocumentIconProps) {
  // Handle undefined or null mimeType
  if (!mimeType) {
    return <File className={`text-gray-600 ${className}`} size={size} />
  }

  // Special case: Google Drive folder gets the Google Drive icon
  if (name === 'Google Drive') {
    return <GoogleDriveIcon size={size} className={className} />
  }

  // Handle folder types - use Google Drive mimeType for all folders
  if (mimeType === 'application/vnd.google-apps.folder') {
    return <Folder className={cn("text-purple-600 fill-purple-200", className)} size={size} />
  }

  // Handle document types based on mimeType (lowercase for matching)
  const m = (mimeType || '').toLowerCase()
  let IconComponent = File
  let iconColor = 'text-gray-600'

  if (m.includes('pdf')) {
    IconComponent = File
    iconColor = 'text-red-600'
  } else if (m === 'application/vnd.google-apps.spreadsheet') {
    IconComponent = GoogleSheetsIcon
    iconColor = ''
  } else if (m.includes('excel') || m.includes('spreadsheetml')) {
    IconComponent = FileSpreadsheet
    iconColor = 'text-green-600'
  } else if (m.includes('spreadsheet')) {
    IconComponent = FileSpreadsheet
    iconColor = 'text-green-600'
  } else if (m === 'application/vnd.google-apps.presentation') {
    IconComponent = GoogleSlidesIcon
    iconColor = ''
  } else if (m.includes('powerpoint') || m.includes('presentationml')) {
    IconComponent = Presentation
    iconColor = 'text-orange-600'
  } else if (m.includes('presentation')) {
    IconComponent = Presentation
    iconColor = 'text-orange-600'
  } else if (m === 'application/vnd.google-apps.document') {
    IconComponent = GoogleDocIcon
    iconColor = ''
  } else if (m.includes('word') || m.includes('wordprocessingml')) {
    IconComponent = FileText
    iconColor = 'text-blue-600'
  } else if (m.includes('document')) {
    IconComponent = FileText
    iconColor = 'text-blue-600'
  } else if (m.includes('image')) {
    IconComponent = FileImage
    iconColor = 'text-purple-600'
  } else if (mimeType.includes('video')) {
    IconComponent = FileVideo
    iconColor = 'text-red-500'
  } else if (mimeType.includes('audio')) {
    IconComponent = FileAudio
    iconColor = 'text-blue-500'
  } else if (m.includes('archive') || m.includes('zip')) {
    IconComponent = FileArchive
    iconColor = 'text-yellow-600'
  } else if (m.includes('code') || m.includes('text')) {
    IconComponent = FileCode
    iconColor = 'text-gray-700'
  }

  return (
    <IconComponent
      className={`${iconColor} ${className}`}
      size={size}
    />
  )
}
