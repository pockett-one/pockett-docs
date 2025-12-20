"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DocumentIcon } from "@/components/ui/document-icon"
import { formatFileSize } from "@/lib/utils"
import { reminderStorage } from "@/lib/reminder-storage"
import {
  FileText,
  FolderOpen,
  MoreHorizontal,
  Download,
  ExternalLink,
  Share2,
  Bookmark,
  Edit3,
  Copy,
  Move,
  Clock,
  Trash2,
  Calendar,
  Check
} from "lucide-react"

interface DocumentActionMenuProps {
  document: any
  onOpenDocument?: (doc: any) => void
  onDownloadDocument?: (doc: any) => void
  onShareDocument?: (doc: any) => void
  onBookmarkDocument?: (doc: any) => void
  onRenameDocument?: (doc: any) => void
  onCopyDocument?: (doc: any) => void
  onMoveDocument?: (doc: any) => void
  onVersionHistory?: (doc: any) => void
  onDeleteDocument?: (doc: any) => void
}

export function DocumentActionMenu({
  document,
  onOpenDocument,
  onDownloadDocument,
  onShareDocument,
  onBookmarkDocument,
  onRenameDocument,
  onCopyDocument,
  onMoveDocument,
  onVersionHistory,
  onDeleteDocument
}: DocumentActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [selectedDueDate, setSelectedDueDate] = useState<string>("")
  const [hasCopiedName, setHasCopiedName] = useState(false)

  // Handle copy name
  const handleCopyName = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setHasCopiedName(true)
    setTimeout(() => setHasCopiedName(false), 2000)
  }

  // Ensure we're on the client side and DOM is ready
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle due date selection
  const handleDueDateChange = async (dateTime: string) => {
    if (!dateTime) return

    try {
      await reminderStorage.addReminder({
        documentId: document.id,
        documentName: document.name,
        dueDate: dateTime,
        isCompleted: false,
        reminderType: 'due_date',
        message: undefined
      })

      // Update document with due date
      document.dueDate = dateTime

      setSelectedDueDate(dateTime)
      setShowDueDatePicker(false)
      setIsOpen(false)

      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pockett-reminder-updated'))
      }

      console.log('Due date reminder added:', dateTime)
    } catch (error) {
      console.error('Failed to add due date reminder:', error)
    }
  }

  // Safe event handlers that only run when safe
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }, [])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element
    if (!target.closest('.modal-content')) {
      setIsOpen(false)
    }
  }, [])

  // Handle escape key and click outside for modal - only when safe
  useEffect(() => {
    // Don't do anything if not open or not mounted
    if (!isOpen || !mounted) return

    // Double-check we're in a safe environment
    if (typeof window === 'undefined') return
    if (!window.document) return
    if (!window.document.addEventListener) return

    // Now it's safe to add event listeners
    try {
      window.document.addEventListener('keydown', handleEscapeKey)
      window.document.addEventListener('mousedown', handleClickOutside)
    } catch (error) {
      console.warn('Could not add event listeners:', error)
      return
    }

    // Cleanup function
    return () => {
      try {
        if (window.document && window.document.removeEventListener) {
          window.document.removeEventListener('keydown', handleEscapeKey)
          window.document.removeEventListener('mousedown', handleClickOutside)
        }
      } catch (error) {
        console.warn('Could not remove event listeners:', error)
      }
    }
  }, [isOpen, mounted, handleEscapeKey, handleClickOutside])

  const getDisplayType = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return "Folder"
    if (doc.mimeType?.includes('document')) return "Document"
    if (doc.mimeType?.includes('spreadsheet')) return "Spreadsheet"
    if (doc.mimeType?.includes('presentation')) return "Presentation"
    if (doc.type?.includes('pdf')) return "PDF"
    return "File"
  }

  // Download function that creates dummy files based on extension
  const handleDownload = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return

    const extension = doc.name.split('.').pop()?.toLowerCase() || 'txt'
    let content: string
    let mimeType = 'text/plain'
    let filename = doc.name

    switch (extension) {
      case 'txt':
        content = `This is a sample text file.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This file was created for demonstration purposes and contains sample content.

File Details:
- Name: ${doc.name}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

You can edit this file with any text editor.`
        break

      case 'pdf':
        content = `This is a sample PDF document.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This document contains sample content for demonstration purposes.
You can open this text file and convert it to PDF using your preferred method.

File Information:
- Name: ${doc.name}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

Thank you for using our document management system.`
        filename = doc.name.replace(/\.pdf$/, '.txt')
        break

      default:
        content = `This is a sample ${extension.toUpperCase()} file.

File Information:
- Name: ${doc.name}
- Extension: ${extension}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

This is a dummy file created for demonstration purposes.
The content is formatted as plain text for compatibility.`
    }

    // Create and download the file - only when safe
    try {
      if (typeof window !== 'undefined' && window.document && window.document.body) {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = filename
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.warn('Could not download file:', error)
    }
  }

  // Render the modal using portal to document.body
  const renderModal = () => {
    // Only render if mounted, open, and document.body exists
    if (!mounted || !isOpen || typeof window === 'undefined' || !window.document?.body) {
      return null
    }

    return createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 modal-content z-[1000000]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DocumentIcon mimeType={document.mimeType} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h3
                      className="text-sm font-medium text-gray-900 truncate select-text cursor-text"
                      title={document.name}
                    >
                      {document.name}
                    </h3>
                    <button
                      onClick={(e) => handleCopyName(e, document.name)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors flex-shrink-0"
                      title="Copy name"
                    >
                      {hasCopiedName ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {getDisplayType(document)}
                    {!document.mimeType?.includes('folder') && (
                      <> • {formatFileSize(document.size)}</>
                    )}
                  </p>
                  <div className="mt-1.5 space-y-0.5 border-t border-gray-50 pt-1.5">
                    {document.createdTime && (
                      <p className="text-[10px] text-gray-400">
                        <span className="font-medium text-gray-500">Created:</span> {document.owners?.[0]?.displayName || 'Unknown'} | {new Date(document.createdTime).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      <span className="font-medium text-gray-500">Modified:</span> {document.lastModifyingUser?.displayName || 'Unknown'} | {new Date(document.modifiedTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-2">
            {document.mimeType?.includes('folder') ? (
              // Folder actions
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Open the actual folder using document.id
                    const googleDriveUrl = `https://drive.google.com/drive/folders/${document.id}`
                    if (typeof window !== 'undefined') {
                      window.open(googleDriveUrl, '_blank')
                    }
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <span>Open In Google Drive</span>
                </button>
              </div>
            ) : (
              // File actions
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    if (document.webViewLink) {
                      if (typeof window !== 'undefined') {
                        window.open(document.webViewLink, '_blank')
                      }
                    } else {
                      // Generate fake Google Docs URL and open directly
                      const fakeDocId = Math.random().toString(36).substring(2, 15)
                      const googleDocsUrl = `https://docs.google.com/document/d/${fakeDocId}/edit`
                      if (typeof window !== 'undefined') {
                        window.open(googleDocsUrl, '_blank')
                      }
                    }
                    onOpenDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-green-600" />
                  <span>Open in Google Docs</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Use real parent folder if available, otherwise fallback to Drive root
                    const parentId = document.parents?.[0]
                    const googleDriveFolderUrl = parentId
                      ? `https://drive.google.com/drive/folders/${parentId}`
                      : `https://drive.google.com/drive/my-drive`

                    if (typeof window !== 'undefined') {
                      window.open(googleDriveFolderUrl, '_blank')
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span>Open Folder in Drive</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Basic download implementation
                    handleDownload(document)
                    onDownloadDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onShareDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Share2 className="h-4 w-4 text-purple-600" />
                  <span>Share</span>
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onRenameDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-gray-600" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onCopyDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Copy className="h-4 w-4 text-gray-600" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onMoveDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Move className="h-4 w-4 text-gray-600" />
                  <span>Move</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onVersionHistory?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>Version history</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onBookmarkDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Bookmark className="h-4 w-4 text-gray-600" />
                  <span>Bookmark</span>
                </button>
                <button
                  onClick={() => {
                    setShowDueDatePicker(true)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span>Set Due Date</span>
                </button>

                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onDeleteDocument?.(document)
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>,
      window.document.body
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
        title="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {/* Render modal using portal */}
      {renderModal()}

      {/* Due Date Picker Modal */}
      {showDueDatePicker && mounted && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]"
          onClick={() => setShowDueDatePicker(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 modal-content z-[1000000]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Set Due Date
                    </h3>
                    <p className="text-xs text-gray-500">
                      {document.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDueDatePicker(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select due date and time
                </label>
                <DateTimePicker
                  value={selectedDueDate}
                  onChange={handleDueDateChange}
                  placeholder="Choose date and time"
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDueDatePicker(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>,
        window.document.body
      )}
    </>
  )
}