import { ProjectWorkspace } from "@/components/projects/project-workspace"
import { getOrganizationHierarchy, getOrganizationName } from "@/lib/actions/hierarchy"
import { getProjectPersonas } from "@/lib/actions/personas"
import { canViewProject, canAccessRbacAdmin, getProjectPersona } from "@/lib/permission-helpers"
import { getViewAsPersonaFromCookie } from "@/lib/view-as-server"
import {
  resolveProjectCapabilitiesForUser,
  resolveProjectCapabilitiesForPersona,
} from "@/lib/permissions/resolve"
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
    if (!canView) {
        notFound() // Don't reveal project exists if user can't view
    }

    const viewAsSlug = await getViewAsPersonaFromCookie()
    const applyViewAs = viewAsSlug && (await canAccessRbacAdmin(user.id))
    const capabilities = applyViewAs
        ? await resolveProjectCapabilitiesForPersona(viewAsSlug)
        : await resolveProjectCapabilitiesForUser(org.id, client.id, project.id)
    const canViewSettings = capabilities['project:can_manage'] ?? false
    const canViewInternalTabs = capabilities['project:can_view_internal'] ?? false
    const canEdit = capabilities['project:can_edit'] ?? false
    const canManage = canViewSettings

    const projectRole = applyViewAs ? viewAsSlug : await getProjectPersona(org.id, client.id, project.id)
    const restrictToSharedOnly = projectRole ? !['proj_admin', 'proj_member'].includes(projectRole) : false

    const projectPersonas = await getProjectPersonas()
    const projectPersonaDisplayName =
        projectRole && typeof projectRole === 'string' && projectRole.startsWith('proj_')
            ? (projectPersonas as { slug: string; displayName: string }[]).find((p) => p.slug === projectRole)?.displayName ?? null
            : null

    return (
        <div className="h-full flex flex-col p-6">
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
                    canViewInternalTabs={canViewInternalTabs}
                    canEdit={canEdit}
                    canManage={canManage}
                    restrictToSharedOnly={restrictToSharedOnly}
                    projectDescription={project.description ?? undefined}
                    isClosed={project.isClosed ?? false}
                    projectPersonaDisplayName={projectPersonaDisplayName}
                />
            </ErrorBoundary>
        </div>
    )
}
