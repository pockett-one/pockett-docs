'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getCanCreateAdditionalFirm } from '@/lib/actions/firms'

/**
 * Client hook: whether the user may add another non-sandbox firm (subscription gate).
 */
export function useCanCreateAdditionalFirm(userId: string | undefined) {
    const [canCreate, setCanCreate] = useState<boolean | null>(null)
    const pathname = usePathname()

    useEffect(() => {
        if (!userId) {
            setCanCreate(null)
            return
        }
        let cancelled = false
        const load = () => {
            getCanCreateAdditionalFirm().then((ok) => {
                if (!cancelled) setCanCreate(ok)
            })
        }
        load()
        return () => {
            cancelled = true
        }
    }, [userId, pathname])

    useEffect(() => {
        if (!userId) return
        const refresh = () => {
            if (document.visibilityState !== 'visible') return
            void getCanCreateAdditionalFirm().then(setCanCreate)
        }
        document.addEventListener('visibilitychange', refresh)
        window.addEventListener('focus', refresh)
        return () => {
            document.removeEventListener('visibilitychange', refresh)
            window.removeEventListener('focus', refresh)
        }
    }, [userId])

    const loadingEntitlement = Boolean(userId) && canCreate === null
    const canCreateAdditionalFirm = canCreate === true

    return { canCreateAdditionalFirm, loadingEntitlement }
}
