import { getFirmHierarchy, getFirmName } from "@/lib/actions/hierarchy"
import { ClientProjectView } from "@/components/projects/client-project-view"
import { prisma } from "@/lib/prisma"

interface PageProps {
    params: Promise<{ slug: string; clientSlug: string }>
}

export default async function ClientProjectPage({ params }: PageProps) {
    const { slug, clientSlug } = await params

    const [clients, orgName, org] = await Promise.all([
        getFirmHierarchy(slug),
        getFirmName(slug),
        prisma.firm.findUnique({ where: { slug }, select: { id: true, sandboxOnly: true } }),
    ])

    return (
        <div className="h-full flex flex-col">
            <ClientProjectView
                clients={clients}
                orgSlug={slug}
                orgName={orgName}
                orgId={org?.id}
                firmSandboxOnly={org?.sandboxOnly ?? false}
                selectedClientSlug={clientSlug}
            />
        </div>
    )
}
