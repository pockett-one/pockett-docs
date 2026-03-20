import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { FirmService } from '@/lib/firm-service'
import { ClientService } from '@/lib/services/client.service'
import { projectService } from '@/lib/services/project.service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { createAdminClient } from '@/utils/supabase/admin'
import { safeInngestSend } from '@/lib/inngest/client'
import { SANDBOX_HIERARCHY } from '@/lib/services/sample-file-service'

/** One demo contact per sandbox client (keys match `clientName` in sandbox-hierarchy.json). */
const SANDBOX_CLIENT_PRIMARY_CONTACTS: Record<
  string,
  { name: string; title: string; phone?: string; notes?: string }
> = {
  'Acme Robotics': {
    name: 'Jordan Lee',
    title: 'VP of Marketing',
    phone: '+1 (555) 201-4400',
    notes: 'Primary marketing stakeholder for engagements.',
  },
  'Horizon FinTech': {
    name: 'Sam Rivera',
    title: 'Head of Growth',
    phone: '+1 (555) 302-8800',
    notes: 'Main point of contact for GTM and lifecycle programs.',
  },
  'Nova Health Systems': {
    name: 'Dr. Morgan Patel',
    title: 'Director of Communications',
    phone: '+1 (555) 403-1200',
    notes: 'Clinical marketing and public affairs liaison.',
  },
}

export interface SandboxOnboardingInput {
  userId: string
  userEmail: string
  firstName?: string
  lastName?: string
  connectionId: string
  sandboxOrgName?: string
}

export interface SandboxOnboardingResult {
  success: true
  firm: { id: string; slug: string; name: string }
  orgFolderId: string
}

/**
 * Runs the full sandbox onboarding flow: firm + members, connector metadata,
 * Drive org folder, DB hierarchy (clients + projects), Drive structure,
 * connector org map, bulk client/engagement folder ids, Inngest sample files.
 * Caller is responsible for auth and passing a valid userId.
 */
