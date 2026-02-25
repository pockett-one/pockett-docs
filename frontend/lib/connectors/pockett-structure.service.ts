/**
 * Shared Pockett folder structure logic: detect, setup, import, ensure.
 * Uses a storage adapter (Google Drive, Dropbox, OneDrive) and Prisma; does not create connector records for new orgs.
 */

import { prisma } from '@/lib/prisma'
import { ConnectorType } from '@prisma/client'
import { logger } from '@/lib/logger'
import type { IConnectorStorageAdapter } from './types'
import { POCKETT_DOT_FOLDER, POCKETT_META_FILE } from './types'

// ---------------------------------------------------------------------------
// Meta helpers (storage-agnostic)
// ---------------------------------------------------------------------------

async function readMetaFromFolder(
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
  for (const folder of otherFolders) {
    const childMeta = await readMetaFromFolder(adapter, connectionId, folder.id)
    if (childMeta?.type === 'organization') {
      return { detected: true, importRootFolderId: parentFolderId }
    }
  }
  return { detected: false }
}

export interface SetupOrgFolderResult {
  rootId: string
  orgId: string
}

/**
 * CLEAN onboarding: create root .pockett (meta root) and org folder with .pockett (meta organization).
 */
export async function setupOrgFolder(
  connectionId: string,
  parentFolderId: string,
  adapter: IConnectorStorageAdapter,
  options?: { userId?: string }
): Promise<SetupOrgFolderResult> {
  const connector = await prisma.connector.findUnique({
    where: { id: connectionId },
    include: { organization: true }
  })
  if (!connector) throw new Error('Connection not found')

  const rootFolderId = await adapter.findOrCreateFolder(connectionId, parentFolderId, POCKETT_DOT_FOLDER)
  await writeMetaInFolder(adapter, connectionId, parentFolderId, { type: 'root', version: 1 })
  await restrictIfSupported(adapter, connectionId, rootFolderId, 'Restricted .pockett folder to owner-only')

  const orgFolderId = await adapter.findOrCreateFolder(connectionId, parentFolderId, connector.organization.name)
  const isDefault = options?.userId
    ? !!(await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: connector.organizationId, userId: options.userId } },
      select: { isDefault: true }
    }))?.isDefault
    : false
  await writeMetaInFolder(adapter, connectionId, orgFolderId, {
    type: 'organization',
    slug: connector.organization.slug,
    isDefault
  })
  await restrictIfSupported(adapter, connectionId, orgFolderId, 'Restricted organization folder to owner-only')

  const settings = (connector.settings as Record<string, unknown>) || {}
  await prisma.connector.update({
    where: { id: connectionId },
    data: {
      settings: {
        ...settings,
        rootFolderId,
        orgFolderId,
        parentFolderId
      }
    }
  })

  await prisma.connectorLinkedFile.upsert({
    where: { connectorId_fileId: { connectorId: connectionId, fileId: parentFolderId } },
    update: { isGrantRevoked: false, linkedAt: new Date(), metadata: { description: 'User Selected Root' } },
    create: { connectorId: connectionId, fileId: parentFolderId, isGrantRevoked: false, metadata: { description: 'User Selected Root' } }
  })
  await prisma.connectorLinkedFile.upsert({
    where: { connectorId_fileId: { connectorId: connectionId, fileId: rootFolderId } },
    update: { isGrantRevoked: false, linkedAt: new Date(), metadata: { description: 'System Root', type: 'root' } },
    create: { connectorId: connectionId, fileId: rootFolderId, isGrantRevoked: false, metadata: { description: 'System Root', type: 'root' } }
  })
  await prisma.connectorLinkedFile.upsert({
    where: { connectorId_fileId: { connectorId: connectionId, fileId: orgFolderId } },
    update: { isGrantRevoked: false, linkedAt: new Date(), metadata: { description: 'Organization', type: 'organization', slug: connector.organization.slug } },
    create: { connectorId: connectionId, fileId: orgFolderId, isGrantRevoked: false, metadata: { description: 'Organization', type: 'organization', slug: connector.organization.slug } }
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
    where: { id: connectionId },
    include: { organization: true }
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

  const orgOwnerPersona = await prisma.rbacPersona.findFirst({ where: { slug: 'org_admin' } })
  if (!orgOwnerPersona) throw new Error('System Error: org_admin persona not found')

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
    const slug = orgMeta.slug as string
    const isDefault = orgMeta.isDefault === true
    let org = await prisma.organization.findUnique({ where: { slug } })
    let conn: { id: string; settings: unknown } | null = null

    if (org) {
      conn = await prisma.connector.findFirst({
        where: { organizationId: org.id, type: connectorType }
      })
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
            settings: { onboarding: { currentStep: 4, isComplete: true, lastUpdated: new Date().toISOString() } }
          }
        })
      } catch (e: unknown) {
        const err = e as { code?: string }
        if (err?.code === 'P2002') org = await prisma.organization.findUnique({ where: { slug } })
        else throw e
      }
      if (!org) throw new Error('Failed to create or find organization')
      let orgPersona = await prisma.organizationPersona.findFirst({
        where: { organizationId: org.id, rbacPersonaId: orgOwnerPersona.id }
      })
      if (!orgPersona) {
        orgPersona = await prisma.organizationPersona.create({
          data: {
            organizationId: org.id,
            rbacPersonaId: orgOwnerPersona.id,
            displayName: 'Organization Owner'
          }
        })
      }
      await prisma.organizationMember.create({
        data: {
          userId,
          organizationId: org.id,
          organizationPersonaId: orgPersona.id,
          isDefault
        }
      })
      await onCreateConnectorForOrg(org.id)
      conn = await prisma.connector.findFirst({
        where: { organizationId: org.id, type: connectorType }
      })
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
          data: { organizationId: org!.id, name: clientFolder.name, slug: cSlug }
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
            data: { organizationId: org!.id, clientId: client!.id, name: projectFolder.name, slug: pSlug }
          })
          await ensureProjectPersonasForProject(project.id)
          // Add importing user and org owner as project members so they have can_view (avoid 404)
          const projectLeadPersona = await prisma.projectPersona.findFirst({
            where: { projectId: project.id, rbacPersona: { slug: 'proj_admin' } }
          })
          if (projectLeadPersona) {
            await prisma.projectMember.create({
              data: { projectId: project.id, userId, personaId: projectLeadPersona.id }
            })
            const orgOwner = await prisma.organizationMember.findFirst({
              where: {
                organizationId: org!.id,
                organizationPersona: { rbacPersona: { slug: 'org_admin' } }
              }
            })
            if (orgOwner && orgOwner.userId !== userId) {
              await prisma.projectMember.create({
                data: { projectId: project.id, userId: orgOwner.userId, personaId: projectLeadPersona.id }
              })
            }
          }
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

  const slug = effectiveStepOneSlug ?? stepOneOrgSlug ?? firstOrgSlug ?? (connector.organization?.slug ?? '')
  const orgId = stepOneOrgFolderId ?? orgFolders[0]?.id ?? rootFolderId
  return { rootId: rootFolderId, orgId, slug }
}

