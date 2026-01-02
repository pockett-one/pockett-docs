import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import Script from 'next/script'

interface GooglePickerButtonProps {
    connectionId: string
    onImport?: (files: any[]) => void
    children?: React.ReactNode
    triggerLabel?: string
    showSuccessToast?: boolean
}

export function GooglePickerButton({ connectionId, onImport, children, triggerLabel = "Link Files", showSuccessToast = true }: GooglePickerButtonProps) {
    const [loading, setLoading] = useState(false)
    const [pickerApiLoaded, setPickerApiLoaded] = useState(false)
    const { addToast } = useToast()

    // Check if API is already loaded on mount (for re-opens)
    useEffect(() => {
        if (window.google && window.google.picker) {
            setPickerApiLoaded(true)
        }
    }, [])

    const handleValues = useCallback((ids: string[], token: string) => {
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
                console.error(err)
                addToast({
                    title: 'Import Failed',
                    message: 'Could not import selected files.',
                    type: 'error'
                })
            })
            .finally(() => setLoading(false))

    }, [connectionId, onImport, addToast, showSuccessToast])

    const createPicker = useCallback(async () => {
        if (!connectionId) return

        setLoading(true)
        try {
            // 1. Get Access Token from backend
            const res = await fetch(`/api/connectors/google-drive/token?connectionId=${connectionId}`)
            if (!res.ok) throw new Error('Failed to get access token')
            const { accessToken } = await res.json()

            if (!accessToken) throw new Error('Invalid access token')

            // 2. Build Picker
            if (pickerApiLoaded && window.google && window.google.picker) {
                const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(true)

                const picker = new window.google.picker.PickerBuilder()
                    .addView(docsView)
                    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                    .setOAuthToken(accessToken)
                    .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '')
                    .setAppId(process.env.NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER || '')
                    .setCallback((data: any) => {
                        if (data.action === window.google.picker.Action.PICKED) {
                            const files = data.docs
                            const ids = files.map((f: any) => f.id)
                            handleValues(ids, accessToken)
                        }
                    })
                    .build()
                picker.setVisible(true)
            } else {
                console.error('Picker API not loaded')
                addToast({ title: 'Error', message: 'Google Picker API not loaded yet.', type: 'error' })
            }
        } catch (error) {
            console.error(error)
            addToast({ title: 'Error', message: 'Failed to launch picker.', type: 'error' })
        } finally {
            setLoading(false)
        }
    }, [connectionId, pickerApiLoaded, handleValues, addToast])

    return (
        <>
            <Script
                src="https://apis.google.com/js/api.js"
                onLoad={() => {
                    window.gapi.load('picker', { callback: () => setPickerApiLoaded(true) })
                }}
            />
            {children && React.isValidElement(children) ? (
                // Clone the child to attach the onClick handler directly
                React.cloneElement(children as React.ReactElement<any>, {
                    onClick: (e: React.MouseEvent) => {
                        if (!loading && pickerApiLoaded) {
                            createPicker()
                            if ((children as React.ReactElement<any>).props.onClick) {
                                (children as React.ReactElement<any>).props.onClick(e)
                            }
                        }
                    },
                    disabled: loading || !pickerApiLoaded,
                    className: `${(children as React.ReactElement<any>).props.className || ''} ${!loading && pickerApiLoaded ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`
                })
            ) : (
                <Button onClick={createPicker} disabled={loading || !pickerApiLoaded} variant="outline" className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {triggerLabel}
                </Button>
            )}
        </>
    )
}

declare global {
    interface Window {
        gapi: any
        google: any
    }
}
