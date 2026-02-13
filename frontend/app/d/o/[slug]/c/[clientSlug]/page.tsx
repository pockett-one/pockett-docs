import { getOrganizationHierarchy, getOrganizationName } from "@/lib/actions/hierarchy"
import { ClientProjectView } from "@/components/projects/client-project-view"

interface PageProps {
    params: Promise<{ slug: string; clientSlug: string }>
}

export default async function ClientProjectPage({ params }: PageProps) {
    const { slug, clientSlug } = await params

    // Fetch Data
    const clients = await getOrganizationHierarchy(slug)
    const orgName = await getOrganizationName(slug)

    return (
        <div className="h-full flex flex-col">
            <ClientProjectView
                clients={clients}
                orgSlug={slug}
                orgName={orgName}
                selectedClientSlug={clientSlug}
            />
        </div>
    )
}
