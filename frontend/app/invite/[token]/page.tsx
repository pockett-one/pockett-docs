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
    } catch (e) {
        // If INVALID or ALREADY ACCEPTED, show error or redirect?
        // For MVP, if it throws "Invitation already processed", maybe we should redirect to login or dashboard?
        // But for better UX, let's let the client show the error or a specific error page.
        // For now, let's catch distinct errors if possible.
        console.error("Invite Page Error:", e)
        // Check error message or type
        // If invalid token, 404
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
