import { describe, it, expect } from 'vitest'
import {
  POCKETT_META_FILE,
  POCKETT_DOT_FOLDER,
  type PockettMetaRoot,
  type PockettMetaOrganization,
  type PockettMetaClient,
  type PockettMetaProject,
  type PockettMetaDocument,
  type IConnectorStorageAdapter
} from './types'

describe('connector types', () => {
  it('exports meta constants', () => {
    expect(POCKETT_META_FILE).toBe('meta.json')
    expect(POCKETT_DOT_FOLDER).toBe('.pockett')
  })

  it('PockettMetaRoot has type root', () => {
    const meta: PockettMetaRoot = { type: 'root', version: 1 }
    expect(meta.type).toBe('root')
  })

  it('PockettMetaOrganization has type organization and slug', () => {
    const meta: PockettMetaOrganization = { type: 'organization', slug: 'acme', isDefault: true }
    expect(meta.type).toBe('organization')
    expect(meta.slug).toBe('acme')
  })

  it('IConnectorStorageAdapter can be implemented with required methods only', () => {
    const adapter: IConnectorStorageAdapter = {
      listFolderChildren: async () => [],
      readFileContent: async () => null,
      writeFile: async () => {},
      createFolder: async () => 'id',
      findOrCreateFolder: async () => 'id',
      getFileParent: async () => null,
      fileExists: async () => false
    }
    expect(adapter.listFolderChildren).toBeDefined()
    expect(adapter.fileExists).toBeDefined()
  })
})
