'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { canViewProjectSettings as checkCanViewProjectSettings } from '@/lib/permission-helpers'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'
import { safeInngestSend } from '@/lib/inngest/client'
import { createPlatformAuditEvent } from '@/lib/platform-audit'

const supabaseAdmin = createSupabaseAdmin(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface CreateProjectData {
    name: string
    description?: string
}

/**
 * Create a new project for the current user (V2)
 */
export async function createProject(organizationSlug: string, clientSlug: string, data: CreateProjectData) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // 1. Resolve Org & Check Permissions (V2)
    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: {
                where: { userId: user.id }
            }
        }
    })

    if (!organization) {
        throw new Error('Organization not found')
    }

    const { requireAccess } = await import('@/lib/billing/subscription-gate')
    await requireAccess(organization.id, 'projects.create')

    const membership = organization.members[0]
    if (!membership) {
        throw new Error('Unauthorized')
    }

    // 2. Resolve Client (V2)
    const client = await (prisma as any).client.findFirst({
        where: {
            organizationId: organization.id,
            slug: clientSlug
        }
    })

    if (!client) {
        throw new Error('Client not found')
    }

    // 3. Check for duplicate Project Name (V2)
    const existingName = await (prisma as any).project.findFirst({
        where: {
            clientId: client.id,
            name: {
                equals: data.name,
                mode: 'insensitive'
            }
        }
    })

    if (existingName) {
        throw new Error('A project with this name already exists for this client')
    }

    // 4. Generate Slug and ensure uniqueness (V2)
    const { generateProjectSlug } = await import('@/lib/slug-utils')
    const MAX_SLUG_ATTEMPTS = 10
    let slug = generateProjectSlug(data.name)
    let attempts = 0
    while (attempts < MAX_SLUG_ATTEMPTS) {
        const existingSlug = await (prisma as any).project.findUnique({
            where: {
                clientId_slug: {
                    clientId: client.id,
                    slug
                }
            }
        })
        if (!existingSlug) break
        slug = generateProjectSlug(data.name)
        attempts++
    }
    if (attempts >= MAX_SLUG_ATTEMPTS) {
        throw new Error('Could not generate a unique project slug. Please try again.')
    }

    // 5. Create Project Record (V2)
    const newProject = await (prisma as any).project.create({
        data: {
            organizationId: organization.id,
            clientId: client.id,
            name: data.name,
            slug: slug,
            description: data.description
        }
    })

    // 6. Add creator as Project Lead (RBAC v2)
    await (prisma as any).projectMember.create({
        data: {
            projectId: newProject.id,
            userId: user.id,
            role: 'proj_admin'
        }
    })

    // 7. Create Drive Folder Structure (V2)
    try {
        const connectorId = organization.connectorId
        if (connectorId) {
            const result = await googleDriveConnector.ensureAppFolderStructure(
                connectorId,
                client.name,
                client.slug,
                await googleDriveConnector.createGoogleDriveAdapter(connectorId),
                organization.id,
                {
                    projectName: newProject.name,
                    projectSlug: newProject.slug
                }
            )

            if (result.projectId) {
                await (prisma as any).project.update({
                    where: { id: newProject.id },
                    data: { connectorRootFolderId: result.projectId }
                })
            }
        }
    } catch (e) {
        logger.error("Failed to create Google Drive folder structure for project", e as Error)
    }

    revalidatePath(`/d/o/${organizationSlug}/c/${clientSlug}`)
    return newProject
}

/**
 * Get project folder IDs (V2)
 */
export async function getProjectFolderIds(projectId: string) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    const project = await (prisma as any).project.findFirst({
        where: { id: projectId, isDeleted: false },
        include: {
            client: {
                include: {
                    organization: true
                }
            }
        }
    })

    if (!project) {
        throw new Error('Project not found')
    }

    const connectorId = project.client.organization.connectorId
    if (!connectorId) {
        return { generalFolderId: null, confidentialFolderId: null, stagingFolderId: null, isProjectLead: false }
    }

    const folderIds = await googleDriveConnector.getProjectFolderIds(connectorId, project.slug, {
        projectName: project.name,
        clientSlug: project.client.slug,
        clientName: project.client.name,
        projectFolderId: project.connectorRootFolderId
    })

    const projectMember = await (prisma as any).projectMember.findFirst({
        where: { projectId: project.id, userId: user.id }
    })

    const isProjectLead = projectMember?.role === 'proj_admin'

    return {
        ...folderIds,
        isProjectLead
    }
}

