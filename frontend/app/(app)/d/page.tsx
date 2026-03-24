'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FirmsView } from '@/components/projects/firms-view'
import { WorkspaceLoader } from '@/components/ui/workspace-loader'
import { supabase } from '@/lib/supabase'
import { getUserFirms, type FirmOption } from '@/lib/actions/firms'

export default function FirmsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [firms, setFirms] = useState<FirmOption[]>([])
    const [activeOrgIdFromJWT, setActiveOrgIdFromJWT] = useState<string | null>(null)

    useEffect(() => {
        const checkOrganizations = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError || !session) {
                    router.push('/signin')
                    return
                }

                setActiveOrgIdFromJWT(session.user.app_metadata?.active_firm_id || null)

                const orgs = await getUserFirms()
                setFirms(orgs)

                if (orgs.length === 0) {
                    router.push('/d/onboarding')
                    return
                }

                const defaultOrgSlug = orgs.find(o => o.isDefault)?.slug ?? orgs[0]?.slug
                if (defaultOrgSlug) {
                    router.replace(`/d/f/${defaultOrgSlug}`)
                    return
                }

                setIsLoading(false)
            } catch (error) {
                console.error('[/d] Error checking organizations:', error)
                router.push('/d/onboarding')
            }
        }

        checkOrganizations()
    }, [router])

    if (isLoading) {
        return (
            <WorkspaceLoader
                className="h-full min-h-[60vh]"
                title="Preparing your dashboard"
                subtitle="Fetching workspace context and loading your default firm"
            />
        )
    }

    return (
        <div className="h-full flex flex-col p-8 bg-stone-50/30">
            <FirmsView firms={firms} activeOrgIdFromJWT={activeOrgIdFromJWT} />
        </div>
    )
}
