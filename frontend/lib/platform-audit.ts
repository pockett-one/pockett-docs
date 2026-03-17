import { prisma } from '@/lib/prisma'
import type { PlatformAuditEventType } from '@prisma/client'

export type CreatePlatformAuditEventParams = {
  organizationId: string
  clientId: string | null
  projectId: string
  projectDocumentId?: string | null
  eventType: PlatformAuditEventType
  actorUserId?: string | null
  metadata?: Record<string, unknown>
  eventAt?: Date
}

/**
 * Append a project-scoped platform audit event. Immutable (no UPDATE); use only for INSERT.
 * Call from project/document mutation paths (e.g. closeProject, activity PATCH, share finalize).
 */
export async function createPlatformAuditEvent(params: CreatePlatformAuditEventParams): Promise<void> {
  const {
    organizationId,
    clientId,
    projectId,
    projectDocumentId,
    eventType,
    actorUserId,
    metadata = {},
    eventAt = new Date(),
  } = params

  await prisma.platformAuditEvent.create({
    data: {
      organizationId,
      clientId: clientId ?? undefined,
      projectId,
      projectDocumentId: projectDocumentId ?? undefined,
      scope: 'PROJECT',
      eventType,
      eventAt,
      actorUserId: actorUserId ?? undefined,
      metadata: metadata as object,
    },
  })
}
