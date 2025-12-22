import { prisma } from './prisma'
import { Connector, ConnectorStatus, ConnectorType } from '@prisma/client'
import { ignoreParser } from './ignore-parser'

export interface GoogleDriveConnection {
  id: string
  email: string
  name: string
  connectedAt: string
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ERROR'
  lastSyncAt?: string
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  createdTime?: string
  lastModifyingUser?: {
    displayName: string
    photoLink?: string
  }
  size?: string
  webViewLink?: string
  iconLink?: string
  owners?: {
    displayName: string
    photoLink?: string
  }[]
  parents?: string[]
}

export class GoogleDriveConnector {
  private static instance: GoogleDriveConnector

  static getInstance(): GoogleDriveConnector {
    if (!GoogleDriveConnector.instance) {
      GoogleDriveConnector.instance = new GoogleDriveConnector()
    }
    return GoogleDriveConnector.instance
  }

  async initiateConnection(userId?: string): Promise<{ authUrl: string; state: string }> {
    const response = await fetch('/api/connectors/google-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'initiate', userId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to initiate Google Drive connection')
    }

    return response.json()
  }

  async getConnections(organizationId: string): Promise<GoogleDriveConnection[]> {
    const connectors = await prisma.connector.findMany({
      where: {
        organizationId,
        type: ConnectorType.GOOGLE_DRIVE
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        status: true,
        lastSyncAt: true
      }
    })

    return connectors.map(connector => ({
      id: connector.id,
      email: connector.email,
      name: connector.name || connector.email.split('@')[0],
      connectedAt: connector.createdAt.toISOString().split('T')[0],
      status: connector.status, // Keep the original enum value
      lastSyncAt: connector.lastSyncAt?.toISOString()
    }))
  }

  async disconnectConnection(connectionId: string): Promise<void> {
    // Get connector to revoke tokens
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId }
    })

    if (connector) {
      // Revoke token with Google
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${connector.accessToken}`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Failed to revoke token:', error)
      }

      // Mark as disconnected instead of deleting
      await prisma.connector.update({
        where: { id: connectionId },
        data: {
          status: 'REVOKED',
          // Clear sensitive data but keep the record
          accessToken: '', // Set to empty string since field is required
          refreshToken: null,
          tokenExpiresAt: null
        }
      })
    }
  }

  async removeConnection(connectionId: string): Promise<void> {
    // Completely remove the connector from the database
    await prisma.connector.delete({
      where: { id: connectionId }
    })
  }

  // Cache for ignored folder IDs per connection
  private ignoreCache = new Map<string, { ids: string[]; timestamp: number }>()
  private readonly CACHE_TTL = 1000 * 60 * 60 // 1 hour

  private async resolveIgnoreIds(connectionId: string, accessToken: string): Promise<string[]> {
    const now = Date.now()
    const cached = this.ignoreCache.get(connectionId)

    // Return cached IDs if valid
    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return cached.ids
    }

    const patterns = ignoreParser.getPatterns()
    if (patterns.length === 0) return []

    const ignoreIds: string[] = []

    // Parallel lookup for all patterns
    await Promise.all(patterns.map(async (pattern) => {
      try {
        const q = `name = '${pattern}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.files && data.files.length > 0) {
            // Add all matching folder IDs
            data.files.forEach((f: any) => ignoreIds.push(f.id))
          }
        }
      } catch (error) {
        console.error(`Failed to resolve ignore pattern: ${pattern}`, error)
      }
    }))

    // Update cache
    this.ignoreCache.set(connectionId, { ids: ignoreIds, timestamp: now })
    return ignoreIds
  }

  async getFiles(connectionId: string, pageToken?: string): Promise<{
    files: GoogleDriveFile[]
    nextPageToken?: string
  }> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // 1. Resolve Ignore IDs (Cached)
    const ignoreIds = await this.resolveIgnoreIds(connectionId, accessToken)

    // 2. Build Query
    // Exclude the folder itself (by name) AND its contents (by parent ID)
    const nameExclusions = ignoreParser.getPatterns().map(p => `not name = '${p}'`).join(' and ')
    const parentExclusions = ignoreIds.map(id => `not '${id}' in parents`).join(' and ')

    let query = 'trashed = false'
    if (nameExclusions) query += ` and ${nameExclusions}`
    if (parentExclusions) query += ` and ${parentExclusions}`

    const params = new URLSearchParams({
      pageSize: '10',
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)',
      orderBy: 'modifiedTime desc',
      q: query
    })

    if (pageToken) params.set('pageToken', pageToken)

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    return { files: data.files || [], nextPageToken: data.nextPageToken }
  }

  async getMostRecentFiles(connectionId: string, limit: number = 5): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // 1. Resolve Ignore IDs (Cached)
    const ignoreIds = await this.resolveIgnoreIds(connectionId, accessToken)

    // 2. Build Query
    const nameExclusions = ignoreParser.getPatterns().map(p => `not name = '${p}'`).join(' and ')
    const parentExclusions = ignoreIds.map(id => `not '${id}' in parents`).join(' and ')

    let query = 'trashed = false'
    if (nameExclusions) query += ` and ${nameExclusions}`
    if (parentExclusions) query += ` and ${parentExclusions}`

    const params = new URLSearchParams({
      pageSize: limit.toString(),
      fields: 'files(id, name, mimeType, modifiedTime, createdTime, size, webViewLink, parents, lastModifyingUser(displayName, photoLink), owners(displayName, photoLink))',
      orderBy: 'modifiedTime desc',
      q: query
    })

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Failed to fetch recent files:', response.status)
      return []
    }

    const data = await response.json()
    return data.files || []
  }

  async storeConnection(
    organizationId: string,
    googleAccountId: string,
    email: string,
    name: string,
    accessToken: string,
    refreshToken: string, // Might be empty if not returned
    tokenExpiresAt: Date,
    avatarUrl?: string
  ): Promise<Connector> {

    // Prepare update data
    const updateData: any = {
      email,
      name,
      avatarUrl,
      accessToken,
      tokenExpiresAt,
      status: ConnectorStatus.ACTIVE,
      updatedAt: new Date()
    }

    // Only update refresh_token if we received a new one
    if (refreshToken) {
      updateData.refreshToken = refreshToken
    }

    return prisma.connector.upsert({
      where: {
        organizationId_googleAccountId: {
          organizationId,
          googleAccountId
        }
      },
      update: updateData,
      create: {
        organizationId,
        type: ConnectorType.GOOGLE_DRIVE,
        googleAccountId,
        email,
        name,
        avatarUrl,
        accessToken,
        refreshToken: refreshToken || '', // Required field
        tokenExpiresAt,
        status: ConnectorStatus.ACTIVE
      }
    })
  }

  async getUserInfo(connectionId: string): Promise<{
    email: string
    name: string
    picture?: string
    quotaBytesTotal: string
    quotaBytesUsed: string
  }> {
    // Get the connector to access the access token
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId }
    })

    if (!connector) {
      throw new Error('Connection not found')
    }

    // Check if token is expired and refresh if needed
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      console.log('Token expired, refreshing...', {
        connectionId,
        expiresAt: connector.tokenExpiresAt,
        now: new Date()
      })
      try {
        accessToken = await this.refreshAccessToken(connectionId)
        console.log('Token refreshed successfully')
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // If refresh fails, mark connection as expired and suggest reconnection
        await prisma.connector.update({
          where: { id: connectionId },
          data: { status: ConnectorStatus.EXPIRED }
        })
        throw new Error(`Token refresh failed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}. Please reconnect your account.`)
      }
    }

    // Make API call to get user info
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive user info error:', response.status, errorText)

      // Handle specific error cases
      if (response.status === 403) {
        throw new Error('Access denied. Please reconnect your Google Drive account to grant the required permissions.')
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please reconnect your Google Drive account.')
      }

      throw new Error(`Google Drive user info error: ${response.status}`)
    }

    const data = await response.json()

    return {
      email: data.user?.emailAddress || connector.email,
      name: data.user?.displayName || connector.name || '',
      picture: data.user?.photoLink,
      quotaBytesTotal: data.storageQuota?.limit || '0',
      quotaBytesUsed: data.storageQuota?.usage || '0'
    }
  }

  async refreshAccessToken(connectionId: string): Promise<string> {
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId }
    })

    if (!connector || !connector.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
        refresh_token: connector.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', response.status, errorText)

      // Handle specific Google OAuth errors
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error === 'invalid_grant') {
            throw new Error('Refresh token is invalid or expired. Please reconnect your account.')
          }
        } catch (parseError) {
          // If we can't parse the error, use the original error
        }
      }

      throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`)
    }

    const tokens = await response.json()
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000)

    // Update the connector with new token
    await prisma.connector.update({
      where: { id: connectionId },
      data: {
        accessToken: tokens.access_token,
        tokenExpiresAt: newExpiry,
        status: ConnectorStatus.ACTIVE
      }
    })

    return tokens.access_token
  }

  async downloadFile(connectionId: string, fileId: string): Promise<{
    stream: ReadableStream
    mimeType: string
    size: string
    name: string
  }> {
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId }
    })

    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // 1. Get file metadata first to know name/mimeType/size
    const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,size`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch file metadata: ${metadataResponse.status}`)
    }

    const metadata = await metadataResponse.json()

    // 2. Download content
    // Determine if it's a native Google format that needs export
    const GOOGLE_MIME_TYPES: Record<string, { exportMime: string; extension: string }> = {
      'application/vnd.google-apps.document': {
        exportMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx'
      },
      'application/vnd.google-apps.spreadsheet': {
        exportMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
      },
      'application/vnd.google-apps.presentation': {
        exportMime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx'
      }
    }

    const exportConfig = GOOGLE_MIME_TYPES[metadata.mimeType]

    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    let finalMimeType = metadata.mimeType
    let finalName = metadata.name

    if (exportConfig) {
      // It's a Google Doc/Sheet/Slide - use export
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportConfig.exportMime)}`
      finalMimeType = exportConfig.exportMime

      // Append extension if not present
      if (!finalName.toLowerCase().endsWith(`.${exportConfig.extension}`)) {
        finalName = `${finalName}.${exportConfig.extension}`
      }
    }

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive Download Error:', errorText)
      throw new Error(`Failed to download/export file stream: ${response.status} ${response.statusText} - ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body received from Google Drive')
    }

    // For exports, we CANNOT trust metadata.size because the export size is different.
    // And Google doesn't usually send Content-Length for exports (chunked).
    // So if exporting, force size to '0' or undefined so the API route omits Content-Length.
    const finalSize = exportConfig ? undefined : (metadata.size || response.headers.get('Content-Length') || '0')

    return {
      stream: response.body as unknown as ReadableStream,
      mimeType: finalMimeType,
      size: finalSize || '0',
      name: finalName
    }
  }
}

export const googleDriveConnector = GoogleDriveConnector.getInstance()
