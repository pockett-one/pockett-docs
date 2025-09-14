import { prisma } from './prisma'
import { Connector, ConnectorStatus, ConnectorType } from '@prisma/client'

export interface GoogleDriveConnection {
  id: string
  email: string
  name: string
  connectedAt: string
  status: 'active' | 'expired' | 'revoked'
  lastSyncAt?: string
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
  webViewLink?: string
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
      status: connector.status.toLowerCase() as 'active' | 'expired' | 'revoked',
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

      // Remove from database
      await prisma.connector.delete({
        where: { id: connectionId }
      })
    }
  }

  async getFiles(connectionId: string, pageToken?: string): Promise<{
    files: GoogleDriveFile[]
    nextPageToken?: string
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
      console.log('Token expired, refreshing...')
      accessToken = await this.refreshAccessToken(connectionId)
    }

    // Make API call to Google Drive
    const params = new URLSearchParams({
      pageSize: '10',
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)',
      orderBy: 'modifiedTime desc'
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive API error:', response.status, errorText)
      throw new Error(`Google Drive API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken
    }
  }

  async storeConnection(
    organizationId: string,
    googleAccountId: string,
    email: string,
    name: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiresAt: Date,
    avatarUrl?: string
  ): Promise<Connector> {
    return prisma.connector.create({
      data: {
        organizationId,
        type: ConnectorType.GOOGLE_DRIVE,
        googleAccountId,
        email,
        name,
        avatarUrl,
        accessToken,
        refreshToken,
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
      console.log('Token expired, refreshing...')
      accessToken = await this.refreshAccessToken(connectionId)
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
      throw new Error('Failed to refresh token')
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
}

export const googleDriveConnector = GoogleDriveConnector.getInstance()
