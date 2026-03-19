/**
 * Server-only sample file service. Uses Node fs via sandbox-asset-loader (dynamic import).
 * Import this only from API routes or server code. Client pages should use sample-file-service.ts.
 */
import { IConnectorStorageAdapter, METADATA_FILE_NAME, METADATA_FOLDER_NAME } from '@/lib/connectors/types'
import { logger } from '@/lib/logger'
import {
    DEFAULT_SAMPLE_FILES,
    generateSampleContent,
    MIME_BY_TYPE,
    type SampleFile,
    type SampleFolder,
} from './sample-file-service'

export { DEFAULT_SAMPLE_FILES, SANDBOX_PROJECT_DATA } from './sample-file-service'

export class SampleFileService {
    static async createSampleFiles(
        adapter: IConnectorStorageAdapter,
        connectionId: string,
        folderId: string,
        files: SampleFile[]
    ): Promise<void> {
        const loader = await import('./sandbox-asset-loader')
        await Promise.all(
            files.map(async (file) => {
                try {
                    const mimeType = MIME_BY_TYPE[file.type] || 'text/plain'
                    if (loader.isAssetType(file.type) && adapter.writeFileBinary) {
                        const buffer = loader.getSandboxAssetBuffer(file.type)
                        if (buffer) {
                            await adapter.writeFileBinary(connectionId, folderId, file.name, buffer, mimeType)
                            logger.debug(`Created sample asset: ${file.name} in folder: ${folderId}`)
                            return
                        }
                        if (loader.isBinaryOnlyAssetType(file.type)) {
                            logger.warn(`Sandbox asset missing for ${file.type}, skipping ${file.name}. Add sample.${file.type} to lib/services/sandbox-assets/`)
                            return
                        }
                    }
                    const content = generateSampleContent(file.name, file.type)
                    await adapter.writeFile(connectionId, folderId, file.name, content, mimeType)
                    logger.debug(`Created sample file: ${file.name} in folder: ${folderId}`)
                } catch (error) {
                    logger.error(`Failed to create sample file: ${file.name}`, error as Error)
                }
            })
        )
    }

    static async createFolderStructure(
        adapter: IConnectorStorageAdapter,
        connectionId: string,
        parentFolderId: string,
        structure: SampleFolder
    ): Promise<void> {
        const filesPromise = structure.files?.length
            ? this.createSampleFiles(adapter, connectionId, parentFolderId, structure.files)
            : Promise.resolve()

        const subfoldersPromise = structure.subfolders?.length
            ? Promise.all(
                structure.subfolders.map(async (sub) => {
                    try {
                        const subFolderId = await adapter.findOrCreateFolder(connectionId, parentFolderId, sub.name)
                        const dotPockettId = await adapter.findOrCreateFolder(connectionId, subFolderId, METADATA_FOLDER_NAME)
                        await adapter.writeFile(connectionId, dotPockettId, METADATA_FILE_NAME, JSON.stringify({ type: 'document', folderType: 'general', sandboxOnly: true }))
                        await this.createFolderStructure(adapter, connectionId, subFolderId, sub)
                    } catch (error) {
                        logger.error(`Failed to create subfolder structure: ${sub.name}`, error as Error)
                    }
                })
            )
            : Promise.resolve()

        await Promise.all([filesPromise, subfoldersPromise])
    }
}
