/**
 * Connector registry: resolve connector instance by type, list connections for a firm (all types), get storage adapter by connection.
 * Enables API/UI to work with multiple connector types (Google Drive, OneDrive, etc.) without hardcoding.
 * To add a new provider: implement IConnectorInstance + IConnectorStorageAdapter, register in getConnectorInstanceByType and getStorageAdapter.
 * Document permission regrant (e.g. open/edit) is provider-specific and can be added as an optional interface extension later.
 */

import { ConnectorType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { IConnectorStorageAdapter } from './types'
import { createGoogleDriveAdapter } from './adapters/google-drive-adapter'
import { createOneDriveAdapter } from './adapters/onedrive-adapter'
import { GoogleDriveConnector } from '@/lib/google-drive-connector'
import { getOneDriveConnectorInstance } from './onedrive-connector'

/** Unified connection DTO for API/UI (any provider). */
export interface ConnectorConnection {
  id: string
  type: ConnectorType
  email: string
  name: string
  connectedAt: string
  status: string
  lastSyncAt?: string
}

/** Full connector interface: OAuth, list files, permissions, etc. Registry returns this by type. */
export interface IConnectorInstance {
  getConnections(organizationId: string): Promise<ConnectorConnection[]>
  disconnectConnection(connectionId: string): Promise<void>
  removeConnection(connectionId: string): Promise<void>
  getAccessToken(connectionId: string): Promise<string | null>
}

const instances: Partial<Record<ConnectorType, IConnectorInstance>> = {}

function getConnectorInstanceByType(type: ConnectorType): IConnectorInstance {
  if (type === ConnectorType.GOOGLE_DRIVE) {
    if (!instances.GOOGLE_DRIVE) {
      instances.GOOGLE_DRIVE = GoogleDriveConnector.getInstance() as unknown as IConnectorInstance
    }
    return instances.GOOGLE_DRIVE
  }
  if (type === ConnectorType.ONEDRIVE) {
    if (!instances.ONEDRIVE) {
      instances.ONEDRIVE = getOneDriveConnectorInstance()
    }
    return instances.ONEDRIVE
  }
  throw new Error(`Unsupported connector type: ${type}`)
}

/**
 * Get the full connector instance for a given type (for OAuth, listFiles, permissions, etc.).
 */
export function getConnectorInstance(type: ConnectorType): IConnectorInstance {
  return getConnectorInstanceByType(type)
}

/**
 * List all connections for an organization (all connector types). Uses Prisma; no provider-specific filtering.
 */
export async function getConnections(organizationId: string): Promise<ConnectorConnection[]> {
  const org = await prisma.firm.findUnique({
    where: { id: organizationId },
    include: {
      connector: {
        select: {
          id: true,
          type: true,
          name: true,
          externalAccountId: true,
          settings: true,
          createdAt: true,
          status: true,
          lastSyncAt: true
        }
      }
    }
  })

  if (!org?.connector) return []

  const connectors = [org.connector]
  return connectors.map((c) => {
    const settings = (c.settings || {}) as { accountEmail?: string }
    const stored = settings.accountEmail?.trim()
    const email =
      stored && stored.includes('@')
        ? stored
        : c.externalAccountId.includes('@')
          ? c.externalAccountId
          : ''
    return {
      id: c.id,
      type: c.type,
      email,
      name: c.name ?? '',
      connectedAt: c.createdAt.toISOString().split('T')[0],
      status: c.status,
      lastSyncAt: c.lastSyncAt?.toISOString(),
    }
  })
}

/**
 * Get the storage adapter for a connection (by connector id). Used by pockett-structure and callers that need folder/file ops.
 */
export async function getStorageAdapter(connectionId: string): Promise<IConnectorStorageAdapter> {
  const connector = await prisma.connector.findUnique({
    where: { id: connectionId }
  })
  if (!connector) throw new Error('Connection not found')
  if (connector.type === ConnectorType.GOOGLE_DRIVE) {
    const g = GoogleDriveConnector.getInstance()
    return createGoogleDriveAdapter(async (id) => {
      const token = await g.getAccessToken(id)
      if (!token) throw new Error('Could not get access token')
      return token
    })
  }
  if (connector.type === ConnectorType.ONEDRIVE) {
    const one = getOneDriveConnectorInstance()
    return createOneDriveAdapter(async (id) => {
      const token = await one.getAccessToken(id)
      if (!token) throw new Error('Could not get access token')
      return token
    })
  }
  throw new Error(`No storage adapter for connector type: ${connector.type}`)
}

/**
 * Disconnect or remove a connection using the appropriate connector instance.
 */
export async function disconnectConnection(connectionId: string): Promise<void> {
  const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
  if (!connector) throw new Error('Connection not found')
  const instance = getConnectorInstance(connector.type)
  await instance.disconnectConnection(connectionId)
}

/**
 * Permanently remove a connector record. Uses the appropriate connector instance for any cleanup, then deletes the record.
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
  if (!connector) throw new Error('Connection not found')
  const instance = getConnectorInstance(connector.type)
  await instance.removeConnection(connectionId)
}
