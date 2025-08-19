"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/mock-data"
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
  Trash2
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

  // Handle escape key and click outside for modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as Element
        if (!target.closest('.modal-content')) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      window.document.addEventListener('keydown', handleEscapeKey)
      window.document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      window.document.removeEventListener('keydown', handleEscapeKey)
      window.document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    
    // Create and download the file
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

      {/* Action Menu Popup */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {document.mimeType?.includes('folder') ? (
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 truncate max-w-48">
                      {document.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getDisplayType(document)} • {formatFileSize(document.size)}
                    </p>
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
                      // Generate fake Google Drive folder URL
                      const fakeFolderId = Math.random().toString(36).substring(2, 15)
                      const googleDriveUrl = `https://drive.google.com/drive/folders/${fakeFolderId}`
                      window.open(googleDriveUrl, '_blank')
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
                      // Generate fake Google Docs URL and open directly
                      const fakeDocId = Math.random().toString(36).substring(2, 15)
                      const googleDocsUrl = `https://docs.google.com/document/d/${fakeDocId}/edit`
                      window.open(googleDocsUrl, '_blank')
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
        </div>
      )}
    </>
  )
}