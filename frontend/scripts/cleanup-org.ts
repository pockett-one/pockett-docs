import { PrismaClient } from '@prisma/client'
import { google } from 'googleapis'

const prisma = new PrismaClient()

async function cleanupOrg(orgId: string) {
    console.log(`Starting cleanup for Organization ID: ${orgId}`)

    // 1. Fetch Org and Connector to get Drive Info
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { connectors: true }
    })

    if (!org) {
        console.error('Organization not found!')
        return
    }

    // 2. Delete Drive Folders (if connected)
    const connector = org.connectors.find(c => c.type === 'GOOGLE_DRIVE')
    if (connector) {
        const settings = connector.settings as any
        const orgFolderId = settings.orgFolderId
        // We only delete the Org folder, not the .pockett root (as it might contain other orgs if shared? No, usually 1:1, but user asked for "organization folders under .pockett")
        // If we delete .pockett root, we might lose other things?
        // User asked "also the organization fodlers under .pockett". So we delete the Org Folder.

        if (orgFolderId) {
            console.log(`Found Drive Org Folder: ${orgFolderId}. Deleting...`)
            try {
                await deleteDriveFolder(connector.accessToken, connector.refreshToken, orgFolderId)
                console.log('✅ Drive Folder Deleted/Trashed')
            } catch (e) {
                console.error('Failed to delete Drive folder:', e)
            }
        }
    }

    // 3. Cascade Delete DB Records
    // Prisma relations with onDelete: Cascade should handle most, but let's be explicit if needed.
    // Organization has cascade for members, connectors, documents, clients, projects.
    console.log('Deleting Organization records from DB...')
    await prisma.organization.delete({
        where: { id: orgId }
    })
    console.log('✅ Database records deleted')
}

async function deleteDriveFolder(accessToken: string, refreshToken: string | null, fileId: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken })

    const drive = google.drive({ version: 'v3', auth })

    // Try to trash it (safer) or delete property?
    // We'll just trash it.
    await drive.files.update({
        fileId,
        requestBody: { trashed: true },
        supportsAllDrives: true
    })
}

// Run if ID provided
const id = process.argv[2]
if (id) {
    cleanupOrg(id)
        .catch(console.error)
        .finally(() => prisma.$disconnect())
} else {
    console.log('Please provide Organization ID as argument')
}
