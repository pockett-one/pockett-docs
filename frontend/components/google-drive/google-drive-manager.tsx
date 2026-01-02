"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, FileText, ShieldCheck, Plus, Search, Filter, RefreshCw, HardDrive, Check, Loader2 } from 'lucide-react'
import { GooglePickerButton } from './google-picker-button'
import { formatDistanceToNow } from 'date-fns'
import { formatFileSize, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Skeleton } from '@/components/ui/skeleton'

interface GoogleDriveManagerProps {
    connectionId: string
    onImport?: (files: any[]) => void
}

interface LinkedFile {
    id: string
    name: string
    mimeType: string
    size: string
    linkedAt: string
    status: string
    isGrantRevoked: boolean
}

export function GoogleDriveManager({ connectionId, onImport }: GoogleDriveManagerProps) {
    const [linkedFiles, setLinkedFiles] = useState<LinkedFile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isRevoking, setIsRevoking] = useState<string | null>(null)
    const { addToast } = useToast()

    const fetchLinkedFiles = useCallback(async () => {
        if (!connectionId) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/connectors/google-drive/linked-files?connectionId=${connectionId}`)
            if (res.ok) {
                const data = await res.json()
                setLinkedFiles(data.files || [])
            }
        } catch (error) {
            console.error(error)
            addToast({ title: 'Error', message: 'Failed to fetch files', type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }, [connectionId, addToast])

    useEffect(() => {
        fetchLinkedFiles()
    }, [fetchLinkedFiles])

    const handleImportSuccess = (files: any[]) => {
        if (onImport) onImport(files)
        fetchLinkedFiles() // Refresh list
        addToast({
            title: 'Access Granted',
            message: `Successfully granted access to ${files.length} file(s).`,
            type: 'success'
        })
    }

    const handleUnlink = async (id: string) => {
        setIsRevoking(id)
        try {
            const res = await fetch('/api/connectors/google-drive/linked-files', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, connectionId })
            })
            if (res.ok) {
                // Remove from list immediately
                setLinkedFiles(prev => prev.filter(f => f.id !== id))
                addToast({ title: 'Access Revoked', message: 'File access revoked successfully.', type: 'success' })
            } else {
                throw new Error('Failed to unlink')
            }
        } catch (error) {
            addToast({ title: 'Error', message: 'Failed to revoke access.', type: 'error' })
        } finally {
            setIsRevoking(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-gray-900" />
                        Authorized Files
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Pockett can only access the files listed below.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLinkedFiles}
                        disabled={isLoading}
                        className="h-10 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>

                    <GooglePickerButton
                        connectionId={connectionId}
                        onImport={handleImportSuccess}
                        triggerLabel="Grant Access"
                        showSuccessToast={false}
                    >
                        <Button className="h-10 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all active:scale-[0.98]">
                            <Plus className="w-4 h-4 mr-2" />
                            Grant Access
                        </Button>
                    </GooglePickerButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm min-h-[300px]">
                {/* Search/Filter Bar (Visual only for now) */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{linkedFiles.length}</span> files authorized
                    </div>
                </div>

                {isLoading && linkedFiles.length === 0 ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-50" />)}
                    </div>
                ) : linkedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-medium text-lg">No files authorized yet</h4>
                        <p className="text-gray-500 text-sm mt-2 max-w-sm">
                            Click "Grant Access" to select the Google Drive files you want Pockett to manage.
                        </p>
                        <div className="mt-6">
                            <GooglePickerButton
                                connectionId={connectionId}
                                onImport={handleImportSuccess}
                                triggerLabel="Grant Access"
                                showSuccessToast={false}
                            >
                                <Button variant="outline" className="border-gray-200 text-gray-900 hover:bg-gray-50">
                                    Browse Google Drive
                                </Button>
                            </GooglePickerButton>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto custom-scrollbar">
                        {linkedFiles.map(file => (
                            <div key={file.id} className="group flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="p-2.5 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[300px] md:max-w-[400px]">
                                            {file.name}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                {formatFileSize(parseInt(file.size))}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span>
                                                Granted {formatDistanceToNow(new Date(file.linkedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnlink(file.id)}
                                        disabled={isRevoking === file.id}
                                        className="h-9 px-3 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                        {isRevoking === file.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Revoke
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
