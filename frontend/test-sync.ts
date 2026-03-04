import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Finding shares...")
    const shares = await prisma.projectDocumentSharing.findMany({
        where: {
            projectId: "25dbd2b8-2822-42b3-bac3-f29b17b86056" // The project ID from the UI/Network tab
        }
    })
    console.log(`Found ${shares.length} shares to sync.`)

    // Quick inline sync instead of requiring the module which has path aliases
    for (const share of shares) {
        if ((share.settings as any)?.share?.externalCollaborator?.enabled) {
            console.log(`Manually inserting row for share ${share.id}...`)
            
            // We know the EC user is "15f2dadb-ff9b-44df-a14a-91a72916bdcc" from earlier query
            const userId = "15f2dadb-ff9b-44df-a14a-91a72916bdcc"
            
            await prisma.projectDocumentSharingUser.upsert({
                where: {
                    sharingId_userId: {
                        sharingId: share.id,
                        userId: userId
                    }
                },
                create: {
                    projectId: share.projectId,
                    sharingId: share.id,
                    userId: userId,
                    email: "deepak.gupta@whiskit.io" // Found via auth.users earlier or user session
                },
                update: {}
            })
            console.log(`Synced ${share.id}`)
        }
    }
    console.log("Done syncing.")
}
main().catch(console.error)
