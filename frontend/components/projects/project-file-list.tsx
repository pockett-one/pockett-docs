'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Upload, FolderUp, X, Folder, File as FileIcon, ArrowUp, ArrowDown, ChevronRight, Search, List as ListIcon, LayoutGrid, Filter, ChevronDown, User, FileText, FileSpreadsheet, Presentation, ListChecks, PenTool, Map as MapIcon, LayoutTemplate, FileCode, AlertCircle, ShieldCheck, Maximize2, Minimize2, CheckCircle2, XCircle, Trash2, Layout, Code, Laptop } from 'lucide-react'
import { config } from "@/lib/config"
import { DocumentIcon } from '@/components/ui/document-icon'
import { DocumentActionMenu } from '@/components/ui/document-action-menu'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'
import { DriveFile } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { logger } from '@/lib/logger'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import useDrivePicker from 'react-google-drive-picker'
import { GoogleDriveImportDialog } from './google-drive-import-dialog'

interface ProjectFileListProps {
    projectId: string
    driveFolderId?: string | null
    rootFolderName?: string
}

type SortByOption = 'name' | 'modifiedTime' | 'modifiedTimeByMe' | 'viewedByMeTime'
type SortConfig = {
    sortBy: SortByOption
    direction: 'asc' | 'desc'
    foldersFirst: boolean
}

type BreadcrumbItem = {
    id: string
    name: string
}

type CreateItemType = 'folder' | 'doc' | 'sheet' | 'slide' | 'form' | 'drawing' | 'map' | 'site' | 'script'

type ConflictItem = {
    file: File
    existingId: string
}

type UploadQueueItem = {
    id: string
    file: File
    progress: number
    status: 'pending' | 'uploading' | 'completed' | 'error'
    error?: string
    finalName?: string
}

