import { ProjectWorkspace } from "@/components/projects/project-workspace"
import { getOrganizationHierarchy, getOrganizationName } from "@/lib/actions/hierarchy"
import { canViewProject, canEditProject, canManageProject } from "@/lib/permission-helpers"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"

interface PageProps {
    params: Promise<{ slug: string; clientSlug: string; projectSlug: string }>
}

export default async function ProjectPage({ params }: PageProps) {
    const { slug, clientSlug, projectSlug } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        notFound()
    }

    // Fetch Hierarchy to resolve slugs to IDs (excludes deleted projects)
    const clients = await getOrganizationHierarchy(slug)
    const orgName = await getOrganizationName(slug)

    const client = clients.find(c => c.slug === clientSlug)
    if (!client) notFound()

    const project = client.projects.find(p => p.slug === projectSlug)
    if (!project) notFound()

    // Get organization and client IDs for permission checks
    const org = await prisma.organization.findUnique({
        where: { slug: slug },
        select: { id: true }
    })
    if (!org) notFound()

    // Check permissions using cached permissions (no DB queries)
    const canView = await canViewProject(org.id, client.id, project.id)
    const canEdit = await canEditProject(org.id, client.id, project.id)
    const canManage = await canManageProject(org.id, client.id, project.id)
    const canViewSettings = canManage // Settings require can_manage

    if (!canView) {
        notFound() // Don't reveal project exists if user can't view
    }

    return (
        <div className="h-full flex flex-col">
            <ErrorBoundary context="ProjectWorkspace">
                <ProjectWorkspace
                    orgSlug={slug}
                    clientSlug={client.slug}
                    projectId={project.id}
                    connectorRootFolderId={project.connectorRootFolderId}
                    orgName={orgName}
                    clientName={client.name}
                    projectName={project.name}
                    canViewSettings={canViewSettings}
                    canEdit={canEdit}
                    canManage={canManage}
                    projectDescription={project.description ?? undefined}
                    isClosed={project.isClosed ?? false}
                />
            </ErrorBoundary>
        </div>
    )
}
