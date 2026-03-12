import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { googleDriveConnector } from "@/lib/google-drive-connector";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Search Indexing Functions
// ---------------------------------------------------------------------------

/**
 * Index a single file or folder for search (V2)
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
 * Index a batch of files/folders for search (V2)
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
 * Recursively scan all files in a project's Drive folder tree and index them (V2)
 */
export const scanAndIndexProject = inngest.createFunction(
    { id: "scan-and-index-project" },
    { event: "project.index.scan.requested" },
    async ({ event, step }) => {
        const { organizationId, clientId, projectId, connectorId, rootFolderIds } = event.data

        const allFiles = await step.run("discover-files", async () => {
            const files: { externalId: string; fileName: string; parentId: string | null }[] = []
            const queue = [...rootFolderIds]
            const visited = new Set<string>()

            for (const folderId of rootFolderIds) {
                try {
                    const meta = await googleDriveConnector.getFileMetadata(connectorId, folderId)
                    if (meta?.name) {
                        files.push({
                            externalId: folderId,
                            fileName: meta.name,
                            parentId: meta.parents?.[0] ?? null,
                        })
                    }
                } catch {
                    // skip
                }
            }

            while (queue.length > 0 && visited.size < 1000) {
                const folderId = queue.shift()!
                if (visited.has(folderId)) continue
                visited.add(folderId)

                try {
                    const children = await googleDriveConnector.listFiles(connectorId, folderId, 500)
                    for (const child of children) {
                        if (!child.id || !child.name) continue
                        files.push({ externalId: child.id, fileName: child.name, parentId: folderId })
                        if (child.mimeType === 'application/vnd.google-apps.folder') {
                            queue.push(child.id)
                        }
                    }
                } catch {
                    // skip
                }
            }

            return files
        })

        if (allFiles.length === 0) return { indexed: 0, projectId }

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
 * Reconciliation for file deletion (V2)
 */
export const reconcileFileDeletion = inngest.createFunction(
    { id: "reconcile-file-deletion" },
    { event: "file.delete.requested" },
    async ({ event, step }) => {
        const { organizationId, externalId, googlePermissionId } = event.data

        await step.run("remove-from-search-index", async () => {
            const { SearchService } = await import("@/lib/services/search-service")
            await SearchService.removeFile(organizationId, externalId)
        })

        if (googlePermissionId) {
            await step.run("revoke-google-permission", async () => {
                const org = await (prisma as any).organization.findUnique({
                    where: { id: organizationId },
                    select: { connectorId: true }
                })
                const connectorId = org?.connectorId
                if (connectorId) {
                    await googleDriveConnector.revokePermission(connectorId, externalId, googlePermissionId)
                }
            })
        }

        await step.run("cleanup-sharing-records", async () => {
            await (prisma as any).projectDocumentSharingUser.deleteMany({
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
 * Reconciliation for folder deletion (V2)
 */
export const reconcileFolderDeletion = inngest.createFunction(
    { id: "reconcile-folder-deletion" },
    { event: "folder.delete.requested" },
    async ({ event, step }) => {
        const { organizationId, externalId } = event.data

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

        const shares = await step.run("fetch-shares", async () => {
            return await (prisma as any).projectDocumentSharingUser.findMany({
                where: {
                    sharing: { projectId },
                },
                include: { sharing: true },
            });
        });

        if (shares.length === 0) {
            return { message: "No shares to revoke", reason, projectId };
        }

        const connectorId = await step.run("fetch-connector", async () => {
            const org = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { connectorId: true }
            })
            return org?.connectorId;
        });

        if (!connectorId) {
            logger.warn("Missing active Google Drive connector", { organizationId, projectId })
            await step.run("cleanup-db-no-connector", async () => {
                await (prisma as any).projectDocumentSharingUser.deleteMany({
                    where: { sharing: { projectId } }
                });
                await (prisma as any).projectDocumentSharing.deleteMany({
                    where: { projectId }
                });
            });
            return { message: "Cleaned up DB records only", projectId };
        }

        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            let failCount = 0;
            const BATCH_SIZE = 10;

            for (let i = 0; i < shares.length; i += BATCH_SIZE) {
                const batch = shares.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (share: any) => {
                    if (share.googlePermissionId && share.sharing.externalId) {
                        try {
                            await googleDriveConnector.revokePermission(connectorId, share.sharing.externalId, share.googlePermissionId);
                            successCount++;
                        } catch (e) {
                            successCount++ // Treat as success for cleanup purposes if already revoked
                        }
                    }
                }));
            }
            return { successCount, failCount };
        });

        await step.run("cleanup-db", async () => {
            await (prisma as any).projectDocumentSharingUser.deleteMany({
                where: { sharing: { projectId } }
            });
            await (prisma as any).projectDocumentSharing.deleteMany({
                where: { projectId }
            });
        });

        return { message: "Revoked project permissions", results: revokeResults, projectId };
    }
);

/**
 * Revoke permissions when sharing settings updated (V2)
 */
export const revokeByDisabledPersona = inngest.createFunction(
    { id: "revoke-by-disabled-persona" },
    { event: "sharing.settings.updated" },
    async ({ event, step }) => {
        const { projectId, organizationId, sharingId, disabledPersonas, documentId } = event.data;

        const connectorId = await step.run("fetch-connector", async () => {
            const org = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { connectorId: true }
            })
            return org?.connectorId;
        });

        if (!connectorId) return { message: "No active connector" };

        const usersToRevoke = await step.run("fetch-sharing-users", async () => {
            const sharing = await (prisma as any).projectDocumentSharing.findUnique({
                where: { id: sharingId },
                include: { users: true }
            });

            if (!sharing) return [];

            const usersForRevocation = [];
            for (const user of sharing.users) {
                const projectMember = await (prisma as any).projectMember.findFirst({
                    where: { projectId, userId: user.userId }
                });

                const personaSlug = projectMember?.role;
                const shouldRevoke =
                    (disabledPersonas.includes('guest') && personaSlug === 'proj_viewer') ||
                    (disabledPersonas.includes('externalCollaborator') && personaSlug === 'proj_ext_collaborator');

                if (shouldRevoke && user.googlePermissionId) {
                    usersForRevocation.push(user);
                }
            }
            return usersForRevocation;
        });

        if (usersToRevoke.length === 0) return { message: "No users to revoke" };

        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            for (const user of usersToRevoke) {
                if (user.googlePermissionId) {
                    try {
                        await googleDriveConnector.revokePermission(connectorId, documentId, user.googlePermissionId);
                        successCount++;
                    } catch (e) {
                        // ignore
                    }
                }
            }
            return { successCount };
        });

        await step.run("cleanup-db", async () => {
            const userIdsToDelete = usersToRevoke.map((u: any) => u.id);
            await (prisma as any).projectDocumentSharingUser.deleteMany({
                where: { id: { in: userIdsToDelete } }
            });
        });

        return { message: "Revoked disabled personas", results: revokeResults };
    }
);

