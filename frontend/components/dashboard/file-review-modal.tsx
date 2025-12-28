import { useState, useEffect, useMemo, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Trash2, Check, AlertTriangle, Loader2, Filter, X, ChevronDown, HardDrive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DocumentIcon } from '@/components/ui/document-icon'
import { cn, formatFileSize, getFileTypeLabel } from '@/lib/utils'

interface ReviewFile {
    id: string
    name: string
    size?: number
    modifiedTime?: string
    iconLink?: string
    mimeType?: string
    reason?: string
    owner?: string
    location?: string
    badges?: Array<{ type: 'risk' | 'attention' | 'stale' | 'sensitive', text: string }>
}

interface FileReviewModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description: string
    files: ReviewFile[]
    onConfirm: (selectedIds: string[]) => Promise<void>
    confirmLabel?: string
    isLoading?: boolean
}

function MultiSelectFilter({
    label,
    options,
    selected,
    onChange
}: {
    label: string,
    options: string[],
    selected: Set<string>,
    onChange: (value: Set<string>) => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleOption = (option: string) => {
        const newSelected = new Set(selected)
        if (newSelected.has(option)) {
            newSelected.delete(option)
        } else {
            newSelected.add(option)
        }
        onChange(newSelected)
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    selected.size > 0
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                )}
            >
                {label}
                {selected.size > 0 && (
                    <span className="flex items-center justify-center bg-blue-600 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1">
                        {selected.size}
                    </span>
                )}
                <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-[100]">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map(option => {
                            const isSelected = selected.has(option)
                            return (
                                <button
                                    key={option}
                                    onClick={() => toggleOption(option)}
                                    className="flex items-center w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border mr-2 flex items-center justify-center transition-colors flex-shrink-0",
                                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                                    )}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={cn("truncate", isSelected ? "text-gray-900 font-medium" : "text-gray-600")}>
                                        {option}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export function FileReviewModal({
    isOpen,
    onClose,
    title,
    description,
    files,
    onConfirm,
    confirmLabel = 'Delete Selected',
    isLoading = false
}: FileReviewModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

    // Filters
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
    const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set())
            setIsConfirmingDelete(false)
            setSelectedTypes(new Set())
            setSelectedSizes(new Set())
        }
    }, [isOpen])

    // Filter Logic
    const availableTypes = useMemo(() => {
        const types = new Set(files.map(f => getFileTypeLabel(f.mimeType || 'unknown')))
        return Array.from(types).sort()
    }, [files])

    const sizeOptions = ['Small (<1MB)', 'Medium (1-10MB)', 'Large (10MB-1GB)', 'X-Large (>1GB)']

    console.log('[FileReviewModal Debug] Files prop length:', files.length)

    const filteredFiles = useMemo(() => {
        const result = files.filter(f => {
            // Type Filter
            if (selectedTypes.size > 0 && !selectedTypes.has(getFileTypeLabel(f.mimeType || 'unknown'))) {
                return false
            }
            // Size Filter
            if (selectedSizes.size > 0) {
                const size = f.size || 0
                const MB = 1024 * 1024
                const GB = 1024 * MB

                const matchesSize = Array.from(selectedSizes).some(selectedSize => {
                    if (selectedSize === 'Small (<1MB)') return size < 1 * MB
                    if (selectedSize === 'Medium (1-10MB)') return size >= 1 * MB && size < 10 * MB
                    if (selectedSize === 'Large (10MB-1GB)') return size >= 10 * MB && size < 1 * GB
                    if (selectedSize === 'X-Large (>1GB)') return size >= 1 * GB
                    return false
                })

                if (!matchesSize) return false
            }
            return true
        })
        console.log('[FileReviewModal Debug] Filtered files length:', result.length)
        return result
    }, [files, selectedTypes, selectedSizes])

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredFiles.map(f => f.id)))
        }
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    // Action Logic
    const handleActionClick = async () => {
        if (selectedIds.size === 0) return

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true)
            return
        }

        setIsSubmitting(true)
        try {
            await onConfirm(Array.from(selectedIds))
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
            setIsConfirmingDelete(false)
        }
    }

    const totalSelectedSize = useMemo(() => {
        return files.filter(f => selectedIds.has(f.id)).reduce((acc, f) => acc + (f.size || 0), 0)
    }, [files, selectedIds])

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col h-[70vh]">
                {/* Header Section */}
                <div className="px-1 pb-4">
                    <p className="text-gray-600 text-sm mb-4">{description}</p>

                    {/* Filters & Stats Bar */}
                    <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        {/* Filters Row */}
                        <div className="flex items-center gap-2 flex-wrap pb-1">
                            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

                            <MultiSelectFilter
                                label="Type"
                                options={availableTypes}
                                selected={selectedTypes}
                                onChange={setSelectedTypes}
                            />

                            <MultiSelectFilter
                                label="Size"
                                options={sizeOptions}
                                selected={selectedSizes}
                                onChange={setSelectedSizes}
                            />

                            {(selectedTypes.size > 0 || selectedSizes.size > 0) && (
                                <button
                                    onClick={() => { setSelectedTypes(new Set()); setSelectedSizes(new Set()) }}
                                    className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium px-2 flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" />
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Selection status */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={filteredFiles.length > 0 && selectedIds.size === filteredFiles.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    disabled={isLoading || isSubmitting || filteredFiles.length === 0}
                                />
                                <span className="text-xs font-medium text-gray-600">
                                    {selectedIds.size} selected
                                </span>
                            </div>
                            {selectedIds.size > 0 && (
                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                    {formatFileSize(totalSelectedSize)} selected
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl bg-white relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white/80 z-10">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span className="text-sm">Loading files...</span>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <div className="p-4 bg-gray-50 rounded-full mb-3">
                                <Filter className="h-6 w-6 text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">No files match your filters</span>
                            <button
                                onClick={() => { setSelectedTypes(new Set()); setSelectedSizes(new Set()) }}
                                className="mt-2 text-xs text-blue-600 hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredFiles.map(file => {
                                const isSelected = selectedIds.has(file.id)
                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => toggleSelection(file.id)}
                                        className={cn(
                                            "flex items-start gap-3 p-3 transition-all cursor-pointer group",
                                            isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 pt-1 text-gray-400">
                                            {/* Checkbox */}
                                            <div
                                                className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                    isSelected
                                                        ? "bg-blue-600 border-blue-600"
                                                        : "border-gray-300 group-hover:border-blue-400 bg-white"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>

                                            {/* File Icon */}
                                            <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm group-hover:border-gray-200 transition-colors flex-shrink-0">
                                                <DocumentIcon mimeType={file.mimeType || 'unknown'} className="h-6 w-6" />
                                            </div>
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            {/* Row 1: Name & Badges */}
                                            <div className="flex items-center gap-2">
                                                <h4 className={cn(
                                                    "text-sm font-semibold truncate",
                                                    isSelected ? "text-blue-900" : "text-gray-900"
                                                )} title={file.name}>
                                                    {file.name}
                                                </h4>

                                                {/* Security Badges - Only show non-reason badges (Risk/Sensitive) */}
                                                {file.badges?.filter(b => b.type !== 'stale').map((badge, i) => (
                                                    <span key={i} className={cn(
                                                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap",
                                                        badge.type === 'risk' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                            badge.type === 'sensitive' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                                "bg-amber-100 text-amber-800 border-amber-200"
                                                    )}>
                                                        {badge.type === 'sensitive' ? 'SENSITIVE' : 'RISK'}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Row 2: Owner • Location */}
                                            <div className="flex items-center text-[11px] text-gray-500 gap-1.5 mt-0.5">
                                                <span className="truncate max-w-[200px]" title={file.owner}>{file.owner || 'Unknown User'}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="flex items-center gap-1 truncate text-gray-400">
                                                    <HardDrive className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{file.location || 'My Drive'}</span>
                                                </span>
                                            </div>

                                            {/* Row 3: Reason Badge • Time • Size */}
                                            <div className="flex items-center text-xs text-gray-500 font-medium gap-1.5 mt-1.5">
                                                {file.reason && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                                                        {file.reason}
                                                    </span>
                                                )}

                                                <span className="text-gray-300 mx-1">•</span>

                                                <span className="text-gray-400 font-normal">
                                                    {file.modifiedTime && formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true })}
                                                </span>

                                                <span className="text-gray-300 mx-1">•</span>

                                                <span className="text-gray-400 font-normal">
                                                    {formatFileSize(file.size || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-2">
                        {isConfirmingDelete && (
                            <span className="text-xs text-red-600 font-medium animate-pulse mr-2">
                                Are you sure? This action is permanent.
                            </span>
                        )}
                        <button
                            onClick={handleActionClick}
                            disabled={selectedIds.size === 0 || isSubmitting}
                            className={cn(
                                "px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-all shadow-sm",
                                selectedIds.size === 0
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                    : isConfirmingDelete
                                        ? "bg-red-600 hover:bg-red-700 ring-2 ring-red-100 ring-offset-1"
                                        : "bg-gray-900 hover:bg-gray-800"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : isConfirmingDelete ? (
                                <>
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Confirm Delete ({selectedIds.size})</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    <span>Move to Trash ({selectedIds.size})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
