import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import useDrivePicker from 'react-google-drive-picker'
import { logger } from '@/lib/logger'
import { config } from "@/lib/config"

interface GooglePickerButtonProps {
    connectionId: string
    onImport?: (files: any[]) => void
    children?: React.ReactNode
    triggerLabel?: string
    showSuccessToast?: boolean
    mode?: 'import' | 'select-folder'
}

export function GooglePickerButton({
    connectionId,
    onImport,
    children,
    triggerLabel = "Link Files",
    showSuccessToast = true,
    mode = 'import'
}: GooglePickerButtonProps) {
    const [loading, setLoading] = useState(false)
    const { addToast } = useToast()
    const [openPicker] = useDrivePicker()

    const handleValues = useCallback((ids: string[], token: string) => {
        if (mode === 'select-folder') {
            if (onImport) onImport(ids)
            return
        }

        // Process the selected files
        setLoading(true)
        fetch('/api/connectors/google-drive/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, fileIds: ids })
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Import failed')
                const data = await res.json()

                if (showSuccessToast) {
                    addToast({
                        title: 'Import Successful',
                        message: `Imported ${data.count} file(s).`,
                        type: 'success'
                    })
                }

                if (onImport) onImport(ids)
            })
            .catch((err) => {
                logger.error('Import process failed', err as Error)
                addToast({
                    title: 'Import Failed',
                    message: 'Could not import selected files.',
                    type: 'error'
                })
            })
            .finally(() => setLoading(false))

    }, [connectionId, onImport, addToast, showSuccessToast, mode])

    const createPicker = useCallback(async () => {
        if (!connectionId) return

        setLoading(true)
        try {
            // 1. Get Access Token from backend
            const res = await fetch(`/api/connectors/google-drive/token?connectionId=${connectionId}`)
            if (!res.ok) throw new Error('Failed to get access token')
            const { accessToken } = await res.json()

            if (!accessToken) throw new Error('Invalid access token')

            // Two tabs: "My Drive" (root + LIST) and "Shared Drives" (LIST)
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
                        setMimeTypes?: (m: string) => ViewLike
                        setSelectFolderEnabled?: (v: boolean) => ViewLike
                    }
                    const myDriveView = new g.DocsView(g.ViewId.DOCS) as ViewLike
                    myDriveView.setParent!('root')
                    myDriveView.setIncludeFolders(true)
                    if (mode === 'select-folder' && myDriveView.setSelectFolderEnabled) myDriveView.setSelectFolderEnabled(true)
                    myDriveView.setMode(g.DocsViewMode.LIST)
                    if (mode === 'select-folder' && myDriveView.setMimeTypes) myDriveView.setMimeTypes('application/vnd.google-apps.folder')
                    if (myDriveView.setLabel) myDriveView.setLabel('My Drive')

                    const sharedDrivesView = new g.DocsView(g.ViewId.DOCS) as ViewLike
                    sharedDrivesView.setIncludeFolders(true)
                    if (mode === 'select-folder' && sharedDrivesView.setSelectFolderEnabled) sharedDrivesView.setSelectFolderEnabled(true)
                    sharedDrivesView.setMode(g.DocsViewMode.LIST)
                    if (mode === 'select-folder' && sharedDrivesView.setMimeTypes) sharedDrivesView.setMimeTypes('application/vnd.google-apps.folder')
                    if (sharedDrivesView.setEnableDrives) sharedDrivesView.setEnableDrives(true)
                    if (sharedDrivesView.setLabel) sharedDrivesView.setLabel('Shared Drives')

                    return [myDriveView, sharedDrivesView]
                })()
                : undefined

            // 2. Build Picker
            // @ts-ignore
            openPicker({
                clientId: config.googleDrive.clientId || "",
                developerKey: "", // Keep empty for localhost
                appId: config.googleDrive.appId || "",
                token: accessToken,
                showUploadView: false,
                showUploadFolders: true,
                setIncludeFolders: true,
                setSelectFolderEnabled: true,
                supportDrives: true,
                multiselect: mode !== 'select-folder', // Multiselect for files, single select for root folder
                customViews: customViews,
                disableDefaultView: true,
                callbackFunction: (data: any) => {
                    if (data.action === 'cancel') {
                        setLoading(false)
                    }
                    if (data.action === 'picked') {
                        const files = data.docs
                        const ids = files.map((f: any) => f.id)
                        handleValues(ids, accessToken)
                    }
                }
            })

        } catch (error) {
            logger.error('Failed to launch picker', error as Error)
            addToast({ title: 'Error', message: 'Failed to launch picker.', type: 'error' })
            setLoading(false)
        }
    }, [connectionId, handleValues, addToast, mode, openPicker])

    return (
        <>
            {children && React.isValidElement(children) ? (
                // Clone the child to attach the onClick handler directly
                React.cloneElement(children as React.ReactElement<any>, {
                    onClick: (e: React.MouseEvent) => {
                        if (!loading) {
                            createPicker()
                            if ((children as React.ReactElement<any>).props.onClick) {
                                (children as React.ReactElement<any>).props.onClick(e)
                            }
                        }
                    },
                    disabled: loading || (children as React.ReactElement<any>).props.disabled,
                    className: `${(children as React.ReactElement<any>).props.className || ''} ${!loading ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`
                })
            ) : (
                <Button onClick={createPicker} disabled={loading} variant="outline" className="gap-2">
                    {loading ? <LoadingSpinner size="sm" /> : <Plus className="h-4 w-4" />}
                    {triggerLabel}
                </Button>
            )}
        </>
    )
}
