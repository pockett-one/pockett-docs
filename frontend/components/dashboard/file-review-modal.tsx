import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Trash2, Check, AlertTriangle, Loader2, Filter, X, ChevronDown, HardDrive, Archive, Folder, ChevronRight, Minus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DocumentIcon } from '@/components/ui/document-icon'
import { cn, formatFileSize, getFileTypeLabel } from '@/lib/utils'
import { DocumentActionMenu } from '@/components/ui/document-action-menu'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'

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
    parentName?: string
    badges?: Array<{ type: 'risk' | 'attention' | 'stale' | 'sensitive', text: string }>
    activityTimestamp?: string
    actorEmail?: string
    source?: string
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Filters
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
    const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set())
            setShowDeleteConfirm(false)

            // Pre-select all filters by default
            const types = new Set(files.map(f => getFileTypeLabel(f.mimeType || 'unknown')))
            setSelectedTypes(types)

            setSelectedSizes(new Set(['Small (<1MB)', 'Medium (1-10MB)', 'Large (10MB-1GB)', 'X-Large (>1GB)']))
        }
    }, [isOpen, files])

    // Filter Logic
    const availableTypes = useMemo(() => {
        const types = new Set(files.map(f => getFileTypeLabel(f.mimeType || 'unknown')))
        return Array.from(types).sort()
    }, [files])

    // Update selected types when files change if filtering logic implies consistency
    useEffect(() => {
        if (files.length > 0 && selectedTypes.size === 0) {
            const types = new Set(files.map(f => getFileTypeLabel(f.mimeType || 'unknown')))
            setSelectedTypes(types)
        }
    }, [files])

    const sizeOptions = ['Small (<1MB)', 'Medium (1-10MB)', 'Large (10MB-1GB)', 'X-Large (>1GB)']

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
    const handleActionClick = () => {
        if (selectedIds.size === 0) return
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false)
        setIsSubmitting(true)
        try {
            await onConfirm(Array.from(selectedIds))
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalSelectedSize = useMemo(() => {
        return files.filter(f => selectedIds.has(f.id)).reduce((acc, f) => acc + (f.size || 0), 0)
    }, [files, selectedIds])

    // Calculate total potential savings (sum of all displayed files)
    const totalPotentialSavings = useMemo(() => {
        return files.reduce((acc, f) => acc + (f.size || 0), 0)
    }, [files])

    const filteredFilesCount = filteredFiles.length

    // Grouping Logic by Age
    const groupedFiles = useMemo(() => {
        const groups: Record<string, ReviewFile[]> = {
            '5+ Years': [],
            '2 - 5 Years': [],
            '1 - 2 Years': [],
            '6 Months - 1 Year': []
        }

        filteredFiles.forEach(file => {
            const dateStr = file.activityTimestamp || file.modifiedTime
            if (!dateStr) return

            const date = new Date(dateStr)
            const now = new Date()
            const timeDiff = now.getTime() - date.getTime()
            const dayDiff = timeDiff / (1000 * 3600 * 24)

            if (dayDiff >= 1825) {
                groups['5+ Years'].push(file)
            } else if (dayDiff >= 730) {
                groups['2 - 5 Years'].push(file)
            } else if (dayDiff >= 365) {
                groups['1 - 2 Years'].push(file)
            } else if (dayDiff >= 180) {
                groups['6 Months - 1 Year'].push(file)
            }
        })

        // Filter out empty groups
        return Object.entries(groups).filter(([_, files]) => files.length > 0)
    }, [filteredFiles])

    // State for expanded groups (default all open)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (groupedFiles.length > 0) {
            const initial: Record<string, boolean> = {}
            groupedFiles.forEach(([title]) => {
                initial[title] = true // Default open
            })
            setExpandedGroups(initial)
        }
    }, [groupedFiles.length])

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }))
    }

    // Toggle all files in a specific group
    const toggleGroupSelection = (groupFiles: ReviewFile[]) => {
        const groupIds = groupFiles.map(f => f.id)
        const allSelected = groupIds.every(id => selectedIds.has(id))

        const newSet = new Set(selectedIds)
        if (allSelected) {
            // Deselect all
            groupIds.forEach(id => newSet.delete(id))
        } else {
            // Select all
            groupIds.forEach(id => newSet.add(id))
        }
        setSelectedIds(newSet)
    }

    // Collapsible Header Component with Selection
    const GroupHeader = ({ title, count, size, isExpanded, onToggle, groupFiles }: { title: string, count: number, size: number, isExpanded: boolean, onToggle: () => void, groupFiles: ReviewFile[] }) => {
        const groupIds = groupFiles.map(f => f.id)
        const allSelected = groupIds.every(id => selectedIds.has(id))
        const someSelected = !allSelected && groupIds.some(id => selectedIds.has(id))

        return (
            <div className="flex items-center w-full px-1 py-3 hover:bg-gray-50 rounded-lg group transition-colors select-none">
                {/* Group Checkbox */}
                <div onClick={(e) => e.stopPropagation()} className="pl-1 pr-3 flex items-center">
                    <div
                        onClick={() => toggleGroupSelection(groupFiles)}
                        className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                            allSelected
                                ? "bg-blue-600 border-blue-600"
                                : someSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300 hover:border-blue-500 bg-white"
                        )}
                    >
                        {allSelected && <Check className="w-3 h-3 text-white" />}
                        {someSelected && <Minus className="w-3 h-3 text-white" />}
                    </div>
                </div>

                <div
                    onClick={onToggle}
                    className="flex-1 flex items-center cursor-pointer"
                >
                    <div className={`p-1 rounded-md mr-3 transition-colors ${isExpanded ? 'bg-gray-100 text-gray-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {title}
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {count} items
                            </span>
                        </h3>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                        {formatFileSize(size)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent side="right" className="!w-[90vw] !max-w-[90vw] p-0 border-l border-gray-100 shadow-2xl flex flex-col h-full bg-white [&>button]:hidden">
                    <SheetHeader className="px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                        {/* Header matching Activity Center design */}
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl border border-orange-100 shadow-sm bg-orange-50 mt-1">
                                <Archive className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <SheetTitle className="text-xl font-bold text-gray-900">{title}</SheetTitle>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{filteredFilesCount} documents found</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span className="font-medium text-orange-600">{formatFileSize(totalPotentialSavings)} reclaimable</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </SheetHeader>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Filters & Stats Section */}
                        <div className="px-6 pt-4 pb-0 flex-shrink-0">
                            {/* Filters & Stats Bar */}
                            <div className="flex flex-col gap-3">
                                {/* Filters Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
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
                                    </div>

                                    {(selectedTypes.size > 0 || selectedSizes.size > 0) && (
                                        <button
                                            onClick={() => { setSelectedTypes(new Set()); setSelectedSizes(new Set()); }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                            Clear Filters
                                        </button>
                                    )}
                                </div>

                                {/* Selection status & Select All */}
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                                        <div
                                            className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                filteredFiles.length > 0 && selectedIds.size === filteredFiles.length
                                                    ? "bg-blue-600 border-blue-600"
                                                    : "border-gray-300 group-hover:border-blue-500 bg-white"
                                            )}
                                        >
                                            {filteredFiles.length > 0 && selectedIds.size === filteredFiles.length && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={filteredFiles.length > 0 && selectedIds.size === filteredFiles.length}
                                            onChange={toggleSelectAll}
                                            disabled={isLoading || isSubmitting || filteredFiles.length === 0}
                                        />
                                        <span className="text-xs font-semibold text-gray-700">
                                            Select All ({filteredFiles.length})
                                        </span>
                                    </label>

                                    {selectedIds.size > 0 && (
                                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                                            {formatFileSize(totalSelectedSize)} selected
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* File List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white h-full animate-pulse">
                                            <div className="w-4 h-4 rounded border border-gray-200 bg-gray-100 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0 flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg w-10 h-10 flex-shrink-0" />
                                                <div className="flex-1 space-y-2 py-0.5">
                                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                                    <div className="flex gap-2">
                                                        <div className="h-3 bg-gray-100 rounded w-16" />
                                                        <div className="h-3 bg-gray-100 rounded w-12" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                                        <Filter className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">No files found</span>
                                    <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
                                    <button
                                        onClick={() => { setSelectedTypes(new Set()); setSelectedSizes(new Set()); }}
                                        className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 pb-4">
                                    {groupedFiles.map(([groupTitle, groupFiles]) => {
                                        const totalSize = groupFiles.reduce((acc, f) => acc + (f.size || 0), 0)
                                        const isExpanded = expandedGroups[groupTitle]

                                        return (
                                            <div key={groupTitle} className="mb-4">
                                                <div className="mb-2">
                                                    <GroupHeader
                                                        title={groupTitle}
                                                        count={groupFiles.length}
                                                        size={groupFiles.reduce((acc, f) => acc + (f.size || 0), 0)}
                                                        isExpanded={isExpanded}
                                                        onToggle={() => toggleGroup(groupTitle)}
                                                        groupFiles={groupFiles}
                                                    />
                                                </div>
                                                {isExpanded && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {groupFiles.map(file => {
                                                            const isSelected = selectedIds.has(file.id)
                                                            return (
                                                                <div
                                                                    key={file.id}
                                                                    onClick={() => toggleSelection(file.id)}
                                                                    className={cn(
                                                                        "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border group relative h-full",
                                                                        isSelected
                                                                            ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                                                            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 border-gray-100"
                                                                    )}
                                                                >
                                                                    {/* Checkbox (Custom) */}
                                                                    <div
                                                                        className={cn(
                                                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 mt-1",
                                                                            isSelected
                                                                                ? "bg-blue-600 border-blue-600"
                                                                                : "border-gray-300 group-hover:border-blue-400 bg-white"
                                                                        )}
                                                                    >
                                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0 flex items-start gap-3">
                                                                        {/* File Icon */}
                                                                        <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm flex-shrink-0">
                                                                            <DocumentIcon mimeType={file.mimeType || 'unknown'} className="w-6 h-6" />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            {/* Row 1: Name */}
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <h4
                                                                                    title={file.name}
                                                                                    className={cn(
                                                                                        "text-sm font-bold truncate pr-6",
                                                                                        isSelected ? "text-blue-900" : "text-gray-900"
                                                                                    )}>
                                                                                    {file.name}
                                                                                </h4>
                                                                            </div>

                                                                            {/* Row 2: Owner • Location */}
                                                                            <div className="flex items-center text-[11px] text-gray-500 gap-1.5 truncate mt-0.5">
                                                                                <span className="truncate max-w-[150px]" title={file.actorEmail || file.owner}>
                                                                                    {file.actorEmail || file.owner || 'Unknown User'}
                                                                                </span>
                                                                                <span className="text-gray-300">•</span>
                                                                                <span className="flex items-center gap-1 truncate text-gray-400" title={file.parentName || 'My Drive'}>
                                                                                    <HardDrive className="h-3 w-3 flex-shrink-0" />
                                                                                    <span className="truncate">{file.parentName || 'My Drive'}</span>
                                                                                </span>
                                                                            </div>

                                                                            {/* Row 3: Badges • Time • Size */}
                                                                            <div className="flex items-center text-xs text-gray-500 gap-2 mt-1.5">
                                                                                {/* Badges */}
                                                                                {file.badges && file.badges.length > 0 && (
                                                                                    <div className="flex gap-1">
                                                                                        {file.badges.map((badge, i) => (
                                                                                            <span key={i} className={cn(
                                                                                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap uppercase tracking-wide",
                                                                                                badge.type === 'risk' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                                                                    badge.type === 'stale' ? "bg-orange-50 text-orange-700 border-orange-100" :
                                                                                                        badge.type === 'sensitive' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                                                                            "bg-amber-100 text-amber-800 border-amber-200"
                                                                                            )}>
                                                                                                {badge.type === 'risk' ? 'RISK' : badge.type === 'stale' ? 'STALE' : badge.type === 'sensitive' ? 'SENSITIVE' : 'ATTENTION'}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {/* Separator if badges exist */}
                                                                                {file.badges && file.badges.length > 0 && (
                                                                                    <span className="text-gray-300">•</span>
                                                                                )}

                                                                                {/* Time */}
                                                                                <span className="text-gray-400 font-normal">
                                                                                    {formatDistanceToNow(new Date(file.modifiedTime || new Date()), { addSuffix: true })}
                                                                                </span>

                                                                                {/* Size */}
                                                                                {file.size && (
                                                                                    <>
                                                                                        <span className="text-gray-300">•</span>
                                                                                        <span className="text-gray-400 font-normal">
                                                                                            {formatFileSize(file.size)}
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Actions Menu - Absolute positioned top-right (centered vertically relative to card) */}
                                                                    <div
                                                                        className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <DocumentActionMenu
                                                                            document={file as any}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-white border-t border-gray-100 p-6 flex-shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleActionClick}
                                    disabled={selectedIds.size === 0 || isSubmitting}
                                    className={cn(
                                        "flex-[2] px-4 py-3 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]",
                                        selectedIds.size === 0
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                            : "bg-gray-900 hover:bg-gray-800 shadow-gray-200"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            <span>Move {selectedIds.size > 0 ? `${selectedIds.size} Files` : ''} to Trash</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                count={selectedIds.size}
                totalSize={totalSelectedSize}
            />
        </>
    )
}
