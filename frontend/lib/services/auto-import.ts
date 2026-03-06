import { IConnectorStorageAdapter, PockettMetaOrganization } from '@/lib/connectors/types'
import * as pockettStructure from '@/lib/connectors/pockett-structure.service'
import { safeInngestSend } from '@/lib/inngest/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { duplicateConnectorForOrganization } from '@/lib/services/connection-manager'
import { OrganizationService } from '@/lib/organization-service'
import { ClientService } from '@/lib/services/client.service'
import { projectService } from '@/lib/services/project.service'

interface DetectedProject {
  folderId: string
  name: string
  slug: string
  alreadyImported: boolean
}

interface DetectedClient {
  folderId: string
  name: string
  slug: string
  alreadyImported: boolean
  projects: DetectedProject[]
}

interface DetectedOrganization {
  folderId: string
  name: string
  slug: string
  metadata: PockettMetaOrganization
  hasMetaFile: boolean
  alreadyImported: boolean
  clients: DetectedClient[]
}

interface ImportResult {
  orgSlug: string
  orgId: string
  clientCount: number
  projectCount: number
  projectIds: string[]
}

/**
 * Detect all organizations in Drive and their hierarchical structure (Clients > Projects)
 */
export async function detectAllOrganizations(
  connectionId: string,
  parentFolderId: string,
  adapter: IConnectorStorageAdapter
): Promise<DetectedOrganization[]> {
  try {
    logger.info('Detecting organization hierarchy in Drive (V2)', { parentFolderId, connectionId })
    const detected: DetectedOrganization[] = []

    const pockettFolders = await adapter.search(connectionId, "name = '.pockett' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")
    logger.info(`Found ${pockettFolders.length} .pockett metadata folders in Drive`)

    for (const dotPockett of pockettFolders) {
      try {
        const parentId = await adapter.getFileParent(connectionId, dotPockett.id)
        if (!parentId) continue

        // Ancestry check
        if (parentFolderId && parentFolderId !== 'root') {
          let current: string | null = parentId
          let foundAncestor = false
          let depth = 0
          while (current && depth < 20) {
            if (current === parentFolderId) {
              foundAncestor = true
              break
            }
            current = await adapter.getFileParent(connectionId, current)
            depth++
          }
          if (!foundAncestor) continue
        }

        const metadataRaw = await pockettStructure.readMetaFromFolder(adapter, connectionId, parentId)
        if (!metadataRaw || metadataRaw.type !== 'organization') continue

        const metadata = metadataRaw as unknown as PockettMetaOrganization

        // Check if already imported (V2)
        const existingOrg = await (prisma as any).organization.findUnique({
          where: { slug: metadata.slug },
          select: { id: true },
        })

        const clients: DetectedClient[] = []
        const clientFolders = await adapter.listFolderChildren(connectionId, parentId)

        for (const cf of clientFolders) {
          if (cf.name.startsWith('.')) continue
          const clientMeta = await pockettStructure.readMetaFromFolder(adapter, connectionId, cf.id)
          if (!clientMeta || clientMeta.type !== 'client') continue

          const clientSlug = (clientMeta as any).slug
          const existingClient = existingOrg ? await (prisma as any).client.findFirst({
            where: { organizationId: existingOrg.id, slug: clientSlug },
            select: { id: true }
          }) : null

          const projects: DetectedProject[] = []
          const projectFolders = await adapter.listFolderChildren(connectionId, cf.id)

          for (const pf of projectFolders) {
            if (pf.name.startsWith('.')) continue
            const projectMeta = await pockettStructure.readMetaFromFolder(adapter, connectionId, pf.id)
            if (!projectMeta || projectMeta.type !== 'project') continue

            const projectSlug = (projectMeta as any).slug
            const existingProject = existingClient ? await (prisma as any).project.findFirst({
              where: { clientId: existingClient.id, slug: projectSlug },
              select: { id: true }
            }) : null

            projects.push({
              folderId: pf.id,
              name: pf.name,
              slug: projectSlug,
              alreadyImported: !!existingProject
            })
          }

          clients.push({
            folderId: cf.id,
            name: cf.name,
            slug: clientSlug,
            alreadyImported: !!existingClient,
            projects
          })
        }

        const folderName = await adapter.getFolderName(connectionId, parentId)
        detected.push({
          folderId: parentId,
          name: folderName || metadata.folderName || metadata.slug,
          slug: metadata.slug,
          metadata,
          hasMetaFile: true,
          alreadyImported: !!existingOrg,
          clients
        })
      } catch (err) {
        logger.error('Error processing potential organization folder', err as Error)
      }
    }
    return detected
  } catch (error) {
    logger.error('Failed to detect organizations', error as Error)
    throw error
  }
}

/**
 * Import selected organizations from Drive
 */
