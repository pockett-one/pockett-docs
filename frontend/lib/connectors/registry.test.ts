import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectorType } from '@prisma/client'
import { getConnectorInstance } from './registry'

vi.mock('@/lib/prisma', () => ({
  prisma: {}
}))

describe('connector registry', () => {
  describe('getConnectorInstance', () => {
    it('returns an instance for GOOGLE_DRIVE with required methods', () => {
      const instance = getConnectorInstance(ConnectorType.GOOGLE_DRIVE)
      expect(instance).toBeDefined()
      expect(typeof instance.getConnections).toBe('function')
      expect(typeof instance.disconnectConnection).toBe('function')
      expect(typeof instance.removeConnection).toBe('function')
      expect(typeof instance.getAccessToken).toBe('function')
    })

    it('returns the same instance for GOOGLE_DRIVE on multiple calls', () => {
      const a = getConnectorInstance(ConnectorType.GOOGLE_DRIVE)
      const b = getConnectorInstance(ConnectorType.GOOGLE_DRIVE)
      expect(a).toBe(b)
    })

    it('throws for unsupported connector type', () => {
      expect(() => getConnectorInstance('DROPBOX' as ConnectorType)).toThrow('Unsupported connector type')
    })
  })
})
