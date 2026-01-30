"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DocumentIcon } from "@/components/ui/document-icon"
import { formatFileSize, formatSmartDateTime } from "@/lib/utils"
import { reminderStorage } from "@/lib/reminder-storage"
import { FilePreviewSheet } from "@/components/files/file-preview-sheet"
import { VersionHistorySheet } from "@/components/files/version-history-sheet"
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
  Check,
  Info,
  Eye,
  X
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast"

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
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [selectedDueDate, setSelectedDueDate] = useState<string>("")
  const [hasCopiedName, setHasCopiedName] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { addToast } = useToast()

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle copy name
  const handleCopyName = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setHasCopiedName(true)
    setTimeout(() => setHasCopiedName(false), 2000)
  }

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

      document.dueDate = dateTime
      setSelectedDueDate(dateTime)
      setShowDueDatePicker(false)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pockett-reminder-updated'))
      }
    } catch (error) {
      console.error('Failed to add due date reminder:', error)
    }
  }

  const getDisplayType = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return "Folder"
    if (doc.mimeType?.includes('document')) return "Document"
    if (doc.mimeType?.includes('spreadsheet')) return "Spreadsheet"
    if (doc.mimeType?.includes('presentation')) return "Presentation"
    if (doc.type?.includes('pdf')) return "PDF"
    return "File"
  }

  const handleDownload = async (doc: any) => {
    if (doc.mimeType?.includes('folder')) return

    try {
      const { getSession } = await import('@/lib/supabase')
      const session = await getSession()

      if (!session) {
        console.error('No session found for download')
        return
      }

      const downloadUrl = `/api/documents/download?fileId=${doc.id}&connectorId=${doc.connectorId}&filename=${encodeURIComponent(doc.name)}&token=${session.access_token}`

      const a = window.document.createElement('a')
      a.href = downloadUrl
      a.download = doc.name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 h-8 w-8 p-0"
            title="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 p-0"
          onClick={(e) => e.stopPropagation()}
          onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus jump causing scroll
        >
          {/* Header Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <DocumentIcon mimeType={document.mimeType} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="text-sm font-medium text-gray-900 truncate select-text cursor-default max-w-[180px]">
                          {document.name}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-[300px] break-words">
                        <p>{document.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                      <span className="font-medium text-gray-500">Created:</span> {document.owners?.[0]?.displayName || 'Unknown'} | {formatSmartDateTime(document.createdTime)}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    <span className="font-medium text-gray-500">Modified:</span> {document.lastModifyingUser?.displayName || 'Unknown'} | {formatSmartDateTime(document.modifiedTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {document.mimeType?.includes('folder') ? (
              <DropdownMenuItem
                onClick={() => {
                  const googleDriveUrl = `https://drive.google.com/drive/folders/${document.id}`
                  if (typeof window !== 'undefined') window.open(googleDriveUrl, '_blank')
                }}
                className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <span>Open In Google Drive</span>
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => setShowPreview(true)}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span>Preview</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    if (document.webViewLink) {
                      if (typeof window !== 'undefined') window.open(document.webViewLink, '_blank')
                    } else {
                      const fakeDocId = Math.random().toString(36).substring(2, 15)
                      const googleDocsUrl = `https://docs.google.com/document/d/${fakeDocId}/edit`
                      if (typeof window !== 'undefined') window.open(googleDocsUrl, '_blank')
                    }
                    onOpenDocument?.(document)
                  }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <ExternalLink className="h-4 w-4 text-green-600" />
                  <span>Edit in Google Docs</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const parentId = document.parents?.[0]
                    const googleDriveFolderUrl = parentId
                      ? `https://drive.google.com/drive/folders/${parentId}`
                      : `https://drive.google.com/drive/my-drive`
                    if (typeof window !== 'undefined') window.open(googleDriveFolderUrl, '_blank')
                  }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span>Open Folder in Drive</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    handleDownload(document)
                    onDownloadDocument?.(document)
                  }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Download</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={async () => {
                    // Share Logic
                    if (navigator.share && document.webViewLink) {
                      try {
                        await navigator.share({
                          title: document.name,
                          text: `Check out this document: ${document.name}`,
                          url: document.webViewLink
                        })
                        return
                      } catch (err) { }
                    }
                    if (document.webViewLink) {
                      navigator.clipboard.writeText(document.webViewLink)
                      addToast({ type: 'success', title: 'Link Copied', message: 'Document link copied to clipboard' })
                    } else {
                      addToast({ type: 'error', title: 'Share Unavailable', message: 'No link available' })
                    }
                    onShareDocument?.(document)
                  }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Share2 className="h-4 w-4 text-purple-600" />
                  <span>Share</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setShowVersionHistory(true)
                    onVersionHistory?.(document)
                  }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>Version history</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onBookmarkDocument?.(document)}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Bookmark className="h-4 w-4 text-gray-600" />
                  <span>Bookmark</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setShowDueDatePicker(true)}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span>Set Due Date</span>
                </DropdownMenuItem>

                {(onRenameDocument || onCopyDocument || onMoveDocument || onDeleteDocument) && <DropdownMenuSeparator />}

                {onRenameDocument && (
                  <DropdownMenuItem
                    onClick={() => onRenameDocument(document)}
                    className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                  >
                    <Edit3 className="h-4 w-4 text-gray-600" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                )}

                {onCopyDocument && (
                  <DropdownMenuItem
                    onClick={() => onCopyDocument(document)}
                    className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                    <span>Copy</span>
                  </DropdownMenuItem>
                )}

                {onMoveDocument && (
                  <DropdownMenuItem
                    onClick={() => onMoveDocument(document)}
                    className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                  >
                    <Move className="h-4 w-4 text-gray-600" />
                    <span>Move</span>
                  </DropdownMenuItem>
                )}

                {(onRenameDocument || onCopyDocument || onMoveDocument) && onDeleteDocument && <DropdownMenuSeparator />}

                {onDeleteDocument && (
                  <DropdownMenuItem
                    onClick={() => onDeleteDocument(document)}
                    className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <FilePreviewSheet
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        document={document}
        onDownload={handleDownload}
      />

      <VersionHistorySheet
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        document={document}
      />

      {/* Still using Portal for Date Picker as it is a complex modal. Could use Dialog too but sticking to scope. */}
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
                >
                  <X className="h-5 w-5" />
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