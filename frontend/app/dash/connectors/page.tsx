"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Settings,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Calendar,
  User,
  RefreshCw,
  Unlink,
  Link,
  Cloud,
  Zap
} from "lucide-react"
import { GoogleDriveConnection } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { ConnectionTestModal } from "@/components/ui/connection-test-modal"
import { GoogleDriveManager } from "@/components/google-drive/google-drive-manager"
import { GooglePickerButton } from "@/components/google-drive/google-picker-button"
import { createClient } from '@supabase/supabase-js'
import { sendEvent, ANALYTICS_EVENTS } from "@/lib/analytics"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ConnectorsPage() {
  const [selectedConnector, setSelectedConnector] = useState<string | null>('google-drive')
  const [existingConnections, setExistingConnections] = useState<GoogleDriveConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasHandledOAuthCallback, setHasHandledOAuthCallback] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const hasLoadedDataRef = useRef(false)
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const activeConnection = existingConnections.find(c => c.id === activeAccountId)
  const { addToast } = useToast()

  // Handle OAuth callback results
  useEffect(() => {
    const handleCallback = async () => {
      const errorParam = searchParams.get('error')
      const successParam = searchParams.get('success')
      const emailParam = searchParams.get('email')

      if (errorParam) {
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: 'Failed to connect Google Drive. Please try again.'
        })
        setHasHandledOAuthCallback(true)
        window.history.replaceState({}, '', window.location.pathname)
      } else if (successParam === 'google_drive_connected' && emailParam) {
        addToast({
          type: 'success',
          title: 'Google Drive Connected',
          message: `Successfully connected ${emailParam}.`
        })
        sendEvent({
          action: ANALYTICS_EVENTS.ADD_CONNECTOR_COMPLETE,
          category: 'Integration',
          label: 'Google Drive Connected',
          email: emailParam
        })
        setHasHandledOAuthCallback(true)
        window.history.replaceState({}, '', window.location.pathname)
        if (user) loadOrganizationAndConnections(false)
      }
    }

    const hasOAuthParams = searchParams.get('error') || searchParams.get('success')
    if (hasOAuthParams && !hasHandledOAuthCallback) {
      handleCallback()
    }
  }, [searchParams, user, addToast, hasHandledOAuthCallback])

  const loadOrganizationAndConnections = useCallback(async (showToastOnError = true) => {
    if (isLoadingData || hasLoadedDataRef.current) return

    setIsLoadingData(true)
    hasLoadedDataRef.current = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const orgResponse = await fetch('/api/organization', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (!orgResponse.ok) throw new Error('Failed to load organization')

      const organization = await orgResponse.json()
      setOrganizationId(organization.id)

      const connResponse = await fetch(`/api/connectors?organizationId=${organization.id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (!connResponse.ok) throw new Error('Failed to load connections')

      const connections = await connResponse.json()
      setExistingConnections(connections)
      if (connections.length > 0 && !activeAccountId) {
        setActiveAccountId(connections[0].id)
      }
    } catch (error) {
      if (showToastOnError) {
        addToast({ type: 'error', title: 'Loading Failed', message: 'Failed to load data' })
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [addToast, isLoadingData])

  const refreshConnections = useCallback(async () => {
    setIsRefreshing(true)
    hasLoadedDataRef.current = false
    setIsLoadingData(false)
    // Force reload by calling verify immediately
    try {
      await loadOrganizationAndConnections(true)
      addToast({ type: 'success', title: 'Refreshed', message: 'Connection status updated.' })
    } finally {
      setIsRefreshing(false)
    }
  }, [addToast, loadOrganizationAndConnections])

  useEffect(() => {
    if (user && !hasLoadedDataRef.current && !searchParams.get('success')) {
      loadOrganizationAndConnections()
    }
  }, [user, loadOrganizationAndConnections, searchParams])

  const connectors = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Connect your Google Drive to access documents and folders',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5 7.51-3.22-7.52-1.43c.01.69.01 3.52-.02 4.65z" />
          {/* Fallback Cloud Icon if path is complex */}
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      ),
      activeIcon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      connected: false
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Access your Dropbox files',
      activeIcon: <div className="h-5 w-5 bg-blue-600/20 text-blue-600 rounded flex items-center justify-center text-[10px] font-bold">D</div>,
      connected: false
    },
    {
      id: 'box',
      name: 'Box',
      description: 'Connect to your Box account',
      activeIcon: <div className="h-5 w-5 bg-blue-500/20 text-blue-500 rounded flex items-center justify-center text-[10px] font-bold">B</div>,
      connected: false
    }
  ]

  const handleConnectGoogleDrive = async () => {
    sendEvent({
      action: ANALYTICS_EVENTS.ADD_CONNECTOR_START,
      category: 'Integration',
      label: 'Google Drive Start'
    })
    setLoading(true)
    try {
      const response = await fetch('/api/connectors/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initiate', userId: user?.id }),
      })
      if (!response.ok) throw new Error('Failed to initiate connection')
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      addToast({ type: 'error', title: 'Connection Failed', message: 'Failed to initiate connection' })
      setLoading(false)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/connectors', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })
      setExistingConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'REVOKED' as const } : c))
      addToast({ type: 'success', title: 'Disconnected', message: 'Account disconnected successfully' })
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to disconnect' })
    }
  }

  const handleRemove = async (connectionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/connectors', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, action: 'remove' })
      })
      setExistingConnections(prev => prev.filter(c => c.id !== connectionId))
      addToast({ type: 'success', title: 'Removed', message: 'Connection removed.' })
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to remove' })
    }
  }

  const handleTestConnection = async (connectionId: string) => {
    setTestingConnection(connectionId)
    // Clear previous results
    setConnectionTestResult(null)

    try {
      const response = await fetch('/api/connectors/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', connectionId })
      })

      if (!response.ok) throw new Error('Test failed')
      const result = await response.json()
      setConnectionTestResult(result)
      setIsTestModalOpen(true)
    } catch (error) {
      addToast({ type: 'error', title: 'Test Failed', message: 'Could not verify connection.' })
    } finally {
      setTestingConnection(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connectors</h1>
        <p className="text-gray-500 text-sm mt-1">Manage external data sources and file access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-8 items-start">
        {/* Sidebar */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
          <div className="p-3 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
            Sources
          </div>
          {connectors.map(connector => (
            <button
              key={connector.id}
              onClick={() => setSelectedConnector(connector.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all border-l-2 ${selectedConnector === connector.id
                ? 'bg-gray-50 border-gray-900'
                : 'border-transparent hover:bg-white hover:pl-4'
                }`}
            >
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selectedConnector === connector.id ? 'bg-white shadow-sm ring-1 ring-gray-100' : 'bg-gray-100'
                }`}>
                {/* Use Colored Icon if Selected, Gray otherwise */}
                {selectedConnector === connector.id ? connector.activeIcon : (
                  <Cloud className="w-3.5 h-3.5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium truncate block ${selectedConnector === connector.id ? 'text-gray-900' : 'text-gray-600'}`}>
                  {connector.name}
                </span>
                {existingConnections.some(c => c.id.includes(connector.id) && c.status === 'ACTIVE') && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-gray-400 font-medium">Connected</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="min-h-[500px] space-y-6">
          {selectedConnector === 'google-drive' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
              {/* Service Header & Global Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center p-3 shadow-sm">
                      <svg className="h-8 w-8" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Google Drive</h2>
                      <p className="text-sm text-gray-500 mt-1">Connect one or more Google accounts to manage file access.</p>
                    </div>
                  </div>

                  <Button onClick={handleConnectGoogleDrive} disabled={loading} className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? 'Connecting...' : 'Add Account'}
                  </Button>
                </div>
                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Account Tabs (Pill Style) */}
                  <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100/80 p-1 rounded-lg w-fit">
                      {existingConnections.map(c => {
                        const isActive = activeAccountId === c.id
                        const isConnected = c.status === 'ACTIVE'

                        return (
                          <div
                            key={c.id}
                            className={`group flex items-center transition-all ${isActive
                              ? 'bg-white shadow-sm ring-1 ring-gray-200 rounded-md my-[1px]'
                              : ''
                              }`}
                          >
                            <button
                              onClick={() => setActiveAccountId(c.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isActive
                                ? 'text-gray-900 cursor-default'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
                              {c.email}
                            </button>

                            {/* Inline Actions for Active Tab */}
                            {isActive && (
                              <div className="flex items-center pr-1.5 pl-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="w-px h-3.5 bg-gray-200 mx-1.5" />

                                {isConnected ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleTestConnection(c.id); }}
                                      disabled={testingConnection === c.id}
                                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                      title="Test Connection"
                                    >
                                      {testingConnection === c.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDisconnect(c.id); }}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Disconnect"
                                    >
                                      <Unlink className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleConnectGoogleDrive(); }}
                                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                      title="Reconnect"
                                    >
                                      <Link className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRemove(c.id); }}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Active Account Content */}
                  {activeConnection ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <GoogleDriveManager connectionId={activeConnection.id} />
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">Select an account to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium">Coming Soon</h3>
              <p className="text-gray-500 text-sm mt-1">This integration is under development.</p>
            </div>
          )}
        </div>
      </div>

      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        result={connectionTestResult}
        connectionName={activeConnection?.name || 'Google Drive'}
      />
    </div>
  )
}