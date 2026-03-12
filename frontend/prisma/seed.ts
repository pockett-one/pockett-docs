import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const SYSTEM_MANAGEMENT_ORG_SLUG = 'pockett-internal'

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function resolveUserIdsByEmails(emails: string[]): Promise<string[]> {
    if (emails.length === 0) return []
    const admin = createAdminClient()
    const userIds: string[] = []
    let page = 1
    const perPage = 1000
    const emailSet = new Set(emails.map((e) => e.toLowerCase().trim()))
    while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
        if (error) {
            console.warn('Could not list Supabase users for system admin seed:', error.message)
            return []
        }
        for (const u of data.users) {
            if (u.email && emailSet.has(u.email.toLowerCase())) userIds.push(u.id)
        }
        if (data.users.length < perPage) break
        page++
    }
    return userIds
}

async function main() {
    console.log('Seeding baseline data (Simplified RBAC)...')

    // 1. Seed Personas (Platform Schema)
    const personas = [
        { slug: 'sys_admin', displayName: 'System Administrator', description: 'Platform-level administrator with full control across all organizations. Can manage system configuration, users, organizations, billing settings, and platform-wide policies. Typically reserved for the SaaS operator or internal platform team.' },
        { slug: 'org_admin', displayName: 'Organization Administrator', description: 'Manages a specific organization within the platform. Can manage organization members, create and manage projects, configure organization settings, and control access for users within their organization.' },
        { slug: 'org_member', displayName: 'Organization Member', description: 'Full-time internal member of the organization with access to organization resources and projects they are assigned to. Typically employees or full-time team members.' },
        { slug: 'proj_admin', displayName: 'Project Lead', description: 'Responsible for managing a specific project. Can manage project members, update project content, and oversee collaboration within the project workspace. Usually a project manager, engagement lead, or team lead.' },
        { slug: 'proj_member', displayName: 'Contributor (Internal)', description: 'Internal team member contributing to project work. Can create and edit project content, collaborate with team members, and participate in discussions within assigned projects. Typically full-time employees or core project team members.' },
        { slug: 'proj_ext_collaborator', displayName: 'Contributor (External)', description: 'External collaborator invited to contribute to a project. Can create or edit content within the project but has limited access outside the project scope. Typically contractors, consultants, vendors, or agency partners.' },
        { slug: 'proj_viewer', displayName: 'Guest (External)', description: 'External stakeholder with read-only access to project content. Cannot modify content but can review materials and stay informed. Typically clients, sponsors, or external stakeholders.' },
    ]
    for (const persona of personas) {
        await (prisma as any).persona.upsert({
            where: { slug: persona.slug },
            update: { displayName: persona.displayName, description: persona.description },
            create: persona,
        })
    }
    console.log(`Seeded ${personas.length} essential personas.`)

    // 2. System Management org (tenant for platform operations; org_admin = internal admin access)
    const systemOrg = await (prisma as any).organization.upsert({
        where: { slug: SYSTEM_MANAGEMENT_ORG_SLUG },
        update: {},
        create: {
            name: 'System Management',
            slug: SYSTEM_MANAGEMENT_ORG_SLUG,
            updatedAt: new Date(),
            sandboxOnly: true,
        },
    })
    console.log('System Management org ready:', systemOrg.slug)

    // 3. Add org_admins from SYSTEM_ADMIN_EMAILS (comma-separated)
    const emailsEnv = process.env.SYSTEM_ADMIN_EMAILS
    const adminEmails = emailsEnv
        ? emailsEnv.split(',').map((e) => e.trim()).filter(Boolean)
        : []
    if (adminEmails.length > 0) {
        const userIds = await resolveUserIdsByEmails(adminEmails)
        for (const userId of userIds) {
            await (prisma as any).orgMember.upsert({
                where: {
                    userId_organizationId: { userId, organizationId: systemOrg.id },
                },
                update: { role: 'org_admin' },
                create: {
                    userId,
                    organizationId: systemOrg.id,
                    role: 'org_admin',
                    membershipType: 'internal',
                    isDefault: false,
                },
            })
        }
        console.log(`Added ${userIds.length} org_admin(s) to System Management (${adminEmails.length} email(s) configured)`)
    }

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