export function ProjectFileList({ projectId, driveFolderId, rootFolderName = 'Project Files' }: ProjectFileListProps) {
    const { session } = useAuth()
    const sessionRef = useRef(session)

    useEffect(() => {
        sessionRef.current = session
    }, [session])

    // Core State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(driveFolderId || null)
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
        { id: driveFolderId || 'root', name: rootFolderName }
    ])

    // Data State
    const [files, setFiles] = useState<DriveFile[]>([])
    const [loading, setLoading] = useState(true) // Initial load
    const [error, setError] = useState<string | null>(null)
    const [pickerToken, setPickerToken] = useState<string | null>(null)

    // Upload & Conflict State
    const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(true)
    const [conflictItems, setConflictItems] = useState<ConflictItem[]>([])
    const [overwriteSelections, setOverwriteSelections] = useState<Set<string>>(new Set())
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Actions State
    const [isCreateItemOpen, setIsCreateItemOpen] = useState(false)
    const [createItemType, setCreateItemType] = useState<CreateItemType>('folder')
    const [newItemName, setNewItemName] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    // Picker State
    const [openPicker] = useDrivePicker();
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [importedFiles, setImportedFiles] = useState<any[]>([])
    const [importLoading, setImportLoading] = useState(false)

    // UX State
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: 'name', direction: 'asc', foldersFirst: true })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set())
    const [highlightedFileId, setHighlightedFileId] = useState<string | null>(null)

    const handleShowFileLocation = (fileName: string) => {
        const file = files.find(f => f.name === fileName)
        if (file) {
            setHighlightedFileId(file.id)
            setTimeout(() => {
                const el = document.getElementById(`file-row-${file.id}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)

            // Auto-clear highlight after 3 seconds
            setTimeout(() => setHighlightedFileId(null), 3000)
        }
    }

    const fetchFiles = useCallback(async (folderId: string, silent = false) => {
        if (!sessionRef.current?.access_token) return
        if (!silent) setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/connectors/google-drive/linked-files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionRef.current.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'list', folderId })
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to fetch files')
            }
            const data = await res.json()
            setFiles(data.files || [])
        } catch (err: any) {
            logger.error(err)
            setError(err.message)
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (currentFolderId) {
            fetchFiles(currentFolderId)
        }
    }, [currentFolderId, fetchFiles])

    // Core Upload Function (Direct to Drive)
    const uploadFile = async (file: File, fileIdToOverwrite?: string, rename = false, onProgress?: (p: number) => void): Promise<{ success: boolean, error?: string, finalFile?: { name: string, id: string } }> => {
        // Use ref to avoid stale closure during batch processing
        const token = sessionRef.current?.access_token
        if (!token) return { success: false, error: 'No access token' }

        try {
            // 1. Prepare Metadata
            let fileName = file.name
            if (rename) {
                const part = file.name.split('.')
                const ext = part.length > 1 ? `.${part.pop()}` : ''
                const name = part.join('.')
                fileName = `${name}_${Date.now()}${ext}`
            }

            // 2. Get Resumable Upload URL from our API
            const res = await fetch('/api/connectors/google-drive/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: fileName,
                    mimeType: file.type || 'application/octet-stream',
                    parentId: currentFolderId || 'root',
                    fileId: fileIdToOverwrite
                })
            })

            if (!res.ok) {
                const text = await res.text()
                let errMsg = 'Failed to initiate upload'
                try {
                    const d = JSON.parse(text)
                    errMsg = d.error || errMsg
                } catch { }
                logger.error('Init Upload Error:', new Error(text))
                return { success: false, error: errMsg }
            }

            const { uploadUrl } = await res.json()
            logger.debug('Got Resumable Upload URL:', uploadUrl)

            // 3. Direct Upload to Google Drive (XHR for progress)
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', uploadUrl, true)
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100
                        onProgress?.(percentComplete)
                    }
                }

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        try {
                            const data = JSON.parse(xhr.responseText)
                            resolve({ success: true, finalFile: { name: data.name, id: data.id } })
                        } catch (e) {
                            logger.warn('Failed to parse upload response', { error: e })
                            resolve({ success: true })
                        }
                    } else {
                        logger.error('Drive Upload Error', new Error(`Status: ${xhr.status}, Response: ${xhr.responseText}`))
                        resolve({ success: false, error: `Upload failed: ${xhr.status}` })
                    }
                }

                xhr.onerror = () => {
                    logger.error('Network Error during upload', new Error(xhr.statusText))
                    resolve({ success: false, error: 'Network interruption. Please check connection.' })
                }

                xhr.send(file)
            })

        } catch (err: any) {
            logger.error('Upload Exception:', err)
            return { success: false, error: err.message }
        }
    }

    // Helper to update queue item
    const updateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
        setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
    }

    // Batch Resolution Handler
    const handleBatchResolution = async () => {
        const remainingToProcess = [...conflictItems]
        setConflictItems([]) // Close dialog

        // Add conflicting items to queue
        const newQueueItems: UploadQueueItem[] = remainingToProcess.map(item => ({
            id: `upload-${Date.now()}-${Math.random()}`,
            file: item.file,
            progress: 0,
            status: 'pending'
        }))

        // Map file to queue ID
        const fileToQueueId = new Map<File, string>()
        remainingToProcess.forEach((item, idx) => {
            fileToQueueId.set(item.file, newQueueItems[idx].id)
        })

        setUploadQueue(prev => [...prev, ...newQueueItems])
        setIsUploading(true)
        setIsUploadModalOpen(true)

        for (const item of remainingToProcess) {
            const queueId = fileToQueueId.get(item.file)!
            updateQueueItem(queueId, { status: 'uploading' })

            const updateProgress = (p: number) => {
                updateQueueItem(queueId, { progress: p })
            }

            let result
            if (overwriteSelections.has(item.file.name)) {
                result = await uploadFile(item.file, item.existingId, false, updateProgress)
            } else {
                result = await uploadFile(item.file, undefined, true, updateProgress)
            }

            if (!result.success) {
                updateQueueItem(queueId, { status: 'error', error: result.error })
            } else {
                updateQueueItem(queueId, { status: 'completed', progress: 100 })
            }
        }

        // Reset selections
        setOverwriteSelections(new Set())

        // Refresh
        if (currentFolderId) fetchFiles(currentFolderId, true)

        setIsUploading(false)
    }

    const cancelBatchResolution = () => {
        setConflictItems([])
        setOverwriteSelections(new Set())
        setIsUploading(false)
    }

    // Queue Processor
    const processUploads = async (fileList: FileList) => {
        setIsUploading(true)
        setIsUploadModalOpen(true)

        try {
            const uploads = Array.from(fileList)
            const conflicts: ConflictItem[] = []
            const safeUploads: File[] = []

            // 1. Classify
            for (const file of uploads) {
                const existing = files.find(f => f.name === file.name && f.mimeType !== 'application/vnd.google-apps.folder')
                if (existing) {
                    conflicts.push({ file, existingId: existing.id })
                } else {
                    safeUploads.push(file)
                }
            }

            // 2. Prepare Safe Uploads Queue
            const newQueueItems: UploadQueueItem[] = safeUploads.map(file => ({
                id: `upload-${Date.now()}-${Math.random()}`,
                file: file,
                progress: 0,
                status: 'pending'
            }))

            setUploadQueue(prev => [...prev, ...newQueueItems])

            // If we have conflicts, show dialog
            if (conflicts.length > 0) {
                setConflictItems(conflicts)
            }

            // 3. Process Safe Uploads
            if (safeUploads.length > 0) {
                // Map file to queue ID
                const fileToQueueId = new Map<File, string>()
                safeUploads.forEach((file, idx) => {
                    fileToQueueId.set(file, newQueueItems[idx].id)
                })

                for (const file of safeUploads) {
                    const queueId = fileToQueueId.get(file)!
                    updateQueueItem(queueId, { status: 'uploading' })

                    const result = await uploadFile(file, undefined, false, (p) => {
                        updateQueueItem(queueId, { progress: p })
                    })

                    if (!result.success) {
                        updateQueueItem(queueId, { status: 'error', error: result.error })
                    } else {
                        updateQueueItem(queueId, { status: 'completed', progress: 100 })
                    }
                }

                if (currentFolderId) fetchFiles(currentFolderId, true)
            }
            setIsUploading(false)

        } catch (e: any) {
            logger.error(e)
            setError(e.message) // Global error fallback
            setIsUploading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files
        if (!fileList || fileList.length === 0) return
        await processUploads(fileList)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const openCreateDialog = (type: CreateItemType) => {
        setCreateItemType(type)
        setNewItemName('')
        setIsCreateItemOpen(true)
    }

    const handleCreateItem = async () => {
        if (!newItemName.trim() || !session?.access_token) return
        setLoading(true)
        try {
            let mimeType = 'application/vnd.google-apps.folder'
            switch (createItemType) {
                case 'doc': mimeType = 'application/vnd.google-apps.document'; break;
                case 'sheet': mimeType = 'application/vnd.google-apps.spreadsheet'; break;
                case 'slide': mimeType = 'application/vnd.google-apps.presentation'; break;
                case 'form': mimeType = 'application/vnd.google-apps.form'; break;
                case 'drawing': mimeType = 'application/vnd.google-apps.drawing'; break;
                case 'map': mimeType = 'application/vnd.google-apps.map'; break;
                case 'site': mimeType = 'application/vnd.google-apps.site'; break;
                case 'script': mimeType = 'application/vnd.google-apps.script'; break;
            }

            const res = await fetch('/api/connectors/google-drive/linked-files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create-folder',
                    folderId: currentFolderId || 'root',
                    name: newItemName,
                    mimeType
                })
            })
            if (!res.ok) throw new Error(`Create ${createItemType} failed`)

            setIsCreateItemOpen(false)
            setNewItemName('')
            if (currentFolderId) fetchFiles(currentFolderId)
        } catch (err: any) {
            logger.error(err)
            setError(err.message)
            setLoading(false)
        }
    }

    const handleGoogleDrivePicker = async () => {
        if (!sessionRef.current?.access_token) return

        try {
            setImportLoading(true)
            const res = await fetch('/api/connectors/google-drive?action=token', {
                headers: { Authorization: `Bearer ${sessionRef.current.access_token}` }
            })

            if (!res.ok) throw new Error('Failed to get Google Access Token')

            const data = await res.json()
            const googleAccessToken = data.accessToken
            setPickerToken(googleAccessToken) // Store for import action

            if (!googleAccessToken) throw new Error('No Google Access Token returned')

            // @ts-ignore - Explicitly match onboarding config (empty key)
            openPicker({
                clientId: config.googleDrive.clientId || "",
                developerKey: "",
                appId: config.googleDrive.appId || "",
                viewId: "DOCS", // View all files
                token: googleAccessToken, // Use the real Google Token
                showUploadView: false,
                setIncludeFolders: true,
                supportDrives: true,
                multiselect: true,
                callbackFunction: (data) => {
                    if (data.action === 'picked') {
                        setImportedFiles(data.docs)
                        setIsImportDialogOpen(true)
                    }
                },
            })
        } catch (error) {
            console.error('Failed to launch picker', error)
        } finally {
            setImportLoading(false)
        }
    }

    const handleImportConfirm = async (mode: 'copy' | 'shortcut') => {
        setImportLoading(true)
        try {
            logger.debug(`[Frontend] Import Confirm. FolderId: ${currentFolderId}`)

            // Fetch connection info
            const tokenRes = await fetch('/api/connectors/google-drive?action=token', {
                headers: { Authorization: `Bearer ${sessionRef.current?.access_token}` }
            })
            const tokenData = await tokenRes.json()
            const connectionId = tokenData.connectionId

            const res = await fetch('/api/connectors/google-drive/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionRef.current?.access_token}`
                },
                body: JSON.stringify({
                    connectionId,
                    fileIds: importedFiles.map(f => f.id),
                    mode,
                    parentId: currentFolderId || 'root',
                    userToken: pickerToken // Pass the user's token
                })
            })

            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Import failed')
            }

            // Success
            setIsImportDialogOpen(false)
            if (currentFolderId) fetchFiles(currentFolderId, true)

        } catch (err: any) {
            logger.error(err)
            setError(err.message)
        } finally {
            setImportLoading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false)
    }
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const fileList = e.dataTransfer.files
        if (!fileList || fileList.length === 0) return
        await processUploads(fileList)
    }

    const setSortBy = (sortBy: SortByOption) => setSortConfig(c => ({ ...c, sortBy }))
    const setSortDirection = (direction: 'asc' | 'desc') => setSortConfig(c => ({ ...c, direction }))
    const setFoldersFirst = (foldersFirst: boolean) => setSortConfig(c => ({ ...c, foldersFirst }))

    const handleFolderClick = (file: DriveFile) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            setBreadcrumbs(prev => [...prev, { id: file.id, name: file.name }])
            setCurrentFolderId(file.id)
        }
    }

    const handleBreadcrumbClick = (index: number, id: string) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1))
        setCurrentFolderId(id)
    }

    const toggleFilterType = (type: string) => {
        setFilterTypes(prev => {
            const next = new Set(prev)
            if (next.has(type)) {
                next.delete(type)
            } else {
                next.add(type)
            }
            return next
        })
    }

    // Filter Logic
    const sortedFiles = useMemo(() => {
        let result = [...files]
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            result = result.filter(f => f.name.toLowerCase().includes(lowerQuery))
        }

        if (filterTypes.size > 0 && !filterTypes.has('all')) {
            result = result.filter(f => {
                const mime = f.mimeType
                if (filterTypes.has('folder') && mime === 'application/vnd.google-apps.folder') return true
                if (filterTypes.has('document') && mime === 'application/vnd.google-apps.document') return true
                if (filterTypes.has('spreadsheet') && mime === 'application/vnd.google-apps.spreadsheet') return true
                if (filterTypes.has('presentation') && mime === 'application/vnd.google-apps.presentation') return true
                if (filterTypes.has('image') && mime.startsWith('image/')) return true
                return false
            })
        }

        const direction = sortConfig.direction === 'asc' ? 1 : -1
        const getSortValue = (f: DriveFile): string | number => {
            if (sortConfig.sortBy === 'name') return f.name
            if (sortConfig.sortBy === 'modifiedTime' || sortConfig.sortBy === 'modifiedTimeByMe') return new Date(f.modifiedTime).getTime()
            if (sortConfig.sortBy === 'viewedByMeTime') return new Date(f.viewedByMeTime || f.lastViewedTime || 0).getTime()
            return 0
        }
        const cmp = (a: DriveFile, b: DriveFile): number => {
            const va = getSortValue(a)
            const vb = getSortValue(b)
            if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * direction
            return ((Number(va) || 0) - (Number(vb) || 0)) * direction
        }
        if (sortConfig.foldersFirst) {
            const folders = result.filter(f => f.mimeType === 'application/vnd.google-apps.folder').sort(cmp)
            const rest = result.filter(f => f.mimeType !== 'application/vnd.google-apps.folder').sort(cmp)
            return [...folders, ...rest]
        }
        return result.sort(cmp)
    }, [files, sortConfig, searchQuery, filterTypes])

    const TableHeader = ({ label }: { label: string }) => (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 tracking-wider select-none">
            {label}
        </div>
    )

    return (
        <div className="flex flex-col h-full bg-white"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Top Bar: Breadcrumbs & Actions */}
            <div className="px-4 py-3 border-b border-transparent bg-white flex flex-col gap-4 sticky top-0 z-10">
                {/* Breadcrumbs */}
                <div className="flex items-center text-xs font-medium text-slate-700 overflow-x-auto no-scrollbar whitespace-nowrap">
                    {breadcrumbs.map((item, index) => (
                        <div key={item.id} className="flex items-center">
                            {index > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1 text-slate-400" />}
                            <button
                                onClick={() => handleBreadcrumbClick(index, item.id)}
                                className={cn(
                                    "flex items-center hover:bg-slate-100 px-2 py-1 rounded transition-colors",
                                    index === breadcrumbs.length - 1 ? "text-slate-900 bg-slate-50" : "hover:text-slate-900"
                                )}
                            >
                                <Folder className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                {item.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Filters */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} className="h-8 gap-2 bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-200 border rounded-md shadow-sm">
                                    <Plus className="h-4 w-4" />
                                    Add
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[280px] py-1">
                                <DropdownMenuItem onClick={() => openCreateDialog('folder')} className="text-xs py-1.5">
                                    <Folder className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                    New folder
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Upload Section Header */}
                                <div className="px-2 py-1 bg-slate-50 border-y border-slate-50 flex items-center justify-between group select-none">
                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                        <Upload className="h-3.5 w-3.5" />
                                        File upload
                                    </span>
                                    {/* ... Tooltip ... */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 bg-white text-purple-700 text-[9px] px-1.5 py-0.5 rounded border border-purple-200 font-medium whitespace-nowrap cursor-help uppercase tracking-wider">
                                                <ShieldCheck className="h-3 w-3" />
                                                Direct-to-Drive
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-[300px] p-4 text-xs bg-white text-slate-900 border-slate-200 shadow-xl">
                                            <div className="space-y-2">
                                                <p className="font-semibold text-purple-700 flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4" />
                                                    Secure Direct Upload
                                                </p>
                                                <p>
                                                    Your files are uploaded <strong>directly to Google Drive</strong> and never reside on Pockett servers.
                                                </p>
                                                <p className="text-slate-500">
                                                    We use <a href="https://developers.google.com/drive/api/guides/manage-uploads#resumable" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google&apos;s resumable upload protocol</a> to ensure reliability and security.
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs py-1.5">
                                    <Laptop className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                    From your computer
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={handleGoogleDrivePicker} className="flex items-center text-xs py-1.5">
                                    <div className="mr-2 h-4 w-4 flex items-center justify-center">
                                        {/* Google Drive Logo */}
                                        <svg viewBox="0 0 87.3 78" className="h-3.5 w-3.5">
                                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l4.3-7.4-7.5-12.95H6l.6 10.4z" fill="#0066da" />
                                            <path d="M43.65 25 13.9 76.5h63.7l-9.8-16.95H29.15l29-50.25-3.65-6.3L43.65 25z" fill="#00ac47" />
                                            <path d="M73.55 76.5c2.1 0 4.05-.8 5.55-2.15l-6.1-10.6-3.8-6.6-4.6 7.95 9.05 15.65-.1-4.25z" fill="#ea4335" />
                                            <path d="M43.65 25 25.1 4.5l-3.35-4.5H80.5l-5.6 9.7L43.65 25z" fill="#00832d" />
                                            <path d="M10.45 6.85C9 7.65 7.9 8.8 7.1 10.15L25.1 41.3l18.55-32.1-1.65-2.9-6.3-10.9L13.7 3 10.45 6.85z" fill="#2684fc" />
                                            <path d="M40.05 76.5h33.5l-4.5-7.8H43.65l-3.6 7.8z" fill="#ffba00" />
                                        </svg>
                                    </div>
                                    Import from Google Drive
                                </DropdownMenuItem>

                                <DropdownMenuItem disabled className="text-xs py-1.5">
                                    <span className="pl-6 text-slate-400">Folder upload</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-0" />

                                {/* New File Section Header */}
                                <div className="px-2 py-1 bg-slate-50 border-b border-slate-50 flex items-center gap-2 text-xs font-semibold text-slate-500 select-none">
                                    <Plus className="h-3.5 w-3.5" />
                                    New file
                                </div>

                                <DropdownMenuItem onClick={() => openCreateDialog('doc')} className="text-xs py-1.5">
                                    <FileText className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                    Google Doc
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCreateDialog('sheet')} className="text-xs py-1.5">
                                    <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-green-500" />
                                    Google Sheet
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCreateDialog('slide')} className="text-xs py-1.5">
                                    <Presentation className="mr-2 h-3.5 w-3.5 text-yellow-500" />
                                    Google Slide
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCreateDialog('form')} className="text-xs py-1.5">
                                    <ListChecks className="mr-2 h-3.5 w-3.5 text-purple-600" />
                                    Google Form
                                </DropdownMenuItem>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="text-xs py-1.5">More</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-[200px] py-1">
                                        <DropdownMenuItem onClick={() => openCreateDialog('drawing')} className="text-xs py-1.5">
                                            <PenTool className="mr-2 h-3.5 w-3.5 text-red-500" />
                                            Google Drawing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openCreateDialog('map')} className="text-xs py-1.5">
                                            <MapIcon className="mr-2 h-3.5 w-3.5 text-orange-500" />
                                            Google My Map
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openCreateDialog('site')} className="text-xs py-1.5">
                                            <Layout className="mr-2 h-3.5 w-3.5 text-blue-600" />
                                            Google Site
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openCreateDialog('script')} className="text-xs py-1.5">
                                            <Code className="mr-2 h-3.5 w-3.5 text-slate-600" />
                                            Google Apps Script
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-6 w-px bg-slate-200 mx-2" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className="h-8 gap-2 bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    Type
                                    {filterTypes.size > 0 && <span className="ml-1 bg-slate-100 text-slate-900 px-1.5 rounded-full text-[10px]">{filterTypes.size}</span>}
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px]">
                                <DropdownMenuCheckboxItem checked={filterTypes.size === 0} onCheckedChange={() => setFilterTypes(new Set())}>
                                    All
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={filterTypes.has('folder')} onCheckedChange={() => toggleFilterType('folder')}>
                                    Folders
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('document')} onCheckedChange={() => toggleFilterType('document')}>
                                    Documents
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('spreadsheet')} onCheckedChange={() => toggleFilterType('spreadsheet')}>
                                    Spreadsheets
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('presentation')} onCheckedChange={() => toggleFilterType('presentation')}>
                                    Presentations
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('image')} onCheckedChange={() => toggleFilterType('image')}>
                                    Images
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* ... Other Filters (unchanged) ... */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className="h-8 gap-2 bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    People
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px]">
                                <DropdownMenuLabel>Owner</DropdownMenuLabel>
                                <DropdownMenuItem className="gap-2">
                                    <User className="h-4 w-4" />
                                    Any onwers
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <User className="h-4 w-4" />
                                    Owned by me
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <User className="h-4 w-4" />
                                    Not owned by me
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className="h-8 gap-2 bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    Modified
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px]">
                                <DropdownMenuItem>Any time</DropdownMenuItem>
                                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                                <DropdownMenuItem>This year</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className="h-8 gap-2 bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    Source
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px]">
                                <DropdownMenuItem>All sources</DropdownMenuItem>
                                <DropdownMenuItem>Uploaded</DropdownMenuItem>
                                <DropdownMenuItem>Shared with me</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Right: Search & Layout */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                disabled={loading}
                                placeholder="Search in this folder"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-[250px] pl-9 bg-slate-50 border-transparent focus:bg-white focus:border-slate-300 transition-all rounded-full text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div >

            {/* Content Area - Styled as a Card */}
            < div className="flex-1 overflow-hidden flex flex-col relative m-4 bg-white rounded-xl border border-slate-200 shadow-sm" >
                {/* Google Drive Style Upload Progress Modal */}
                {/* Google Drive Style Upload Progress Modal */}
                {
                    uploadQueue.length > 0 && (
                        <div className={cn(
                            "fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-slate-200 z-50 flex flex-col transition-all duration-300 w-[360px]",
                            isUploadModalOpen ? "h-auto max-h-[400px]" : "h-10"
                        )}>
                            {/* Modal Header */}
                            <div
                                className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200 text-slate-900 rounded-t-lg cursor-pointer"
                                onClick={() => setIsUploadModalOpen(!isUploadModalOpen)}
                            >
                                <span className="text-[11px] font-medium">
                                    {isUploading ? 'Uploading' : 'Uploads complete'} {uploadQueue.filter(i => i.status === 'completed').length}/{uploadQueue.length}
                                </span>
                                <div className="flex items-center gap-2 text-slate-500">
                                    {isUploadModalOpen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setUploadQueue([])
                                            setIsUploading(false)
                                        }}
                                        className="hover:bg-slate-200 rounded p-0.5 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            {isUploadModalOpen && (
                                <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 custom-scrollbar">
                                    {uploadQueue.map((item) => (
                                        <div key={item.id} className="flex flex-col gap-1 px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 group">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-shrink-0">
                                                    <DocumentIcon mimeType={item.file.type} className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] text-slate-700 truncate font-medium" title={item.finalName || item.file.name}>{item.finalName || item.file.name}</p>
                                                    {item.status === 'error' && (
                                                        <p className="text-[10px] text-red-500 truncate">{item.error || 'Upload failed'}</p>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    {/* Show Location Action */}
                                                    {(item.status === 'completed' || item.status === 'uploading') && (
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleShowFileLocation(item.finalName || item.file.name)
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-500 transition-opacity"
                                                                    >
                                                                        <Folder className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Show file location</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}

                                                    {item.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-slate-900" />}
                                                    {item.status === 'error' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                                </div>
                                            </div>
                                            {/* Progress Bar Row */}
                                            {item.status === 'uploading' && (
                                                <div className="flex items-center gap-2 pl-6">
                                                    <Progress value={item.progress} className="h-1 flex-1 bg-slate-100" />
                                                    <span className="text-[10px] text-slate-400 tabular-nums">{Math.round(item.progress)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />

                {/* Drag Drop Overlay */}
                {
                    isDragging && (
                        <div className="absolute inset-0 z-50 bg-blue-50/80 border-2 border-dashed border-blue-400 flex flex-col items-center justify-center pointer-events-none">
                            <Upload className="h-16 w-16 text-blue-500 mb-4" />
                            <h3 className="text-xl font-medium text-blue-700">Drop files to upload</h3>
                        </div>
                    )
                }

                {/* Fixed Table Header (Compact) */}
                <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0 z-10 font-medium text-slate-500">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4"><TableHeader label="Name" /></div>
                        <div className="col-span-2"><TableHeader label="Owner" /></div>
                        <div className="col-span-2"><TableHeader label="Date modified" /></div>
                        <div className="col-span-2 text-left"><TableHeader label="File size" /></div>
                        <div className="col-span-1 flex items-center justify-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button disabled={loading} variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" className="h-3.5 w-3.5">
                                            <path d="M120-240v-80h240v80H120Zm0-200v-80h480v80H120Zm0-200v-80h720v80H120Z" />
                                        </svg>
                                        Sort
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[220px] py-1">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">Sort by</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem checked={sortConfig.sortBy === 'name'} onCheckedChange={() => setSortBy('name')}>
                                        Name
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={sortConfig.sortBy === 'modifiedTime'} onCheckedChange={() => setSortBy('modifiedTime')}>
                                        Date modified
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={sortConfig.sortBy === 'modifiedTimeByMe'} onCheckedChange={() => setSortBy('modifiedTimeByMe')}>
                                        Date modified by me
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={sortConfig.sortBy === 'viewedByMeTime'} onCheckedChange={() => setSortBy('viewedByMeTime')}>
                                        Date opened by me
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">Sort direction</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem checked={sortConfig.direction === 'asc'} onCheckedChange={() => setSortDirection('asc')}>
                                        A to Z
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={sortConfig.direction === 'desc'} onCheckedChange={() => setSortDirection('desc')}>
                                        Z to A
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">Folders</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem checked={sortConfig.foldersFirst} onCheckedChange={(c) => c === true && setFoldersFirst(true)}>
                                        On top
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={!sortConfig.foldersFirst} onCheckedChange={(c) => c === true && setFoldersFirst(false)}>
                                        Mixed with files
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="col-span-1"></div>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                            <p className="text-sm text-slate-600">{error}</p>
                            <Button variant="link" onClick={() => window.location.reload()} className="h-auto p-0 mt-2 text-blue-600 text-xs">Try Refreshing</Button>
                        </div>
                    ) : sortedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Folder className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 mb-1">
                                {searchQuery ? 'No results found' : 'Folder is empty'}
                            </h3>
                            <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
                                {searchQuery ? `No files match "${searchQuery}" in this folder.` : 'Drag and drop files here to upload or create new documents.'}
                            </p>
                            <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                                Upload File
                            </Button>
                        </div>
                    ) : (
                        <div className={cn("divide-y divide-slate-100", isUploading && "opacity-50 transition-opacity")}>
                            {sortedFiles.map((file) => (
                                <div
                                    key={file.id}
                                    id={`file-row-${file.id}`}
                                    className={cn(
                                        "group grid grid-cols-12 gap-4 px-4 py-3 transition-colors items-center cursor-default",
                                        file.mimeType === 'application/vnd.google-apps.folder' && "cursor-pointer",
                                        file.id === highlightedFileId ? "bg-slate-200" : "hover:bg-slate-50"
                                    )}
                                    // Make single click work for folders if user prefers, but double click is standard. 
                                    onDoubleClick={() => handleFolderClick(file)}
                                    onClick={() => handleFolderClick(file)}
                                >
                                    {/* Name Column */}
                                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                                        <div className="flex-shrink-0">
                                            <DocumentIcon mimeType={file.mimeType} className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-medium truncate",
                                                file.mimeType === 'application/vnd.google-apps.folder' ? "text-slate-800 hover:text-blue-600 hover:underline" : "text-slate-700"
                                            )} title={file.name}>
                                                {file.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Owner Column */}
                                    <div className="col-span-2 min-w-0">
                                        <span className="text-xs text-slate-500 truncate block" title={file.actorEmail || 'me'}>
                                            {file.actorEmail || 'me'}
                                        </span>
                                    </div>

                                    {/* Date Modified Column */}
                                    <div className="col-span-2">
                                        <span className="text-xs text-slate-500">
                                            {formatRelativeTime(file.modifiedTime)}
                                        </span>
                                    </div>

                                    {/* File Size Column */}
                                    <div className="col-span-2 text-left">
                                        {file.mimeType === 'application/vnd.google-apps.folder' ? (
                                            <span className="text-xs text-slate-300">—</span>
                                        ) : file.size ? (
                                            <span className="text-xs text-slate-500 font-mono">
                                                {formatFileSize(Number(file.size))}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-300">—</span>
                                        )}
                                    </div>

                                    {/* Sort column spacer */}
                                    <div className="col-span-1" />

                                    {/* Action Column */}
                                    <div className="col-span-1 flex justify-end">
                                        {/* Action Menu - Visible on Hover */}
                                        <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DocumentActionMenu document={file} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Item Dialog */}
                <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {createItemType === 'folder' ? 'New Folder' :
                                    createItemType === 'doc' ? 'New Google Doc' :
                                        createItemType === 'sheet' ? 'New Google Sheet' :
                                            createItemType === 'slide' ? 'New Google Slide' :
                                                createItemType === 'form' ? 'New Google Form' :
                                                    createItemType === 'drawing' ? 'New Google Drawing' :
                                                        createItemType === 'map' ? 'New Google Map' :
                                                            createItemType === 'site' ? 'New Google Site' :
                                                                'New Google Script'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                id="name"
                                placeholder={createItemType === 'folder' ? "Folder Name" : "Document Name"}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateItem()
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCreateItemOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateItem} disabled={!newItemName.trim()}>Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Batch Conflict Dialog */}
                <Dialog open={conflictItems.length > 0} onOpenChange={(open) => !open && cancelBatchResolution()}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Duplicate files found</DialogTitle>
                            <DialogDescription>
                                The following files already exist in this folder. Check the box to overwrite, or leave unchecked to keep both (rename).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Select All Header */}
                            <div className="flex items-center space-x-3 px-3 pb-2 border-b border-slate-100">
                                <Checkbox
                                    id="select-all-conflicts"
                                    checked={conflictItems.length > 0 && overwriteSelections.size === conflictItems.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setOverwriteSelections(new Set(conflictItems.map(i => i.file.name)))
                                        } else {
                                            setOverwriteSelections(new Set())
                                        }
                                    }}
                                />
                                <label htmlFor="select-all-conflicts" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                    Select all / Unselect all
                                </label>
                            </div>

                            {conflictItems.map((item) => (
                                <div key={item.file.name} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                    <Checkbox
                                        id={`overwrite-${item.file.name}`}
                                        checked={overwriteSelections.has(item.file.name)}
                                        onCheckedChange={(checked) => {
                                            setOverwriteSelections(prev => {
                                                const next = new Set(prev)
                                                if (checked) next.add(item.file.name)
                                                else next.delete(item.file.name)
                                                return next
                                            })
                                        }}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor={`overwrite-${item.file.name}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Rewrite "{item.file.name}"
                                        </label>
                                        <p className="text-xs text-slate-500">
                                            {overwriteSelections.has(item.file.name)
                                                ? "Existing file will be replaced."
                                                : "New file will be renamed."}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="gap-2 sm:justify-end">
                            <Button variant="outline" onClick={cancelBatchResolution}>
                                Cancel Upload
                            </Button>
                            <Button onClick={handleBatchResolution}>
                                Confirm & Upload
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >

            <GoogleDriveImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                selectedFiles={importedFiles}
                onConfirm={handleImportConfirm}
                loading={importLoading}
            />
        </div >
    )
}
