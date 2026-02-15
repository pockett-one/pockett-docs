'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { ensureProjectPersonasForProject, getOrganizationPersonas, getProjectPersonas } from '@/lib/actions/personas'
import { canViewProjectSettings as checkCanViewProjectSettings } from '@/lib/permission-helpers'
import { ROLES } from '@/lib/roles'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'

const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface CreateProjectData {
    name: string
    description?: string
}

export async function createProject(organizationSlug: string, clientSlug: string, data: CreateProjectData) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // 1. Resolve Org & Check Permissions
    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: {
            id: true,
            members: {
                where: { userId: user.id },
                include: {
                    organizationPersona: {
                        include: {
                            rbacPersona: {
                                include: { role: true }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!organization) {
        throw new Error('Organization not found')
    }

    const membership = organization.members[0]
    if (!membership) {
        throw new Error('Unauthorized')
    }

    // All users with org membership can create projects (org_guest removed)
    // Additional permission checks happen at project level via personas

    // 2. Resolve Client
    const client = await prisma.client.findFirst({
        where: {
            organizationId: organization.id,
            slug: clientSlug
        }
    })

    if (!client) {
        throw new Error('Client not found')
    }

    // 3. Check for duplicate Project Name
    const existingName = await prisma.project.findFirst({
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

    // 4. Generate Slug (12 chars: base 7 + '-' + suffix 4, same as org) and ensure uniqueness within client
    const { generateProjectSlug } = await import('@/lib/slug-utils')
    const MAX_SLUG_ATTEMPTS = 10
    let slug = generateProjectSlug(data.name)
    let attempts = 0
    while (attempts < MAX_SLUG_ATTEMPTS) {
        const existingSlug = await prisma.project.findUnique({
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

    // 5. Create Project Record
    const newProject = await prisma.project.create({
        data: {
            organizationId: organization.id,
            clientId: client.id,
            name: data.name,
            slug: slug,
            description: data.description
        }
    })

    // 5a. Replicate personas into project_personas for this project (proj_* from rbac.personas), then add project creator as Project Lead
    await ensureProjectPersonasForProject(newProject.id)
    
    const projAdminRbacPersona = await prisma.rbacPersona.findUnique({
        where: { slug: 'proj_admin' }
    })
    
    if (projAdminRbacPersona) {
        const projectLeadPersona = await prisma.projectPersona.findFirst({
            where: {
                projectId: newProject.id,
                rbacPersonaId: projAdminRbacPersona.id
            }
        })
        
        if (projectLeadPersona) {
            await prisma.projectMember.create({
                data: {
                    projectId: newProject.id,
                    userId: user.id,
                    personaId: projectLeadPersona.id
                }
            })
        }
    }

    // 6. Create Drive Folder Structure
    try {
        const connector = await prisma.connector.findFirst({
            where: {
                organizationId: organization.id,
                type: 'GOOGLE_DRIVE',
                status: 'ACTIVE'
            }
        })

        if (connector) {
            const { GoogleDriveConnector } = require('@/lib/google-drive-connector')
            const result = await GoogleDriveConnector.getInstance().ensureAppFolderStructure(
                connector.id,
                client.name,
                client.slug,
                newProject.name,
                newProject.slug
            )

            // Update Project with Drive Folder ID
            if (result.projectId) {
                await prisma.project.update({
                    where: { id: newProject.id },
                    data: { driveFolderId: result.projectId }
                })
            }
        }
    } catch (e) {
        console.error("Failed to create Google Drive folder for project", e)
        // Don't fail the request, just log it. Folder can be created/synced later or manually.
    }

    revalidatePath(`/d/o/${organizationSlug}/c/${clientSlug}`)
    return newProject
}

export async function getProjectFolderIds(projectId: string) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // Get project with connector info (exclude soft-deleted)
    const project = await prisma.project.findFirst({
        where: { id: projectId, isDeleted: false },
        include: {
            client: {
                include: {
                    organization: {
                        include: {
                            connectors: {
                                where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
                                take: 1
                            }
                        }
                    }
                }
            }
        }
    })

    if (!project) {
        throw new Error('Project not found')
    }

    const connector = project.client.organization.connectors[0]
    if (!connector) {
        return { generalFolderId: null, confidentialFolderId: null, isProjectLead: false }
    }

    // Get folder IDs from connector settings
    const { googleDriveConnector } = await import('@/lib/google-drive-connector')
    const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, project.slug)

    // Check if user is Project Lead
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            projectId: project.id,
            userId: user.id
        },
        include: {
            persona: true
        }
    })

    const isProjectLead = projectMember?.persona?.displayName.toLowerCase() === 'project lead'

    return {
        generalFolderId: folderIds.generalFolderId,
        confidentialFolderId: folderIds.confidentialFolderId,
        stagingFolderId: folderIds.stagingFolderId,
        isProjectLead
    }
}

/** Whether the current user can view and use project settings. */
export async function canViewProjectSettings(projectId: string): Promise<boolean> {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false

    const project = await prisma.project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { 
            id: true,
            organizationId: true,
            clientId: true
        }
    })
    if (!project) return false

    // Use permission helper to check can_manage on project scope
    return await checkCanViewProjectSettings(
        project.organizationId,
        project.clientId,
        project.id
    )
}

async function assertCanManageProject(projectId: string) {
    const can = await canViewProjectSettings(projectId)
    if (!can) throw new Error('Insufficient permissions to manage project settings.')
}

export async function updateProject(
    projectId: string,
    data: { name?: string; description?: string },
    orgSlug: string,
    clientSlug: string
) {
    await assertCanManageProject(projectId)
    const project = await prisma.project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { id: true }
    })
    if (!project) throw new Error('Project not found')

    await prisma.project.update({
        where: { id: projectId },
        data: {
            ...(data.name != null && { name: data.name }),
            ...(data.description !== undefined && { description: data.description })
        }
    })
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}/p/[projectSlug]`, 'page')
}

export async function closeProject(projectId: string, orgSlug: string, clientSlug: string) {
    await assertCanManageProject(projectId)
    const project = await prisma.project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: {
            id: true,
            organizationId: true,
            driveFolderId: true,
            client: { select: { organizationId: true } }
        }
    })
    if (!project) throw new Error('Project not found')

    await prisma.project.update({
        where: { id: projectId },
        data: { isClosed: true }
    })

    // Remove all project members who are org guests (not part of the organization)
    const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { id: true, userId: true }
    })
    if (projectMembers.length > 0) {
        const orgMemberships = await prisma.organizationMember.findMany({
            where: {
                organizationId: project.organizationId,
                userId: { in: projectMembers.map((m) => m.userId) }
            },
            include: {
                organizationPersona: {
                    include: {
                        rbacPersona: {
                            include: { role: true }
                        }
                    }
                }
            }
        })
        // org_guest removed - no guest filtering needed
        const guestMembers: typeof projectMembers = []

        if (guestMembers.length > 0 && project.driveFolderId) {
            const connector = await prisma.connector.findFirst({
                where: {
                    organizationId: project.client.organizationId,
                    type: 'GOOGLE_DRIVE',
                    status: 'ACTIVE'
                }
            })
            if (connector) {
                for (const member of guestMembers) {
                    try {
                        const { data: { user: memberUser } } = await supabaseAdmin.auth.admin.getUserById(member.userId)
                        const memberEmail = memberUser?.email
                        if (memberEmail) {
                            const revoked = await googleDriveConnector.revokeFolderPermissionByEmail(
                                connector.id,
                                project.driveFolderId!,
                                memberEmail
                            )
                            if (revoked) {
                                logger.info('Revoked Drive folder access for guest on project close', 'Project', {
                                    userId: member.userId,
                                    projectId,
                                    folderId: project.driveFolderId
                                })
                            }
                        }
                    } catch (e) {
                        logger.error('Error revoking Drive for guest on close', e instanceof Error ? e : new Error(String(e)), 'Project', { memberId: member.id })
                    }
                }
            }
        }

        await prisma.projectMember.deleteMany({
            where: { id: { in: guestMembers.map((m) => m.id) } }
        })
    }

    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}/p/[projectSlug]`, 'page')
}

