import { prisma } from '@/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getFileInfo(projectId: string, documentIdParam: string): Promise<{ organizationId: string, externalId: string, connectorId: string | null } | null> {
  const index = await (prisma as any).projectDocumentSearchIndex.findFirst({
    where: {
      OR: [
        { externalId: documentIdParam, organizationId: { not: undefined } },
        { id: UUID_REGEX.test(documentIdParam) ? documentIdParam : undefined }
      ]
    },
    select: { organizationId: true, externalId: true, connectorId: true },
  })

  if (index) return { organizationId: index.organizationId, externalId: index.externalId, connectorId: index.connectorId }

  const project = await (prisma as any).project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  })
  if (project && !UUID_REGEX.test(documentIdParam)) {
    return { organizationId: project.organizationId, externalId: documentIdParam, connectorId: null }
  }

  return null
}