export interface EnsureAppFolderStructureResult {
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
  connectionId: string,
  clientName: string,
  clientSlug: string,
  adapter: IConnectorStorageAdapter,
  options?: { projectName?: string; projectSlug?: string }
): Promise<EnsureAppFolderStructureResult> {
  const connector = await prisma.connector.findUnique({
    where: { id: connectionId },
    include: { organization: true }
  })
  if (!connector) throw new Error('Connection not found')

  const settings = (connector.settings as Record<string, unknown>) || {}
  let rootFolderId = settings.rootFolderId as string | undefined
  let orgFolderId = settings.orgFolderId as string | undefined
  let clientFolderId = (settings.clientFolderIds as Record<string, string>)?.[clientSlug] ?? (settings.clientFolderIds as Record<string, string>)?.[clientName]
  const projectSlug = options?.projectSlug
  const projectName = options?.projectName
  let projectFolderId = projectSlug
    ? ((settings.projectFolderIds as Record<string, string>)?.[projectSlug] ?? (projectName ? (settings.projectFolderIds as Record<string, string>)?.[projectName] : undefined))
    : undefined

  if (!rootFolderId || !orgFolderId) {
    throw new Error('Organization folder not configured; complete Drive setup first.')
  }

  const projectFolderSettings = (settings.projectFolderSettings as Record<string, { generalFolderId?: string; confidentialFolderId?: string; stagingFolderId?: string }>) || {}
  const projectSettingsKey = projectSlug ?? projectName

  if (!clientFolderId && clientName) {
    clientFolderId = await adapter.findOrCreateFolder(connectionId, orgFolderId, clientName)
    await writeMetaInFolder(adapter, connectionId, clientFolderId, { type: 'client', slug: clientSlug })
    await restrictIfSupported(adapter, connectionId, clientFolderId, 'Restricted client folder to owner-only')
  } else if (clientFolderId) {
    const exists = await adapter.fileExists(connectionId, clientFolderId)
    if (!exists) {
      clientFolderId = await adapter.findOrCreateFolder(connectionId, orgFolderId, clientName)
      await writeMetaInFolder(adapter, connectionId, clientFolderId, { type: 'client', slug: clientSlug })
      await restrictIfSupported(adapter, connectionId, clientFolderId, 'Restricted client folder to owner-only')
    } else {
      await restrictIfSupported(adapter, connectionId, clientFolderId, 'Restricted client folder to owner-only')
    }
  }

  let generalFolderId: string | undefined
  let confidentialFolderId: string | undefined
  let stagingFolderId: string | undefined

  if (projectName && projectSlug && clientFolderId) {
    if (!projectFolderId) {
      projectFolderId = await adapter.findOrCreateFolder(connectionId, clientFolderId, projectName)
      await writeMetaInFolder(adapter, connectionId, projectFolderId, { type: 'project', slug: projectSlug })
      await restrictIfSupported(adapter, connectionId, projectFolderId, 'Restricted project folder to owner-only')
    } else {
      const exists = await adapter.fileExists(connectionId, projectFolderId)
      if (!exists) {
        projectFolderId = await adapter.findOrCreateFolder(connectionId, clientFolderId, projectName)
        await writeMetaInFolder(adapter, connectionId, projectFolderId, { type: 'project', slug: projectSlug })
        await restrictIfSupported(adapter, connectionId, projectFolderId, 'Restricted project folder to owner-only')
      } else {
        await restrictIfSupported(adapter, connectionId, projectFolderId, 'Restricted project folder to owner-only')
      }
    }

    if (projectFolderId && projectSettingsKey) {
      const projectSettings = projectFolderSettings[projectSettingsKey] || {}
      generalFolderId = projectSettings.generalFolderId
      confidentialFolderId = projectSettings.confidentialFolderId
      stagingFolderId = projectSettings.stagingFolderId

      const ensureDocumentFolder = async (
        name: string,
        folderType: 'general' | 'confidential' | 'staging',
        currentId: string | undefined
      ): Promise<string> => {
        let id = currentId
        if (!id) {
          id = await adapter.findOrCreateFolder(connectionId, projectFolderId!, name)
          await writeMetaInFolder(adapter, connectionId, id, { type: 'document', folderType })
          if (folderType !== 'general') {
            await restrictIfSupported(adapter, connectionId, id, `Created ${name} folder`)
          } else {
            logger.info(`Created ${name} folder`, 'PockettStructure', { id, projectFolderId, connectionId })
          }
        } else {
          const exists = await adapter.fileExists(connectionId, id)
          if (!exists) {
            id = await adapter.findOrCreateFolder(connectionId, projectFolderId!, name)
            await writeMetaInFolder(adapter, connectionId, id, { type: 'document', folderType })
            if (folderType !== 'general') await restrictIfSupported(adapter, connectionId, id, `Created ${name} folder`)
            else logger.info(`Created ${name} folder`, 'PockettStructure', { id, projectFolderId, connectionId })
          } else if (folderType !== 'general') {
            await restrictIfSupported(adapter, connectionId, id, `Restricted ${name} folder`)
          }
        }
        return id
      }

      generalFolderId = await ensureDocumentFolder('general', 'general', generalFolderId)
      confidentialFolderId = await ensureDocumentFolder('confidential', 'confidential', confidentialFolderId)
      stagingFolderId = await ensureDocumentFolder('staging', 'staging', stagingFolderId)
    }
  }

  const newSettings = {
    ...settings,
    rootFolderId,
    orgFolderId,
    clientFolderIds: {
      ...((settings.clientFolderIds as Record<string, string>) || {}),
      [clientSlug]: clientFolderId
    }
  }
  if (projectSettingsKey && projectFolderId) {
    ; (newSettings as Record<string, unknown>).projectFolderIds = {
      ...((settings.projectFolderIds as Record<string, string>) || {}),
      [projectSettingsKey]: projectFolderId
    }
      ; (newSettings as Record<string, unknown>).projectFolderSettings = {
        ...(projectFolderSettings || {}),
        [projectSettingsKey]: { generalFolderId, confidentialFolderId, stagingFolderId }
      }
  }

  await prisma.connector.update({
    where: { id: connectionId },
    data: { settings: newSettings }
  })

  if (clientFolderId) {
    await prisma.connectorLinkedFile.upsert({
      where: { connectorId_fileId: { connectorId: connectionId, fileId: clientFolderId } },
      update: { isGrantRevoked: false, linkedAt: new Date(), metadata: { type: 'client', slug: clientSlug } },
      create: { connectorId: connectionId, fileId: clientFolderId, isGrantRevoked: false, metadata: { type: 'client', slug: clientSlug } }
    })
  }
  if (projectFolderId && projectSettingsKey) {
    await prisma.connectorLinkedFile.upsert({
      where: { connectorId_fileId: { connectorId: connectionId, fileId: projectFolderId } },
      update: { isGrantRevoked: false, linkedAt: new Date(), metadata: { type: 'project', slug: projectSlug } },
      create: { connectorId: connectionId, fileId: projectFolderId, isGrantRevoked: false, metadata: { type: 'project', slug: projectSlug } }
    })
  }

  return {
    rootId: rootFolderId!,
    orgId: orgFolderId,
    clientId: clientFolderId,
    projectId: projectFolderId,
    generalFolderId,
    confidentialFolderId,
    stagingFolderId
  }
}
