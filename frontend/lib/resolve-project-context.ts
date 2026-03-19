/**
 * Resolve projectId to orgId and clientId for RBAC checks in project-scoped API routes.
 * Returns null if project not found (caller should return 404).
 */
import { prisma } from '@/lib/prisma'

export async function resolveProjectContext(projectId: string): Promise<{
  firmId: string
  /** @deprecated use firmId */
  orgId: string
  clientId: string
  projectId: string
} | null> {
  const project = await prisma.engagement.findFirst({
    where: { id: projectId, isDeleted: false },
    select: { id: true, clientId: true, client: { select: { firmId: true } } },
  })
  if (!project) return null
  return {
    firmId: project.client.firmId,
    orgId: project.client.firmId,
    clientId: project.clientId,
    projectId: project.id,
  }
}