/**
 * Check project settings visibility (V2)
 */
export async function canViewProjectSettings(projectId: string): Promise<boolean> {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false

    const project = await (prisma as any).project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { id: true, organizationId: true, clientId: true }
    })
    if (!project) return false

    return await checkCanViewProjectSettings(
        project.organizationId,
        project.clientId,
        project.id
    )
}

async function assertCanManageProject(projectId: string) {
    const can = await canViewProjectSettings(projectId)
    if (!can) throw new Error('Insufficient permissions')
}

/**
 * Update project (V2)
 */
export async function updateProject(
    projectId: string,
    data: { name?: string; description?: string; kickoffDate?: string | null; dueDate?: string | null },
    orgSlug: string,
    clientSlug: string
) {
    await assertCanManageProject(projectId)

    const project = await (prisma as any).project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { organizationId: true, clientId: true, dueDate: true, kickoffDate: true }
    })
    if (!project) throw new Error('Project not found')

    const parsedKickoff = data.kickoffDate === undefined ? undefined : (data.kickoffDate ? new Date(data.kickoffDate) : null)
    const parsedDue = data.dueDate === undefined ? undefined : (data.dueDate ? new Date(data.dueDate) : null)

    await (prisma as any).project.update({
        where: { id: projectId },
        data: {
            ...(data.name != null && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(parsedKickoff !== undefined && { kickoffDate: parsedKickoff }),
            ...(parsedDue !== undefined && { dueDate: parsedDue }),
        }
    })

    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    try {
        await createPlatformAuditEvent({
            organizationId: project.organizationId,
            clientId: project.clientId,
            projectId,
            eventType: 'PROJECT_UPDATED',
            actorUserId: user?.id ?? undefined,
            metadata: { name: data.name, description: data.description, kickoffDate: data.kickoffDate, dueDate: data.dueDate },
        })
    } catch (e) {
        logger.error('Failed to create audit event for project update', e as Error)
    }

    // Notifications (in-app + email for critical): emit when dueDate changes
    try {
        if (parsedDue !== undefined) {
            const prev = project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : null
            const next = parsedDue ? parsedDue.toISOString().slice(0, 10) : null
            if (prev !== next && parsedDue) {
                const members = await (prisma as any).projectMember.findMany({
                    where: { projectId },
                    select: { userId: true },
                })
                const rows = members.map((m: any) => ({
                    organizationId: project.organizationId,
                    clientId: project.clientId,
                    projectId,
                    documentId: null,
                    userId: m.userId,
                    type: 'PROJECT_DUE_DATE_SET',
                    title: 'Project due date updated',
                    body: `Due on ${parsedDue.toISOString().slice(0, 10)}`,
                    ctaUrl: `/d/o/${orgSlug}/c/${clientSlug}/p/${projectId}`,
                    metadata: { dueDate: parsedDue.toISOString() },
                    channels: { inApp: true, email: false },
                    dedupeKey: `project:${projectId}:due:${parsedDue.toISOString().slice(0, 10)}`,
                }))
                if (rows.length) {
                    await (prisma as any).notification.createMany({ data: rows, skipDuplicates: true })
                }

                // Critical email: due within 24 hours (best-effort)
                const hours = (parsedDue.getTime() - Date.now()) / (1000 * 60 * 60)
                if (hours <= 24) {
                    const { createAdminClient } = await import('@/utils/supabase/admin')
                    const { sendEmail } = await import('@/lib/email')
                    const admin = createAdminClient()
                    await Promise.all(members.map(async (m: any) => {
                        try {
                            const { data } = await admin.auth.admin.getUserById(m.userId)
                            const email = data?.user?.email
                            if (!email) return
                            await sendEmail(
                                email,
                                'Project due soon',
                                `<p><strong>Project due soon</strong></p><p>Your project is due on <strong>${parsedDue.toISOString().slice(0, 10)}</strong>.</p>`
                            )
                        } catch {
                            // ignore individual failures
                        }
                    }))
                }
            }
        }
    } catch (e) {
        logger.warn('Failed to create due date notifications', e as Error)
    }

    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
}

