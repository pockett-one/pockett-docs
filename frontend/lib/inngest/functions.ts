import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { GoogleDriveConnector } from "@/lib/google-drive-connector";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Search Indexing Functions
// ---------------------------------------------------------------------------

/**
 * Index a single file or folder for search.
 * Triggered by: create-folder, duplicate, copy, move, rename, single upload.
 */
export const indexFileForSearch = inngest.createFunction(
    { id: "index-file-for-search" },
    { event: "file.index.requested" },
    async ({ event, step }) => {
        await step.run("index-file", async () => {
            const { SearchService } = await import("@/lib/services/search-service")
            await SearchService.indexFile({
                organizationId: event.data.organizationId,
                clientId: event.data.clientId ?? undefined,
                projectId: event.data.projectId ?? undefined,
                externalId: event.data.externalId,
                fileName: event.data.fileName,
                parentId: event.data.parentId ?? undefined,
            })
        })
        return { externalId: event.data.externalId, fileName: event.data.fileName }
    }
)

/**
 * Index a batch of files/folders for search.
 * Triggered by: multi-file upload, folder upload (all children).
 * Processes in chunks of 10 to stay within OpenAI embedding rate limits.
 */
export const indexBatchForSearch = inngest.createFunction(
    { id: "index-batch-for-search" },
    { event: "file.index.batch.requested" },
    async ({ event, step }) => {
        const { organizationId, clientId, projectId, files } = event.data
        const BATCH_SIZE = 10

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE)
            await step.run(`index-files-${i}`, async () => {
                const { SearchService } = await import("@/lib/services/search-service")
                for (const file of batch) {
                    await SearchService.indexFile({
                        organizationId,
                        clientId: clientId ?? undefined,
                        projectId: projectId ?? undefined,
                        externalId: file.externalId,
                        fileName: file.fileName,
                        parentId: file.parentId ?? undefined,
                    })
                }
            })
        }

        return { indexed: files.length }
    }
)

/**
 * Recursively scan all files in a project's Drive folder tree and index them.
 * Triggered after onboarding import to catch all pre-existing Drive content.
 * Capped at 1,000 items per scan to prevent runaway jobs.
 */
export const scanAndIndexProject = inngest.createFunction(
    { id: "scan-and-index-project" },
    { event: "project.index.scan.requested" },
    async ({ event, step }) => {
        const { organizationId, clientId, projectId, connectorId, rootFolderIds } = event.data

        // Step 1: Recursively discover all files/folders under the root folders
        const allFiles = await step.run("discover-files", async () => {
            const drive = new GoogleDriveConnector()
            const files: { externalId: string; fileName: string; parentId: string | null }[] = []
            const queue = [...rootFolderIds]
            const visited = new Set<string>()

            // Include the root folders themselves
            for (const folderId of rootFolderIds) {
                try {
                    const meta = await drive.getFileMetadata(connectorId, folderId)
                    if (meta?.name) {
                        files.push({
                            externalId: folderId,
                            fileName: meta.name,
                            parentId: meta.parents?.[0] ?? null,
                        })
                    }
                } catch {
                    // skip inaccessible folders
                }
            }

            // BFS through all subfolders
            while (queue.length > 0 && visited.size < 1000) {
                const folderId = queue.shift()!
                if (visited.has(folderId)) continue
                visited.add(folderId)

                try {
                    const children = await drive.listFiles(connectorId, folderId, 500)
                    for (const child of children) {
                        if (!child.id || !child.name) continue
                        files.push({ externalId: child.id, fileName: child.name, parentId: folderId })
                        if (child.mimeType === 'application/vnd.google-apps.folder') {
                            queue.push(child.id)
                        }
                    }
                } catch {
                    // skip inaccessible subfolders
                }
            }

            return files
        })

        if (allFiles.length === 0) return { indexed: 0, projectId }

        // Step 2: Index files in batches of 20
        const BATCH_SIZE = 20
        for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
            const batch = allFiles.slice(i, i + BATCH_SIZE)
            await step.run(`index-batch-${i}`, async () => {
                const { SearchService } = await import("@/lib/services/search-service")
                for (const file of batch) {
                    await SearchService.indexFile({
                        organizationId,
                        clientId: clientId ?? undefined,
                        projectId: projectId ?? undefined,
                        externalId: file.externalId,
                        fileName: file.fileName,
                        parentId: file.parentId ?? undefined,
                    })
                }
            })
        }

        return { indexed: allFiles.length, projectId, organizationId }
    }
)

