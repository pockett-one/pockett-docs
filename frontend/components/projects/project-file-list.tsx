'use client'

import { useState, useEffect } from 'react'
import { Folder, File, FileText, Image, Video, Music, Archive, MoreVertical } from 'lucide-react'
import { DocumentIcon } from '@/components/ui/document-icon'
import { DocumentActionMenu } from '@/components/ui/document-action-menu'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'
import { DriveFile } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

interface ProjectFileListProps {
    projectId: string
    driveFolderId?: string | null
}

export function ProjectFileList({ projectId, driveFolderId }: ProjectFileListProps) {
    const { session } = useAuth()
    const [files, setFiles] = useState<DriveFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchFiles() {
            if (!session?.access_token || !driveFolderId) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                // Fetch files from the project's Drive folder
                const response = await fetch('/api/connectors/google-drive/linked-files', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'list',
                        folderId: driveFolderId
                    })
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch files')
                }

                const data = await response.json()
                setFiles(data.files || [])
            } catch (err) {
                console.error('Error fetching project files:', err)
                setError('Failed to load files')
            } finally {
                setLoading(false)
            }
        }

        fetchFiles()
    }, [session, driveFolderId, projectId])

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Modern Loading Spinner */}
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                        {/* Outer spinning ring */}
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100"></div>
                        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-6 text-sm font-medium text-slate-600">Loading files...</p>
                    <p className="mt-1 text-xs text-slate-400">Please wait while we fetch your project files</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <div className="text-slate-400 mb-2">⚠️</div>
                <p className="text-sm text-slate-600">{error}</p>
            </div>
        )
    }

    if (!driveFolderId) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">No Drive Folder Linked</h3>
                <p className="text-sm text-slate-500">
                    This project doesn't have a Google Drive folder linked yet.
                </p>
            </div>
        )
    }

    if (files.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">No Files Found</h3>
                <p className="text-sm text-slate-500">
                    This project folder is empty.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Header - Google Drive Style */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Date Modified</div>
                    <div className="col-span-2 text-right">File Size</div>
                </div>
            </div>

            {/* File List */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className="group grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 transition-colors items-center"
                    >
                        {/* Name Column */}
                        <div className="col-span-6 flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0">
                                <DocumentIcon mimeType={file.mimeType} className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900 truncate" title={file.name}>
                                    {file.name}
                                </span>
                                {/* Action Menu - Visible on Hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DocumentActionMenu document={file} />
                                </div>
                            </div>
                        </div>

                        {/* Owner Column */}
                        <div className="col-span-2 min-w-0">
                            <span className="text-sm text-slate-600 truncate block" title={file.actorEmail || 'me'}>
                                {file.actorEmail || 'me'}
                            </span>
                        </div>

                        {/* Date Modified Column */}
                        <div className="col-span-2">
                            <span className="text-sm text-slate-600">
                                {formatRelativeTime(file.modifiedTime)}
                            </span>
                        </div>

                        {/* File Size Column */}
                        <div className="col-span-2 text-right">
                            {file.mimeType === 'application/vnd.google-apps.folder' ? (
                                <span className="text-sm text-slate-400">—</span>
                            ) : file.size ? (
                                <span className="text-sm text-slate-600 font-mono">
                                    {formatFileSize(Number(file.size))}
                                </span>
                            ) : (
                                <span className="text-sm text-slate-400">—</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3">
                <div className="text-xs text-slate-500 font-medium">
                    {files.length} {files.length === 1 ? 'item' : 'items'}
                </div>
            </div>
        </div>
    )
}
