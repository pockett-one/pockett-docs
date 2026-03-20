/**
 * OneDrive storage adapter (stub).
 * Implements IConnectorStorageAdapter so getStorageAdapter(connectionId) can return
 * a valid adapter for ONEDRIVE connections. All methods throw until full OneDrive support is added.
 * Thumbnails and document permission regrant can be added with the same extensible design.
 */

import type { IConnectorStorageAdapter } from '../types'

const NOT_IMPLEMENTED = 'OneDrive storage adapter is not yet implemented.'

function stub(): never {
  throw new Error(NOT_IMPLEMENTED)
}

export type GetAccessToken = (connectionId: string) => Promise<string>

export function createOneDriveAdapter(_getAccessToken: GetAccessToken): IConnectorStorageAdapter {
  return {
    listFolderChildren: () => stub(),
    readFileContent: () => stub(),
    writeFile: () => stub(),
    createFolder: () => stub(),
    findOrCreateFolder: () => stub(),
    getFileParent: () => stub(),
    getFolderName: () => stub(),
    fileExists: () => stub(),
    search: () => stub(),
  }
}
