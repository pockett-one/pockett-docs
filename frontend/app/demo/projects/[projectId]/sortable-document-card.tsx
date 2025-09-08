"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FileText, FileSpreadsheet, Presentation, Calendar, MessageSquare, Plus } from "lucide-react"
import { useState } from "react"

interface Document {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'pdf'
  size: number
  modifiedTime: string
  contributor: string
  assignee?: string
  dueDate?: string
  notes?: Array<{
    id: string
    content: string
    author: string
    createdAt: string
  }>
}

interface SortableDocumentCardProps {
  doc: Document
  getDocumentIcon: (doc: Document) => React.ReactNode
  formatFileSize: (bytes: number) => string
  formatRelativeTime: (timestamp: string) => string
  formatDate: (dateString: string) => string
  onAddNote?: (docId: string, content: string) => void
  accentColor?: string
}

export function SortableDocumentCard({ 
  doc, 
  getDocumentIcon, 
  formatFileSize, 
  formatRelativeTime,
  formatDate,
  onAddNote,
  accentColor
}: SortableDocumentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id })

  const [showNotes, setShowNotes] = useState(false)
  const [newNote, setNewNote] = useState("")

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddNote = () => {
    if (newNote.trim() && onAddNote) {
      onAddNote(doc.id, newNote.trim())
      setNewNote("")
    }
  }

  const isOverdue = doc.dueDate ? new Date(doc.dueDate) < new Date() : false

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined
      }}
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
        <div className="flex items-center space-x-1">
          {doc.notes && doc.notes.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowNotes(!showNotes)
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <MessageSquare className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowNotes(!showNotes)
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <Plus className="h-3 w-3" />
          </button>
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
        {doc.dueDate && (
          <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
            <Calendar className="h-3 w-3" />
            <span>Due: {formatDate(doc.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="space-y-2">
            {doc.notes && doc.notes.map((note) => (
              <div key={note.id} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-700">{note.author}</div>
                <div className="text-gray-600">{note.content}</div>
                <div className="text-gray-400">{formatRelativeTime(note.createdAt)}</div>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                onClick={(e) => e.stopPropagation()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNote()
                  }
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddNote()
                }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
