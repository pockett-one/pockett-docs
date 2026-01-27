import { ProjectWorkspace } from "@/components/projects/project-workspace"
import { getOrganizationHierarchy, getOrganizationName } from "@/lib/actions/hierarchy"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ slug: string; clientSlug: string; projectSlug: string }>
}

export default async function ProjectPage({ params }: PageProps) {
    const { slug, clientSlug, projectSlug } = await params

    // Fetch Hierarchy to resolve slugs to IDs
    const clients = await getOrganizationHierarchy(slug)
    const orgName = await getOrganizationName(slug)

    const client = clients.find(c => c.slug === clientSlug)
    if (!client) notFound()

    const project = client.projects.find(p => p.slug === projectSlug)
    if (!project) notFound()

    return (
        <div className="h-full flex flex-col p-6">
            <ProjectWorkspace
                orgSlug={slug}
                clientSlug={client.slug}
                projectId={project.id}
                orgName={orgName}
                clientName={client.name}
                projectName={project.name}
            />
        </div>
    )
}
