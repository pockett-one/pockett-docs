'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { DocumentIcon } from '@/components/ui/document-icon'
import { SharedFolderIcon } from '@/components/ui/folder-shared-icon'
import { cn } from '@/lib/utils'

interface SecureAccessModalProps {
    isOpen: boolean
    onClose: () => void
    email: string
    fileName: string
    mimeType?: string
    externalId?: string
    firmId?: string
}

export function SecureAccessModal({
    isOpen,
    onClose,
    email,
    fileName,
    mimeType,
    externalId,
    firmId
}: SecureAccessModalProps) {
    const isFolder = mimeType?.includes('folder')
    const proxyThumbnailUrl = externalId && firmId
        ? `/api/proxy/thumbnail/${encodeURIComponent(externalId)}?firmId=${encodeURIComponent(firmId)}&size=400`
        : null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-[28px] p-0 overflow-hidden">
                {/* Top Preview Area (mimicking ShareCard) */}
                <div className={cn(
                    "aspect-[16/9] bg-slate-50 border-b border-slate-100 overflow-hidden relative flex items-center justify-center",
                )}>
                    {proxyThumbnailUrl ? (
                        <div className="w-full h-full relative">
                            <img
                                src={proxyThumbnailUrl}
                                alt={fileName}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                    ) : isFolder ? (
                        <div className="w-full h-full bg-indigo-50/30 flex items-center justify-center">
                            <SharedFolderIcon fillLevel={1} tooltip="shared" className="h-24 w-24 opacity-60" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center relative">
                            <DocumentIcon mimeType={mimeType} size={80} />
                        </div>
                    )}

                    {/* Badge Overlay */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded shadow-sm border border-slate-200/50 p-1.5 flex items-center justify-center">
                        <DocumentIcon mimeType={mimeType} className="w-4 h-4" />
                    </div>

                    <div className="absolute top-4 right-4 animate-pulse">
                        <div className="bg-green-500 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                </div>

                <div className="p-8">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl font-bold text-slate-900 group flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-indigo-600" />
                            Secure Access Request
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 text-left">
                            We've sent a secure access link for <span className="font-bold text-slate-900 italic">"{fileName}"</span> to:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-indigo-100">
                            <Mail className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Verification Inbox</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{email}</p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="flex gap-4 items-start">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-200 mt-2 shrink-0" />
                            <p className="text-[13px] text-slate-500 leading-relaxed">
                                Google Drive requires a one-time verification step. Please follow the link in the email to open the document directly.
                            </p>
                        </div>

                        <Button
                            variant="blackCta"
                            onClick={onClose}
                            className="w-full rounded-2xl py-7 text-base font-bold group shadow-lg shadow-slate-200 transition-all active:translate-y-1"
                        >
                            I understand. Close this message
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>

                {/* Bottom Accent Bar (mimicking ShareCard) */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            </DialogContent>
        </Dialog>
    )
}