export async function importMultipleOrganizations(
  connectionId: string,
  parentFolderId: string,
  selectedFolderIds: string[],
  adapter: IConnectorStorageAdapter,
  userId: string,
  sourceOrgId?: string
): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  try {
    const allDetected = await detectAllOrganizations(connectionId, parentFolderId, adapter)
    const toImport = allDetected.filter(
      (org) => selectedFolderIds.includes(org.folderId) && !org.alreadyImported
    )

    for (const org of toImport) {
      try {
        const result = await importOrganization(org, connectionId, adapter, userId, sourceOrgId, selectedFolderIds)
        results.push(result)
      } catch (err) {
        logger.error(`Failed to import organization: ${org.slug}`, err as Error)
      }
    }
    return results
  } catch (error) {
    logger.error('Failed to import organizations', error as Error)
    throw error
  }
}

/**
 * Import a single organization and its allowed sub-structure
 */
async function importOrganization(
  detectedOrg: DetectedOrganization,
  connectionId: string,
  adapter: IConnectorStorageAdapter,
  userId: string,
  sourceOrgId?: string,
  allowedFolderIds?: string[]
): Promise<ImportResult> {
  const slug = detectedOrg.slug
  logger.info(`Importing organization (V2): ${slug}`, { name: detectedOrg.name })

  // 1. Create Organization via Service
  const org = await OrganizationService.createOrganizationWithMember({
    userId,
    email: '', // Not needed for import as user already exists
    firstName: '',
    lastName: '',
    organizationName: detectedOrg.name,
    connectorId: connectionId,
    orgFolderId: detectedOrg.folderId,
    allowDomainAccess: false
  })

  // Set the slug correctly if it differs from generated
  if (org.slug !== detectedOrg.slug) {
    await (prisma as any).organization.update({
      where: { id: org.id },
      data: { slug: detectedOrg.slug }
    })
  }

  // 2. Duplicate connection if needed
  if (sourceOrgId) {
    try {
      await duplicateConnectorForOrganization(sourceOrgId, org.id, prisma)
    } catch (err) {
      logger.warn(`Failed to duplicate connection for: ${slug}`, err as Error)
    }
  }

  const clientFolders = await adapter.listFolderChildren(connectionId, detectedOrg.folderId)
  const projectIds: string[] = []
  let createdClientCount = 0

  for (const clientFolder of clientFolders) {
    if (clientFolder.name.startsWith('.')) continue
    if (allowedFolderIds && !allowedFolderIds.includes(clientFolder.id)) continue

    try {
      const clientMetadata = await pockettStructure.readMetaFromFolder(adapter, connectionId, clientFolder.id)
      if (!clientMetadata || clientMetadata.type !== 'client') continue

      // 3. Create Client via Service
      const client = await ClientService.createClient({
        organizationId: org.id,
        name: clientFolder.name,
        creatorUserId: userId,
        sandboxOnly: (clientMetadata as any)?.sandboxOnly ?? false,
        settings: { ...(clientMetadata as any || {}), driveFolderId: clientFolder.id }
      })

      // Update Client with driveFolderId and slug
      await (prisma as any).client.update({
        where: { id: client.id },
        data: {
          driveFolderId: clientFolder.id,
          slug: (clientMetadata as any).slug || client.slug
        }
      })
      createdClientCount++

      // 4. Create Projects
      const projectFolders = await adapter.listFolderChildren(connectionId, clientFolder.id)
      for (const projectFolder of projectFolders) {
        if (projectFolder.name.startsWith('.')) continue
        if (allowedFolderIds && !allowedFolderIds.includes(projectFolder.id)) continue

        try {
          const projectMetadata = await pockettStructure.readMetaFromFolder(adapter, connectionId, projectFolder.id)
          if (!projectMetadata || projectMetadata.type !== 'project') continue

          const project = await projectService.createProject(
            org.id,
            client.id,
            projectFolder.name,
            userId,
            ''
          )

          // Update Project with root folder and slug
          await (prisma as any).project.update({
            where: { id: project.id },
            data: {
              connectorRootFolderId: projectFolder.id,
              slug: (projectMetadata as any).slug || project.slug,
              sandboxOnly: (projectMetadata as any)?.sandboxOnly ?? false
            }
          })

          projectIds.push(project.id)

          try {
            await safeInngestSend('project.index.scan.requested', {
              organizationId: org.id,
              projectId: project.id,
              connectorId: connectionId,
              rootFolderIds: [projectFolder.id],
            })
          } catch (err) {
            logger.warn(`Failed indexing trigger for: ${project.slug}`, err as Error)
          }
        } catch (err) {
          logger.warn(`Failed to import project: ${projectFolder.name}`, err as Error)
        }
      }
    } catch (err) {
      logger.warn(`Failed to import client: ${clientFolder.name}`, err as Error)
    }
  }

  return {
    orgSlug: detectedOrg.slug,
    orgId: org.id,
    clientCount: createdClientCount,
    projectCount: projectIds.length,
    projectIds,
  }
}
