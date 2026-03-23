'use client'

import { useEffect, useState } from 'react'
import { getCanCreateAdditionalFirm } from '@/lib/actions/firms'

/**
 * Client hook: whether the user may add another non-sandbox firm (subscription gate).
 */
export function useCanCreateAdditionalFirm(userId: string | undefined) {
    const [canCreate, setCanCreate] = useState<boolean | null>(null)

    useEffect(() => {
        if (!userId) {
            setCanCreate(null)
            return
        }
        let cancelled = false
        getCanCreateAdditionalFirm().then((ok) => {
            if (!cancelled) setCanCreate(ok)
        })
        return () => {
            cancelled = true
        }
    }, [userId])

    const loadingEntitlement = Boolean(userId) && canCreate === null
    const canCreateAdditionalFirm = canCreate === true

    return { canCreateAdditionalFirm, loadingEntitlement }
}
