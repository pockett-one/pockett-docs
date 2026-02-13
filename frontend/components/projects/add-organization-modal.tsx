'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { createOrganization } from '@/lib/actions/organizations'
import { useAuth } from '@/lib/auth-context'

interface AddOrganizationModalProps {
    trigger?: React.ReactNode
}

const PUBLIC_EMAIL_DOMAINS = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com',
    'live.com', 'icloud.com', 'aol.com', 'mail.com', 'protonmail.com', 'zoho.com'
])

export function AddOrganizationModal({ trigger }: AddOrganizationModalProps) {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [allowDomainAccess, setAllowDomainAccess] = useState(true)
    const [allowedEmailDomain, setAllowedEmailDomain] = useState('')
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    useEffect(() => {
        if (open && user?.email) {
            const domain = user.email.split('@')[1]?.toLowerCase() || ''
            if (domain) setAllowedEmailDomain((prev) => (prev || domain))
        }
    }, [open, user?.email])

    const isPublicDomain = allowedEmailDomain && PUBLIC_EMAIL_DOMAINS.has(allowedEmailDomain.toLowerCase())

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const domain = allowDomainAccess ? (allowedEmailDomain?.trim() || null) : null
        try {
            const newOrg = await createOrganization({
                name,
                allowDomainAccess: allowDomainAccess && !!domain,
                allowedEmailDomain: domain
            })
            setOpen(false)
            setName('')
            setError(null)
            
            // Navigate to the new organization
            router.push(`/d/o/${newOrg.slug}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to create organization')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            setOpen(newOpen)
            if (!newOpen) {
                setName('')
                setAllowDomainAccess(true)
                setAllowedEmailDomain('')
                setError(null)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Organization
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-slate-900">Create New Organization</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Create a new workspace organization. You will be set as the organization owner.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-slate-900">Organization Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Acme Consulting"
                                disabled={isLoading}
                                required
                                autoFocus
                                className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="grid gap-3 border-t border-slate-200 pt-4">
                            <h4 className="font-semibold text-slate-900">Allow domain access</h4>
                            <p className="text-sm text-slate-600">
                                Enabling access allows users with email address with this domain to join the workspace without an invitation.
                            </p>
                            <div className="flex items-center justify-between gap-4">
                                <Label htmlFor="allow-domain" className="text-sm font-normal text-slate-900 cursor-pointer flex-1">
                                    Enable access for {allowedEmailDomain || 'your domain'}
                                </Label>
                                <Switch
                                    id="allow-domain"
                                    checked={allowDomainAccess}
                                    onCheckedChange={setAllowDomainAccess}
                                    disabled={isLoading}
                                />
                            </div>
                            {allowDomainAccess && (
                                <div className="grid gap-2">
                                    <Label htmlFor="domain" className="text-sm text-slate-700">Email domain</Label>
                                    <Input
                                        id="domain"
                                        value={allowedEmailDomain}
                                        onChange={(e) => setAllowedEmailDomain(e.target.value)}
                                        placeholder="e.g., acme.com"
                                        disabled={isLoading}
                                        className="font-mono text-sm border-slate-200 bg-white text-slate-900"
                                    />
                                    {isPublicDomain && (
                                        <p className="text-xs text-slate-500">
                                            Public email domains (e.g. gmail.com) are not recommended for organization access.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={isLoading || !name.trim()}>
                            {isLoading ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Creating...
                                </>
                            ) : (
                                'Create Organization'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
