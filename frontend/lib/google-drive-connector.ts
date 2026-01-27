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
  size?: string | number
  webViewLink?: string
  iconLink?: string
  owners?: {
    displayName: string
    photoLink?: string
    emailAddress?: string
  }[]
  parents?: string[]
  viewedByMeTime?: string
  sharedTime?: string
  activityCount?: number
  badges?: {
    type: 'risk' | 'attention' | 'cleanup' | 'sensitive' | 'stale'
    text: string
  }[]
}

import fs from 'fs'
import path from 'path'

const log = (msg: string) => {
  try {
    const logPath = path.join(process.cwd(), 'debug-connector.txt')
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`)
  } catch (e) { console.error(e) }
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

  async testConnection(connectionId: string): Promise<any> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // 1. Fetch User Info & Quota
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (!aboutRes.ok) throw new Error('Failed to fetch user info')
    const aboutData = await aboutRes.json()

    // 2. Fetch Recent Files (Validation)
    const filesRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=5&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size)', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (!filesRes.ok) throw new Error('Failed to fetch files')
    const filesData = await filesRes.json()

    return {
      userInfo: {
        email: aboutData.user.emailAddress,
        name: aboutData.user.displayName,
        quotaBytesUsed: aboutData.storageQuota?.usage || '0',
        quotaBytesTotal: aboutData.storageQuota?.limit || '0'
      },
      files: filesData.files || [],
      totalFiles: filesData.files?.length || 0 // This is just recent count, real total requires active scanning which is expensive
    }
  }

  async getConnections(organizationId: string): Promise<GoogleDriveConnection[]> {
    log(`getConnections called for org: ${organizationId}`)
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
    log(`Found ${connectors.length} connectors`)

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

  async recursivelyImportFiles(connectionId: string, fileIds: string[]): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const importedFiles: GoogleDriveFile[] = []

    // Recursive function with logging and robust params
    const fetchRecursively = async (ids: string[]) => {
      console.log(`[Import] Processing IDs: ${ids.join(', ')}`)

      for (const id of ids) {
        try {
          // 1. Fetch Metadata (Simplified fields + supportsAllDrives)
          const params = new URLSearchParams({
            fields: 'id, name, mimeType, size, modifiedTime, webViewLink, parents',
            supportsAllDrives: 'true'
          })

          const url = `https://www.googleapis.com/drive/v3/files/${id}?${params}`
          console.log(`[Import] Fetching: ${url}`)

          const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })

          if (!res.ok) {
            console.error(`[Import] Failed to fetch file ${id} - Status: ${res.status} ${res.statusText}`)
            const errBody = await res.text()
            console.error(`[Import] Error Body: ${errBody}`)
            continue
          }

          const file = await res.json()
          console.log(`[Import] Successfully fetched: ${file.name} (${file.mimeType})`)

          // Add to result list
          importedFiles.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            size: file.size,
            webViewLink: file.webViewLink,
            owners: [], // Skip owners to be safe
            parents: file.parents,
            sharedTime: file.modifiedTime
          })

          // 2. If Folder, fetch children
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            console.log(`[Import] ${file.name} is a folder. Listing children...`)

            const q = `'${id}' in parents and trashed = false`
            const childParams = new URLSearchParams({
              q: q,
              fields: 'files(id, name)',
              pageSize: '1000',
              supportsAllDrives: 'true',
              includeItemsFromAllDrives: 'true'
            })

            const childUrl = `https://www.googleapis.com/drive/v3/files?${childParams}`
            const childRes = await fetch(childUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })

            if (childRes.ok) {
              const childData = await childRes.json()
              const childIds = childData.files?.map((f: any) => f.id) || []
              console.log(`[Import] Found ${childIds.length} children in ${file.name}`)

              if (childIds.length > 0) {
                await fetchRecursively(childIds)
              }
            } else {
              console.error(`[Import] Failed to list children of folder ${id}: ${childRes.status}`)
              console.error(await childRes.text())
            }
          }

        } catch (e) {
          console.error(`[Import] Exception processing ${id}`, e)
        }
      }
    }

    await fetchRecursively(fileIds)
    console.log(`[Import] Completed. Total imported: ${importedFiles.length}`)
    return importedFiles
  }

  async removeConnection(connectionId: string): Promise<void> {
    // Completely remove the connector from the database
    await prisma.connector.delete({
      where: { id: connectionId }
    })
  }

  /**
   * Ensures the App Folder structure exists for a given connection
   * Structure: .pockett -> <Organization> -> <Client> -> <Project>
   */
  async ensureAppFolderStructure(connectionId: string, clientName: string, projectName?: string): Promise<{ rootId: string, orgId: string, clientId: string, projectId?: string }> {
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId },
      include: { organization: true }
    })

    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const settings = (connector.settings as any) || {}
    let rootFolderId = settings.rootFolderId
    let orgFolderId = settings.orgFolderId
    let clientFolderId = settings.clientFolderIds?.[clientName]
    let projectFolderId = projectName ? settings.projectFolderIds?.[projectName] : undefined

    // 1. Ensure Root Folder (.pockett)
    // If we have a parent configured (from Picker), use it. Otherwise search in root.
    const parentId = settings.parentFolderId || undefined // undefined means root in findOrCreate

    if (!rootFolderId) {
      rootFolderId = await this.findOrCreateFolder(accessToken, '.pockett', parentId ? [parentId] : undefined, {
        description: 'System Root',
        appProperties: { source: 'pockett', type: 'system_root' },
        folderColorRgb: '#7F56D9'
      })
    } else {
      const exists = await this.checkFileExists(accessToken, rootFolderId)
      if (!exists) rootFolderId = await this.findOrCreateFolder(accessToken, '.pockett', parentId ? [parentId] : undefined, {
        description: 'System Root',
        appProperties: { source: 'pockett', type: 'system_root' },
        folderColorRgb: '#7F56D9'
      })
    }

    // 2. Ensure Organization Folder
    if (!orgFolderId) {
      orgFolderId = await this.findOrCreateFolder(accessToken, connector.organization.name, [rootFolderId], {
        description: 'Organization',
        appProperties: { source: 'pockett', type: 'organization', orgId: connector.organization.id },
        folderColorRgb: '#7F56D9'
      })
    } else {
      const exists = await this.checkFileExists(accessToken, orgFolderId)
      if (!exists) orgFolderId = await this.findOrCreateFolder(accessToken, connector.organization.name, [rootFolderId], {
        description: 'Organization',
        appProperties: { source: 'pockett', type: 'organization', orgId: connector.organization.id },
        folderColorRgb: '#7F56D9'
      })
    }

    // 3. Ensure Client Folder
    if (!clientFolderId && clientName) {
      clientFolderId = await this.findOrCreateFolder(accessToken, clientName, [orgFolderId], {
        description: 'Client',
        appProperties: { source: 'pockett', type: 'client', clientName },
        folderColorRgb: '#7F56D9'
      })
    } else if (clientFolderId) {
      const exists = await this.checkFileExists(accessToken, clientFolderId)
      if (!exists) clientFolderId = await this.findOrCreateFolder(accessToken, clientName, [orgFolderId], {
        description: 'Client',
        appProperties: { source: 'pockett', type: 'client', clientName },
        folderColorRgb: '#7F56D9'
      })
    }

    // 4. Ensure Project Folder (Optional)
    if (projectName && clientFolderId) {
      if (!projectFolderId) {
        projectFolderId = await this.findOrCreateFolder(accessToken, projectName, [clientFolderId], {
          description: 'Project',
          appProperties: { source: 'pockett', type: 'project', projectName },
          folderColorRgb: '#7F56D9'
        })
      } else {
        const exists = await this.checkFileExists(accessToken, projectFolderId)
        if (!exists) projectFolderId = await this.findOrCreateFolder(accessToken, projectName, [clientFolderId], {
          description: 'Project',
          appProperties: { source: 'pockett', type: 'project', projectName },
          folderColorRgb: '#7F56D9'
        })
      }
    }

    // Update settings in DB
    const newSettings = {
      ...settings,
      rootFolderId,
      orgFolderId,
      clientFolderIds: {
        ...(settings.clientFolderIds || {}),
        [clientName]: clientFolderId
      }
    }

    if (projectName && projectFolderId) {
      newSettings.projectFolderIds = {
        ...(settings.projectFolderIds || {}),
        [projectName]: projectFolderId
      }
    }

    await prisma.connector.update({
      where: { id: connectionId },
      data: {
        settings: newSettings
      }
    })

    // Sync LinkedFiles for Client
    if (clientFolderId) {
      const clientMetadata = { description: 'Client', appProperties: { source: 'pockett', type: 'client', clientName } }
      await prisma.linkedFile.upsert({
        where: { connectorId_fileId: { connectorId: connectionId, fileId: clientFolderId } },
        update: { isGrantRevoked: false, linkedAt: new Date(), metadata: clientMetadata },
        create: { connectorId: connectionId, fileId: clientFolderId, isGrantRevoked: false, metadata: clientMetadata }
      })
    }

    // Sync LinkedFiles for Project
    if (projectName && projectFolderId) {
      const projectMetadata = { description: 'Project', appProperties: { source: 'pockett', type: 'project', projectName } }
      await prisma.linkedFile.upsert({
        where: { connectorId_fileId: { connectorId: connectionId, fileId: projectFolderId } },
        update: { isGrantRevoked: false, linkedAt: new Date(), metadata: projectMetadata },
        create: { connectorId: connectionId, fileId: projectFolderId, isGrantRevoked: false, metadata: projectMetadata }
      })
    }

    return { rootId: rootFolderId, orgId: orgFolderId, clientId: clientFolderId, projectId: projectFolderId }
  }

  async setupOrgFolder(connectionId: string, parentFolderId: string): Promise<{ rootId: string, orgId: string }> {
    const connector = await prisma.connector.findUnique({
      where: { id: connectionId },
      include: { organization: true }
    })

    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // 1. Create/Find .pockett inside the selected parent
    const rootMetadata = {
      description: 'System Root',
      appProperties: { source: 'pockett', type: 'system_root' },
      folderColorRgb: '#7F56D9'
    }
    const rootFolderId = await this.findOrCreateFolder(accessToken, '.pockett', [parentFolderId], rootMetadata)

    // 2. Create/Find Organization Folder inside .pockett
    // Uses the Organization Name directly (human readable)
    const orgMetadata = {
      description: 'Organization',
      appProperties: { source: 'pockett', type: 'organization', orgId: connector.organization.id },
      folderColorRgb: '#7F56D9'
    }
    const orgFolderId = await this.findOrCreateFolder(accessToken, connector.organization.name, [rootFolderId], orgMetadata)

    // 3. Update Connector Settings
    const settings = (connector.settings as any) || {}
    await prisma.connector.update({
      where: { id: connectionId },
      data: {
        settings: {
          ...settings,
          rootFolderId, // .pockett ID
          orgFolderId,  // Org Name ID
          parentFolderId // The User selected "My Drive" or "Shared Drive" ID
        }
      }
    })

    // 4. Create LinkedFile records
    // Selected Parent
    await prisma.linkedFile.upsert({
      where: {
        connectorId_fileId: {
          connectorId: connectionId,
          fileId: parentFolderId
        }
      },
      update: {
        isGrantRevoked: false,
        linkedAt: new Date(),
        metadata: { description: 'User Selected Root' }
      },
      create: {
        connectorId: connectionId,
        fileId: parentFolderId,
        isGrantRevoked: false,
        metadata: { description: 'User Selected Root' }
      }
    })

    // System Root (.pockett)
    await prisma.linkedFile.upsert({
      where: {
        connectorId_fileId: {
          connectorId: connectionId,
          fileId: rootFolderId
        }
      },
      update: {
        isGrantRevoked: false,
        linkedAt: new Date(),
        metadata: rootMetadata
      },
      create: {
        connectorId: connectionId,
        fileId: rootFolderId,
        isGrantRevoked: false,
        metadata: rootMetadata
      }
    })

    // Organization Folder
    await prisma.linkedFile.upsert({
      where: {
        connectorId_fileId: {
          connectorId: connectionId,
          fileId: orgFolderId
        }
      },
      update: {
        isGrantRevoked: false,
        linkedAt: new Date(),
        metadata: orgMetadata
      },
      create: {
        connectorId: connectionId,
        fileId: orgFolderId,
        isGrantRevoked: false,
        metadata: orgMetadata
      }
    })

    return { rootId: rootFolderId, orgId: orgFolderId }
  }

  private async checkFileExists(accessToken: string, fileId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id&supportsAllDrives=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      return res.status === 200
    } catch {
      return false
    }
  }

  /**
   * Common utility to create a file or folder in Google Drive
   */
  private async createDriveFile(
    accessToken: string,
    params: {
      name: string,
      mimeType: string,
      parents?: string[],
      description?: string,
      appProperties?: any,
      folderColorRgb?: string
    }
  ): Promise<any> {
    const body: any = {
      name: params.name,
      mimeType: params.mimeType,
      description: params.description,
      appProperties: params.appProperties,
      folderColorRgb: params.folderColorRgb
    }

    if (params.parents && params.parents.length > 0) {
      body.parents = params.parents
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Failed to create file ${params.name}: ${res.status} - ${err}`)
    }

    return await res.json()
  }

  private async findOrCreateFolder(accessToken: string, name: string, parents?: string[], metadata?: { description?: string, appProperties?: any, folderColorRgb?: string }): Promise<string> {
    // 1. Search
    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and trashed = false`
    if (parents && parents.length > 0) {
      query += ` and '${parents[0]}' in parents`
    }

    // supportsAllDrives=true & includeItemsFromAllDrives=true are required for Shared Drives
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (searchRes.ok) {
      const data = await searchRes.json()
      if (data.files && data.files.length > 0) {
        return data.files[0].id
      }
    }

    // 2. Create using utility
    const folder = await this.createDriveFile(accessToken, {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents,
      ...metadata
    })

    return folder.id
  }

  // Cache for ignored folder IDs per connection
  private ignoreCache = new Map<string, { ids: string[]; timestamp: number }>()
  private readonly CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

  /**
   * Helper function to calculate badges for a file based on permissions and content
   */
  private calculateBadges(file: any): { type: 'risk' | 'attention' | 'sensitive' | 'stale', text: string }[] {
    const badges: { type: 'risk' | 'attention' | 'sensitive' | 'stale', text: string }[] = []

    // 🔴 RISK Badges
    const isPublic = file.permissions?.some((p: any) => p.type === 'anyone')
    const isPublicEditor = file.permissions?.some((p: any) => p.type === 'anyone' && (p.role === 'writer' || p.role === 'owner'))

    if (isPublicEditor) {
      badges.push({ type: 'risk', text: 'Anyone with link can edit' })
    } else if (isPublic) {
      badges.push({ type: 'risk', text: 'Publicly Shared' })
    }

    // 🟡 ATTENTION Badges
    // Ideally we check for external domains here. 
    // For now, let's leave ATTENTION for non-public but broadly shared files if we can detect them, 
    // or just ensure SENSITIVE is distinct.

    // 🟣 SENSITIVE Badges (Content-based)
    const lowerName = (file.name || '').toLowerCase()
    if (/(password|credentials|\.env|secret|config|key|token|auth|private|id_rsa|contract|invoice|agreement|nda|tax|visa|insurance|passport|forex|ticket|medical|health|prescription|diagnosis|hospital|bank|account|statement|salary|payroll|w2|1099|ssn|social|credit|loan|mortgage|license|driver|birth|certificate|aadhar|aadhaar|pan|resume|cv|offer|employment|termination|resignation|confidential|personal|sensitive)/i.test(lowerName)) {
      badges.push({ type: 'sensitive', text: 'May contain sensitive content' })
    }

    return badges
  }



  /**
   * Helper function to fetch activity data for specific file IDs
   * Returns activities for the given file IDs within the specified time range
   */
  private async getActivityForFiles(accessToken: string, fileIds: string[], timeRange: '4w' | 'all' = '4w'): Promise<any[]> {
    if (fileIds.length === 0) return []

    try {
      // Determine time filter based on timeRange
      let filter = ''
      if (timeRange === '4w') {
        const fourWeeksAgo = new Date()
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
        const startTimeIso = fourWeeksAgo.toISOString()
        filter = `time > "${startTimeIso}"`
      } else {
        // For 'all', fetch activities from last 90 days (for badge calculation)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const startTimeIso = ninetyDaysAgo.toISOString()
        filter = `time > "${startTimeIso}"`
      }

      // Fetch all activities in the timeframe
      // We'll filter by file IDs after fetching
      const res = await fetch('https://driveactivity.googleapis.com/v2/activity:query', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageSize: 500, // Fetch enough activities
          filter: filter
        })
      })

      if (!res.ok) {
        console.error('Activity API error:', res.status, res.statusText)
        return []
      }

      const data = await res.json()
      const allActivities = data.activities || []

      // Filter activities to only include those for our file IDs
      const fileIdSet = new Set(fileIds)
      return allActivities.filter((activity: any) => {
        const fileId = activity.targets?.[0]?.driveItem?.name?.replace('items/', '')
        return fileId && fileIdSet.has(fileId)
      })
    } catch (error) {
      console.error('Error fetching activity for files:', error)
      return []
    }
  }



  async getStorageFiles(
    connectionId: string,
    limit: number = 100,
    sizeRange: '0.5-1' | '1-5' | '5-10' | '10+' = '0.5-1',
    timeRange: '4w' | 'all' = '4w'
  ): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const params = new URLSearchParams({
      pageSize: Math.min(limit * 5, 1000).toString(), // Fetch more to filter client-side, max 1000
      q: "trashed = false",
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, viewedByMeTime, size, webViewLink, owners(displayName, emailAddress, photoLink), permissions, shared, parents)",
      orderBy: "quotaBytesUsed desc"
    })

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Storage API] Google Drive error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        query: params.toString()
      })
      throw new Error(`Google Drive API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const files = data.files || []

    // Parse size range to min/max bytes
    let minSize: number, maxSize: number
    switch (sizeRange) {
      case '0.5-1':
        minSize = 524288000 // 0.5GB
        maxSize = 1073741824 // 1GB
        break
      case '1-5':
        minSize = 1073741824 // 1GB
        maxSize = 5368709120 // 5GB
        break
      case '5-10':
        minSize = 5368709120 // 5GB
        maxSize = 10737418240 // 10GB
        break
      case '10+':
        minSize = 10737418240 // 10GB
        maxSize = Infinity
        break
    }

    // Filter files by size range client-side
    let largeFiles = files.filter((f: any) => {
      const fileSize = parseInt(f.size || '0')
      return fileSize >= minSize && (maxSize === Infinity ? true : fileSize < maxSize)
    })

    // Filter by timeframe using Metadata instead of Activity API
    if (timeRange === '4w') {
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

      // Filter files that have activity (modified or viewed) in last 4 weeks
      largeFiles = largeFiles.filter((f: any) => {
        const lastActivityStr = f.viewedByMeTime || f.modifiedTime
        if (!lastActivityStr) return false
        const lastActivity = new Date(lastActivityStr)
        return lastActivity > fourWeeksAgo
      })
    }

    // Sort by size descending (largest first)
    largeFiles.sort((a: any, b: any) => {
      const sizeA = parseInt(a.size || '0')
      const sizeB = parseInt(b.size || '0')
      return sizeB - sizeA // Descending order
    })

    // Fetch activity data for last 90 days to determine CLEANUP badges
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const fileIds = largeFiles.slice(0, limit).map((f: any) => f.id)
    const activities90d = await this.getActivityForFiles(accessToken, fileIds, 'all') // Fetch all activities

    // Create a map of fileId -> most recent activity timestamp for badge calculation
    const activityMapForBadges = new Map<string, Date>()
    activities90d.forEach((activity: any) => {
      const fileId = activity.targets?.[0]?.driveItem?.name?.replace('items/', '')
      const timestamp = activity.timestamp ? new Date(activity.timestamp) : null

      if (fileId && timestamp) {
        const existing = activityMapForBadges.get(fileId)
        if (!existing || timestamp > existing) {
          activityMapForBadges.set(fileId, timestamp)
        }
      }
    })

    return largeFiles.slice(0, limit).map((f: any) => {
      const badges = []

      // 🔴 STALE Badge: Large file with no activity in 90+ days
      // Using Activity API data for accurate inactivity detection
      const lastActivity = activityMapForBadges.get(f.id)
      const isInactive = !lastActivity || lastActivity < ninetyDaysAgo

      if (isInactive) {
        badges.push({ type: 'stale', text: 'No activity in 90+ days' })
      }

      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
        size: f.size,
        webViewLink: f.webViewLink,
        source: 'Google Drive',
        // Use last activity timestamp from Activity API, fallback to modifiedTime
        activityTimestamp: lastActivity ? lastActivity.toISOString() : f.modifiedTime,
        lastAction: 'Large File',
        lastViewedTime: f.modifiedTime, // Using modifiedTime as fallback
        owners: f.owners,
        permissions: f.permissions,
        shared: f.shared,
        badges: badges,
        sharedTime: f.sharedWithMeTime || f.modifiedTime,
        parents: f.parents
      } as GoogleDriveFile
    })
  }

  async getSharedFiles(connectionId: string, limit: number = 10): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const params = new URLSearchParams({
      pageSize: Math.min(limit * 2, 1000).toString(),
      q: "sharedWithMe = true and trashed = false",
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, sharedWithMeTime, size, webViewLink, owners(displayName, emailAddress, photoLink), permissions, shared, parents)",
      orderBy: "sharedWithMeTime desc"
    })

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`)
    }

    const data = await response.json()
    const files = data.files || []

    // Map files with badge computation
    const allFiles = files.map((f: any) => {
      // Compute security badges
      const badges = this.calculateBadges(f)


      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: f.sharedWithMeTime || f.modifiedTime,
        size: f.size,
        webViewLink: f.webViewLink,
        source: 'Google Drive',
        activityTimestamp: f.sharedWithMeTime || f.modifiedTime,
        lastAction: 'Shared With You',
        actorEmail: f.owners?.[0]?.emailAddress,
        owners: f.owners,
        permissions: f.permissions,
        shared: f.shared,
        badges: badges,
        sharedTime: f.sharedWithMeTime || f.modifiedTime,
        parents: f.parents
      } as GoogleDriveFile
    })

    // Filter to show only actionable files:
    // 1. Files with badges (RISK or ATTENTION)
    // 2. Files shared in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const actionableFiles = allFiles.filter((file: any) => {
      const hasBadge = file.badges && file.badges.length > 0
      const isRecent = file.sharedTime && new Date(file.sharedTime) > thirtyDaysAgo
      return hasBadge || isRecent
    })

    return allFiles.slice(0, limit)  // TEMP: Show all shared files instead of actionableFiles
  }

  async getSharedByMeFiles(connectionId: string, limit: number = 10): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const params = new URLSearchParams({
      pageSize: Math.min(limit * 2, 1000).toString(),
      q: "'me' in owners and trashed = false",
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, owners(displayName, emailAddress, photoLink), permissions, shared, parents)",
      orderBy: "modifiedTime desc"
    })

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`)
    }

    const data = await response.json()
    const files = data.files || []

    // Filter to only include files that are actually shared
    const sharedFiles = files.filter((f: any) => f.shared === true)

    // Map files with badge computation
    const allFiles = sharedFiles.map((f: any) => {
      // Compute security badges
      const badges = this.calculateBadges(f)

      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
        size: f.size ? parseInt(f.size) : 0,
        webViewLink: f.webViewLink,
        source: 'Google Drive',
        activityTimestamp: f.modifiedTime,
        lastAction: 'Shared By You',
        owners: f.owners,
        permissions: f.permissions,
        shared: f.shared,
        badges: badges,
        sharedTime: f.modifiedTime,
        parents: f.parents
      } as GoogleDriveFile
    })

    // Filter to show only actionable files:
    // 1. Files with badges (RISK or ATTENTION)
    // 2. Files shared in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const actionableFiles = allFiles.filter((file: any) => {
      const hasBadge = file.badges && file.badges.length > 0
      const isRecent = file.sharedTime && new Date(file.sharedTime) > thirtyDaysAgo
      return hasBadge || isRecent
    })

    return allFiles.slice(0, limit)  // TEMP: Show all shared files instead of actionableFiles
  }

  // Helper to re-check ignore IDs
  async resolveIgnoreIds(connectionId: string, accessToken: string): Promise<string[]> {
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

  async getMostRecentFiles(connectionId: string, limit: number = 5, timeRange: '24h' | '7d' | '1w' | '2w' | '30d' | '4w' | '1y' = '7d', minSize?: number, userEmail?: string): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')

    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const now = new Date()
    let startTime = new Date()
    switch (timeRange) {
      case '24h': startTime.setDate(now.getDate() - 1); break;
      case '7d': startTime.setDate(now.getDate() - 7); break;
      case '1w': startTime.setDate(now.getDate() - 7); break;
      case '2w': startTime.setDate(now.getDate() - 14); break;
      case '4w': startTime.setDate(now.getDate() - 28); break;
      case '30d': startTime.setDate(now.getDate() - 30); break;
      case '1y': startTime.setFullYear(now.getFullYear() - 1); break;
      default: startTime.setDate(now.getDate() - 7);
    }
    const startTimeIso = startTime.toISOString()

    // 1. Fetch "Viewed" Files (Files API)
    const viewedFilesPromise = (async () => {
      try {
        const q = `viewedByMeTime > '${startTimeIso}' and trashed = false`
        const params = new URLSearchParams({
          pageSize: limit.toString(), // Fetch closer to limit
          fields: 'files(id, name, mimeType, modifiedTime, viewedByMeTime, size, webViewLink, parents, owners(displayName, emailAddress, photoLink), permissions, shared)',
          orderBy: 'viewedByMeTime desc',
          q: q
        })
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.files || []
      } catch (e) {
        console.error('Files API Error (Viewed)', e)
        return []
      }
    })()

    // 2. Fetch "Modified" Files (Files API)
    const modifiedFilesPromise = (async () => {
      try {
        const q = `modifiedTime > '${startTimeIso}' and trashed = false`
        const params = new URLSearchParams({
          pageSize: limit.toString(),
          fields: 'files(id, name, mimeType, modifiedTime, viewedByMeTime, size, webViewLink, parents, owners(displayName, emailAddress, photoLink), permissions, shared)',
          orderBy: 'modifiedTime desc',
          q: q
        })
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.files || []
      } catch (e) {
        console.error('Files API Error (Modified)', e)
        return []
      }
    })()

    const [viewedFiles, modifiedFiles] = await Promise.all([viewedFilesPromise, modifiedFilesPromise])

    // 3. Merge & Deduplicate
    const combined = new Map<string, any>()

    const processFiles = (files: any[], actionType: string) => {
      files.forEach((f: any) => {
        const existing = combined.get(f.id)
        const timestamp = actionType === 'Viewed' ? f.viewedByMeTime : f.modifiedTime

        if (!timestamp) return

        let fileData = {
          ...f,
          activityTimestamp: timestamp,
          lastAction: actionType,
          parents: f.parents,
          owners: f.owners
        }

        if (existing) {
          if (new Date(timestamp) > new Date(existing.activityTimestamp)) {
            fileData = { ...existing, ...f, activityTimestamp: timestamp, lastAction: actionType }
          } else {
            fileData = existing
          }
        }
        combined.set(f.id, fileData)
      })
    }

    processFiles(viewedFiles, 'Viewed')
    processFiles(modifiedFiles, 'Edited')

    // 4. Sort and Return
    let sorted = Array.from(combined.values()).sort((a, b) => {
      return new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime()
    })

    if (minSize) {
      sorted = sorted.filter(f => f.size && parseInt(f.size) > minSize)
    }

    return sorted.slice(0, limit).map((f: any) => ({
      ...f,
      parentName: undefined,
      actorEmail: f.owners?.[0]?.emailAddress
    }))
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


  async getStorageQuota(connectionId: string): Promise<{ limit: string, usage: string, usageInDrive: string, usageInTrash: string } | null> {
    try {
      const connector = await prisma.connector.findUnique({
        where: { id: connectionId }
      })

      if (!connector) return null

      // Refresh token if needed
      let accessToken = connector.accessToken
      if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
        try {
          accessToken = await this.refreshAccessToken(connectionId)
        } catch (e) {
          console.error('Failed to refresh token for quota', e)
          return null
        }
      }

      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.storageQuota || null
    } catch (error) {
      console.error('Failed to fetch storage quota', error)
      return null
    }
  }

  /**
   * Helper to get or refresh access token
   */
  public async getAccessToken(connectionId: string): Promise<string | null> {
    try {
      const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
      if (!connector) return null

      if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
        return this.refreshAccessToken(connectionId)
      }
      return connector.accessToken
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }

  /**
   * Moves a file to trash
   */
  async trashFile(connectorId: string, fileId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(connectorId)
      if (!accessToken) throw new Error('Could not get access token')

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trashed: true })
      })

      return res.ok
    } catch (error) {
      console.error('Failed to trash file:', error)
      return false
    }
  }

  /**
   * Identifies potential duplicate files based on name and size
   */
  async getDuplicateFiles(connectorId: string, limit: number = 20): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken(connectorId)
      if (!accessToken) return []

      // 1. Fetch recent files (fetch a large batch to increase chance of finding duplicates)
      // fields: need md5Checksum, size, name
      const fields = 'files(id, name, size, md5Checksum, mimeType, modifiedTime, webViewLink, iconLink, parents, permissions, shared)'
      const params = new URLSearchParams({
        pageSize: '500',
        fields: fields,
        orderBy: 'modifiedTime desc', // Check recent files first
        q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'"
      })

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (!res.ok) return []
      const data = await res.json()
      const files = data.files || []

      // 2. Group by Signature (MD5 or Name+Size)
      const groups = new Map<string, any[]>()

      files.forEach((f: any) => {
        // Create a signature
        // specific preference for md5Checksum if available, otherwise name+size
        let signature = ''
        if (f.md5Checksum) {
          signature = f.md5Checksum
        } else if (f.size && f.name) {
          signature = `${f.name}_${f.size}`
        } else {
          return // Skip if no robust way to identify
        }

        if (!groups.has(signature)) {
          groups.set(signature, [])
        }
        groups.get(signature)?.push({
          id: f.id,
          name: f.name,
          size: f.size ? parseInt(f.size) : 0,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
          webViewLink: f.webViewLink,
          iconLink: f.iconLink,
          badges: this.calculateBadges(f)
        })
      })

      // 3. Filter for groups with > 1 file
      const result: any[] = []
      groups.forEach((groupFiles, signature) => {
        if (groupFiles.length > 1) {
          result.push({
            signature,
            files: groupFiles,
            count: groupFiles.length,
            representativeFile: groupFiles[0], // For UI display
            totalSize: groupFiles.reduce((acc, f) => acc + f.size, 0)
          })
        }
      })

      // Return top duplicate groups by potential savings (total size)
      return result.sort((a, b) => b.totalSize - a.totalSize).slice(0, limit)

    } catch (error) {
      console.error('Failed to get duplicate files:', error)
      return []
    }
  }

  /**
   * Revokes a permission on a file
   */
  async revokePermission(connectorId: string, fileId: string, permissionId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(connectorId)
      if (!accessToken) throw new Error('Could not get access token')

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      return res.ok || res.status === 204
    } catch (error) {
      console.error('Failed to revoke permission:', error)
      return false
    }
  }

  /**
   * Updates permission expiration time
   */
  async updatePermissionExpiry(connectorId: string, fileId: string, permissionId: string, expirationTime: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(connectorId)
      if (!accessToken) throw new Error('Could not get access token')

      // Must be a date string ISO
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirationTime })
      })

      return res.ok
    } catch (error) {
      console.error('Failed to update permission:', error)
      return false
    }
  }

  /**
   * Fetches stale files (not accessed in > 90 days)
   * Matches the logic used in the Summary card:
   * 1. Fetches samples from Recent, Shared, and Storage
   * 2. Filters in-memory using viewedByMeTime || modifiedTime
   */
  async getStaleFiles(connectionId: string, limit: number = 50): Promise<GoogleDriveFile[]> {
    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)
    const sixMonthsAgoIso = sixMonthsAgo.toISOString()

    // Direct Query: "modifiedTime < 90 days ago" (Candidate set)
    // We query modifiedTime because it is always present. viewedByMeTime is optional.
    // if a file was modified > 180 days ago, it *might* be stale.
    // We will THEN filter out any files that were VIEWED recently.
    // ROBUST APPROACH:
    // To match Summary metrics exactly, we fetch a broad set of files (up to 1000)
    // and apply the EXACT same in-memory filter logic as the Summary endpoint.
    console.log('[StaleFiles Debug] Fetching sampled files (matching Summary strategy)...')

    // Reuse existing methods to aggregate files (Recent, Shared, Storage)
    // This ensures consistency with the Summary endpoint which uses the same sampling.
    const [recent, shared, sharedByMe, storage] = await Promise.all([
      this.getMostRecentFiles(connectionId, 200, '1y'),
      this.getSharedFiles(connectionId, 200),
      this.getSharedByMeFiles(connectionId, 200),
      this.getStorageFiles(connectionId, 200)
    ])

    // Combine and Deduplicate by ID
    const allFiles = [...recent, ...shared, ...sharedByMe, ...storage]
    const uniqueFilesMap = new Map<string, GoogleDriveFile>()

    // Process candidates 
    allFiles.forEach(f => {
      if (!uniqueFilesMap.has(f.id)) {
        uniqueFilesMap.set(f.id, f)
      }
    })
    const candidates = Array.from(uniqueFilesMap.values())
    console.log('[StaleFiles Debug] Aggregated Candidates:', candidates.length)
    console.log('[StaleFiles Debug] Candidates:', candidates.length)

    // Client-side Filter matching Summary Logic:
    // Stale = (viewed || modified) < 180 days ago

    // Explicitly filter candidates to find STALE items
    const files = candidates.filter((f: any) => {
      // Exclude folders from Stale Documents view/counts
      if (f.mimeType === 'application/vnd.google-apps.folder') return false

      const lastAccessedStr = f.viewedByMeTime || f.modifiedTime
      if (!lastAccessedStr) return false

      const lastAccessed = new Date(lastAccessedStr).getTime()
      return lastAccessed < sixMonthsAgo.getTime()
    })
    console.log('[StaleFiles Debug] Final Stale Files:', files.length)

    // Map and resolve Parent Names (batch fetch)
    // 1. Collect Parent IDs
    const parentIds = new Set<string>()
    files.forEach((f: any) => {
      if (f.parents?.[0]) parentIds.add(f.parents[0])
    })

    // 2. Fetch Parent Names
    const parentNameMap = new Map<string, string>()
    if (parentIds.size > 0) {
      try {
        const ids = Array.from(parentIds).slice(0, 200)
        // We only fetch names for up to 200 parents to keep it fast
        const q = ids.map(id => `id = '${id}'`).join(' or ')
        const pParams = new URLSearchParams({
          pageSize: '50',
          fields: 'files(id, name)',
          q: q
        })
        const pRes = await fetch(`https://www.googleapis.com/drive/v3/files?${pParams}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (pRes.ok) {
          const pData = await pRes.json()
          pData.files?.forEach((f: any) => parentNameMap.set(f.id, f.name))
        }
      } catch (e) {
        console.error('Parent Name Fetch Error', e)
      }
    }

    return files.map((f: any) => {
      // Calculate badges - mainly STALE
      const badges = this.calculateBadges(f)

      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
        size: f.size,
        webViewLink: f.webViewLink,
        source: 'Google Drive',
        activityTimestamp: f.viewedByMeTime || f.modifiedTime,
        lastAction: 'Stale',
        lastViewedTime: f.viewedByMeTime,
        actorEmail: f.owners?.[0]?.emailAddress,
        owners: f.owners,
        permissions: f.permissions,
        shared: f.shared,
        badges: badges,
        parentName: f.parents?.[0] ? parentNameMap.get(f.parents[0]) : undefined
      } as GoogleDriveFile
    })
  }

  async getFilesMetadata(connectionId: string, fileIds: string[]): Promise<GoogleDriveFile[]> {
    if (fileIds.length === 0) return []

    const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
    if (!connector) throw new Error('Connection not found')
    let accessToken = connector.accessToken
    if (connector.tokenExpiresAt && connector.tokenExpiresAt < new Date()) {
      accessToken = await this.refreshAccessToken(connectionId)
    }

    const results = await Promise.all(fileIds.map(async (id) => {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size,modifiedTime,webViewLink&supportsAllDrives=true`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (res.ok) {
          const f = await res.json()
          return {
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            modifiedTime: f.modifiedTime,
            webViewLink: f.webViewLink
          } as GoogleDriveFile
        }
        return null
      } catch (e) {
        console.error(`Failed to fetch metadata for ${id}`, e)
        return null
      }
    }))

    return results.filter((f): f is GoogleDriveFile => f !== null)
  }
}

export const googleDriveConnector = GoogleDriveConnector.getInstance()
