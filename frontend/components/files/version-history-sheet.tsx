"use client"

import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { X, Clock, AlertCircle, Download, FileText } from "lucide-react"
import { DriveFile, DriveRevision } from "@/lib/types"
import { formatFileSize, formatSmartDateTime, cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface VersionHistorySheetProps {
    isOpen: boolean
    onClose: () => void
    document: DriveFile
}

export function VersionHistorySheet({
    isOpen,
    onClose,
    document
}: VersionHistorySheetProps) {
    const { session } = useAuth()
    const [revisions, setRevisions] = useState<DriveRevision[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && document?.id && document?.connectorId) {
            loadRevisions()
        } else {
            setRevisions([])
            setLoading(false)
        }
    }, [isOpen, document])

    const loadRevisions = async () => {
        if (!session?.access_token || !document.connectorId) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/documents/versions?fileId=${document.id}&connectorId=${document.connectorId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setRevisions(data.revisions)
            } else {
                let errorBody = ""
                try {
                    errorBody = await response.text()
                } catch {
                    // Ignore body parsing errors
                }

                console.error("Failed to load version history", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody,
                })

                const statusInfo = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`
                const detailedMessage = errorBody
                    ? `Failed to load version history (${statusInfo}): ${errorBody}`
                    : `Failed to load version history (${statusInfo})`

                setError(detailedMessage)
            }
        } catch (err) {
            setError('An error occurred while fetching versions')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }



    if (!document) return null

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-50 border-l border-gray-200 shadow-2xl">
                {/* Stylized Header */}
                <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm z-20 relative">
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-12 h-12 bg-blue-50/80 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex flex-col gap-0.5">
                            <SheetTitle className="text-lg font-bold text-gray-900 tracking-tight">
                                Version History
                            </SheetTitle>
                            <SheetDescription className="text-xs font-medium text-gray-500 truncate max-w-[200px]" title={document.name}>
                                {document.name}
                            </SheetDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white">
                    {loading ? (
                        <div className="space-y-6 animate-pulse mt-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-gray-200 rounded-full" />
                                        <div className="w-0.5 h-16 bg-gray-100 mt-1" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">Failed to load versions</h3>
                            <p className="text-sm text-gray-500 mb-4">{error}</p>
                            <Button variant="outline" onClick={loadRevisions} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                                Try Again
                            </Button>
                        </div>
                    ) : revisions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-2/3 text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="font-medium">No version history available</p>
                        </div>
                    ) : (
                        <div className="relative ml-2 space-y-0 pb-10">
                            {[...revisions].reverse().map((rev, index) => {
                                const versionNumber = revisions.length - index
                                const isCurrent = index === 0

                                // All versions are downloadable via our proxy API
                                const handleDownload = () => {
                                    if (!session?.access_token) return
                                    const url = `/api/documents/download?fileId=${document.id}&connectorId=${document.connectorId}&revisionId=${rev.id}&filename=${encodeURIComponent(rev.originalFilename || document.name)}&token=${session.access_token}`

                                    // Trigger download
                                    const a = window.document.createElement('a')
                                    a.href = url
                                    a.download = rev.originalFilename || document.name
                                    window.document.body.appendChild(a)
                                    a.click()
                                    window.document.body.removeChild(a)
                                }

                                return (
                                    <div key={rev.id} className="relative pl-10 pb-10 group last:pb-0">
                                        {/* Timeline Dot & Line */}
                                        <div className="absolute left-0 top-[5px] flex flex-col items-center h-full">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2 z-10 box-content transition-all duration-300",
                                                isCurrent
                                                    ? "bg-white border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)] scale-110"
                                                    : "bg-white border-gray-300 group-hover:border-gray-400"
                                            )}>
                                                {isCurrent && <div className="w-2 h-2 bg-blue-600 rounded-full m-auto absolute inset-0" />}
                                            </div>
                                            {/* Vertical Line */}
                                            {index !== revisions.length - 1 && (
                                                <div className="w-px bg-gray-200 flex-grow mt-1 group-hover:bg-gray-300 transition-colors" />
                                            )}
                                        </div>

                                        <div className={cn(
                                            "flex flex-col gap-1.5 p-4 rounded-xl transition-all duration-200 border",
                                            isCurrent
                                                ? "bg-white border-blue-100 shadow-sm"
                                                : "bg-transparent border-transparent hover:bg-white hover:border-gray-100 hover:shadow-sm"
                                        )}>
                                            {/* Row 1: Title & Size */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-sm tracking-tight",
                                                        isCurrent ? "font-bold text-gray-900" : "font-semibold text-gray-700"
                                                    )}>
                                                        {isCurrent ? 'Current Version' : `Version ${versionNumber}`}
                                                    </span>
                                                    {rev.size && (
                                                        <>
                                                            <span className="text-gray-300 text-[10px]">•</span>
                                                            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                {formatFileSize(Number(rev.size))}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Download Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                    title="Download this version"
                                                    onClick={handleDownload}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Row 2: Date & User */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="font-medium text-gray-600">
                                                    {formatSmartDateTime(rev.modifiedTime)}
                                                </span>
                                                {rev.lastModifyingUser?.displayName &&
                                                    rev.lastModifyingUser.displayName !== 'Unknown' &&
                                                    rev.lastModifyingUser.displayName !== 'Unknown User' && (
                                                        <>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="truncate">
                                                                {rev.lastModifyingUser.displayName}
                                                            </span>
                                                        </>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
