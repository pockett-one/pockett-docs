import { verifyInvitation } from "@/lib/actions/invitations"
import { InviteLandingClient } from "@/components/invite/invite-landing-client"
import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"

interface PageProps {
    params: Promise<{
        token: string
    }>
}

export default async function InvitePage({ params }: PageProps) {
    const { token } = await params

    if (!token) notFound()

    // 1. Verify Token & Fetch Invite Data
    let invite
    try {
        invite = await verifyInvitation(token)
    } catch (e: any) {
        // Handle different error types gracefully
        const errorMessage = e?.message || 'Unknown error'
        
        // Invalid token or expired - return 404 (don't expose token validity)
        if (errorMessage.includes('Invalid token') || errorMessage.includes('expired')) {
            notFound()
        }
        
        // For other errors, log in dev mode only
        if (process.env.NODE_ENV === 'development') {
            console.error("Invite Page Error:", e)
        }
        
        // Still return 404 to avoid exposing internal errors
        notFound()
    }

    if (!invite) notFound()

    // 2. Get Current User (if any)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Render Client Component
    return (
        <InviteLandingClient
            invitation={invite}
            userEmail={user?.email}
        />
    )
}
