import { getOrganizationHierarchy } from "@/lib/actions/hierarchy"
import { prisma } from "@/lib/prisma"
import { OrganizationClientsView } from "@/components/projects/organization-clients-view"

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
    // Await params as required in Next.js 15+
    const { slug } = await params
    
    // Fetch clients and organization
    const clients = await getOrganizationHierarchy(slug)
    const organization = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true }
    })
    
    return (
        <div className="h-full flex flex-col">
            <OrganizationClientsView
                clients={clients}
                orgSlug={slug}
                orgId={organization?.id}
            />
        </div>
    )
}
