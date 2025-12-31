import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Trash2, Clock, Shield, User, Globe, AlertTriangle, Loader2, Check } from 'lucide-react'
import { DriveFile } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { formatDistanceToNow, addDays } from 'date-fns'

interface RiskyShareReviewModalProps {
    isOpen: boolean
    onClose: () => void
    files: DriveFile[]
    onUpdate?: () => void
}

export function RiskyShareReviewModal({ isOpen, onClose, files, onUpdate }: RiskyShareReviewModalProps) {
    const { session } = useAuth()
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

    const handleRevoke = async (fileId: string, permissionId: string) => {
        const key = `${fileId}-${permissionId}`
        setProcessingIds(prev => new Set(prev).add(key))
        try {
            await fetch('/api/drive-action', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'revoke', fileId, permissionId })
            })
            if (onUpdate) onUpdate()
        } catch (e) {
            console.error(e)
        } finally {
            setProcessingIds(prev => {
                const s = new Set(prev)
                s.delete(key)
                return s
            })
        }
    }

    const handleSetExpiry = async (fileId: string, permissionId: string, days: number) => {
        const key = `${fileId}-${permissionId}`
        setProcessingIds(prev => new Set(prev).add(key))
        try {
            const date = addDays(new Date(), days)
            await fetch('/api/drive-action', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'set_expiry', fileId, permissionId, expirationTime: date.toISOString() })
            })
            if (onUpdate) onUpdate()
        } catch (e) {
            console.error(e)
        } finally {
            setProcessingIds(prev => {
                const s = new Set(prev)
                s.delete(key)
                return s
            })
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Security Risk Review">
            <div className="flex flex-col gap-6">
                <p className="text-gray-600">
                    The following files have risky sharing settings (e.g., Public access or external editors).
                    Review permissions below.
                </p>

                <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
                    {files.map(file => (
                        <div key={file.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Shield className={`h-5 w-5 ${file.badges?.some(b => b.type === 'risk') ? 'text-red-500' : 'text-orange-500'}`} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900">{file.name}</h4>
                                        <p className="text-xs text-gray-500">
                                            {file.permissions?.length || 0} permissions found
                                        </p>
                                    </div>
                                </div>
                                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    View File
                                </a>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {file.permissions?.map((perm: any) => {
                                    // Skip owner
                                    if (perm.role === 'owner') return null
                                    const key = `${file.id}-${perm.id}`
                                    const isProcessing = processingIds.has(key)

                                    return (
                                        <div key={perm.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${perm.type === 'anyone' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {perm.type === 'anyone' ? <Globe className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {perm.displayName || (perm.type === 'anyone' ? 'Anyone with link' : perm.emailAddress || 'Unknown User')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {perm.role} • {perm.type}
                                                        {perm.expirationTime && (
                                                            <span className="text-orange-600 ml-1">
                                                                (Expires {formatDistanceToNow(new Date(perm.expirationTime), { addSuffix: true })})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                ) : (
                                                    <>
                                                        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                            <button
                                                                onClick={() => handleSetExpiry(file.id, perm.id, 7)}
                                                                className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-200"
                                                                title="Expire in 7 days"
                                                            >
                                                                7d
                                                            </button>
                                                            <button
                                                                onClick={() => handleSetExpiry(file.id, perm.id, 30)}
                                                                className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                                title="Expire in 30 days"
                                                            >
                                                                30d
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRevoke(file.id, perm.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Revoke Access"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Done</button>
                </div>
            </div>
        </Modal>
    )
}
