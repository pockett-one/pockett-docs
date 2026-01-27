import { getOrganizationHierarchy } from "@/lib/actions/hierarchy"
import { redirect } from "next/navigation"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ClientRedirectPage({ params }: PageProps) {
    const { slug } = await params

    // Fetch Data
    const clients = await getOrganizationHierarchy(slug)

    if (clients.length > 0) {
        redirect(`/o/${slug}/c/${clients[0].id}`)
    }

    const { ClientProjectView } = await import("@/components/projects/client-project-view")

    return (
        <div className="h-full flex flex-col">
            <ClientProjectView
                clients={clients}
                orgSlug={slug}
                selectedClientSlug=""
            />
        </div>
    )
}
