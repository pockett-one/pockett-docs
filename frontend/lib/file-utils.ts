import { prisma } from '@/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getFileInfo(projectId: string, documentIdParam: string): Promise<{ organizationId: string, externalId: string, connectorId: string | null, fileName?: string } | null> {
  const doc = await (prisma as any).projectDocument.findFirst({
    where: {
      projectId,
      OR: [
        { externalId: documentIdParam },
        ...(UUID_REGEX.test(documentIdParam) ? [{ id: documentIdParam }] : []),
      ],
    },
    select: { organizationId: true, externalId: true, connectorId: true, fileName: true },
  })

  if (doc) {
    return {
      organizationId: doc.organizationId,
      externalId: doc.externalId,
      connectorId: doc.connectorId,
      fileName: doc.fileName,
    }
  }

  return null
}

/** Resolve project document by projectId + documentId (externalId or UUID). Returns id, organizationId, clientId, projectId for use in doc-comments/audit. */
export async function getProjectDocumentContext(
  projectId: string,
  documentIdParam: string
): Promise<{ id: string; organizationId: string; clientId: string; projectId: string } | null> {
  const doc = await (prisma as any).projectDocument.findFirst({
    where: {
      projectId,
      OR: [
        { externalId: documentIdParam },
        ...(UUID_REGEX.test(documentIdParam) ? [{ id: documentIdParam }] : []),
      ],
    },
    select: { id: true, organizationId: true, clientId: true, projectId: true, project: { select: { clientId: true } } },
  })
  if (!doc) return null
  const clientId = doc.clientId ?? doc.project?.clientId
  if (!clientId) return null
  return {
    id: doc.id,
    organizationId: doc.organizationId,
    clientId,
    projectId: doc.projectId,
  }
}
