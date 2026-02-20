/**
 * Project document sharing: resolve shared external ids and ancestor folder ids per persona.
 * Used by GET /api/projects/[projectId]/sharing/ids and by the list-files API to filter results.
 * When a folder is shared, all descendants up to MAX_DESCENDANT_DEPTH levels are made visible.
 * Caching is not used here so sharing state stays fresh when another user updates shares.
 */

import { prisma } from '@/lib/prisma'

const MAX_ANCESTOR_DEPTH = 15
/** Max depth of descendants to include when a shared item is a folder (inheritance visibility). */
export const MAX_DESCENDANT_DEPTH = 15

const FOLDER_MIME = 'application/vnd.google-apps.folder'

type DriveConnector = {
  getFileMetadata: (c: string, f: string) => Promise<{ parents?: string[] } | null>
  getFilesMetadata: (c: string, fileIds: string[]) => Promise<{ id: string; mimeType?: string }[]>
  listFiles: (c: string, folderId: string, limit: number) => Promise<{ id: string; mimeType?: string }[]>
}

export type SharedOnlyPersonaSlug = 'proj_ext_collaborator' | 'proj_guest'

async function buildAncestorFolders(
  fileIds: string[],
  connectorId: string,
  googleDriveConnector: DriveConnector
): Promise<string[]> {
  const ancestorFolderIds = new Set<string>()
  for (const fileId of fileIds) {
    let currentId: string | null = fileId
    let depth = 0
    const seen = new Set<string>()
    while (currentId && depth < MAX_ANCESTOR_DEPTH) {
      if (seen.has(currentId)) break
      seen.add(currentId)
      const meta = await googleDriveConnector.getFileMetadata(connectorId, currentId)
      if (!meta?.parents?.length) break
      const parentId = meta.parents[0]
      ancestorFolderIds.add(parentId)
      currentId = parentId
      depth++
    }
  }
  return Array.from(ancestorFolderIds)
}

/** Collect all descendant file/folder ids under the given folder ids, up to MAX_DESCENDANT_DEPTH levels. */
async function buildDescendantIds(
  sharedFolderIds: string[],
  connectorId: string,
  googleDriveConnector: DriveConnector
): Promise<string[]> {
  if (sharedFolderIds.length === 0) return []
  const descendantIds = new Set<string>()
  const listLimit = 500
  const visitedFolders = new Set<string>()

  for (const rootId of sharedFolderIds) {
    const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }]
    while (queue.length > 0) {
      const { id: folderId, depth } = queue.shift()!
      if (depth >= MAX_DESCENDANT_DEPTH) continue
      if (visitedFolders.has(folderId)) continue
      visitedFolders.add(folderId)
      try {
        const children = await googleDriveConnector.listFiles(connectorId, folderId, listLimit)
        for (const child of children) {
          descendantIds.add(child.id)
          if (child.mimeType === FOLDER_MIME) {
            queue.push({ id: child.id, depth: depth + 1 })
          }
        }
      } catch (e) {
        // Folder may be inaccessible or deleted; skip and continue
        console.warn(`[project-sharing-ids] listFiles for folder ${folderId} failed`, e)
      }
    }
  }
  return Array.from(descendantIds)
}

/** EC enabled: supports legacy (settings.externalCollaborator === true) and new shape (settings.share.externalCollaborator.enabled). */
function isECEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') return false
  const s = settings as Record<string, unknown>
  if (s.externalCollaborator === true) return true
  const share = s.share as Record<string, unknown> | undefined
  const ec = share?.externalCollaborator as { enabled?: boolean } | undefined
  return ec?.enabled === true
}

/** Guest enabled: supports legacy (settings.guest === true) and new shape (settings.share.guest.enabled). */
function isGuestEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') return false
  const s = settings as Record<string, unknown>
  if (s.guest === true) return true
  const share = s.share as Record<string, unknown> | undefined
  const guest = share?.guest as { enabled?: boolean } | undefined
  return guest?.enabled === true
}

/**
 * Returns shared external ids, ancestor folder ids, and descendant ids (children of shared folders up to MAX_DESCENDANT_DEPTH) for the given project and persona.
 * - personaSlug 'proj_ext_collaborator' => items shared with External Collaborator (and their ancestors + descendants)
 * - personaSlug 'proj_guest' => items shared with Guest (and their ancestors + descendants)
 * - personaSlug null => union of both (for backward compat / restrictToSharedOnly without persona)
 */
