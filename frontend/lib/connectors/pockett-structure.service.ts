/**
 * Shared Pockett folder structure logic: detect, setup, import, ensure.
 * Uses a storage adapter (Google Drive, Dropbox, OneDrive) and Prisma; does not create connector records for new orgs.
 */

import { prisma } from '@/lib/prisma'
import { ConnectorType } from '@prisma/client'
import { logger } from '@/lib/logger'
import type { IConnectorStorageAdapter } from './types'
import { POCKETT_DOT_FOLDER, POCKETT_META_FILE } from './types'

export const FOLDERS = {
  GENERAL: { name: 'General', type: 'general' },
  CONFIDENTIAL: { name: 'Confidential', type: 'confidential' },
  STAGING: { name: 'Staging', type: 'staging' }
} as const

// ---------------------------------------------------------------------------
// Meta helpers (storage-agnostic)
// ---------------------------------------------------------------------------

export async function readMetaFromFolder(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  folderId: string
): Promise<Record<string, unknown> | null> {
  const children = await adapter.listFolderChildren(connectionId, folderId)
  const dotPockett = children.find((f) => f.name === POCKETT_DOT_FOLDER)
  if (!dotPockett) return null
  const inner = await adapter.listFolderChildren(connectionId, dotPockett.id)
  const metaFile = inner.find((f) => f.name === POCKETT_META_FILE)
  if (!metaFile) return null
  const content = await adapter.readFileContent(connectionId, metaFile.id)
  if (!content) return null
  try {
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return null
  }
}

async function writeMetaInFolder(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  parentFolderId: string,
  meta: Record<string, unknown>
): Promise<void> {
  const dotPockettId = await adapter.findOrCreateFolder(connectionId, parentFolderId, POCKETT_DOT_FOLDER)
  await adapter.writeFile(connectionId, dotPockettId, POCKETT_META_FILE, JSON.stringify(meta))
}

/**
 * Ensure the standard .pockett folder with meta.json (type: root) exists inside the given root folder.
 * Used when creating the default workspace root (_Pockett_Workspace_) so the structure is consistent.
 */
export async function ensureRootMetaInFolder(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  rootFolderId: string
): Promise<void> {
  await writeMetaInFolder(adapter, connectionId, rootFolderId, { type: 'root', version: 1 })
}

function restrictIfSupported(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  folderId: string,
  logLabel: string
): Promise<void> {
  if (adapter.restrictFolderToOwnerOnly) {
    return adapter.restrictFolderToOwnerOnly(connectionId, folderId).then(() => {
      logger.info(logLabel, 'PockettStructure', { folderId, connectionId })
    })
  }
  return Promise.resolve()
}

// ---------------------------------------------------------------------------
// Collision Detection Helper
// ---------------------------------------------------------------------------

/**
 * Determine the actual folder name to use for org folder.
 * If orgName collides with an existing folder in parentFolder, use slug instead.
 * Returns { folderName, collision } for audit trail.
 */
