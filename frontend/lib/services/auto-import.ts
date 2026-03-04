import { IConnectorStorageAdapter, PockettMetaOrganization } from '@/lib/connectors/types'
import * as pockettStructure from '@/lib/connectors/pockett-structure.service'
import { safeInngestSend } from '@/lib/inngest/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { duplicateConnectorForOrganization } from '@/lib/services/connection-manager'
import { ensureProjectPersonasForProject } from '@/lib/actions/personas'

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
  parentFolderId: string, // Used for scoping if needed, or 'root'
  adapter: IConnectorStorageAdapter
): Promise<DetectedOrganization[]> {
  try {
    logger.info('Detecting organization hierarchy in Drive (Recursive)', { parentFolderId, connectionId })

    const detected: DetectedOrganization[] = []

    // 1. Search for all .pockett folders
    // We search for the folder name itself to find all pockett metadata roots globally
    const pockettFolders = await adapter.search(connectionId, "name = '.pockett' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")

    logger.info(`Found ${pockettFolders.length} .pockett metadata folders in Drive`)

    // 2. Identify Organization folders (those that have a meta.json with type: 'organization')
    for (const dotPockett of pockettFolders) {
      try {
        // The parent of .pockett is the actual Org/Client/Project folder
        const parentId = await adapter.getFileParent(connectionId, dotPockett.id)
        if (!parentId) continue

        // 2a. Verify ancestry: skip if this folder isn't inside the chosen parentFolderId
        if (parentFolderId && parentFolderId !== 'root') {
          let current: string | null = parentId
          let foundAncestor = false
          let depth = 0
          while (current && depth < 20) { // Safety limit for deep nesting
            if (current === parentFolderId) {
              foundAncestor = true
              break
            }
            current = await adapter.getFileParent(connectionId, current)
            depth++
          }
          if (!foundAncestor) {
            continue // Skip, it's outside our scoped tree
          }
        }

        const metadataRaw = await pockettStructure.readMetaFromFolder(adapter, connectionId, parentId)
        if (!metadataRaw || metadataRaw.type !== 'organization') {
          continue
        }

        const metadata = metadataRaw as unknown as PockettMetaOrganization

        // Check if this organization is already imported
        const existingOrg = await prisma.organization.findUnique({
          where: { slug: metadata.slug },
          select: { id: true },
        })

        // Detect Clients and Projects within this Org
        const clients: DetectedClient[] = []
        const clientFolders = await adapter.listFolderChildren(connectionId, parentId)

        for (const cf of clientFolders) {
          if (cf.name.startsWith('.')) continue

          const clientMeta = await pockettStructure.readMetaFromFolder(adapter, connectionId, cf.id)
          if (!clientMeta || clientMeta.type !== 'client') continue

          const clientSlug = (clientMeta as any).slug
          const existingClient = existingOrg ? await prisma.client.findFirst({
            where: { organizationId: existingOrg.id, slug: clientSlug },
            select: { id: true }
          }) : null

          // Detect Projects within this Client
          const projects: DetectedProject[] = []
          const projectFolders = await adapter.listFolderChildren(connectionId, cf.id)

          for (const pf of projectFolders) {
            if (pf.name.startsWith('.')) continue

            const projectMeta = await pockettStructure.readMetaFromFolder(adapter, connectionId, pf.id)
            if (!projectMeta || projectMeta.type !== 'project') continue

            const projectSlug = (projectMeta as any).slug
            const existingProject = existingClient ? await prisma.project.findFirst({
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
 * Creates DB records and triggers search indexing
 * Duplicates connection from source organization to each new organization
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
    logger.info('Importing selected organizations and structure', {
      totalSelected: selectedFolderIds.length,
      userId,
    })

    // Get all detected organizations
    const allDetected = await detectAllOrganizations(connectionId, parentFolderId, adapter)

    // Filter to organizations that were actually selected (top-level folders)
    const toImport = allDetected.filter(
      (org) => selectedFolderIds.includes(org.folderId) && !org.alreadyImported
    )

    // Import each organization, passing the full selection list for sub-filtering
    for (const org of toImport) {
      try {
        const result = await importOrganization(
          org,
          connectionId,
          adapter,
          userId,
          sourceOrgId,
          selectedFolderIds
        )
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
  try {
    const slug = detectedOrg.slug
    logger.info(`Importing organization: ${slug}`, { name: detectedOrg.name })

    // Get org_admin persona for RBAC
    const orgAdminPersona = await prisma.rbacPersona.findFirst({
      where: { slug: 'org_admin' }
    })

    // Create organization in DB
    const org = await prisma.organization.create({
      data: {
        name: detectedOrg.name,
        slug,
        sandboxOnly: (detectedOrg.metadata as any)?.sandboxOnly ?? false,
        settings: {},
      },
      include: {
        clients: true,
      },
    })

    // Create organization persona for RBAC if admin persona exists
    let orgPersonaId: string | undefined = undefined
    if (orgAdminPersona) {
      const orgPersona = await prisma.organizationPersona.create({
        data: {
          organizationId: org.id,
          rbacPersonaId: orgAdminPersona.id,
          displayName: 'Organization Owner'
        }
      })
      orgPersonaId = orgPersona.id
    }

    // Create member with organization persona
    await prisma.organizationMember.create({
      data: {
        userId,
        organizationId: org.id,
        organizationPersonaId: orgPersonaId,
        isDefault: false
      }
    })

    // --- SAVE ORGANIZATION FOLDER ID ---
    await prisma.orgConnectorSettings.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        connectorId: connectionId,
        orgFolderId: detectedOrg.folderId
      },
      update: {
        orgFolderId: detectedOrg.folderId,
        connectorId: connectionId
      }
    })
    // ------------------------------------

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

      // Filter by allowed folder IDs if provided
      if (allowedFolderIds && !allowedFolderIds.includes(clientFolder.id)) continue

      try {
        const clientMetadata = await pockettStructure.readMetaFromFolder(adapter, connectionId, clientFolder.id)
        if (!clientMetadata || clientMetadata.type !== 'client') continue

        const client = await prisma.client.create({
          data: {
            name: clientFolder.name,
            slug: (clientMetadata as any).slug || generateSlug(clientFolder.name),
            organizationId: org.id,
            sandboxOnly: (clientMetadata as any)?.sandboxOnly ?? false,
            settings: {
              ...(clientMetadata as any || {}),
              driveFolderId: clientFolder.id
            }
          }
        })
        createdClientCount++

        const projectFolders = await adapter.listFolderChildren(connectionId, clientFolder.id)
        for (const projectFolder of projectFolders) {
          if (projectFolder.name.startsWith('.')) continue

          // Filter by allowed folder IDs if provided
          if (allowedFolderIds && !allowedFolderIds.includes(projectFolder.id)) continue

          try {
            const projectMetadata = await pockettStructure.readMetaFromFolder(adapter, connectionId, projectFolder.id)
            if (!projectMetadata || projectMetadata.type !== 'project') continue

            const project = await prisma.project.create({
              data: {
                name: projectFolder.name,
                slug: (projectMetadata as any).slug || generateSlug(projectFolder.name),
                organizationId: org.id,
                clientId: client.id,
                connectorRootFolderId: projectFolder.id,
                sandboxOnly: (projectMetadata as any)?.sandboxOnly ?? false,
              },
            })

            // 1. Ensure project personas exist (replicated from RBAC)
            await ensureProjectPersonasForProject(project.id)

            // 2. Add user as Project Lead (proj_admin)
            const projAdminRbacPersona = await prisma.rbacPersona.findUnique({
              where: { slug: 'proj_admin' }
            })

            if (projAdminRbacPersona) {
              const projectLeadPersona = await prisma.projectPersona.findFirst({
                where: {
                  projectId: project.id,
                  rbacPersonaId: projAdminRbacPersona.id
                }
              })

              if (projectLeadPersona) {
                await prisma.projectMember.create({
                  data: {
                    projectId: project.id,
                    userId: userId,
                    personaId: projectLeadPersona.id
                  }
                })
              }
            }

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
      orgSlug: org.slug,
      orgId: org.id,
      clientCount: createdClientCount,
      projectCount: projectIds.length,
      projectIds,
    }
  } catch (error) {
    logger.error(`Error importing organization: ${detectedOrg.slug}`, error as Error)
    throw error
  }
}

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      // Add random suffix for uniqueness
      .concat('-', Math.random().toString(36).substring(2, 6))
  )
}