/**
 * Close/Archive project (V2)
 */
export async function closeProject(projectId: string, orgSlug: string, clientSlug: string) {
    await assertCanManageProject(projectId)
    const project = await (prisma as any).project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { id: true, organizationId: true, clientId: true }
    })
    if (!project) throw new Error('Project not found')

    await (prisma as any).project.update({
        where: { id: projectId },
        data: { isClosed: true }
    })

    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    try {
        await createPlatformAuditEvent({
            organizationId: project.organizationId,
            clientId: project.clientId,
            projectId,
            eventType: 'PROJECT_CLOSED',
            actorUserId: user?.id ?? undefined,
            metadata: { reason: 'closed' },
        })
    } catch (e) {
        logger.error('Failed to create audit event for project close', e as Error)
    }

    await safeInngestSend("project/archived", {
        projectId: project.id,
        organizationId: project.organizationId,
        reason: 'closed',
        timestamp: new Date().toISOString()
    })

    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
}

/**
 * Reopen project (V2)
 */
export async function reopenProject(projectId: string, orgSlug: string, clientSlug: string) {
    await assertCanManageProject(projectId)

    const project = await (prisma as any).project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { organizationId: true, clientId: true }
    })
    if (!project) throw new Error('Project not found')

    await (prisma as any).project.update({
        where: { id: projectId },
        data: { isClosed: false }
    })

    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    try {
        await createPlatformAuditEvent({
            organizationId: project.organizationId,
            clientId: project.clientId,
            projectId,
            eventType: 'PROJECT_REOPENED',
            actorUserId: user?.id ?? undefined,
            metadata: {},
        })
    } catch (e) {
        logger.error('Failed to create audit event for project reopen', e as Error)
    }

    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
}

/**
 * Delete project (Soft delete) (V2)
 */
export async function deleteProject(projectId: string, orgSlug: string, clientSlug: string) {
    await assertCanManageProject(projectId)

    const project = await (prisma as any).project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { id: true, organizationId: true, clientId: true, connectorRootFolderId: true }
    })
    if (!project) throw new Error('Project not found')

    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    try {
        await createPlatformAuditEvent({
            organizationId: project.organizationId,
            clientId: project.clientId,
            projectId,
            eventType: 'PROJECT_SOFT_DELETED',
            actorUserId: user?.id ?? undefined,
            metadata: {},
        })
    } catch (e) {
        logger.error('Failed to create audit event for project delete', e as Error)
    }

    // 1. Fetch all members before deletion for cache invalidation
    const projectMembers = await (prisma as any).projectMember.findMany({
        where: { projectId },
        select: { userId: true }
    })

    // 2. Revoke Drive access
    if (project.connectorRootFolderId) {
        const organization = await (prisma as any).organization.findUnique({
            where: { id: project.organizationId },
            select: { connectorId: true }
        })

        if (organization.connectorId) {
            try {
                await googleDriveConnector.restrictFolderToOwnerOnly(organization.connectorId, project.connectorRootFolderId)
            } catch (e) {
                logger.error('Error restricting Drive folders on project delete', e as Error)
            }
        }
    }

    // 3. Delete members and project
    await (prisma as any).projectMember.deleteMany({ where: { projectId } })
    await (prisma as any).project.update({
        where: { id: projectId },
        data: { isDeleted: true }
    })

    // 4. Invalidate caches
    if (projectMembers.length > 0) {
        const { invalidateUsersSettingsPlus } = await import('@/lib/actions/user-settings')
        await invalidateUsersSettingsPlus(projectMembers.map((m: any) => m.userId))
    }

    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
}