/**
 * Background reconciliation when a file is deleted.
 * Removes from search index and revokes Google permissions.
 */
export const reconcileFileDeletion = inngest.createFunction(
    { id: "reconcile-file-deletion" },
    { event: "file.delete.requested" },
    async ({ event, step }) => {
        const { organizationId, externalId, googlePermissionId } = event.data

        // 1. Remove from Search Index
        await step.run("remove-from-search-index", async () => {
            const { SearchService } = await import("@/lib/services/search-service")
            await SearchService.removeFile(organizationId, externalId)
        })

        // 2. Revoke Google Permission (if ID provided)
        if (googlePermissionId) {
            await step.run("revoke-google-permission", async () => {
                const org = await prisma.organization.findUnique({
                    where: { id: organizationId }
                })
                const connector = org?.connectorId ? await prisma.connector.findUnique({
                    where: { id: org.connectorId }
                }) : null
                if (connector) {
                    const drive = new GoogleDriveConnector()
                    await drive.revokePermission(connector.id, externalId, googlePermissionId)
                }
            })
        }

        // 3. Cleanup Sharing Records
        await step.run("cleanup-sharing-records", async () => {
            await prisma.projectDocumentSharingUser.deleteMany({
                where: {
                    googlePermissionId: googlePermissionId,
                    sharing: { externalId }
                }
            })
        })

        return { externalId, status: "reconciled" }
    }
)

/**
 * Background reconciliation when a folder is deleted.
 * Recursively removes from search index.
 */
export const reconcileFolderDeletion = inngest.createFunction(
    { id: "reconcile-folder-deletion" },
    { event: "folder.delete.requested" },
    async ({ event, step }) => {
        const { organizationId, externalId } = event.data

        // 1. Recursively remove from Search Index
        await step.run("remove-folder-from-search-index", async () => {
            const { SearchService } = await import("@/lib/services/search-service")
            await SearchService.removeFile(organizationId, externalId)
        })

        return { externalId, status: "reconciled" }
    }
)

export const revokeProjectSharing = inngest.createFunction(
    { id: "revoke-project-sharing" },
    { event: "project/archived" },
    async ({ event, step }) => {
        const { projectId, organizationId, reason = "unknown" } = event.data;

        // 1. Fetch all sharing records for the project
        const shares = await step.run("fetch-shares", async () => {
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
            return { message: "No shares to revoke", reason, projectId };
        }

        // 2. Fetch the Google credentials for the organization via connector
        const connectorInfo = await step.run("fetch-connector", async () => {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId }
            })
            const connector = org?.connectorId ? await prisma.connector.findUnique({
                where: { id: org.connectorId }
            }) : null;
            return connector ? { id: connector.id } : null;
        });

        if (!connectorInfo) {
            logger.warn(
                "Missing active Google Drive connector for organization",
                { organizationId, projectId, reason }
            );
            // Still clean up DB records even if we can't revoke on Google Drive
            await step.run("cleanup-db-no-connector", async () => {
                await prisma.projectDocumentSharingUser.deleteMany({
                    where: {
                        sharing: {
                            projectId: projectId,
                        },
                    },
                });
                await prisma.projectDocumentSharing.deleteMany({
                    where: { projectId: projectId },
                });
            });
            return { message: "No active connector - cleaned up DB records only", reason, projectId };
        }

        // 3. Process revocations in batches with parallelization
        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            let failCount = 0;
            const drive = new GoogleDriveConnector();
            const BATCH_SIZE = 10;

            // Process in batches of 10 concurrent revocations
            for (let i = 0; i < shares.length; i += BATCH_SIZE) {
                const batch = shares.slice(i, i + BATCH_SIZE);

                await Promise.all(
                    batch.map(async (share) => {
                        if (share.googlePermissionId) {
                            try {
                                await drive.revokePermission(
                                    connectorInfo.id,
                                    share.sharing.externalId,
                                    share.googlePermissionId
                                );
                                successCount++;
                            } catch (e: any) {
                                logger.error(
                                    `Failed to revoke permission`,
                                    e,
                                    "Inngest",
                                    {
                                        permissionId: share.googlePermissionId,
                                        fileId: share.sharing.externalId,
                                        projectId,
                                        reason
                                    }
                                );
                                failCount++;
                            }
                        }
                    })
                );
            }

            return { successCount, failCount };
        });

        // 4. Clean up DB records
        await step.run("cleanup-db", async () => {
            await prisma.projectDocumentSharingUser.deleteMany({
                where: {
                    sharing: {
                        projectId: projectId,
                    },
                },
            });
            await prisma.projectDocumentSharing.deleteMany({
                where: { projectId: projectId },
            });
        });

        return {
            message: "Successfully revoked all project permissions",
            reason,
            results: revokeResults,
            projectId
        };
    }
);

