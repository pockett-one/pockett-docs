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
  viewedByMeTime?: string
  activityCount?: number
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
  private readonly CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

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
        const escapedPattern = pattern.replace(/'/g, "\\'")
        const q = `name = '${escapedPattern}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
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
    const nameExclusions = ignoreParser.getPatterns().map(p => `not name = '${p.replace(/'/g, "\\'")}'`).join(' and ')
    const parentExclusions = ignoreIds.map(id => `not '${id.replace(/'/g, "\\'")}' in parents`).join(' and ')

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
    const nameExclusions = ignoreParser.getPatterns().map(p => `not name = '${p.replace(/'/g, "\\'")}'`).join(' and ')
    const parentExclusions = ignoreIds.map(id => `not '${id.replace(/'/g, "\\'")}' in parents`).join(' and ')

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

  async getMostAccessedFiles(connectionId: string, limit: number = 5): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // 1. Resolve Ignore IDs (Cached)
    const ignoreIds = await this.resolveIgnoreIds(connectionId, accessToken)

    // 2. Build Query
    const nameExclusions = ignoreParser.getPatterns().map(p => `not name = '${p.replace(/'/g, "\\'")}'`).join(' and ')
    const parentExclusions = ignoreIds.map(id => `not '${id.replace(/'/g, "\\'")}' in parents`).join(' and ')

    let query = 'trashed = false'
    if (nameExclusions) query += ` and ${nameExclusions}`
    if (parentExclusions) query += ` and ${parentExclusions}`

    const params = new URLSearchParams({
      pageSize: limit.toString(),
      fields: 'files(id, name, mimeType, modifiedTime, viewedByMeTime, createdTime, size, webViewLink, parents, lastModifyingUser(displayName, photoLink), owners(displayName, photoLink))',
      orderBy: 'viewedByMeTime desc',
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
      const errorText = await response.text()
      console.error('Failed to fetch accessed files:', response.status, errorText)
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

  async getRevisions(connectionId: string, fileId: string): Promise<any[]> {
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId }
    })

    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id,modifiedTime,keepForever,published,lastModifyingUser(displayName,photoLink),originalFilename,size,mimeType,exportLinks)&pageSize=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      // If 403, might be shared drive or permission issue, return empty
      if (response.status === 403) return []
      throw new Error(`Failed to fetch revisions: ${response.status}`)
    }

    const data = await response.json()
    return data.revisions || []
  }

  async downloadFile(connectionId: string, fileId: string, revisionId?: string): Promise<{
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

    // 1. Get metadata
    let metadata: any
    if (revisionId) {
      // Get revision metadata
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}?fields=originalFilename,mimeType,size,exportLinks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Failed to fetch revision metadata: ${response.status}`)
      const rev = await response.json()
      // Normalize to match file metadata structure
      metadata = {
        name: rev.originalFilename || `revision-${revisionId}`,
        mimeType: rev.mimeType,
        size: rev.size,
        exportLinks: rev.exportLinks
      }
    } else {
      // Get file metadata
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,size`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Failed to fetch file metadata: ${response.status}`)
      metadata = await response.json()
    }

    // 2. Download content
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

    let downloadUrl: string
    let finalMimeType = metadata.mimeType
    let finalName = metadata.name

    if (exportConfig) {
      // Google Doc/Sheet/Slide - use export
      finalMimeType = exportConfig.exportMime

      // Construct export URL
      if (revisionId) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}/export?mimeType=${encodeURIComponent(exportConfig.exportMime)}`
      } else {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportConfig.exportMime)}`
      }

      // Append extension
      if (!finalName.toLowerCase().endsWith(`.${exportConfig.extension}`)) {
        finalName = `${finalName}.${exportConfig.extension}`
      }
    } else {
      // Binary file - use direct download
      // For revisions: files/fileId/revisions/revisionId?alt=media
      // For head: files/fileId?alt=media
      const baseUrl = revisionId
        ? `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}`
        : `https://www.googleapis.com/drive/v3/files/${fileId}`

      downloadUrl = `${baseUrl}?alt=media`
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
    const finalSize = exportConfig ? undefined : (metadata.size || response.headers.get('Content-Length') || '0')

    return {
      stream: response.body as unknown as ReadableStream,
      mimeType: finalMimeType,
      size: finalSize || '0',
      name: finalName
    }
  }

  async getActivity(connectionId: string, fileId: string): Promise<any[]> {
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId }
    })

    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // Google Drive Activity API V2
    const response = await fetch('https://driveactivity.googleapis.com/v2/activity:query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemName: `items/${fileId}`,
        pageSize: 20 // Reasonable limit for a sidebar
      })
    })

    if (!response.ok) {
      // Handle common errors like scope missing gracefully
      const errorText = await response.text()
      console.error('Failed to fetch activity:', response.status, errorText)
      if (response.status === 403) {
        throw new Error("Missing 'drive.activity.readonly' scope. Please reconnect your account.")
      }
      throw new Error(`Failed to fetch activity: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const activities = data.activities || []

    // 2. Resolve Actor Names via People API
    // The Activity API often returns 'people/ACCOUNT_ID' as the personName without a display name.
    // We need to fetch the profiles to show real names.
    const uniquePeopleIds = new Set<string>()
    activities.forEach((act: any) => {
      act.actors?.forEach((actor: any) => {
        const personName = actor.user?.knownUser?.personName
        if (personName && personName.startsWith('people/')) {
          uniquePeopleIds.add(personName)
        }
      })
    })

    if (uniquePeopleIds.size > 0) {
      try {
        const peopleIds = Array.from(uniquePeopleIds)
        console.log('[People API] Attempting to resolve names for:', peopleIds)

        // Batch get people profiles
        // We can request up to 50 people in a single batch
        const batchParams = new URLSearchParams()
        batchParams.append('personFields', 'names')
        peopleIds.slice(0, 50).forEach(id => batchParams.append('resourceNames', id))

        const peopleResponse = await fetch(`https://people.googleapis.com/v1/people:batchGet?${batchParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })

        console.log('[People API] Response status:', peopleResponse.status)

        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json()
          console.log('[People API] Response data:', JSON.stringify(peopleData, null, 2))

          const peopleMap = new Map<string, string>()

          if (peopleData.responses) {
            peopleData.responses.forEach((r: any) => {
              const personId = r.requestedResourceName
              const displayName = r.person?.names?.[0]?.displayName

              if (personId && displayName) {
                peopleMap.set(personId, displayName)
              }
            })
          }

          // Hydrate activities with resolved names
          activities.forEach((act: any) => {
            act.actors?.forEach((actor: any) => {
              const personName = actor.user?.knownUser?.personName
              if (personName && peopleMap.has(personName)) {
                actor.user.knownUser.personName = peopleMap.get(personName)
              }
            })
          })
        } else {
          console.error('[People API] Failed to resolve names, status:', peopleResponse.status)
        }
      } catch (error) {
        console.error('[People API] Error resolving names:', error)
      }
    }

    return activities
  }

  async getMostActiveFiles(connectionId: string, limit: number = 5, timeRange: '24h' | '7d' | '30d' | '1y' = '7d'): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // Calculate time filter
    const now = new Date()
    let startTime = new Date()
    switch (timeRange) {
      case '24h': startTime.setDate(now.getDate() - 1); break;
      case '7d': startTime.setDate(now.getDate() - 7); break;
      case '30d': startTime.setDate(now.getDate() - 30); break;
      case '1y': startTime.setFullYear(now.getFullYear() - 1); break;
      default: startTime.setDate(now.getDate() - 7);
    }
    const timeFilter = `time > "${startTime.toISOString()}"`
    const actionFilter = "detail.action_detail_case:(Edit OR Comment OR Rename OR Create OR Move)"

    // 1. Fetch Global Activity Stream (for counts)
    const activityPromise = (async () => {
      try {
        const res = await fetch('https://driveactivity.googleapis.com/v2/activity:query', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pageSize: 50,
            filter: `${timeFilter}` // Removed action filter to be broader
          })
        })
        if (!res.ok) return []
        const d = await res.json()
        return d.activities || []
      } catch (e) {
        console.error('Activity API fetch failed', e)
        return []
      }
    })()

    // 2. Fetch Files by ViewedByMeTime (for "Accessed" coverage)
    // This ensures we show files even if they were just viewed and not edited
    const viewedFilesPromise = (async () => {
      try {
        const q = `viewedByMeTime > '${startTime.toISOString()}' and trashed = false`
        // Ensure we fetch enough files to cover the requested limit, plus a buffer for overlap
        const fetchSize = Math.max(limit * 2, 50).toString()
        const params = new URLSearchParams({
          pageSize: fetchSize,
          fields: 'files(id, name, mimeType, modifiedTime, viewedByMeTime, size, webViewLink, iconLink)',
          orderBy: 'viewedByMeTime desc',
          q: q
        })
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (!res.ok) return []
        const d = await res.json()
        return d.files || []
      } catch (e) {
        console.error('Viewed files fetch failed', e)
        return []
      }
    })()

    const [activities, viewedFiles] = await Promise.all([activityPromise, viewedFilesPromise])

    // 3. Aggregate Activity Counts
    const fileStats = new Map<string, { count: number, lastActivity: string }>()

    // Process activities
    activities.forEach((act: any) => {
      if (!act.targets) return
      const target = act.targets[0]
      if (!target.driveItem || !target.driveItem.name) return

      const fileId = target.driveItem.name.replace('items/', '')
      const timestamp = act.timestamp

      if (!fileStats.has(fileId)) {
        fileStats.set(fileId, { count: 0, lastActivity: timestamp })
      }
      const entry = fileStats.get(fileId)!
      entry.count += 1
      if (new Date(timestamp) > new Date(entry.lastActivity)) {
        entry.lastActivity = timestamp
      }
    })

    // 4. Merge Viewed Files with Activity Stats
    const allFileIds = new Set<string>()
    fileStats.forEach((_, key) => allFileIds.add(key))
    viewedFiles.forEach((f: any) => allFileIds.add(f.id))

    const mergedFiles: GoogleDriveFile[] = []

    // We need metadata for activity-only files. Viewed files already have metadata.
    // Identify IDs that are in fileStats but NOT in viewedFiles
    const neededMetadataIds: string[] = []
    fileStats.forEach((_, id) => {
      if (!viewedFiles.find((f: any) => f.id === id)) {
        neededMetadataIds.push(id)
      }
    })

    // Batch fetch missing metadata (if any)
    const extraFilesMap = new Map<string, any>()
    if (neededMetadataIds.length > 0) {
      // Simple sequential fetch for missing items (or could optimize with batch, but slicing to limit for now)
      for (let i = 0; i < Math.min(neededMetadataIds.length, 5); i++) {
        const id = neededMetadataIds[i]
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,modifiedTime,viewedByMeTime,size,webViewLink,iconLink`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          if (res.ok) {
            const d = await res.json()
            extraFilesMap.set(id, d)
          }
        } catch { }
      }
    }

    // Construct final list
    allFileIds.forEach((id) => {
      const viewedFile = viewedFiles.find((f: any) => f.id === id)
      const extraFile = extraFilesMap.get(id)
      const fileData = viewedFile || extraFile

      if (fileData) {
        const stats = fileStats.get(id)
        mergedFiles.push({
          ...fileData,
          // Prefer activity time if newer, else view time, else modified
          viewedByMeTime: stats?.lastActivity || fileData.viewedByMeTime || fileData.modifiedTime,
          activityCount: stats?.count || 0
        })
      }
    })

    // 5. Custom Sort: Weighted Score? Or just simple sort?
    // User wants "Most Accessed".
    // Let's sort by: Activity Count DESC, then Viewed Time DESC
    return mergedFiles
      .sort((a, b) => {
        const countA = a.activityCount || 0
        const countB = b.activityCount || 0
        if (countA !== countB) return countB - countA // Higher activity first

        const timeA = a.viewedByMeTime ? new Date(a.viewedByMeTime).getTime() : 0
        const timeB = b.viewedByMeTime ? new Date(b.viewedByMeTime).getTime() : 0
        return timeB - timeA // More recent view/activity second
      })
      .slice(0, limit)
  }
}

export const googleDriveConnector = GoogleDriveConnector.getInstance()