/** Reopen a closed project (Project Lead only). */
export async function reopenProject(projectId: string, orgSlug: string, clientSlug: string) {
    await assertCanManageProject(projectId)
    const project = await prisma.project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: { id: true }
    })
    if (!project) throw new Error('Project not found')

    await prisma.project.update({
        where: { id: projectId },
        data: { isClosed: false }
    })
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}/p/[projectSlug]`, 'page')
}

/** Soft delete: set isDeleted, remove all members, revoke all Drive permissions on project folder. Folder is NOT deleted. */
export async function deleteProject(projectId: string, orgSlug: string, clientSlug: string) {
    await assertCanManageProject(projectId)
    const project = await prisma.project.findFirst({
        where: { id: projectId, isDeleted: false },
        select: {
            id: true,
            driveFolderId: true,
            client: { select: { organizationId: true } }
        }
    })
    if (!project) throw new Error('Project not found')

    // Remove all project members
    await prisma.projectMember.deleteMany({
        where: { projectId }
    })

    // Revoke all Google Drive permissions on the project folder (leave only owner). Do NOT delete the folder.
    if (project.driveFolderId) {
        const connector = await prisma.connector.findFirst({
            where: {
                organizationId: project.client.organizationId,
                type: 'GOOGLE_DRIVE',
                status: 'ACTIVE'
            }
        })
        if (connector) {
            try {
                const restricted = await googleDriveConnector.restrictFolderToOwnerOnly(connector.id, project.driveFolderId)
                if (restricted) {
                    logger.info('Revoked all Drive permissions on project folder (owner only)', 'Project', {
                        projectId,
                        folderId: project.driveFolderId
                    })
                } else {
                    logger.warn('Failed to restrict project folder to owner only', 'Project', {
                        projectId,
                        folderId: project.driveFolderId
                    })
                }
            } catch (e) {
                logger.error('Error revoking Drive permissions on delete', e instanceof Error ? e : new Error(String(e)), 'Project', { projectId })
            }
        }
    }

    // Get affected users BEFORE deleting
    const affectedUsers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
        distinct: ['userId']
    })

    await prisma.project.update({
        where: { id: projectId },
        data: { isDeleted: true }
    })
    
    // Invalidate UserSettingsPlus cache for affected users
    if (affectedUsers.length > 0) {
        const { invalidateUsersSettingsPlus } = await import('@/lib/actions/user-settings')
        await invalidateUsersSettingsPlus(affectedUsers.map(u => u.userId))
    }
    
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}`)
    revalidatePath(`/d/o/${orgSlug}/c/${clientSlug}/p/[projectSlug]`, 'page')
}