/**
 * Revoke permissions when Guest or External Collaborator access is disabled on a document
 */
export const revokeByDisabledPersona = inngest.createFunction(
    { id: "revoke-by-disabled-persona" },
    { event: "sharing.settings.updated" },
    async ({ event, step }) => {
        const { projectId, organizationId, sharingId, disabledPersonas, documentId } = event.data;

        // 1. Fetch the Google connector
        const connectorInfo = await step.run("fetch-connector", async () => {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId }
            })
            const connector = org?.connectorId ? await prisma.connector.findUnique({
                where: { id: org.connectorId }
            }) : null;
            return connector ? { id: connector.id } : null;
        });

        if (!connectorInfo) {
            logger.warn(
                "Missing active Google Drive connector",
                { organizationId, projectId, sharingId }
            );
            return { message: "No active Google Drive connector" };
        }

        // 2. Fetch sharing users to revoke based on disabled personas
        const usersToRevoke = await step.run("fetch-sharing-users", async () => {
            const sharing = await prisma.projectDocumentSharing.findUnique({
                where: { id: sharingId },
                include: {
                    users: true
                }
            });

            if (!sharing) {
                return [];
            }

            const usersForRevocation = [];

            // For each user in the share, check if their persona is being disabled
            for (const user of sharing.users) {
                const projectMember = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: {
                            projectId,
                            userId: user.userId
                        }
                    },
                    include: {
                        persona: {
                            include: {
                                rbacPersona: true
                            }
                        }
                    }
                });

                const personaSlug = projectMember?.persona?.rbacPersona?.slug;

                // Check if this user's persona is in the disabled list
                const shouldRevoke =
                    (disabledPersonas.includes('guest') && personaSlug === 'proj_guest') ||
                    (disabledPersonas.includes('externalCollaborator') && personaSlug === 'proj_ext_collaborator');

                if (shouldRevoke && user.googlePermissionId) {
                    usersForRevocation.push(user);
                }
            }

            return usersForRevocation;
        });

        if (usersToRevoke.length === 0) {
            return { message: "No users matching disabled personas", sharingId };
        }

        // 3. Revoke permissions
        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            let failCount = 0;
            const drive = new GoogleDriveConnector();

            for (const user of usersToRevoke) {
                if (user.googlePermissionId) {
                    try {
                        await drive.revokePermission(
                            connectorInfo.id,
                            documentId,
                            user.googlePermissionId
                        );
                        successCount++;
                    } catch (e: any) {
                        logger.error(
                            "Failed to revoke permission",
                            e,
                            "Inngest",
                            {
                                permissionId: user.googlePermissionId,
                                fileId: documentId,
                                projectId,
                                sharingId
                            }
                        );
                        failCount++;
                    }
                }
            }

            return { successCount, failCount };
        });

        // 4. Cleanup DB - delete the sharing user records and clear permission IDs
        await step.run("cleanup-db", async () => {
            const userIdsToDelete = usersToRevoke.map(u => u.id);

            // Clear googlePermissionId first for audit trail
            await prisma.projectDocumentSharingUser.updateMany({
                where: { id: { in: userIdsToDelete } },
                data: { googlePermissionId: null }
            });

            // Then delete the records
            await prisma.projectDocumentSharingUser.deleteMany({
                where: { id: { in: userIdsToDelete } }
            });
        });

        return {
            message: "Revoked disabled personas",
            sharingId,
            results: revokeResults
        };
    }
);

