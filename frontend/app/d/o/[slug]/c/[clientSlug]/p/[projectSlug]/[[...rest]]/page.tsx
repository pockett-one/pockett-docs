import { ProjectWorkspace } from "@/components/projects/project-workspace"
import { getOrganizationHierarchy, getOrganizationName, type HierarchyClient } from "@/lib/actions/hierarchy"
import { getProjectPersonas } from "@/lib/actions/personas"
import { canViewProject, canAccessRbacAdmin, getProjectPersona } from "@/lib/permission-helpers"
import { getViewAsPersonaFromCookie } from "@/lib/view-as-server"
import {
  resolveProjectCapabilitiesForUser,
  resolveProjectCapabilitiesForPersona,
} from "@/lib/permissions/resolve"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import type { ProjectPathSegments } from "@/components/projects/project-workspace"

const VALID_TABS = new Set(['files', 'shares', 'members', 'insights', 'sources', 'settings'])

function parseRest(rest: string[] | undefined): ProjectPathSegments {
  const tab = rest?.[0] && VALID_TABS.has(rest[0]) ? rest[0] : 'files'
  if (tab !== 'shares') {
    return { tab, viewMode: 'list' }
  }
  const viewMode = (rest?.[1] === 'board' ? 'board' : (rest?.[1] === 'list' ? 'list' : 'grid')) as 'list' | 'board' | 'grid'
  return { tab, viewMode }
}

interface PageProps {
  params: Promise<{ slug: string; clientSlug: string; projectSlug: string; rest?: string[] }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug, clientSlug, projectSlug, rest } = await params
  const pathSegments = parseRest(rest)

  // Canonical URL includes the tab; redirect /p/<slug> to /p/<slug>/files
  if (!rest || rest.length === 0) {
    redirect(`/d/o/${slug}/c/${clientSlug}/p/${projectSlug}/files`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  let clients: HierarchyClient[]
  try {
    clients = await getOrganizationHierarchy(slug)
  } catch (e) {
    notFound()
  }
  const orgName = await getOrganizationName(slug)

  const client = clients.find(c => c.slug === clientSlug)
  if (!client) {
    notFound()
  }

  const project = client.projects.find(p => p.slug === projectSlug)
  if (!project) {
    notFound()
  }

  const org = await prisma.organization.findUnique({
    where: { slug: slug },
    select: { id: true }
  })
  if (!org) {
    notFound()
  }

  const canView = await canViewProject(org.id, client.id, project.id)
  if (!canView) {
    notFound()
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

  if (pathSegments.tab === 'settings' && !canViewSettings) {
    redirect(`/d/o/${slug}/c/${clientSlug}/p/${projectSlug}/files`)
  }
  if (['members', 'insights', 'sources'].includes(pathSegments.tab) && !canViewInternalTabs) {
    redirect(`/d/o/${slug}/c/${clientSlug}/p/${projectSlug}/files`)
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
          canViewInternalTabs={canViewInternalTabs}
          canEdit={canEdit}
          canManage={canManage}
          restrictToSharedOnly={restrictToSharedOnly}
          projectDescription={project.description ?? undefined}
          isClosed={project.isClosed ?? false}
          pathSegments={pathSegments}
          projectPersonaDisplayName={projectPersonaDisplayName}
        />
      </ErrorBoundary>
    </div>
  )
}
