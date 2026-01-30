'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Copy, Link2, AlertTriangle, FileText, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoogleDriveImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedFiles: any[] // Picker API docs define the exact shape, but usually array of objects
    onConfirm: (mode: 'copy' | 'shortcut') => void
    loading: boolean
}

export function GoogleDriveImportDialog({
    open,
    onOpenChange,
    selectedFiles,
    onConfirm,
    loading
}: GoogleDriveImportDialogProps) {
    const [mode, setMode] = React.useState<'copy' | 'shortcut'>('shortcut')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import from Google Drive</DialogTitle>
                    <DialogDescription>
                        You selected {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}. How would you like to add them to this project?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Selected Files Preview (First few) */}
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Selected Files</div>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                            {selectedFiles.map((file) => (
                                <div key={file.id} className="flex items-center gap-2 text-sm text-slate-700">
                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="gap-3">
                        <div className={cn(
                            "flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors cursor-pointer hover:bg-slate-50",
                            mode === 'shortcut' ? "border-purple-600 bg-purple-50/50" : "border-slate-200"
                        )} onClick={() => setMode('shortcut')}>
                            <RadioGroupItem value="shortcut" id="shortcut" className="mt-1" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="shortcut" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Link2 className="h-4 w-4 text-purple-600" />
                                    Create Shortcut
                                </Label>
                                <p className="text-sm text-slate-500">
                                    Creates a link to the original file. Edits made in Google Drive will be reflected here. Ideal for collaboration.
                                </p>
                            </div>
                        </div>
                        <div className={cn(
                            "flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors cursor-pointer hover:bg-slate-50",
                            mode === 'copy' ? "border-purple-600 bg-purple-50/50" : "border-slate-200"
                        )} onClick={() => setMode('copy')}>
                            <RadioGroupItem value="copy" id="copy" className="mt-1" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="copy" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Copy className="h-4 w-4 text-blue-600" />
                                    Make a Copy
                                </Label>
                                <p className="text-sm text-slate-500">
                                    Creates a new independent copy in this project folder. The original file remains untouched.
                                </p>
                                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 border border-amber-100">
                                    <AlertTriangle className="h-3 w-3" />
                                    Changes to the original won't be synced.
                                </div>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={() => onConfirm(mode)} disabled={loading} className="gap-2">
                        {loading && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Import Files
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
