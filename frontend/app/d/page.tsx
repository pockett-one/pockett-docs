'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationsView } from '@/components/projects/organizations-view'
import { supabase } from '@/lib/supabase'
import { getUserOrganizations, type OrganizationOption } from '@/lib/actions/organizations'

export default function OrganizationsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [organizations, setOrganizations] = useState<OrganizationOption[]>([])

    useEffect(() => {
        const checkOrganizations = async () => {
            try {
                // Get the current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError || !session) {
                    router.push('/signin')
                    return
                }

                // Fetch real organizations
                const orgs = await getUserOrganizations()
                setOrganizations(orgs)

                // If no organizations found, redirect to onboarding
                if (orgs.length === 0) {
                    router.push('/d/onboarding')
                    return
                }

                // Auto-redirect to default org to skip org selection screen
                const defaultOrgSlug = orgs.find(o => o.isDefault)?.slug ?? orgs[0]?.slug
                if (defaultOrgSlug) {
                    router.replace(`/d/o/${defaultOrgSlug}`)
                    return
                }

                const activeOrgIdFromJWT = session.user.app_metadata?.active_org_id || null
                setIsLoading(false)
                return { activeOrgIdFromJWT }
            } catch (error) {
                console.error('[/d] Error checking organizations:', error)
                router.push('/d/onboarding')
            }
        }

        checkOrganizations().then(data => {
            if (data) {
                // We can use the data here if needed, but the state is already set
            }
        })
    }, [router])

    // Wait, I need to keep track of activeOrgIdFromJWT in state
    const [activeOrgIdFromJWT, setActiveOrgIdFromJWT] = useState<string | null>(null)

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setActiveOrgIdFromJWT(session.user.app_metadata?.active_org_id || null)
            }
        }
        fetchSession()
    }, [])

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col p-8 bg-stone-50/30">
            <OrganizationsView organizations={organizations} activeOrgIdFromJWT={activeOrgIdFromJWT} />
        </div>
    )
}
