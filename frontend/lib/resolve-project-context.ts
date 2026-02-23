/**
 * Resolve projectId to orgId and clientId for RBAC checks in project-scoped API routes.
 * Returns null if project not found (caller should return 404).
 */
import { prisma } from '@/lib/prisma'

export async function resolveProjectContext(projectId: string): Promise<{
  orgId: string
  clientId: string
  projectId: string
} | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
    select: { id: true, organizationId: true, clientId: true },
  })
  if (!project) return null
  return {
    orgId: project.organizationId,
    clientId: project.clientId,
    projectId: project.id,
  }
}
