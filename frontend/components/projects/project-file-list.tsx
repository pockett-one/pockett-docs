'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Upload, FolderUp, X, Folder, File as FileIcon, ArrowUp, ArrowDown, ChevronRight, Search, List as ListIcon, LayoutGrid, Filter, ChevronDown, User, FileText, FileSpreadsheet, Presentation, ListChecks, PenTool, Map as MapIcon, LayoutTemplate, FileCode, AlertCircle, ShieldCheck, Maximize2, Minimize2, CheckCircle2, XCircle, Trash2, Layout, Code, Laptop, RefreshCw, Info } from 'lucide-react'
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
    const folderInputRef = useRef<HTMLInputElement>(null)
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
    const [filterOwner, setFilterOwner] = useState<'any' | 'me' | 'not-me'>('any')
    const [filterModified, setFilterModified] = useState<'any' | '7d' | '30d' | 'year'>('any')
    const [highlightedFileId, setHighlightedFileId] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false)
    const [fromComputerExpanded, setFromComputerExpanded] = useState(false)
    const [fromDriveExpanded, setFromDriveExpanded] = useState(false)

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

    const handleRefresh = async () => {
        if (!currentFolderId || isRefreshing) return
        setIsRefreshing(true)
        try {
            await fetchFiles(currentFolderId, true)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Core Upload Function (Direct to Drive)
    const uploadFile = async (file: File, fileIdToOverwrite?: string, rename = false, onProgress?: (p: number) => void, parentFolderId?: string): Promise<{ success: boolean, error?: string, finalFile?: { name: string, id: string } }> => {
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
                    parentId: parentFolderId ?? currentFolderId ?? 'root',
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

    // Build folder path -> parent path for ordering. '' = root.
    const getFolderPathsFromFileList = (fileList: FileList): string[] => {
        const dirs = new Set<string>()
        for (let i = 0; i < fileList.length; i++) {
            const rel = (fileList[i] as File & { webkitRelativePath?: string }).webkitRelativePath || ''
            const parts = rel.split('/')
            for (let j = 1; j < parts.length; j++) {
                dirs.add(parts.slice(0, j).join('/'))
            }
        }
        return Array.from(dirs).sort((a, b) => {
            const ad = (a.match(/\//g) || []).length
            const bd = (b.match(/\//g) || []).length
            if (ad !== bd) return ad - bd
            return a.localeCompare(b)
        })
    }

    const processFolderUpload = async (fileList: FileList) => {
        if (!sessionRef.current?.access_token || !currentFolderId) return
        const token = sessionRef.current.access_token
        const rootId = currentFolderId
        const pathToFolderId = new Map<string, string>()
        pathToFolderId.set('', rootId)

        const folderPaths = getFolderPathsFromFileList(fileList)
        for (const path of folderPaths) {
            const parts = path.split('/')
            const name = parts[parts.length - 1]
            const parentPath = parts.length === 1 ? '' : parts.slice(0, -1).join('/')
            const parentId = pathToFolderId.get(parentPath)!
            const res = await fetch('/api/connectors/google-drive/linked-files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create-folder',
                    folderId: parentId,
                    name,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            })
            if (!res.ok) {
                const data = await res.json()
                logger.error(new Error(data.error || 'Failed to create folder'))
                setError(data.error || 'Failed to create folder')
                return
            }
            const data = await res.json()
            pathToFolderId.set(path, data.id)
        }

        const files = Array.from(fileList).filter(f => {
            const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || ''
            const parts = rel.split('/')
            return parts.length >= 1 && parts[parts.length - 1] !== '' // has a file name (not directory-only)
        })
        const fileEntries = files.map(f => {
            const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name
            const parts = rel.split('/')
            const dirPath = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
            return { file: f, dirPath }
        })

        setIsUploading(true)
        setIsUploadModalOpen(true)
        const newQueueItems: UploadQueueItem[] = fileEntries.map(({ file }) => ({
            id: `upload-${Date.now()}-${Math.random()}`,
            file,
            progress: 0,
            status: 'pending'
        }))
        setUploadQueue(prev => [...prev, ...newQueueItems])
        const fileToQueueId = new Map<File, string>()
        fileEntries.forEach((_, idx) => fileToQueueId.set(fileEntries[idx].file, newQueueItems[idx].id))

        for (const { file, dirPath } of fileEntries) {
            const queueId = fileToQueueId.get(file)!
            const parentId = pathToFolderId.get(dirPath) ?? rootId
            updateQueueItem(queueId, { status: 'uploading' })
            const result = await uploadFile(file, undefined, false, (p) => updateQueueItem(queueId, { progress: p }), parentId)
            if (!result.success) {
                updateQueueItem(queueId, { status: 'error', error: result.error })
            } else {
                updateQueueItem(queueId, { status: 'completed', progress: 100 })
            }
        }
        if (currentFolderId) fetchFiles(currentFolderId, true)
        setIsUploading(false)
    }

    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files
        if (!fileList || fileList.length === 0) return
        await processFolderUpload(fileList)
        if (folderInputRef.current) folderInputRef.current.value = ''
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

            // Two tabs: "My Drive" (root + LIST) and "Shared Drives" (LIST); user can traverse and multi-select in both
            const win = typeof window !== 'undefined' ? window : null
            const pickerApi = win && (win as unknown as { google?: { picker?: unknown } }).google?.picker
            const customViews = pickerApi
                ? (() => {
                    const g = (win as unknown as {
                        google: {
                            picker: {
                                DocsView: new (id: string) => unknown
                                ViewId: { DOCS: string }
                                DocsViewMode: { LIST: string }
                            }
                        }
                    }).google.picker
                    type ViewLike = {
                        setParent?: (p: string) => ViewLike
                        setIncludeFolders: (v: boolean) => ViewLike
                        setMode: (m: string) => ViewLike
                        setLabel?: (l: string) => ViewLike
                        setEnableDrives?: (v: boolean) => ViewLike
                    }
                    const myDriveView = new g.DocsView(g.ViewId.DOCS) as ViewLike
                    myDriveView.setParent!('root')
                    myDriveView.setIncludeFolders(true)
                    myDriveView.setMode(g.DocsViewMode.LIST)
                    if (myDriveView.setLabel) myDriveView.setLabel('My Drive')

                    const sharedDrivesView = new g.DocsView(g.ViewId.DOCS) as ViewLike
                    sharedDrivesView.setIncludeFolders(true)
                    sharedDrivesView.setMode(g.DocsViewMode.LIST)
                    if (sharedDrivesView.setEnableDrives) sharedDrivesView.setEnableDrives(true)
                    if (sharedDrivesView.setLabel) sharedDrivesView.setLabel('Shared Drives')

                    return [myDriveView, sharedDrivesView]
                })()
                : undefined

            // @ts-ignore - Explicitly match onboarding config (empty key)
            openPicker({
                clientId: config.googleDrive.clientId || "",
                developerKey: "",
                appId: config.googleDrive.appId || "",
                viewId: "DOCS",
                token: googleAccessToken,
                showUploadView: false,
                setIncludeFolders: true,
                supportDrives: true,
                multiselect: true,
                disableDefaultView: !!customViews,
                customViews,
                setParentFolder: customViews ? undefined : 'root',
                callbackFunction: (data: { action: string; docs?: unknown[] }) => {
                    if (data.action === 'picked') {
                        setImportedFiles(data.docs ?? [])
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

        if (filterTypes.size > 0) {
            result = result.filter(f => {
                const mime = f.mimeType
                if (filterTypes.has('folder') && mime === 'application/vnd.google-apps.folder') return true
                if (filterTypes.has('document')) {
                    const isDoc = mime === 'application/vnd.google-apps.document' ||
                        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        mime === 'application/msword'
                    if (isDoc) return true
                }
                if (filterTypes.has('spreadsheet') && mime === 'application/vnd.google-apps.spreadsheet') return true
                if (filterTypes.has('presentation') && mime === 'application/vnd.google-apps.presentation') return true
                if (filterTypes.has('image') && mime.startsWith('image/')) return true
                return false
            })
        }

        if (filterOwner !== 'any' && session?.user?.email) {
            const myEmail = session.user.email.toLowerCase()
            result = result.filter(f => {
                const owner = (f.actorEmail || '').toLowerCase()
                if (filterOwner === 'me') return owner === myEmail || owner === '' || !owner
                if (filterOwner === 'not-me') return owner !== '' && owner !== myEmail
                return true
            })
        }

        if (filterModified !== 'any') {
            const now = Date.now()
            const day = 24 * 60 * 60 * 1000
            result = result.filter(f => {
                const t = new Date(f.modifiedTime).getTime()
                if (filterModified === '7d') return now - t <= 7 * day
                if (filterModified === '30d') return now - t <= 30 * day
                if (filterModified === 'year') return new Date(f.modifiedTime).getFullYear() === new Date().getFullYear()
                return true
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
    }, [files, sortConfig, searchQuery, filterTypes, filterOwner, filterModified, session?.user?.email])

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

                                {/* From your computer (expandable) */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setFromComputerExpanded(!fromComputerExpanded)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFromComputerExpanded(!fromComputerExpanded) } }}
                                    className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-sm cursor-pointer select-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <Laptop className="h-3.5 w-3.5 text-slate-500" />
                                        From your computer
                                    </span>
                                    <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", fromComputerExpanded && "rotate-180")} />
                                </div>
                                {fromComputerExpanded && (
                                    <>
                                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs py-1.5 pl-8">
                                            <Upload className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                            Upload files
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsFolderUploadModalOpen(true)} className="text-xs py-1.5 pl-8">
                                            <FolderUp className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                            Upload folder
                                        </DropdownMenuItem>
                                    </>
                                )}

                                <DropdownMenuSeparator />

                                {/* Import from Google Drive (expandable) */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setFromDriveExpanded(!fromDriveExpanded)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFromDriveExpanded(!fromDriveExpanded) } }}
                                    className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-sm cursor-pointer select-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Import from Google Drive
                                    </span>
                                    <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", fromDriveExpanded && "rotate-180")} />
                                </div>
                                {fromDriveExpanded && (
                                    <>
                                        <DropdownMenuItem onClick={handleGoogleDrivePicker} className="text-xs py-1.5 pl-8">
                                            <Upload className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                            Upload files
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled className="text-xs py-1.5 pl-8 text-slate-400">
                                            <FolderUp className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                            Upload folder
                                            <span className="ml-1 text-[10px]">(coming later)</span>
                                        </DropdownMenuItem>
                                    </>
                                )}

                                <DropdownMenuSeparator />

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
                                <Button disabled={loading} variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    Type
                                    {filterTypes.size > 0 && <span className="ml-0.5 bg-slate-200 text-slate-800 px-1.5 rounded-full text-[10px] font-medium">{filterTypes.size}</span>}
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px] py-1 text-xs">
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 p-0 font-medium">Type</DropdownMenuLabel>
                                    <DropdownMenuItem className="text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 focus:bg-slate-800 p-1.5 px-2 cursor-pointer">
                                        Done
                                    </DropdownMenuItem>
                                </div>
                                <DropdownMenuCheckboxItem checked={filterTypes.size === 0 ? true : (filterTypes.size < 5 ? ('indeterminate' as const) : false)} onCheckedChange={() => setFilterTypes(new Set())} onSelect={(e) => e.preventDefault()} className="text-xs py-1.5 pl-8">
                                    All types
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={filterTypes.has('folder')} onCheckedChange={() => toggleFilterType('folder')} onSelect={(e) => e.preventDefault()} className="text-xs py-1.5 pl-8">
                                    Folders
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('document')} onCheckedChange={() => toggleFilterType('document')} onSelect={(e) => e.preventDefault()} className="text-xs py-1.5 pl-8">
                                    Documents
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('spreadsheet')} onCheckedChange={() => toggleFilterType('spreadsheet')} onSelect={(e) => e.preventDefault()} className="text-xs py-1.5 pl-8">
                                    Spreadsheets
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('presentation')} onCheckedChange={() => toggleFilterType('presentation')} onSelect={(e) => e.preventDefault()} className="text-xs py-1.5 pl-8">
                                    Presentations
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterTypes.has('image')} onCheckedChange={() => toggleFilterType('image')} onSelect={(e) => e.preventDefault()} className="text-xs py-1.5 pl-8">
                                    Images
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* ... Other Filters (unchanged) ... */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className={cn("h-8 gap-1.5 text-xs bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors", filterOwner !== 'any' && "border-slate-400 ring-1 ring-slate-300")}>
                                    People
                                    {filterOwner !== 'any' && <span className="ml-0.5 bg-slate-200 text-slate-800 px-1.5 rounded-full text-[10px] font-medium">1</span>}
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px] py-1 text-xs">
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 p-0 font-medium">Owner</DropdownMenuLabel>
                                    <DropdownMenuItem className="text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 focus:bg-slate-800 p-1.5 px-2 cursor-pointer">
                                        Done
                                    </DropdownMenuItem>
                                </div>
                                <DropdownMenuCheckboxItem checked={filterOwner === 'any'} onCheckedChange={() => setFilterOwner('any')} className="text-xs py-1.5 pl-8">
                                    <User className="h-3.5 w-3.5 mr-2" />
                                    Any owners
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterOwner === 'me'} onCheckedChange={() => setFilterOwner('me')} className="text-xs py-1.5 pl-8">
                                    <User className="h-3.5 w-3.5 mr-2" />
                                    Owned by me
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterOwner === 'not-me'} onCheckedChange={() => setFilterOwner('not-me')} className="text-xs py-1.5 pl-8">
                                    <User className="h-3.5 w-3.5 mr-2" />
                                    Not owned by me
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className={cn("h-8 gap-1.5 text-xs bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors", filterModified !== 'any' && "border-slate-400 ring-1 ring-slate-300")}>
                                    Modified
                                    {filterModified !== 'any' && <span className="ml-0.5 bg-slate-200 text-slate-800 px-1.5 rounded-full text-[10px] font-medium">1</span>}
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px] py-1 text-xs">
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 p-0 font-medium">Modified</DropdownMenuLabel>
                                    <DropdownMenuItem className="text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 focus:bg-slate-800 p-1.5 px-2 cursor-pointer">
                                        Done
                                    </DropdownMenuItem>
                                </div>
                                <DropdownMenuCheckboxItem checked={filterModified === 'any'} onCheckedChange={() => setFilterModified('any')} className="text-xs py-1.5 pl-8">
                                    Any time
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterModified === '7d'} onCheckedChange={() => setFilterModified('7d')} className="text-xs py-1.5 pl-8">
                                    Last 7 days
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterModified === '30d'} onCheckedChange={() => setFilterModified('30d')} className="text-xs py-1.5 pl-8">
                                    Last 30 days
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={filterModified === 'year'} onCheckedChange={() => setFilterModified('year')} className="text-xs py-1.5 pl-8">
                                    This year
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={loading} variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-white rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    Source
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px] py-1 text-xs">
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 p-0 font-medium">Source</DropdownMenuLabel>
                                    <DropdownMenuItem className="text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 focus:bg-slate-800 p-1.5 px-2 cursor-pointer">
                                        Done
                                    </DropdownMenuItem>
                                </div>
                                <DropdownMenuItem className="text-xs py-1.5">All sources</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs py-1.5">Uploaded</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs py-1.5">Shared with me</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Right: Refresh & Search */}
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={loading || isRefreshing}
                                    onClick={handleRefresh}
                                    className="h-9 w-9 p-0 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Refresh list (e.g. after renaming in Google Docs)
                            </TooltipContent>
                        </Tooltip>
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
                {/* Google Drive Style Upload Progress Modal - portaled to body so fixed positioning is viewport-relative and not clipped by overflow-hidden */}
                {uploadQueue.length > 0 && typeof document !== 'undefined' && document.body && createPortal(
                    <div className={cn(
                        "fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-slate-200 z-[100] flex flex-col transition-all duration-300 w-[360px]",
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
                    </div>,
                    document.body
                )}

                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <input
                    type="file"
                    ref={folderInputRef}
                    className="hidden"
                    // @ts-expect-error webkitdirectory is supported in Chrome/Edge for folder picker
                    webkitdirectory=""
                    multiple
                    onChange={handleFolderUpload}
                />

                {/* Drag Drop Overlay */}
                {
                    isDragging && (
                        <div className="absolute inset-0 z-50 bg-slate-100/90 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center pointer-events-none">
                            <Upload className="h-16 w-16 text-slate-500 mb-4" />
                            <h3 className="text-xl font-medium text-slate-700">Drop files to upload</h3>
                        </div>
                    )
                }

                {/* Fixed Table Header (Compact) */}
                <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-4 py-2 shrink-0 z-10 font-medium text-slate-500">
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center"><TableHeader label="Name" /></div>
                        <div className="col-span-2 flex items-center"><TableHeader label="Owner" /></div>
                        <div className="col-span-2 flex items-center"><TableHeader label="Date modified" /></div>
                        <div className="col-span-2 flex items-center text-left"><TableHeader label="File size" /></div>
                        <div className="col-span-1" />
                        <div className="col-span-1 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button disabled={loading} variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" className="h-3.5 w-3.5">
                                            <path d="M120-240v-80h240v80H120Zm0-200v-80h480v80H120Zm0-200v-80h720v80H120Z" />
                                        </svg>
                                        Sort
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[220px] py-1 text-xs">
                                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">Sort by</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.sortBy === 'name'} onCheckedChange={() => setSortBy('name')}>
                                        Name
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.sortBy === 'modifiedTime'} onCheckedChange={() => setSortBy('modifiedTime')}>
                                        Date modified
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.sortBy === 'modifiedTimeByMe'} onCheckedChange={() => setSortBy('modifiedTimeByMe')}>
                                        Date modified by me
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.sortBy === 'viewedByMeTime'} onCheckedChange={() => setSortBy('viewedByMeTime')}>
                                        Date opened by me
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">Sort direction</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.direction === 'asc'} onCheckedChange={() => setSortDirection('asc')}>
                                        A to Z
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.direction === 'desc'} onCheckedChange={() => setSortDirection('desc')}>
                                        Z to A
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">Folders</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={sortConfig.foldersFirst} onCheckedChange={(c) => c === true && setFoldersFirst(true)}>
                                        On top
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem className="text-xs" checked={!sortConfig.foldersFirst} onCheckedChange={(c) => c === true && setFoldersFirst(false)}>
                                        Mixed with files
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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
                            <Button variant="link" onClick={() => window.location.reload()} className="h-auto p-0 mt-2 text-slate-700 hover:text-slate-900 text-xs">Try Refreshing</Button>
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
                                        "group grid grid-cols-12 gap-4 px-4 py-2 transition-colors items-center cursor-default",
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
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className={cn(
                                                        "text-xs font-medium truncate block",
                                                        file.mimeType === 'application/vnd.google-apps.folder' ? "text-slate-800 hover:text-slate-600 cursor-pointer" : "text-slate-700"
                                                    )}>
                                                        {file.name}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[320px] p-3 text-xs bg-white text-slate-900 border border-slate-200 shadow-xl break-all">
                                                    {file.name}
                                                </TooltipContent>
                                            </Tooltip>
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

                                    {/* Action Column - always visible, aligned with Sort header */}
                                    <div className="col-span-1 flex justify-end">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DocumentActionMenu document={file} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Folder upload confirmation modal (in-app, avoids browser "trust this site" wording) */}
                <Dialog open={isFolderUploadModalOpen} onOpenChange={setIsFolderUploadModalOpen}>
                    <DialogContent className="max-w-lg gap-4 p-5">
                        <DialogHeader className="space-y-3">
                            <DialogTitle>Upload a folder</DialogTitle>
                            <div className="text-xs text-slate-600 leading-relaxed">
                                <p className="mb-2">Choose a folder from your computer. All files inside will be:</p>
                                <ul className="list-disc list-inside space-y-1.5 pl-1">
                                    <li>Uploaded to this project folder in your Google Drive</li>
                                    <li>Folder structure preserved</li>
                                    <li>Sent directly to your Google Drive and never pass through our servers</li>
                                </ul>
                            </div>
                        </DialogHeader>
                        <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-2.5">
                            <Info className="h-4 w-4 shrink-0 text-slate-600 mt-0.5" />
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                Your browser may prompt you to confirm the folder selection.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-3">
                            <Button variant="outline" onClick={() => setIsFolderUploadModalOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-slate-900 text-white hover:bg-slate-800"
                                onClick={() => {
                                    setIsFolderUploadModalOpen(false)
                                    setTimeout(() => folderInputRef.current?.click(), 0)
                                }}
                            >
                                Choose folder
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

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
                                className="focus-visible:ring-slate-400"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCreateItemOpen(false)}>Cancel</Button>
                            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreateItem} disabled={!newItemName.trim()}>Create</Button>
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
                            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleBatchResolution}>
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
