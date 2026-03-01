import { IConnectorStorageAdapter, PockettMetaOrganization } from '@/lib/connectors/types'
import * as pockettStructure from '@/lib/connectors/pockett-structure.service'
import { safeInngestSend } from '@/lib/inngest/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { duplicateConnectorForOrganization } from '@/lib/services/connection-manager'

interface DetectedOrganization {
  folderId: string
  name: string
  slug: string
  metadata: PockettMetaOrganization
  hasMetaFile: boolean
  alreadyImported: boolean
}

interface ImportResult {
  orgSlug: string
  orgId: string
  clientCount: number
  projectCount: number
  projectIds: string[]
}

/**
 * Detect all organizations in Drive that haven't been imported yet
 */
export async function detectAllOrganizations(
  connectionId: string,
  parentFolderId: string,
  adapter: IConnectorStorageAdapter
): Promise<DetectedOrganization[]> {
  try {
    logger.info('Detecting organizations in Drive', { parentFolderId, connectionId })

    const detected: DetectedOrganization[] = []
    const orgFolders = await adapter.listFolderChildren(connectionId, parentFolderId)

    // Filter for folders that might be organizations
    const potentialOrgFolders = orgFolders.filter((f) => !f.name.startsWith('.'))

    for (const folder of potentialOrgFolders) {
      try {
        const children = await adapter.listFolderChildren(connectionId, folder.id)
        const metaFile = children.find((f) => f.name === 'meta.json')

        if (!metaFile) {
          continue // Skip folders without meta.json
        }

        // Try to read metadata
        let metadata: PockettMetaOrganization | null = null
        try {
          const metaContent = await adapter.readFileContent(connectionId, metaFile.id)
          if (metaContent) {
            const parsed = JSON.parse(metaContent)
            if (parsed.type === 'organization') {
              metadata = parsed
            }
          }
        } catch (err) {
          logger.warn(`Failed to parse metadata for folder: ${folder.name}`, err as Error)
          continue
        }

        if (!metadata) {
          continue
        }

        // Check if this organization is already imported
        const existing = await prisma.organization.findUnique({
          where: { slug: metadata.slug },
          select: { id: true },
        })

        detected.push({
          folderId: folder.id,
          name: folder.name,
          slug: metadata.slug,
          metadata,
          hasMetaFile: true,
          alreadyImported: !!existing,
        })

        logger.debug(`Found organization: ${metadata.slug}`, {
          name: folder.name,
          alreadyImported: !!existing,
        })
      } catch (err) {
        logger.warn(`Error processing folder: ${folder.name}`, err as Error)
        // Continue to next folder
      }
    }

    logger.info(`Detected ${detected.length} organizations`, {
      newOrgs: detected.filter((o) => !o.alreadyImported).length,
      existingOrgs: detected.filter((o) => o.alreadyImported).length,
    })

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
  selectedOrgFolderIds: string[],
  adapter: IConnectorStorageAdapter,
  userId: string,
  sourceOrgId?: string
): Promise<ImportResult[]> {
  const results: ImportResult[] = []

  try {
    logger.info('Importing selected organizations', {
      count: selectedOrgFolderIds.length,
      userId,
    })

    // Get all detected organizations
    const allDetected = await detectAllOrganizations(connectionId, parentFolderId, adapter)

    // Filter to selected organizations that aren't already imported
    const toImport = allDetected.filter(
      (org) =>
        selectedOrgFolderIds.includes(org.folderId) &&
        !org.alreadyImported
    )

    logger.debug(`Importing ${toImport.length} organizations`, {
      totalSelected: selectedOrgFolderIds.length,
    })

    // Import each organization
    for (const org of toImport) {
      try {
        const result = await importOrganization(
          org,
          connectionId,
          adapter,
          userId,
          sourceOrgId
        )
        results.push(result)
      } catch (err) {
        logger.error(`Failed to import organization: ${org.slug}`, err as Error)
        // Continue to next org
      }
    }

    logger.info('Organizations imported successfully', {
      count: results.length,
      totalProjects: results.reduce((sum, r) => sum + r.projectCount, 0),
    })

    return results
  } catch (error) {
    logger.error('Failed to import organizations', error as Error)
    throw error
  }
}

/**
 * Import a single organization and trigger search indexing
 * Optionally duplicates connection from source organization
 */
async function importOrganization(
  detectedOrg: DetectedOrganization,
  connectionId: string,
  adapter: IConnectorStorageAdapter,
  userId: string,
  sourceOrgId?: string
): Promise<ImportResult> {
  try {
    const slug = detectedOrg.slug
    logger.info(`Importing organization: ${slug}`, {
      name: detectedOrg.name,
    })

    // Create organization in DB
    const org = await prisma.organization.create({
      data: {
        name: detectedOrg.name,
        slug,
        sandboxOnly: (detectedOrg.metadata as any)?.sandboxOnly ?? false,
        settings: {
          onboarding: {
            currentStep: 3,
            isComplete: false,
          },
        },
        members: {
          create: {
            userId,
            isDefault: false,
          },
        },
      },
      include: {
        clients: {
          include: {
            projects: true,
          },
        },
      },
    })

    // Duplicate connection from source organization if provided
    if (sourceOrgId) {
      try {
        await duplicateConnectorForOrganization(sourceOrgId, org.id, prisma)
        logger.debug(`Connection duplicated for organization: ${slug}`)
      } catch (err) {
        logger.warn(`Failed to duplicate connection for organization: ${slug}`, err as Error)
        // Continue anyway - organization is created even if connection duplication fails
      }
    }

    // Get all subfolders (clients) in the organization folder
    const clientFolders = await adapter.listFolderChildren(connectionId, detectedOrg.folderId)
    const projectIds: string[] = []

    for (const clientFolder of clientFolders) {
      if (clientFolder.name.startsWith('.')) {
        continue // Skip .pockett folder
      }

      try {
        // Check if this has client metadata
        const clientChildren = await adapter.listFolderChildren(connectionId, clientFolder.id)
        const clientMeta = clientChildren.find((f) => f.name === 'meta.json')

        if (!clientMeta) {
          continue
        }

        const clientMetaContent = await adapter.readFileContent(connectionId, clientMeta.id)
        if (!clientMetaContent) {
          continue
        }

        const clientMetadata = JSON.parse(clientMetaContent)
        if (clientMetadata.type !== 'client') {
          continue
        }

        // Create client in DB
        const client = await prisma.client.create({
          data: {
            name: clientFolder.name,
            slug: clientMetadata.slug || generateSlug(clientFolder.name),
            organizationId: org.id,
            sandboxOnly: (clientMetadata as any)?.sandboxOnly ?? false,
          },
          include: {
            projects: true,
          },
        })

        // Get all projects in the client folder
        const projectFolders = await adapter.listFolderChildren(connectionId, clientFolder.id)

        for (const projectFolder of projectFolders) {
          if (projectFolder.name.startsWith('.')) {
            continue
          }

          try {
            const projectChildren = await adapter.listFolderChildren(connectionId, projectFolder.id)
            const projectMeta = projectChildren.find((f) => f.name === 'meta.json')

            if (!projectMeta) {
              continue
            }

            const projectMetaContent = await adapter.readFileContent(connectionId, projectMeta.id)
            if (!projectMetaContent) {
              continue
            }

            const projectMetadata = JSON.parse(projectMetaContent)
            if (projectMetadata.type !== 'project') {
              continue
            }

            // Create project in DB
            const project = await prisma.project.create({
              data: {
                name: projectFolder.name,
                slug: projectMetadata.slug || generateSlug(projectFolder.name),
                organizationId: org.id,
                clientId: client.id,
                connectorRootFolderId: projectFolder.id,
                sandboxOnly: (projectMetadata as any)?.sandboxOnly ?? false,
              },
            })

            projectIds.push(project.id)

            // Trigger search indexing for this project
            try {
              await safeInngestSend('project.index.scan.requested', {
                organizationId: org.id,
                projectId: project.id,
                connectorId: connectionId,
                rootFolderIds: [projectFolder.id],
              })
              logger.debug(`Triggered indexing for project: ${project.slug}`)
            } catch (err) {
              logger.warn(`Failed to trigger indexing for project: ${project.slug}`, err as Error)
            }
          } catch (err) {
            logger.warn(`Failed to import project: ${projectFolder.name}`, err as Error)
          }
        }

        logger.debug(`Imported client: ${client.slug}`, {
          projectCount: projectIds.length,
        })
      } catch (err) {
        logger.warn(`Failed to import client: ${clientFolder.name}`, err as Error)
      }
    }

    logger.info(`Imported organization: ${slug}`, {
      clientCount: org.clients.length,
      projectCount: projectIds.length,
    })

    return {
      orgSlug: org.slug,
      orgId: org.id,
      clientCount: org.clients.length,
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
