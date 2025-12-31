"use client"

import { Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { formatFileSize } from "@/lib/utils"

interface DeleteConfirmationDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    count: number
    totalSize: number
}

export function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    count,
    totalSize
}: DeleteConfirmationDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <div className="flex flex-col items-center text-center gap-4 pt-4">
                    <div className="p-4 rounded-full bg-red-50 mb-1">
                        <Trash2 className="h-6 w-6 text-red-600" />
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-center text-lg font-bold text-gray-900">
                            Move {count} files to Trash?
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm text-gray-500 mt-2 leading-relaxed">
                            You are about to remove <span className="font-semibold text-gray-900">{formatFileSize(totalSize)}</span> of data.
                            Items in trash are deleted forever after 30 days.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 mt-4 w-full">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-200 active:scale-95 outline-none focus:ring-2 focus:ring-red-200"
                    >
                        Delete
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