export async function getOrgFolderName(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  parentFolderId: string,
  orgName: string,
  orgSlug: string
): Promise<{ folderName: string; collision: boolean }> {
  try {
    const children = await adapter.listFolderChildren(connectionId, parentFolderId)
    const nameExists = children.some((f) => f.name === orgName)

    if (nameExists) {
      logger.warn(`Folder name collision detected: '${orgName}' already exists. Using slug: '${orgSlug}'`, 'PockettStructure', { parentFolderId, connectionId })
      return { folderName: orgSlug, collision: true }
    }

    return { folderName: orgName, collision: false }
  } catch (e) {
    logger.error(`Error checking folder collision: ${e instanceof Error ? e.message : String(e)}`, e instanceof Error ? e : new Error(String(e)))
    // On error, default to name (safer than forcing slug)
    return { folderName: orgName, collision: false }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DetectResult {
  detected: boolean
  importRootFolderId?: string
}

/**
 * Detect if the selected folder already contains a Pockett structure.
 */
export async function detectExistingStructure(
  connectionId: string,
  parentFolderId: string,
  adapter: IConnectorStorageAdapter
): Promise<DetectResult> {
  const children = await adapter.listFolderChildren(connectionId, parentFolderId)
  const dotPockett = children.find((f) => f.name === POCKETT_DOT_FOLDER)
  if (!dotPockett) return { detected: false }

  const meta = await readMetaFromFolder(adapter, connectionId, parentFolderId)
  if (!meta) return { detected: false }

  if (meta.type === 'root') {
    return { detected: true, importRootFolderId: parentFolderId }
  }
  if (meta.type === 'organization') {
    const parentId = await adapter.getFileParent(connectionId, parentFolderId)
    if (parentId) return { detected: true, importRootFolderId: parentId }
  }

  const otherFolders = children.filter((f) => f.name !== POCKETT_DOT_FOLDER)
  const childMetas = await Promise.all(
    otherFolders.map((folder) => readMetaFromFolder(adapter, connectionId, folder.id))
  )
  if (childMetas.some((m) => m?.type === 'organization')) {
    return { detected: true, importRootFolderId: parentFolderId }
  }
  return { detected: false }
}

export interface SetupOrgFolderResult {
  rootId: string
  orgId: string
}

/**
 * CLEAN onboarding: create root .pockett (meta root) and org folder with .pockett (meta organization).
 * Uses slug-based naming if org name collides with existing folder.
 */
export async function setupOrgFolder(
  connectionId: string,
  parentFolderId: string,
  adapter: IConnectorStorageAdapter,
  organizationId: string,
  options?: { userId?: string }
): Promise<SetupOrgFolderResult> {
  const connector = await prisma.connector.findUnique({
    where: { id: connectionId }
  })
  if (!connector) throw new Error('Connection not found')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId }
  })
  if (!org) throw new Error(`Organization ${organizationId} not found`)

  const rootFolderId = await adapter.findOrCreateFolder(connectionId, parentFolderId, POCKETT_DOT_FOLDER)
  await writeMetaInFolder(adapter, connectionId, parentFolderId, { type: 'root', version: 1 })
  await restrictIfSupported(adapter, connectionId, rootFolderId, 'Restricted .pockett folder to owner-only')

  // Check for folder name collision and use slug as fallback
  const { folderName, collision } = await getOrgFolderName(
    adapter,
    connectionId,
    parentFolderId,
    org.name,
    org.slug
  )

  const orgFolderId = await adapter.findOrCreateFolder(connectionId, parentFolderId, folderName)
  const isDefault = options?.userId
    ? !!(await (prisma as any).orgMember.findFirst({
      where: { organizationId: org.id, userId: options.userId },
    }))?.isDefault
    : false

  // Update the Organization record immediately with the newly created folder ID
  await prisma.organization.update({
    where: { id: org.id },
    data: { orgFolderId: orgFolderId }
  })

  // Store both original name and actual folder name for audit trail
  await writeMetaInFolder(adapter, connectionId, orgFolderId, {
    type: 'organization',
    slug: org.slug,
    originalName: org.name,
    folderName: folderName,
    collision: collision,
    isDefault,
    sandboxOnly: (org as any).sandboxOnly === true
  })
  await restrictIfSupported(adapter, connectionId, orgFolderId, 'Restricted organization folder to owner-only')

  const settings = (connector.settings as any) || {}
  const organizations = settings.organizations || {}

  await prisma.connector.update({
    where: { id: connectionId },
    data: {
      settings: {
        ...settings,
        rootFolderId,
        parentFolderId,
        // Flat orgFolderId so getProjectFolderIds can resolve client/project folders
        // without needing a project to be created first (fixes Files tab for fresh custom orgs)
        orgFolderId,
        organizations: {
          ...organizations,
          [org.id]: {
            ...(organizations[org.id] || {}),
            orgFolderId
          }
        }
      }
    }
  })

  return { rootId: rootFolderId, orgId: orgFolderId }
}

export type OnCreateConnectorForOrg = (orgId: string) => Promise<void>

export interface ImportStructureResult {
  rootId: string
  orgId: string
  slug: string
}

