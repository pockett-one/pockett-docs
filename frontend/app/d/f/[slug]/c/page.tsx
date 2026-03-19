import { redirect } from "next/navigation"
import { getFirmHierarchy } from "@/lib/actions/hierarchy"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ClientRedirectPage({ params }: PageProps) {
    const { slug } = await params

    // Fetch clients
    const clients = await getFirmHierarchy(slug)

    // If clients exist, redirect to first client
    if (clients.length > 0) {
        redirect(`/d/f/${slug}/c/${clients[0].slug}`)
    }

    // If no clients exist, redirect back to organization page (no /c in URL)
    redirect(`/d/f/${slug}`)
}