export async function getSharedAndAncestorIdsForPersona(
  projectId: string,
  personaSlug: SharedOnlyPersonaSlug | null
): Promise<{ sharedIds: string[]; ancestorIds: string[]; descendantIds: string[] }> {
  const allRows = await prisma.projectDocumentSharing.findMany({
    where: { projectId },
    select: {
      document: { select: { externalId: true } },
      settings: true,
    },
  })

  const settingsRows = allRows.filter((r) => r.document?.externalId) as {
    document: { externalId: string }
    settings: unknown
  }[]

  let sharedIds: string[]
  if (personaSlug === 'proj_ext_collaborator') {
    sharedIds = settingsRows.filter((r) => isECEnabled(r.settings)).map((r) => r.document.externalId)
  } else if (personaSlug === 'proj_guest') {
    sharedIds = settingsRows.filter((r) => isGuestEnabled(r.settings)).map((r) => r.document.externalId)
  } else {
    sharedIds = Array.from(
      new Set([
        ...settingsRows.filter((r) => isECEnabled(r.settings)).map((r) => r.document.externalId),
        ...settingsRows.filter((r) => isGuestEnabled(r.settings)).map((r) => r.document.externalId),
      ])
    )
  }

  let ancestorIds: string[] = []
  let descendantIds: string[] = []
  if (sharedIds.length > 0) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: {
        organization: {
          select: {
            connectors: {
              where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    })
    const connectorId = project?.organization?.connectors?.[0]?.id
    if (connectorId) {
      const { googleDriveConnector } = await import('@/lib/google-drive-connector')
      const [ancestors, sharedFolderIds] = await Promise.all([
        buildAncestorFolders(sharedIds, connectorId, googleDriveConnector),
        googleDriveConnector.getFilesMetadata(connectorId, sharedIds).then((metas) =>
          metas.filter((m) => m.mimeType === FOLDER_MIME).map((m) => m.id)
        ),
      ])
      ancestorIds = ancestors
      if (sharedFolderIds.length > 0) {
        descendantIds = await buildDescendantIds(sharedFolderIds, connectorId, googleDriveConnector)
      }
    }
  }

  return { sharedIds, ancestorIds, descendantIds }
}

export type SharedIdsForAllPersonas = {
  sharedIdsForEC: string[]
  sharedIdsForGuest: string[]
  sharedIdsUnion: string[]
  ancestorIds: string[]
  descendantIds: string[]
}

/**
 * One Prisma query and one set of Drive calls (ancestor + descendant for union).
 * Use this for GET /api/projects/[projectId]/sharing/ids to avoid 3x getSharedAndAncestorIdsForPersona.
 */
export async function getSharedAndAncestorIdsForAllPersonas(
  projectId: string
): Promise<SharedIdsForAllPersonas> {
  const allRows = await prisma.projectDocumentSharing.findMany({
    where: { projectId },
    select: {
      document: { select: { externalId: true } },
      settings: true,
    },
  })

  const settingsRows = allRows.filter((r) => r.document?.externalId) as {
    document: { externalId: string }
    settings: unknown
  }[]

  const sharedIdsForEC = settingsRows.filter((r) => isECEnabled(r.settings)).map((r) => r.document.externalId)
  const sharedIdsForGuest = settingsRows.filter((r) => isGuestEnabled(r.settings)).map((r) => r.document.externalId)
  const sharedIdsUnion = Array.from(
    new Set([...sharedIdsForEC, ...sharedIdsForGuest])
  )

  let ancestorIds: string[] = []
  let descendantIds: string[] = []
  if (sharedIdsUnion.length > 0) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: {
        organization: {
          select: {
            connectors: {
              where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    })
    const connectorId = project?.organization?.connectors?.[0]?.id
    if (connectorId) {
      const { googleDriveConnector } = await import('@/lib/google-drive-connector')
      const [ancestors, sharedFolderIds] = await Promise.all([
        buildAncestorFolders(sharedIdsUnion, connectorId, googleDriveConnector),
        googleDriveConnector.getFilesMetadata(connectorId, sharedIdsUnion).then((metas) =>
          metas.filter((m) => m.mimeType === FOLDER_MIME).map((m) => m.id)
        ),
      ])
      ancestorIds = ancestors
      if (sharedFolderIds.length > 0) {
        descendantIds = await buildDescendantIds(sharedFolderIds, connectorId, googleDriveConnector)
      }
    }
  }

  return {
    sharedIdsForEC,
    sharedIdsForGuest,
    sharedIdsUnion,
    ancestorIds,
    descendantIds,
  }
}
