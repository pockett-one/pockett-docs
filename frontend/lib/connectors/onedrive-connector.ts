/**
 * Microsoft OneDrive connector (stub).
 * Implements IConnectorInstance so the registry can resolve ONEDRIVE without hardcoding.
 * OAuth, list files, metadata, and thumbnails can be implemented here when adding full OneDrive support.
 * Document permission regrant (open/edit equivalent) is provider-specific and can be added as an
 * optional interface extension (e.g. regrantDocumentAccess) later.
 */

import { ConnectorType } from '@prisma/client'
import type { IConnectorInstance } from './registry'
import type { ConnectorConnection } from './registry'

const NOT_IMPLEMENTED = 'OneDrive connector is not yet implemented. Use Google Drive for now.'

export class OneDriveConnector implements IConnectorInstance {
  private static _instance: OneDriveConnector | null = null

  static getInstance(): OneDriveConnector {
    if (!OneDriveConnector._instance) {
      OneDriveConnector._instance = new OneDriveConnector()
    }
    return OneDriveConnector._instance
  }

  async getConnections(_firmId: string): Promise<ConnectorConnection[]> {
    return []
  }

  async disconnectConnection(_connectionId: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED)
  }

  async removeConnection(_connectionId: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED)
  }

  async getAccessToken(_connectionId: string): Promise<string | null> {
    return null
  }
}

export function getOneDriveConnectorInstance(): IConnectorInstance {
  return OneDriveConnector.getInstance()
}