/**
 * IMPORT: Scan folder structure, create missing orgs/clients/projects in DB, update connector settings.
 * Caller must create connector records for newly created orgs via onCreateConnectorForOrg(orgId).
 */
export async function importStructureFromDrive(
  connectionId: string,
  parentFolderId: string,
  userId: string,
  stepOneOrgSlug: string | null,
  connectorType: ConnectorType,
  adapter: IConnectorStorageAdapter,
  onCreateConnectorForOrg: OnCreateConnectorForOrg
): Promise<ImportStructureResult> {
  const connector = await prisma.connector.findUnique({
    where: { id: connectionId }
  })
  if (!connector) throw new Error('Connection not found')

  const children = await adapter.listFolderChildren(connectionId, parentFolderId)
  const dotPockett = children.find((f) => f.name === POCKETT_DOT_FOLDER)
  if (!dotPockett) throw new Error('No .pockett folder found')
  const rootFolderId = dotPockett.id
  const orgFolders = children.filter((f) => f.name !== POCKETT_DOT_FOLDER)
  let firstOrgSlug: string | null = null
  let stepOneOrgFolderId: string | null = null
  /** When we update step-one org slug to Drive meta, return this so redirect uses the new URL */
  let effectiveStepOneSlug: string | null = null

  const orgAdminPersona = await (prisma as any).persona.findUnique({ where: { slug: 'org_admin' } })
  if (!orgAdminPersona) throw new Error('System Error: org_admin persona not found')

  let stepOneOrg: { id: string; name: string; slug: string } | null = null
  if (stepOneOrgSlug) {
    stepOneOrg = await prisma.organization.findUnique({
      where: { slug: stepOneOrgSlug },
      select: { id: true, name: true, slug: true }
    })
  }

  for (const orgFolder of orgFolders) {
    const orgChildren = await adapter.listFolderChildren(connectionId, orgFolder.id)
    const orgDotPockett = orgChildren.find((f) => f.name === POCKETT_DOT_FOLDER)
    if (!orgDotPockett) continue
    const orgMeta = await readMetaFromFolder(adapter, connectionId, orgFolder.id)
    if (!orgMeta || orgMeta.type !== 'organization' || typeof orgMeta.slug !== 'string') continue

    // Skip sandbox orgs from the import lists (UX Polish)
    if (orgMeta.sandboxOnly === true) continue

    const slug = orgMeta.slug as string
    const isDefault = orgMeta.isDefault === true

    // Check for folder name collision (log for audit trail)
    const { collision } = await getOrgFolderName(
      adapter,
      connectionId,
      parentFolderId,
      orgFolder.name,
      slug
    )
    let org = await prisma.organization.findUnique({ where: { slug } })
    let conn: { id: string; settings: unknown } | null = null

    if (org) {
      // Get the connector that's assigned to this organization
      if (org.connectorId) {
        conn = await prisma.connector.findFirst({
          where: { id: org.connectorId, type: connectorType }
        })
      }
    } else if (stepOneOrg && stepOneOrg.name === orgFolder.name) {
      const stepOneOrgRecord = await prisma.organization.findUnique({ where: { id: stepOneOrg.id } })
      if (!stepOneOrgRecord) continue
      org = stepOneOrgRecord
      conn = await prisma.connector.findFirst({
        where: { id: connectionId }
      })
      stepOneOrgFolderId = orgFolder.id
      // Reimport: reuse org slug from Drive meta so URLs like /d/o/pockett-1mpm/... resolve
      if (slug !== org.slug) {
        const taken = await prisma.organization.findUnique({ where: { slug }, select: { id: true } })
        if (!taken) {
          await prisma.organization.update({ where: { id: org.id }, data: { slug } })
          org = { ...org, slug }
          effectiveStepOneSlug = slug
        }
      } else {
        effectiveStepOneSlug = slug
      }
    } else {
      try {
        org = await prisma.organization.create({
          data: {
            name: orgFolder.name,
            slug,
            settings: {}
          }
        })
      } catch (e: unknown) {
        const err = e as { code?: string }
        if (err?.code === 'P2002') org = await prisma.organization.findUnique({ where: { slug } })
        else throw e
      }
      if (!org) throw new Error('Failed to create or find organization')

      // Update organization folder ID column (Parity)
      await prisma.organization.update({
        where: { id: org.id },
        data: { orgFolderId: orgFolder.id }
      })

      await (prisma as any).orgMember.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'org_admin',
          membershipType: 'internal',
          isDefault
        }
      })
      await onCreateConnectorForOrg(org.id)
      // After creating a connector for the org, find it
      const updatedOrg = await prisma.organization.findUnique({ where: { id: org.id } })
      if (updatedOrg?.connectorId) {
        conn = await prisma.connector.findFirst({
          where: { id: updatedOrg.connectorId, type: connectorType }
        })
      }
      if (!firstOrgSlug) firstOrgSlug = org.slug
    }

    if (org && org.slug === stepOneOrgSlug) stepOneOrgFolderId = orgFolder.id

    const settings: Record<string, unknown> = {
      rootFolderId,
      orgFolderId: orgFolder.id,
      parentFolderId
    }
    const clientFolderIds: Record<string, string> = {}
    const projectFolderIds: Record<string, string> = {}
    const projectFolderSettings: Record<string, { generalFolderId?: string; confidentialFolderId?: string; stagingFolderId?: string }> = {}
    const clientChildren = await adapter.listFolderChildren(connectionId, orgFolder.id)
    for (const clientFolder of clientChildren.filter((f) => f.name !== POCKETT_DOT_FOLDER)) {
      const clientMeta = await readMetaFromFolder(adapter, connectionId, clientFolder.id)
      if (!clientMeta || clientMeta.type !== 'client' || typeof clientMeta.slug !== 'string') continue
      const clientSlug = clientMeta.slug as string
      let client = await prisma.client.findFirst({
        where: { organizationId: org!.id, slug: clientSlug }
      })
      if (!client) {
        const { generateClientSlug } = await import('@/lib/slug-utils')
        // Reimport: prefer existing slug from Drive meta so DB matches structure
        let cSlug = clientSlug
        let attempts = 0
        while (attempts < 10) {
          const exists = await prisma.client.findUnique({
            where: { organizationId_slug: { organizationId: org!.id, slug: cSlug } }
          })
          if (!exists) break
          cSlug = generateClientSlug(clientFolder.name)
          attempts++
        }
        client = await prisma.client.create({
          data: { organizationId: org!.id, name: clientFolder.name, slug: cSlug, driveFolderId: clientFolder.id }
        })
        // Create ClientMember for the importing user so they can see this client
        const projAdminPersona = await (prisma as any).persona.findUnique({ where: { slug: 'proj_admin' } })
        if (projAdminPersona) {
          await (prisma as any).clientMember.create({
            data: { clientId: client.id, userId, personaId: projAdminPersona.id }
          })
          const orgAdminMember = await (prisma as any).orgMember.findFirst({
            where: { organizationId: org!.id, role: 'org_admin' }
          })
          if (orgAdminMember && orgAdminMember.userId !== userId) {
            await (prisma as any).clientMember.create({
              data: { clientId: client.id, userId: orgAdminMember.userId, personaId: projAdminPersona.id }
            })
          }
        }
      } else if (client && (client.driveFolderId !== clientFolder.id)) {
        // Sync column if missing or mismatched
        await prisma.client.update({
          where: { id: client.id },
          data: { driveFolderId: clientFolder.id }
        })
      }
      clientFolderIds[client.slug] = clientFolder.id
      const projectChildren = await adapter.listFolderChildren(connectionId, clientFolder.id)
      for (const projectFolder of projectChildren.filter((f) => f.name !== POCKETT_DOT_FOLDER)) {
        const projectMeta = await readMetaFromFolder(adapter, connectionId, projectFolder.id)
        const projectSlugFromMeta = projectMeta?.type === 'project' && typeof projectMeta.slug === 'string' ? (projectMeta.slug as string) : null
        let project = projectSlugFromMeta
          ? await prisma.project.findFirst({ where: { clientId: client!.id, slug: projectSlugFromMeta } })
          : null
        if (!project) {
          project = await prisma.project.findFirst({ where: { clientId: client!.id, name: projectFolder.name } })
        }
        if (!project && projectSlugFromMeta) {
          const { ensureProjectPersonasForProject } = await import('@/lib/actions/personas')
          const { generateProjectSlug } = await import('@/lib/slug-utils')
          // Reimport: prefer existing slug from Drive meta so DB matches structure
          let pSlug = projectSlugFromMeta
          let attempts = 0
          while (attempts < 10) {
            const exists = await prisma.project.findUnique({
              where: { clientId_slug: { clientId: client!.id, slug: pSlug } }
            })
            if (!exists) break
            pSlug = generateProjectSlug(projectFolder.name)
            attempts++
          }
          project = await prisma.project.create({
            data: {
              organizationId: org!.id,
              clientId: client!.id,
              name: projectFolder.name,
              slug: pSlug,
              connectorRootFolderId: projectFolder.id // Sync column (Parity)
            }
          })
          await ensureProjectPersonasForProject(project.id)
          await (prisma as any).projectMember.create({
            data: { projectId: project.id, userId, role: 'proj_admin' }
          })
          const orgAdmin = await (prisma as any).orgMember.findFirst({
            where: { organizationId: org!.id, role: 'org_admin' }
          })
          if (orgAdmin && orgAdmin.userId !== userId) {
            await (prisma as any).projectMember.create({
              data: { projectId: project.id, userId: orgAdmin.userId, role: 'proj_admin' }
            })
          }
        } else if (project && (project.connectorRootFolderId !== projectFolder.id)) {
          // Sync column if missing or mismatched
          await prisma.project.update({
            where: { id: project.id },
            data: { connectorRootFolderId: projectFolder.id }
          })
        }
        if (!project) continue
        projectFolderIds[project.slug] = projectFolder.id
        const docChildren = await adapter.listFolderChildren(connectionId, projectFolder.id)
        let generalId: string | undefined
        let confidentialId: string | undefined
        let stagingId: string | undefined
        for (const doc of docChildren.filter((f) => f.name !== POCKETT_DOT_FOLDER)) {
          const docMeta = await readMetaFromFolder(adapter, connectionId, doc.id)
          const nameLower = doc.name.toLowerCase()
          if (docMeta?.type === 'document' && docMeta.folderType) {
            if (docMeta.folderType === 'general') generalId = doc.id
            else if (docMeta.folderType === 'confidential') confidentialId = doc.id
            else if (docMeta.folderType === 'staging') stagingId = doc.id
          } else if (!generalId && nameLower === 'general') {
            generalId = doc.id
          } else if (!confidentialId && nameLower === 'confidential') {
            confidentialId = doc.id
          } else if (!stagingId && nameLower === 'staging') {
            stagingId = doc.id
          }
        }
        projectFolderSettings[project!.slug] = { generalFolderId: generalId, confidentialFolderId: confidentialId, stagingFolderId: stagingId }
      }
    }
    settings.clientFolderIds = clientFolderIds
    settings.projectFolderIds = projectFolderIds
    settings.projectFolderSettings = projectFolderSettings
    if (conn) {
      await prisma.connector.update({
        where: { id: conn.id },
        data: { settings: { ...((conn.settings as object) || {}), ...settings } }
      })
    }
  }

  if (stepOneOrgSlug && stepOneOrgFolderId) {
    await prisma.connector.update({
      where: { id: connectionId },
      data: {
        settings: {
          ...((connector.settings as object) || {}),
          rootFolderId,
          orgFolderId: stepOneOrgFolderId,
          parentFolderId
        }
      }
    })
  }

  const slug = effectiveStepOneSlug ?? stepOneOrgSlug ?? firstOrgSlug ?? ''
  const orgId = stepOneOrgFolderId ?? orgFolders[0]?.id ?? rootFolderId
  return { rootId: rootFolderId, orgId, slug }
}

