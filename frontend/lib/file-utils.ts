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