/**
 * Revoke permissions when a project member's persona (role) changes
 */
export const revokeByMemberPersonaChange = inngest.createFunction(
    { id: "revoke-by-member-persona-change" },
    { event: "project.member.persona.updated" },
    async ({ event, step }) => {
        const { projectId, organizationId, userId, oldPersonaSlug, newPersonaSlug } = event.data;

        // Only revoke if losing a persona that grants sharing access
        const revokablePersonas = ['proj_guest', 'proj_ext_collaborator'];
        const shouldRevoke = oldPersonaSlug && revokablePersonas.includes(oldPersonaSlug);

        if (!shouldRevoke) {
            return { message: "No revocation needed for this persona change", userId, newPersonaSlug };
        }

        // 1. Fetch the Google connector
        const connectorInfo = await step.run("fetch-connector", async () => {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId }
            })
            const connector = org?.connectorId ? await prisma.connector.findUnique({
                where: { id: org.connectorId }
            }) : null;
            return connector ? { id: connector.id } : null;
        });

        if (!connectorInfo) {
            logger.warn(
                "Missing active Google Drive connector",
                { organizationId, projectId, userId }
            );
            return { message: "No active Google Drive connector" };
        }

        // 2. Find all document shares where this user has access
        const sharesToRevoke = await step.run("find-shares-to-revoke", async () => {
            const shares = await prisma.projectDocumentSharing.findMany({
                where: { projectId },
                include: { users: true }
            });

            const userShares = [];
            for (const share of shares) {
                const userShare = share.users.find(u => u.userId === userId);
                if (userShare && userShare.googlePermissionId) {
                    userShares.push({ share, user: userShare });
                }
            }
            return userShares;
        });

        if (sharesToRevoke.length === 0) {
            return { message: "User has no shared documents", userId, projectId };
        }

        // 3. Revoke permissions
        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            let failCount = 0;
            const drive = new GoogleDriveConnector();

            for (const { share, user } of sharesToRevoke) {
                if (user.googlePermissionId) {
                    try {
                        await drive.revokePermission(
                            connectorInfo.id,
                            share.externalId,
                            user.googlePermissionId
                        );
                        successCount++;
                    } catch (e: any) {
                        logger.error(
                            "Failed to revoke permission",
                            e,
                            "Inngest",
                            {
                                permissionId: user.googlePermissionId,
                                fileId: share.externalId,
                                userId,
                                projectId
                            }
                        );
                        failCount++;
                    }
                }
            }

            return { successCount, failCount };
        });

        // 4. Cleanup DB
        await step.run("cleanup-db", async () => {
            const userShareIds = sharesToRevoke.map(s => s.user.id);

            // Clear googlePermissionId first for audit trail
            await prisma.projectDocumentSharingUser.updateMany({
                where: { id: { in: userShareIds } },
                data: { googlePermissionId: null }
            });

            // Then delete the records
            await prisma.projectDocumentSharingUser.deleteMany({
                where: { id: { in: userShareIds } }
            });
        });

        return {
            message: "Revoked permissions due to persona change",
            userId,
            oldPersonaSlug,
            newPersonaSlug,
            results: revokeResults
        };
    }
);

