"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DocumentIcon } from "@/components/ui/document-icon"
import { formatFileSize, formatSmartDateTime } from "@/lib/utils"
import { reminderStorage } from "@/lib/reminder-storage"
import { FilePreviewSheet } from "@/components/files/file-preview-sheet"
import { DocumentEditSheet, DocumentEditPanelContent, DocumentPreviewPanelContent, getDocumentEditUrl } from "@/components/files/document-edit-sheet"
import { useRightPane } from "@/lib/right-pane-context"
import { VersionHistorySheet } from "@/components/files/version-history-sheet"
import { DocumentShareModal } from "@/components/files/document-share-modal"
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  /** When set, Share opens the custom share modal instead of OS share. Only show Share item when true (Project Lead). */
  showShareModal?: boolean
  /** Required when showShareModal is true; project UUID for saving share settings. */
  projectId?: string
  /** Called after share settings are saved (e.g. to refresh shared badges). */
  onShareSaved?: () => void
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
  onDeleteDocument,
  showShareModal = false,
  projectId,
  onShareSaved,
}: DocumentActionMenuProps) {
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showShareModalOpen, setShowShareModalOpen] = useState(false)
  const [showFileInfo, setShowFileInfo] = useState(false)
  const [selectedDueDate, setSelectedDueDate] = useState<string>("")
  const [hasCopiedName, setHasCopiedName] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { addToast } = useToast()
  const rightPane = useRightPane()

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  const isWindows = typeof navigator !== 'undefined' && /Win/.test(navigator.platform)
  const supportsDesktopApp = isMac || isWindows
  const mime = (document?.mimeType ?? '').toLowerCase()
  const canOpenWithGoogleDoc = mime.includes('document') || mime.includes('vnd.google-apps.document')
  const canOpenWithGoogleSheet = mime.includes('spreadsheet') || mime.includes('vnd.google-apps.spreadsheet')
  const canOpenWithGoogleSlide = mime.includes('presentation') || mime.includes('vnd.google-apps.presentation')
  const canOpenWithWord = supportsDesktopApp && (mime.includes('document') || mime.includes('word'))
  const canOpenWithExcel = supportsDesktopApp && (mime.includes('spreadsheet') || mime.includes('excel'))
  const canOpenWithPowerPoint = supportsDesktopApp && (mime.includes('presentation') || mime.includes('powerpoint'))

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
                  {!document.mimeType?.includes('folder') && document.size != null && typeof document.size === 'number' && (
                    <> • {formatFileSize(document.size)}</>
                  )}
                </p>
                <div className="mt-1.5 space-y-0.5 border-t border-gray-50 pt-1.5">
                  {document.createdTime && !Number.isNaN(new Date(document.createdTime).getTime()) && (
                    <p className="text-[10px] text-gray-400">
                      <span className="font-medium text-gray-500">Created:</span> {document.owners?.[0]?.displayName || 'Unknown'} | {formatSmartDateTime(document.createdTime)}
                    </p>
                  )}
                  {(document.modifiedTime || document.createdTime) && (
                    <p className="text-[10px] text-gray-400">
                      <span className="font-medium text-gray-500">Modified:</span> {document.lastModifyingUser?.displayName || 'Unknown'} | {document.modifiedTime && !Number.isNaN(new Date(document.modifiedTime).getTime()) ? formatSmartDateTime(document.modifiedTime) : document.createdTime && !Number.isNaN(new Date(document.createdTime).getTime()) ? formatSmartDateTime(document.createdTime) : '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {document.mimeType?.includes('folder') ? (
              <>
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
                {showShareModal && projectId && (
                  <DropdownMenuItem
                    onClick={() => setShowShareModalOpen(true)}
                    className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                  >
                    <Share2 className="h-4 w-4 text-purple-600" />
                    <span>Share</span>
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <>
                {/* Open with */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs">
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                    <span>Open with</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <DropdownMenuItem
                      onClick={() => {
                        if (rightPane.hasRightPane) {
                          rightPane.setTitle(document.name ?? 'Document')
                          rightPane.setContent(<DocumentPreviewPanelContent document={document} />)
                        } else {
                          setShowPreview(true)
                        }
                      }}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                      <span>Preview</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onOpenDocument?.(document)
                        if (rightPane.hasRightPane) {
                          rightPane.setTitle(document.name ?? 'Document')
                          rightPane.setContent(<DocumentEditPanelContent document={document} />)
                        } else {
                          setShowEditSheet(true)
                        }
                      }}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                    >
                      <Edit3 className="h-4 w-4 text-green-600" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    {canOpenWithGoogleDoc && (
                      <DropdownMenuItem
                        onClick={() => window.open(getDocumentEditUrl(document), '_blank')}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>Google Docs</span>
                      </DropdownMenuItem>
                    )}
                    {canOpenWithGoogleSheet && (
                      <DropdownMenuItem
                        onClick={() => window.open(getDocumentEditUrl(document), '_blank')}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <FileText className="h-4 w-4 text-green-600" />
                        <span>Google Sheets</span>
                      </DropdownMenuItem>
                    )}
                    {canOpenWithGoogleSlide && (
                      <DropdownMenuItem
                        onClick={() => window.open(getDocumentEditUrl(document), '_blank')}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <FileText className="h-4 w-4 text-amber-600" />
                        <span>Google Slides</span>
                      </DropdownMenuItem>
                    )}
                    {canOpenWithWord && (
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getDocumentEditUrl(document)
                          window.open(`ms-word:ofe|u|${encodeURI(url)}`, '_self')
                        }}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <FileText className="h-4 w-4 text-blue-700" />
                        <span>Microsoft Word</span>
                      </DropdownMenuItem>
                    )}
                    {canOpenWithExcel && (
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getDocumentEditUrl(document)
                          window.open(`ms-excel:ofe|u|${encodeURI(url)}`, '_self')
                        }}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <FileText className="h-4 w-4 text-green-700" />
                        <span>Microsoft Excel</span>
                      </DropdownMenuItem>
                    )}
                    {canOpenWithPowerPoint && (
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getDocumentEditUrl(document)
                          window.open(`ms-powerpoint:ofe|u|${encodeURI(url)}`, '_self')
                        }}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <FileText className="h-4 w-4 text-orange-700" />
                        <span>Microsoft PowerPoint</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={() => { handleDownload(document); onDownloadDocument?.(document) }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Download</span>
                </DropdownMenuItem>

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
                    <span>Make a copy</span>
                  </DropdownMenuItem>
                )}

                {showShareModal && projectId && (
                  <DropdownMenuItem
                    onClick={() => setShowShareModalOpen(true)}
                    className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                  >
                    <Share2 className="h-4 w-4 text-purple-600" />
                    <span>Share</span>
                  </DropdownMenuItem>
                )}
                {!showShareModal && (
                  <DropdownMenuItem
                    onClick={async () => {
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
                )}

                {/* Manage */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs">
                    <FolderOpen className="h-4 w-4 text-gray-600" />
                    <span>Manage</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    {onCopyDocument && (
                      <DropdownMenuItem
                        onClick={() => onCopyDocument(document)}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={async () => {
                        const link = document.webViewLink || getDocumentEditUrl(document)
                        await navigator.clipboard.writeText(link)
                        addToast({ type: 'success', title: 'Link copied', message: 'Document link copied to clipboard' })
                      }}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                      <span>Copy link</span>
                    </DropdownMenuItem>
                    {onMoveDocument && (
                      <DropdownMenuItem
                        onClick={() => onMoveDocument(document)}
                        className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                      >
                        <Move className="h-4 w-4 text-gray-600" />
                        <span>Move</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={() => setShowFileInfo(true)}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Info className="h-4 w-4 text-gray-600" />
                  <span>File information</span>
                </DropdownMenuItem>

                {onDeleteDocument && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => onDeleteDocument(document)}
                          className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Move to Bin</span>
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[200px]">
                        <p>Items in Bin are permanently deleted after 30 days (Google Drive).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => { setShowVersionHistory(true); onVersionHistory?.(document) }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>Version history</span>
                </DropdownMenuItem>
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
                <DropdownMenuItem
                  onClick={() => {
                    const parentId = document.parents?.[0]
                    const url = parentId
                      ? `https://drive.google.com/drive/folders/${parentId}`
                      : `https://drive.google.com/drive/my-drive`
                    window.open(url, '_blank')
                  }}
                  className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-xs"
                >
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span>Open Folder in Drive</span>
                </DropdownMenuItem>
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
        onEdit={() => { setShowPreview(false); setShowEditSheet(true) }}
      />

      <DocumentEditSheet
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        document={document}
        onDownload={handleDownload}
      />

      <VersionHistorySheet
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        document={document}
      />

      <Dialog open={showFileInfo} onOpenChange={setShowFileInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File information</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium truncate max-w-[240px]" title={document.name}>{document.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span>{getDisplayType(document)}</span>
            </div>
            {document.size != null && typeof document.size === 'number' && (
              <div className="flex justify-between">
                <span className="text-gray-500">Size</span>
                <span>{formatFileSize(document.size)}</span>
              </div>
            )}
            {document.modifiedTime && !Number.isNaN(new Date(document.modifiedTime).getTime()) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Modified</span>
                <span>{formatSmartDateTime(document.modifiedTime)}</span>
              </div>
            )}
            {document.createdTime && !Number.isNaN(new Date(document.createdTime).getTime()) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{formatSmartDateTime(document.createdTime)}</span>
              </div>
            )}
            {(document.owners?.[0]?.displayName || document.lastModifyingUser?.displayName) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Owner</span>
                <span>{document.owners?.[0]?.displayName || document.lastModifyingUser?.displayName || '—'}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showShareModal && projectId && (
        <DocumentShareModal
          open={showShareModalOpen}
          onOpenChange={setShowShareModalOpen}
          document={{
            id: document.id,
            name: document.name ?? document.title ?? 'Document',
            mimeType: document.mimeType,
          }}
          projectId={projectId}
          onSaved={onShareSaved}
        />
      )}

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