/**
 * Revoke permissions due to persona change (V2)
 */
export const revokeByMemberPersonaChange = inngest.createFunction(
    { id: "revoke-by-member-persona-change" },
    { event: "project.member.persona.updated" },
    async ({ event, step }) => {
        const { projectId, organizationId, userId, oldPersonaSlug, newPersonaSlug } = event.data;

        const revokablePersonas = ['proj_viewer', 'proj_ext_collaborator'];
        const shouldRevoke = oldPersonaSlug && revokablePersonas.includes(oldPersonaSlug);

        if (!shouldRevoke) return { message: "No revocation needed" };

        const connectorId = await step.run("fetch-connector", async () => {
            const org = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { connectorId: true }
            })
            return org?.connectorId;
        });

        if (!connectorId) return { message: "No connector" };

        const sharesToRevoke = await step.run("find-shares-to-revoke", async () => {
            const shares = await (prisma as any).projectDocumentSharing.findMany({
                where: { projectId },
                include: { users: { where: { userId } } }
            });

            return shares.flatMap((s: any) => s.users.map((u: any) => ({ share: s, user: u }))).filter((x: any) => x.user.googlePermissionId);
        });

        if (sharesToRevoke.length === 0) return { message: "No shares found" };

        const revokeResults = await step.run("revoke-permissions", async () => {
            let successCount = 0;
            for (const { share, user } of sharesToRevoke) {
                if (user.googlePermissionId && share.externalId) {
                    try {
                        await googleDriveConnector.revokePermission(connectorId, share.externalId, user.googlePermissionId);
                        successCount++;
                    } catch (e) {
                        // ignore
                    }
                }
            }
            return { successCount };
        });

        await step.run("cleanup-db", async () => {
            const userShareIds = sharesToRevoke.map((s: any) => s.user.id);
            await (prisma as any).projectDocumentSharingUser.deleteMany({
                where: { id: { in: userShareIds } }
            });
        });

        return { message: "Revoked for persona change", results: revokeResults };
    }
);

/**
 * Grant permissions for new member (V2)
 */
export const grantPermissionsForNewMember = inngest.createFunction(
    { id: "grant-permissions-for-new-member" },
    { event: "project.member.added" },
    async ({ event, step }) => {
        const { projectId, organizationId, userId, email, personaSlug } = event.data;

        const connectorId = await step.run("fetch-connector", async () => {
            const org = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { connectorId: true }
            })
            return org?.connectorId;
        });

        if (!connectorId) return { message: "No connector" };

        const sharingsToGrant = await step.run("find-sharings-to-grant", async () => {
            const sharings = await (prisma as any).projectDocumentSharing.findMany({
                where: { projectId },
                include: {
                    users: { where: { userId } },
                    searchIndex: true
                }
            });

            const isGuest = personaSlug === 'proj_viewer';
            const isExternalCollaborator = personaSlug === 'proj_ext_collaborator';
            const isInternal = !isGuest && !isExternalCollaborator;

            return sharings.filter((sharing: any) => {
                if (sharing.users.length > 0) return false;
                const settings = sharing.settings as any;
                const guestEnabled = settings?.share?.guest?.enabled === true;
                const ecEnabled = settings?.share?.externalCollaborator?.enabled === true;

                if (isInternal) return guestEnabled || ecEnabled;
                if (isExternalCollaborator) return ecEnabled;
                if (isGuest) return guestEnabled;
                return false;
            });
        });

        if (sharingsToGrant.length === 0) return { message: "No shares to grant" };

        const role: 'writer' | 'reader' = personaSlug === 'proj_viewer' ? 'reader' : 'writer';

        const grantResults = await step.run("grant-permissions", async () => {
            let successCount = 0;
            for (const sharing of sharingsToGrant) {
                try {
                    const externalId = sharing.externalId || sharing.searchIndex?.externalId;
                    if (!externalId) continue;

                    const permissionId = await googleDriveConnector.grantFolderPermission(connectorId, externalId, email, role);

                    if (permissionId) {
                        await (prisma as any).projectDocumentSharingUser.create({
                            data: { projectId, sharingId: sharing.id, userId, email, googlePermissionId: permissionId }
                        });
                        successCount++;
                    }
                } catch (e) {
                    logger.error("Failed to grant permission in Inngest (V2)", e as Error)
                }
            }
            return { successCount };
        });

        return { message: "Granted permissions for new member", results: grantResults };
    }
);