/**
 * Grant Google Drive permissions for a newly added member
 * Triggered when a user accepts an invitation or is upgraded to an access-granting role.
 * Covers the scenario: "Share is created first, user is invited later."
 */
export const grantPermissionsForNewMember = inngest.createFunction(
    { id: "grant-permissions-for-new-member" },
    { event: "project.member.added" },
    async ({ event, step }) => {
        const { projectId, organizationId, userId, email, personaSlug } = event.data;

        // 1. Fetch the Google connector
        const connectorInfo = await step.run("fetch-connector", async () => {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId }
            })
            const connector = org?.connectorId ? await prisma.connector.findUnique({
                where: { id: org.connectorId }
            }) : null;
            return connector ? { id: connector.id } : null;
        });

        if (!connectorInfo) {
            logger.warn(
                "Missing active Google Drive connector",
                { organizationId, projectId, userId }
            );
            return { message: "No active Google Drive connector" };
        }

        // 2. Find all shared documents in this project that apply to this member's persona
        const sharingsToGrant = await step.run("find-sharings-to-grant", async () => {
            const sharings = await prisma.projectDocumentSharing.findMany({
                where: { projectId },
                include: {
                    users: { where: { userId } }, // check if user already has access
                    searchIndex: { select: { connectorId: true, fileName: true } }
                }
            });

            const isGuest = personaSlug === 'proj_guest';
            const isExternalCollaborator = personaSlug === 'proj_ext_collaborator';
            const isInternalMember = !isGuest && !isExternalCollaborator;

            return sharings.filter(sharing => {
                // Skip if user already has a sharing record for this document
                if (sharing.users.length > 0) return false;

                const settings = sharing.settings as any;
                const guestEnabled = settings?.share?.guest?.enabled === true;
                const ecEnabled = settings?.share?.externalCollaborator?.enabled === true;

                // Internal members: grant for all documents where any sharing is enabled
                if (isInternalMember) return guestEnabled || ecEnabled;

                // EC: only grant where external collaborator sharing is enabled
                if (isExternalCollaborator) return ecEnabled;

                // Guest: only grant where guest sharing is enabled
                if (isGuest) return guestEnabled;

                return false;
            });
        });

        if (sharingsToGrant.length === 0) {
            return { message: "No shared documents to grant access to", userId, projectId };
        }

        // 3. Determine role: guest → reader, everyone else → writer
        const role: 'writer' | 'reader' = personaSlug === 'proj_guest' ? 'reader' : 'writer';

        // 4. Grant permissions and create tracking records
        const grantResults = await step.run("grant-permissions", async () => {
            const drive = new GoogleDriveConnector();
            let successCount = 0;
            let failCount = 0;

            for (const sharing of sharingsToGrant) {
                try {
                    const fileName = sharing.searchIndex?.fileName || 'a document';
                    const message = `POCKETT SECURE ACCESS\n\nYou have been granted access to "${fileName}". For your security, Google Drive requires a one-time email verification. Please click the "Open" button below to receive your one-time passcode and access the document.`;
                    const options = { rm: 'minimal', ui: '2', sendNotificationEmail: 'true' };

                    const permissionId = await drive.grantFilePermission(
                        connectorInfo.id,
                        sharing.externalId,
                        email,
                        role,
                        message,
                        options
                    );

                    if (permissionId) {
                        // Create the tracking record
                        await prisma.projectDocumentSharingUser.create({
                            data: {
                                projectId,
                                sharingId: sharing.id,
                                userId,
                                email,
                                googlePermissionId: permissionId
                            }
                        });
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (e: any) {
                    logger.error(
                        "Failed to grant permission for new member",
                        e,
                        "Inngest",
                        {
                            fileId: sharing.externalId,
                            userId,
                            projectId,
                            personaSlug
                        }
                    );
                    failCount++;
                }
            }

            return { successCount, failCount };
        });

        return {
            message: "Granted permissions for new member",
            userId,
            personaSlug,
            role,
            results: grantResults
        };
    }
);
