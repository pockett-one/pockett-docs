/**
 * Google Drive implementation of the connector storage adapter.
 * Used by the Pockett structure service for folder structure and meta.json operations.
 */

import type { IConnectorStorageAdapter } from '../types'

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const DRIVE_OPTS = 'supportsAllDrives=true&includeItemsFromAllDrives=true'

export type GetAccessToken = (connectionId: string) => Promise<string>

export function createGoogleDriveAdapter(getAccessToken: GetAccessToken): IConnectorStorageAdapter {
  async function auth(connectionId: string) {
    return getAccessToken(connectionId)
  }

  return {
    async listFolderChildren(connectionId: string, folderId: string): Promise<Array<{ id: string; name: string }>> {
      const token = await auth(connectionId)
      const q = `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`
      const res = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&${DRIVE_OPTS}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return []
      const data = await res.json()
      return (data.files || []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))
    },

    async readFileContent(connectionId: string, fileId: string): Promise<string | null> {
      const token = await auth(connectionId)
      const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media&${DRIVE_OPTS}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return null
      return res.text()
    },

    async writeFile(connectionId: string, parentFolderId: string, fileName: string, content: string): Promise<void> {
      const token = await auth(connectionId)
      const children = await listFolderChildrenInternal(token, parentFolderId)
      const existing = children.find((f) => f.name === fileName)
      if (existing) {
        const patchRes = await fetch(
          `${DRIVE_UPLOAD}/files/${existing.id}?uploadType=media&${DRIVE_OPTS}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: content
          }
        )
        if (!patchRes.ok) {
          const err = await patchRes.text()
          throw new Error(`Failed to update ${fileName}: ${patchRes.status} - ${err}`)
        }
        return
      }
      const boundary = '-------pockett-meta-314159'
      const delimiter = `\r\n--${boundary}\r\n`
      const metadataPart = JSON.stringify({
        name: fileName,
        mimeType: 'application/json',
        parents: [parentFolderId]
      })
      const multipartBody =
        `${delimiter}Content-Type: application/json\r\n\r\n${metadataPart}` +
        `${delimiter}Content-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`
      const createRes = await fetch(`${DRIVE_UPLOAD}/files?uploadType=multipart&${DRIVE_OPTS}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      })
      if (!createRes.ok) {
        const err = await createRes.text()
        throw new Error(`Failed to create ${fileName}: ${createRes.status} - ${err}`)
      }
    },

    async createFolder(connectionId: string, parentFolderId: string, name: string): Promise<string> {
      const token = await auth(connectionId)
      const res = await fetch(`${DRIVE_API}/files?${DRIVE_OPTS}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          mimeType: DRIVE_FOLDER_MIME,
          parents: [parentFolderId]
        })
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Failed to create folder ${name}: ${res.status} - ${err}`)
      }
      const data = await res.json()
      return data.id
    },

    async findOrCreateFolder(connectionId: string, parentFolderId: string, name: string): Promise<string> {
      const token = await auth(connectionId)
      const q = `mimeType = '${DRIVE_FOLDER_MIME}' and name = '${name.replace(/'/g, "\\'")}' and trashed = false and '${parentFolderId}' in parents`
      const searchRes = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&${DRIVE_OPTS}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (searchRes.ok) {
        const data = await searchRes.json()
        if (data.files?.length > 0) return data.files[0].id
      }
      const createRes = await fetch(`${DRIVE_API}/files?${DRIVE_OPTS}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          mimeType: DRIVE_FOLDER_MIME,
          parents: [parentFolderId]
        })
      })
      if (!createRes.ok) {
        const err = await createRes.text()
        throw new Error(`Failed to create folder ${name}: ${createRes.status} - ${err}`)
      }
      const created = await createRes.json()
      return created.id
    },

    async getFileParent(connectionId: string, fileId: string): Promise<string | null> {
      const token = await auth(connectionId)
      const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=parents&${DRIVE_OPTS}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return null
      const data = await res.json()
      const parents = data.parents
      return Array.isArray(parents) && parents.length > 0 ? parents[0] : null
    },

    async fileExists(connectionId: string, fileId: string): Promise<boolean> {
      const token = await auth(connectionId)
      const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=id&${DRIVE_OPTS}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.status === 200
    },

    async restrictFolderToOwnerOnly(connectionId: string, folderId: string): Promise<void> {
      const token = await auth(connectionId)
      const listRes = await fetch(
        `${DRIVE_API}/files/${folderId}/permissions?fields=permissions(id,role,type,emailAddress)&${DRIVE_OPTS}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!listRes.ok) return
      const listData = await listRes.json()
      const permissions = listData.permissions || []
      const toRemove = permissions.filter((p: { role: string }) => p.role !== 'owner')
      await Promise.all(
        toRemove.map((p: { id: string }) =>
          fetch(`${DRIVE_API}/files/${folderId}/permissions/${p.id}?${DRIVE_OPTS}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      )
    }
  }
}

async function listFolderChildrenInternal(
  token: string,
  folderId: string
): Promise<Array<{ id: string; name: string }>> {
  const q = `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`
  const res = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&${DRIVE_OPTS}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.files || []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))
}
