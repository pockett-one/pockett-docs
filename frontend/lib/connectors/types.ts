/**
 * Connector storage adapter: abstraction for cloud storage (Google Drive, Dropbox, OneDrive).
 * Pockett folder structure and onboarding logic use this interface only.
 */

export const METADATA_FILE_NAME = 'meta.json'
export const METADATA_FOLDER_NAME = '.meta'

// Backward-compatible aliases for older imports.
export const POCKETT_META_FILE = METADATA_FILE_NAME
export const METADATA_DOT_FOLDER = METADATA_FOLDER_NAME
export const POCKETT_DOT_FOLDER = METADATA_FOLDER_NAME

export type PockettMetaType = 'root' | 'organization' | 'client' | 'project' | 'document'

export interface PockettMetaBase {
  type: PockettMetaType
}

export interface PockettMetaRoot extends PockettMetaBase {
  type: 'root'
  version?: number
}

export interface PockettMetaOrganization extends PockettMetaBase {
  type: 'organization'
  slug: string
  isDefault: boolean
  originalName?: string  // Original organization name (for audit trail when collision detected)
  folderName?: string    // Actual folder name used (may differ from originalName if collision)
  collision?: boolean    // Whether name collision was detected
  sandboxOnly?: boolean  // Whether this is a sandbox organization (should be hidden from import)
}

export interface PockettMetaClient extends PockettMetaBase {
  type: 'client'
  slug: string
}

export interface PockettMetaProject extends PockettMetaBase {
  type: 'project'
  slug: string
}

export interface PockettMetaDocument extends PockettMetaBase {
  type: 'document'
  folderType: 'general' | 'confidential' | 'staging'
}

export type PockettMeta =
  | PockettMetaRoot
  | PockettMetaOrganization
  | PockettMetaClient
  | PockettMetaProject
  | PockettMetaDocument

/**
 * Storage-agnostic operations required for Pockett folder structure (detect, setup, import, ensure).
 * Each connector (Google Drive, Dropbox, OneDrive) implements this.
 */
export interface IConnectorStorageAdapter {
  listFolderChildren(connectionId: string, folderId: string): Promise<Array<{ id: string; name: string }>>
  readFileContent(connectionId: string, fileId: string): Promise<string | null>
  writeFile(connectionId: string, parentFolderId: string, fileName: string, content: string, mimeType?: string): Promise<void>
  /** Optional: upload binary content (e.g. images). Falls back to writeFile with string if not implemented. */
  writeFileBinary?(connectionId: string, parentFolderId: string, fileName: string, buffer: Buffer, mimeType: string): Promise<void>
  createFolder(connectionId: string, parentFolderId: string, name: string): Promise<string>
  findOrCreateFolder(connectionId: string, parentFolderId: string, name: string): Promise<string>
  getFileParent(connectionId: string, fileId: string): Promise<string | null>
  getFolderName(connectionId: string, folderId: string): Promise<string | null>
  fileExists(connectionId: string, fileId: string): Promise<boolean>
  search(connectionId: string, query: string): Promise<Array<{ id: string; name: string }>>

  /** Optional: restrict folder to owner-only (e.g. Drive permissions). No-op if not supported. */
  restrictFolderToOwnerOnly?(connectionId: string, folderId: string): Promise<void>
}
