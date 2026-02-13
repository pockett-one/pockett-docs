import { redirect } from "next/navigation"
import { getOrganizationHierarchy } from "@/lib/actions/hierarchy"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ClientRedirectPage({ params }: PageProps) {
    const { slug } = await params

    // Fetch clients
    const clients = await getOrganizationHierarchy(slug)

    // If clients exist, redirect to first client
    if (clients.length > 0) {
        redirect(`/d/o/${slug}/c/${clients[0].slug}`)
    }

    // If no clients exist, redirect back to organization page (no /c in URL)
    redirect(`/d/o/${slug}`)
}