export async function runSandboxOnboarding(
  input: SandboxOnboardingInput
): Promise<SandboxOnboardingResult> {
  const userId = input.userId
  const connectionId = input.connectionId
  const name = (input.sandboxOrgName || '').trim() || 'Pockett Inc.'

  // 1. Firm + membership (audit fields set inside FirmService)
  const firm = await FirmService.createFirmWithMember({
    userId,
    email: input.userEmail,
    firstName: input.firstName || '',
    lastName: input.lastName || '',
    firmName: name,
    connectorId: connectionId,
    allowDomainAccess: false,
    sandboxOnly: true,
  })

  let connector: { status: string; settings: unknown } | null = null
  connector = await (prisma as any).connector.findUnique({ where: { id: connectionId } })
  if (connector) {
    const currentSettings = (connector.settings as any) || {}
    await (prisma as any).connector.update({
      where: { id: connectionId },
      data: {
        settings: {
          ...currentSettings,
          onboarding: {
            currentStep: 3,
            isComplete: false,
            driveConnected: true,
            testOrgCreated: true,
            orgsImported: [],
            defaultOrgSlug: '',
            lastUpdated: new Date().toISOString(),
          },
        },
        updatedBy: userId,
      },
    })
  }

  if (!connector || connector.status !== 'ACTIVE') {
    throw new Error('Connector not active')
  }

  const driveSettings = (connector.settings as any) || {}
  const driveRootFolderId = driveSettings.parentFolderId || driveSettings.rootFolderId || 'root'

  const setupResult = await googleDriveConnector.setupOrgFolder(
    connectionId,
    driveRootFolderId,
    firm.id,
    userId
  )
  if (!setupResult.orgId) {
    throw new Error('Failed to create Google Drive folder structure')
  }

  await Promise.all([
    FirmService.setDefaultFirm(userId, firm.id),
    createAdminClient().auth.admin.updateUserById(userId, {
      user_metadata: { active_firm_id: firm.id, active_firm_slug: firm.slug, active_persona: 'firm_admin' },
      app_metadata: { active_firm_id: firm.id, active_persona: 'firm_admin' },
    }).catch((e: Error) => logger.error('JWT metadata injection failed', e)),
    invalidateUserSettingsPlus(userId),
  ])

  const orgId = firm.id
  const adapter = await googleDriveConnector.createGoogleDriveAdapter(connectionId)

  const clientResults: { client: Awaited<ReturnType<typeof ClientService.createClient>>; projectEntries: (typeof SANDBOX_HIERARCHY)[0]['projects'] }[] = []
  for (const clientEntry of SANDBOX_HIERARCHY) {
    const client = await ClientService.createClient({
      firmId: orgId,
      name: clientEntry.clientName,
      creatorUserId: userId,
      sandboxOnly: true,
    })

    const preset =
      SANDBOX_CLIENT_PRIMARY_CONTACTS[clientEntry.clientName] ?? {
        name: 'Alex Kim',
        title: 'Primary contact',
        phone: '+1 (555) 100-0000',
        notes: 'Sample sandbox contact for demos.',
      }
    await prisma.clientContact.create({
      data: {
        firmId: orgId,
        clientId: client.id,
        name: preset.name,
        email: `primary.${client.slug}@sandbox.pockett.dev`,
        phone: preset.phone ?? null,
        title: preset.title,
        notes: preset.notes ?? null,
        tags: [],
        engagementId: null,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    clientResults.push({ client, projectEntries: clientEntry.projects })
  }

  const sandboxClients: {
    clientId: string
    clientSlug: string
    clientName: string
    projects: Array<{ projectId: string; projectSlug: string; projectName: string }>
  }[] = clientResults.map(({ client }) => ({
    clientId: client.id,
    clientSlug: client.slug,
    clientName: client.name,
    projects: [],
  }))
  for (const { client, projectEntries } of clientResults) {
    const sandboxClient = sandboxClients.find((sc) => sc.clientId === client.id)!
    for (const projectEntry of projectEntries) {
      const { project } = await projectService.createProject(orgId, client.id, projectEntry.name, userId, '', true, true)
      sandboxClient.projects.push({ projectId: project.id, projectSlug: project.slug, projectName: projectEntry.name })
    }
  }

  const driveStructure = await googleDriveConnector.createSandboxDriveStructure(
    connectionId,
    adapter,
    setupResult.orgId,
    sandboxClients
  )

  const connectorRow = await (prisma as any).connector.findUnique({ where: { id: connectionId }, select: { settings: true } })
  const currentSettings = (connectorRow?.settings as Record<string, unknown>) || {}
  const organizations = (currentSettings.organizations as Record<string, unknown>) || {}
  await (prisma as any).connector.update({
    where: { id: connectionId },
    data: {
      settings: {
        ...currentSettings,
        organizations: {
          ...organizations,
          [orgId]: {
            orgFolderId: setupResult.orgId,
            clientFolderIds: driveStructure.clientFolderIds,
            projectFolderIds: driveStructure.projectFolderIds,
            projectFolderSettings: driveStructure.projectFolderSettings,
          },
        },
      },
      updatedBy: userId,
    },
  })

  await Promise.all(
    clientResults.map(({ client }) =>
      (prisma as any).client.update({
        where: { id: client.id },
        data: {
          driveFolderId: driveStructure.clientFolderIds[client.slug],
          settings: {
            ...((client as any).settings || {}),
            driveFolderId: driveStructure.clientFolderIds[client.slug],
          },
          updatedBy: userId,
        },
      })
    )
  )
  const allProjects = sandboxClients.flatMap((c) => c.projects)
  await Promise.all(
    allProjects.map((p) =>
      prisma.engagement.update({
        where: { id: p.projectId },
        data: { connectorRootFolderId: driveStructure.projectFolderIds[p.projectSlug], updatedBy: userId },
      })
    )
  )

  const populatePayload = allProjects.map((p) => ({
    projectId: p.projectId,
    projectName: p.projectName,
    rootFolderId: driveStructure.projectFolderIds[p.projectSlug],
    generalFolderId: driveStructure.projectFolderSettings[p.projectSlug]?.generalFolderId,
    stagingFolderId: driveStructure.projectFolderSettings[p.projectSlug]?.stagingFolderId,
    confidentialFolderId: driveStructure.projectFolderSettings[p.projectSlug]?.confidentialFolderId,
  }))
  if (populatePayload.length > 0) {
    safeInngestSend('sandbox.populate.sample-files.requested', {
      organizationId: orgId,
      connectionId,
      projects: populatePayload,
    }).catch((e: Error) => logger.warn('Failed to trigger sandbox populate', e))
  }

  await invalidateUserSettingsPlus(userId)

  return {
    success: true,
    firm: { id: firm.id, slug: firm.slug, name: firm.name },
    orgFolderId: setupResult.orgId,
  }
}
