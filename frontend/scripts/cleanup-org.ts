import { prisma } from '../lib/prisma'
import { google } from 'googleapis'

// Type for connector with decrypted virtual fields from Prisma extension
type ConnectorWithDecrypted = {
    id: string
    type: string
    settings: any
    accessToken: string
    refreshToken: string | null
    accessTokenDecrypted: string
    refreshTokenDecrypted: string | null
}

async function cleanupOrg(orgId: string) {
    console.log(`Starting cleanup for Firm ID: ${orgId}`)

    // 1. Fetch firm and connector to get Drive info
    const org = await prisma.firm.findUnique({
        where: { id: orgId },
        include: { connector: true }
    })

    if (!org) {
        console.error('Firm not found!')
        return
    }

    // 2. Delete Drive folders (if connected)
    const connector = org.connector as ConnectorWithDecrypted | null | undefined
    if (connector && connector.type === 'GOOGLE_DRIVE') {
        const settings = connector.settings as any
        const orgFolderId = org.firmFolderId || settings.orgFolderId

        if (orgFolderId) {
            console.log(`Found Drive org folder: ${orgFolderId}. Deleting...`)
            try {
                await deleteDriveFolder(
                    connector.accessTokenDecrypted,
                    connector.refreshTokenDecrypted,
                    orgFolderId
                )
                console.log('✅ Drive folder deleted/trashed')
            } catch (e) {
                console.error('Failed to delete Drive folder:', e)
            }
        }
    }

    console.log('Deleting firm records from DB...')
    await prisma.firm.delete({
        where: { id: orgId }
    })
    console.log('✅ Database records deleted')
}

async function deleteDriveFolder(accessToken: string, refreshToken: string | null, fileId: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken })

    const drive = google.drive({ version: 'v3', auth })

    await drive.files.update({
        fileId,
        requestBody: { trashed: true },
        supportsAllDrives: true
    })
}

const id = process.argv[2]
if (id) {
    cleanupOrg(id)
        .catch(console.error)
        .finally(() => process.exit(0))
} else {
    console.log('Please provide firm ID as argument')
}
