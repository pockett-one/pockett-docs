"use client"

import { 
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
import { getFileIconComponent } from '@/lib/mock-data'

interface DocumentIconProps {
  mimeType?: string
  size?: number
  className?: string
}

export function DocumentIcon({ mimeType, size = 20, className = "" }: DocumentIconProps) {
  // Handle undefined or null mimeType
  if (!mimeType) {
    return <File className={`text-gray-600 ${className}`} size={size} />
  }
  
  const iconInfo = getFileIconComponent(mimeType)
  
  // Map component names to actual components
  const getIconComponent = () => {
    switch (iconInfo.component) {
      case 'FolderOpen':
        return FolderOpen
      case 'FileText':
        return FileText
      case 'FileSpreadsheet':
        return FileSpreadsheet
      case 'Presentation':
        return Presentation
      case 'FilePdf':
        return File
      case 'FileImage':
        return FileImage
      case 'FileArchive':
        return FileArchive
      case 'FileVideo':
        return FileVideo
      case 'FileAudio':
        return FileAudio
      case 'FileCode':
        return FileCode
      default:
        return File
    }
  }

  const IconComponent = getIconComponent()

  return (
    <IconComponent 
      className={`${iconInfo.color} ${className}`}
      size={size}
    />
  )
}
