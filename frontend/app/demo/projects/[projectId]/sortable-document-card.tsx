"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FileText, FileSpreadsheet, Presentation } from "lucide-react"

interface Document {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'pdf'
  size: number
  modifiedTime: string
  contributor: string
}

interface SortableDocumentCardProps {
  doc: Document
  getDocumentIcon: (doc: Document) => React.ReactNode
  formatFileSize: (bytes: number) => string
  formatRelativeTime: (timestamp: string) => string
}

export function SortableDocumentCard({ 
  doc, 
  getDocumentIcon, 
  formatFileSize, 
  formatRelativeTime 
}: SortableDocumentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getDocumentIcon(doc)}
          <span className="text-sm font-medium text-gray-900 truncate">
            {doc.name}
          </span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>{formatFileSize(doc.size)}</span>
          <span>{formatRelativeTime(doc.modifiedTime)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <FileText className="h-3 w-3" />
          <span>{doc.contributor}</span>
        </div>
      </div>
    </div>
  )
}
