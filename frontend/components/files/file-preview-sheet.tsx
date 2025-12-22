"use client"

import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ExternalLink, X, FileText, Download } from "lucide-react"
import { DocumentIcon } from "@/components/ui/document-icon"
import { formatFileSize, formatSmartDateTime } from "@/lib/utils"

interface FilePreviewSheetProps {
    isOpen: boolean
    onClose: () => void
    document: any
    onDownload?: (doc: any) => void
}

export function FilePreviewSheet({
    isOpen,
    onClose,
    document,
    onDownload
}: FilePreviewSheetProps) {
    if (!document) return null

    const getPreviewUrl = () => {
        // For Google Docs/Sheets/Slides, use the preview endpoint
        // For other files, use the embedLink or webViewLink based on type
        return `https://drive.google.com/file/d/${document.id}/preview`
    }

    const getEditUrl = () => {
        if (document.webViewLink) return document.webViewLink
        return `https://docs.google.com/document/d/${document.id}/edit`
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DocumentIcon mimeType={document.mimeType} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <SheetTitle className="text-base font-semibold text-gray-900 truncate" title={document.name}>
                                {document.name}
                            </SheetTitle>
                            <SheetDescription className="flex items-center text-xs text-gray-500 space-x-2">
                                <span>{formatFileSize(document.size)}</span>
                                <span>•</span>
                                <span>Edited {formatSmartDateTime(document.modifiedTime)}</span>
                            </SheetDescription>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        {onDownload && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDownload(document)}
                                title="Download"
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <Download className="h-5 w-5" />
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getEditUrl(), '_blank')}
                            className="hidden sm:flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open in Google Docs</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                            title="Close preview"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-hidden relative bg-gray-100 flex flex-col">
                    <iframe
                        src={getPreviewUrl()}
                        className="w-full h-full border-0"
                        title="File Preview"
                        allowFullScreen
                    />

                    {/* Fallback/Info Overlay if iframe fails to load or is blocked */}
                    <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur border-t border-gray-200 p-4 text-center text-sm text-gray-500 sm:hidden">
                        <Button
                            className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => window.open(getEditUrl(), '_blank')}
                        >
                            Open in Google Docs
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
