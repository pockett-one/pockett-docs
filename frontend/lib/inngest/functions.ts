import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { GoogleDriveConnector } from "@/lib/google-drive-connector";

export const revokeProjectSharing = inngest.createFunction(
    { id: "revoke-project-sharing" },
    { event: "project/archived" },
    async ({ event, step }) => {
        const { projectId, organizationId } = event.data;

        // 1. Fetch all sharing records for the project
        const shares = await step.run("fetch-shares", async () => {
            // Find all document sharing users related to this project
            const sharingRecords = await prisma.projectDocumentSharingUser.findMany({
                where: {
                    sharing: {
                        projectId: projectId,
                    },
                },
                include: {
                    sharing: true,
                },
            });
            return sharingRecords;
        });

        if (shares.length === 0) {
            return { message: "No shares to revoke" };
        }

        // 2. Fetch the Google credentials for the organization via connector
        const connectorInfo = await step.run("fetch-connector", async () => {
            const connector = await prisma.connector.findFirst({
                where: {
                    organizationId,
                    type: 'GOOGLE_DRIVE',
                    status: 'ACTIVE'
                }
            });
            return connector ? { id: connector.id } : null;
        });

        if (!connectorInfo) {
            throw new Error("Missing active Google Drive connector for organization");
        }

        // 3. Process revocations in batches
        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            let failCount = 0;
            const drive = new GoogleDriveConnector();

            for (const share of shares) {
                if (share.googlePermissionId) {
                    try {
                        await drive.revokePermission(
                            connectorInfo.id,
                            share.sharing.externalId,
                            share.googlePermissionId
                        );
                        successCount++;
                    } catch (e: any) {
                        console.error(`Failed to delete permission ${share.googlePermissionId} on file ${share.sharing.externalId}:`, e.message);
                        failCount++;
                        // Note: We swallow the error here to ensure we try deleting ALL permissions, 
                        // even if some files were already deleted or permissions revoked manually.
                    }
                }
            }
            return { successCount, failCount };
        });

        // 4. Clean up DB records
        await step.run("cleanup-db", async () => {
            // Delete the sharing user records
            await prisma.projectDocumentSharingUser.deleteMany({
                where: {
                    sharing: {
                        projectId: projectId,
                    },
                },
            });

            // Also clean up the parent sharing records
            await prisma.projectDocumentSharing.deleteMany({
                where: { projectId: projectId },
            });
        });

        return {
            message: "Successfully revoked permissions",
            results: revokeResults,
            projectId
        };
    }
);
