
import { PrismaClient } from '@prisma/client'
import { GoogleDriveConnector } from '../lib/google-drive-connector'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Drive creation test...')

    // 1. Find the project
    const project = await prisma.project.findFirst({
        where: { slug: 'securesearch-gap-analysis' },
        include: { client: { include: { organization: true } } }
    })

    if (!project) {
        console.error('Project not found')
        process.exit(1)
    }

    if (!project.driveFolderId) {
        console.error('Project has no Drive Folder ID')
        process.exit(1)
    }

    console.log(`Found Project: ${project.name}`)
    console.log(`Drive Folder ID: ${project.driveFolderId}`)

    // 2. Find Connector
    const connector = await prisma.connector.findFirst({
        where: {
            organizationId: project.client.organizationId,
            type: 'GOOGLE_DRIVE',
            status: 'ACTIVE'
        }
    })

    if (!connector) {
        console.error('No active Google Drive connection found')
        process.exit(1)
    }

    console.log(`Found Connector: ${connector.id} (${connector.email})`)

    const gdc = GoogleDriveConnector.getInstance()

    // Ensure token
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
        console.log('Refreshing token...')
        accessToken = await gdc.refreshAccessToken(connector.id)
    }

    // 3. Create Folder
    const folderName = `Test Folder ${new Date().toISOString()}`
    console.log(`Creating folder: ${folderName}`)

    try {
        const folder = await gdc.createDriveFile(accessToken, {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [project.driveFolderId]
        })

        console.log(`Created Folder: ${folder.name} (${folder.id})`)

        // 4. Create Sheet inside it
        const sheetName = 'Test Sheet'
        console.log(`Creating sheet: ${sheetName}`)

        const sheet = await gdc.createDriveFile(accessToken, {
            name: sheetName,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [folder.id]
        })

        console.log(`Created Sheet: ${sheet.name} (${sheet.id})`)
        console.log('SUCCESS! Check your Google Drive.')

    } catch (error: any) {
        console.error('Creation Failed:', error.message)
        if (error.message.includes('403')) {
            console.error('Reason: Scope permission denied. Connector lacks "drive" or "drive.file" (if not created by app) access to parent.')
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
