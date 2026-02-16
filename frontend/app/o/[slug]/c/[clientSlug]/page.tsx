import { getOrganizationHierarchy, getOrganizationName } from "@/lib/actions/hierarchy"
import { ClientProjectView } from "@/components/projects/client-project-view"
import { prisma } from "@/lib/prisma"

interface PageProps {
    params: Promise<{ slug: string; clientSlug: string }>
}

export default async function ClientProjectPage({ params }: PageProps) {
    const { slug, clientSlug } = await params

    const [clients, orgName, org] = await Promise.all([
        getOrganizationHierarchy(slug),
        getOrganizationName(slug),
        prisma.organization.findUnique({ where: { slug }, select: { id: true } }),
    ])

    return (
        <div className="h-full flex flex-col">
            <ClientProjectView
                clients={clients}
                orgSlug={slug}
                orgName={orgName}
                orgId={org?.id}
                selectedClientSlug={clientSlug}
            />
        </div>
    )
}
