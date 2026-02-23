import { describe, it, expect, vi } from 'vitest'
import { createGoogleDriveAdapter } from './google-drive-adapter'
import type { IConnectorStorageAdapter } from '../types'

describe('google-drive-adapter', () => {
  const getAccessToken = vi.fn().mockResolvedValue('mock-token')

  it('createGoogleDriveAdapter returns an object implementing IConnectorStorageAdapter', () => {
    const adapter = createGoogleDriveAdapter(getAccessToken)
    expect(adapter).toBeDefined()
    expect(typeof adapter.listFolderChildren).toBe('function')
    expect(typeof adapter.readFileContent).toBe('function')
    expect(typeof adapter.writeFile).toBe('function')
    expect(typeof adapter.createFolder).toBe('function')
    expect(typeof adapter.findOrCreateFolder).toBe('function')
    expect(typeof adapter.getFileParent).toBe('function')
    expect(typeof adapter.fileExists).toBe('function')
    expect(typeof adapter.restrictFolderToOwnerOnly).toBe('function')
  })

  it('listFolderChildren calls getAccessToken with connectionId', async () => {
    const adapter = createGoogleDriveAdapter(getAccessToken)
    getAccessToken.mockClear()
    try {
      await adapter.listFolderChildren('conn-1', 'folder-1')
    } catch {
      // fetch will fail in test; we only care that getAccessToken was called
    }
    expect(getAccessToken).toHaveBeenCalledWith('conn-1')
  })
})
