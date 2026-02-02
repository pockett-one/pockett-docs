import { ProjectWorkspace } from "@/components/projects/project-workspace"
import { getOrganizationHierarchy, getOrganizationName } from "@/lib/actions/hierarchy"
import { canViewProjectSettings } from "@/lib/actions/project"
import { notFound } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"

interface PageProps {
    params: Promise<{ slug: string; clientSlug: string; projectSlug: string }>
}

export default async function ProjectPage({ params }: PageProps) {
    const { slug, clientSlug, projectSlug } = await params

    // Fetch Hierarchy to resolve slugs to IDs (excludes deleted projects)
    const clients = await getOrganizationHierarchy(slug)
    const orgName = await getOrganizationName(slug)

    const client = clients.find(c => c.slug === clientSlug)
    if (!client) notFound()

    const project = client.projects.find(p => p.slug === projectSlug)
    if (!project) notFound()

    const canViewSettings = await canViewProjectSettings(project.id)

    return (
        <div className="h-full flex flex-col p-6">
            <ErrorBoundary context="ProjectWorkspace">
                <ProjectWorkspace
                    orgSlug={slug}
                    clientSlug={client.slug}
                    projectId={project.id}
                    driveFolderId={project.driveFolderId}
                    orgName={orgName}
                    clientName={client.name}
                    projectName={project.name}
                    canViewSettings={canViewSettings}
                    projectDescription={project.description ?? undefined}
                    isClosed={project.isClosed ?? false}
                />
            </ErrorBoundary>
        </div>
    )
}