export interface ProjectFolderStructure {
  rootId: string
  orgId: string
  clientId: string
  projectId?: string
  generalFolderId?: string
  confidentialFolderId?: string
  stagingFolderId?: string
}

/**
 * Ensure client (and optionally project + document folders) exist under the org folder; update connector settings and connectorLinkedFile.
 */
export async function ensureAppFolderStructure(
  connectorId: string,
  clientName: string,
  clientSlug: string,
  adapter: IConnectorStorageAdapter,
  organizationId: string,
  projectInfo?: { projectName: string; projectSlug: string }
): Promise<ProjectFolderStructure> {
  const connector = await prisma.connector.findUnique({
    where: { id: connectorId }
  })
  if (!connector) throw new Error('Connector not found')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId }
  })
  if (!org) throw new Error(`Organization ${organizationId} not found`)

  const settings = (connector.settings as any) || {}
  const orgSettings = settings.organizations?.[org.id] || {}
  let rootFolderId = settings.rootFolderId as string | undefined
  let orgFolderId = org.orgFolderId || orgSettings.orgFolderId
  let clientFolderId = orgSettings.clientFolderIds?.[clientSlug]
  const projectName = projectInfo?.projectName
  const projectSlug = projectInfo?.projectSlug
  let projectFolderId = projectSlug ? orgSettings.projectFolderIds?.[projectSlug] : undefined

  if (!rootFolderId || !orgFolderId) {
    if (org?.orgFolderId) {
      orgFolderId = org.orgFolderId
      logger.info('Recovered orgFolderId from database fallback', { orgFolderId, organizationId: org.id })
    } else {
      throw new Error('Organization folder not configured; complete Drive setup first.')
    }
  }

  const projectFolderSettings = orgSettings.projectFolderSettings || {}

  if (!clientFolderId && clientName) {
    clientFolderId = await adapter.findOrCreateFolder(connectorId, orgFolderId, clientName)
    await writeMetaInFolder(adapter, connectorId, clientFolderId, { type: 'client', slug: clientSlug })
    await restrictIfSupported(adapter, connectorId, clientFolderId, 'Restricted client folder to owner-only')
  } else if (clientFolderId) {
    const exists = await adapter.fileExists(connectorId, clientFolderId)
    if (!exists) {
      clientFolderId = await adapter.findOrCreateFolder(connectorId, orgFolderId, clientName)
      await writeMetaInFolder(adapter, connectorId, clientFolderId, { type: 'client', slug: clientSlug })
      await restrictIfSupported(adapter, connectorId, clientFolderId, 'Restricted client folder to owner-only')
    } else {
      await restrictIfSupported(adapter, connectorId, clientFolderId, 'Restricted client folder to owner-only')
    }
  }

  // Update Client record with driveFolderId if we have a match
  if (org && clientFolderId) {
    const client = await (prisma as any).client.findFirst({
      where: { organizationId: org.id, slug: clientSlug }
    })
    if (client) {
      await (prisma as any).client.update({
        where: { id: client.id },
        data: {
          driveFolderId: clientFolderId,
          settings: {
            ...(client.settings as any || {}),
            driveFolderId: clientFolderId
          }
        }
      })
    }
  }

  let generalFolderId: string | undefined
  let confidentialFolderId: string | undefined
  let stagingFolderId: string | undefined
  let projectSubfolders: { generalFolderId?: string; confidentialFolderId?: string; stagingFolderId?: string } | undefined

  if (projectName && projectSlug && clientFolderId) {
    if (!projectFolderId) {
      projectFolderId = await adapter.findOrCreateFolder(connectorId, clientFolderId, projectName)
      await writeMetaInFolder(adapter, connectorId, projectFolderId, { type: 'project', slug: projectSlug })
      await restrictIfSupported(adapter, connectorId, projectFolderId, 'Restricted project folder to owner-only')
    } else {
      const exists = await adapter.fileExists(connectorId, projectFolderId)
      if (!exists) {
        projectFolderId = await adapter.findOrCreateFolder(connectorId, clientFolderId, projectName)
        await writeMetaInFolder(adapter, connectorId, projectFolderId, { type: 'project', slug: projectSlug })
        await restrictIfSupported(adapter, connectorId, projectFolderId, 'Restricted project folder to owner-only')
      } else {
        await restrictIfSupported(adapter, connectorId, projectFolderId, 'Restricted project folder to owner-only')
      }
    }

    // Update Project record with connectorRootFolderId
    if (org && projectFolderId) {
      const project = await (prisma as any).project.findFirst({
        where: { organizationId: org.id, slug: projectSlug }
      })
      if (project) {
        await (prisma as any).project.update({
          where: { id: project.id },
          data: { connectorRootFolderId: projectFolderId }
        })
      }
    }

    if (projectFolderId && projectSlug) {
      const currentProjectSettings = projectFolderSettings[projectSlug] || {}
      generalFolderId = currentProjectSettings.generalFolderId
      confidentialFolderId = currentProjectSettings.confidentialFolderId
      stagingFolderId = currentProjectSettings.stagingFolderId

      const ensureDocumentFolder = async (
        config: typeof FOLDERS[keyof typeof FOLDERS],
        currentId: string | undefined
      ): Promise<string> => {
        let id = currentId
        const name = config.name
        const folderType = config.type

        if (!id) {
          id = await adapter.findOrCreateFolder(connectorId, projectFolderId!, name)
          await writeMetaInFolder(adapter, connectorId, id, { type: 'document', folderType })
          if (folderType !== 'general') {
            await restrictIfSupported(adapter, connectorId, id, `Created ${name} folder`)
          } else {
            logger.info(`Created ${name} folder`, 'PockettStructure', { id, projectFolderId, connectorId })
          }
        } else {
          const exists = await adapter.fileExists(connectorId, id)
          if (!exists) {
            id = await adapter.findOrCreateFolder(connectorId, projectFolderId!, name)
            await writeMetaInFolder(adapter, connectorId, id, { type: 'document', folderType })
            if (folderType !== 'general') await restrictIfSupported(adapter, connectorId, id, `Created ${name} folder`)
            else logger.info(`Created ${name} folder`, 'PockettStructure', { id, projectFolderId, connectorId })
          } else if (folderType !== 'general') {
            await restrictIfSupported(adapter, connectorId, id, `Restricted ${name} folder`)
          }
        }
        return id
      }

      ;[generalFolderId, confidentialFolderId, stagingFolderId] = await Promise.all([
        ensureDocumentFolder(FOLDERS.GENERAL, generalFolderId),
        ensureDocumentFolder(FOLDERS.CONFIDENTIAL, confidentialFolderId),
        ensureDocumentFolder(FOLDERS.STAGING, stagingFolderId),
      ])

      projectSubfolders = { generalFolderId, confidentialFolderId, stagingFolderId }
    }
  }

  // Update connector settings registry with isolated org settings
  const updatedSettings = (connector.settings as any) || {}
  const updatedOrgs = updatedSettings.organizations || {}

  const currentOrgSettings = {
    ...orgSettings,
    orgFolderId,
    clientFolderIds: {
      ...(orgSettings.clientFolderIds || {}),
      [clientSlug]: clientFolderId
    },
    projectFolderIds: projectInfo ? {
      ...(orgSettings.projectFolderIds || {}),
      [projectInfo.projectSlug]: projectFolderId
    } : (orgSettings.projectFolderIds || {}),
    projectFolderSettings: projectInfo && projectSubfolders ? {
      ...(orgSettings.projectFolderSettings || {}),
      [projectInfo.projectSlug]: projectSubfolders
    } : (orgSettings.projectFolderSettings || {})
  }

  await prisma.connector.update({
    where: { id: connectorId },
    data: {
      settings: {
        ...updatedSettings,
        organizations: {
          ...updatedOrgs,
          [org.id]: currentOrgSettings
        }
      }
    }
  })

  return { rootId: rootFolderId || '', orgId: orgFolderId, clientId: clientFolderId, projectId: projectFolderId, generalFolderId, confidentialFolderId, stagingFolderId }
}
