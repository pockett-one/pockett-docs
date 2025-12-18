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
  Link
} from "lucide-react"
import { GoogleDriveConnection } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { ConnectionTestModal } from "@/components/ui/connection-test-modal"
import { createClient } from '@supabase/supabase-js'

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
  const hasLoadedDataRef = useRef(false)
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { addToast } = useToast()

  console.log('ConnectorsPage render:', {
    user: !!user,
    loading,
    organizationId,
    searchParams: searchParams.toString()
  })

  // Handle OAuth callback results
  useEffect(() => {
    const handleCallback = async () => {
      const errorParam = searchParams.get('error')
      const successParam = searchParams.get('success')
      const emailParam = searchParams.get('email')

      console.log('OAuth callback detected:', { errorParam, successParam, emailParam, user: !!user })

      if (errorParam) {
        console.log('Adding error toast for Google Drive connection failure')
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: 'Failed to connect Google Drive. Please try again.'
        })
        setHasHandledOAuthCallback(true)

        // Clear URL parameters to prevent refresh from showing toasts
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        url.searchParams.delete('error')
        url.searchParams.delete('email')
        // Remove any hash fragments that might have been added
        url.hash = ''
        window.history.replaceState({}, '', url.toString())
      } else if (successParam === 'google_drive_connected' && emailParam) {
        console.log('Adding success toast for Google Drive connection')
        addToast({
          type: 'success',
          title: 'Google Drive Connected',
          message: `Successfully connected ${emailParam}. Refreshing your connections...`
        })
        setHasHandledOAuthCallback(true)

        // Clear URL parameters to prevent refresh from showing toasts
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        url.searchParams.delete('error')
        url.searchParams.delete('email')
        // Remove any hash fragments that might have been added
        url.hash = ''
        window.history.replaceState({}, '', url.toString())

        // Try to load organization data if user is authenticated
        if (user) {
          try {
            await loadOrganizationAndConnections(false) // Don't show error toasts
          } catch (error) {
            console.error('Failed to load organization after OAuth callback:', error)
          }
        }
      }
    }

    // Only run if there are actual OAuth parameters and we haven't handled them yet
    const hasOAuthParams = searchParams.get('error') || searchParams.get('success')
    if (hasOAuthParams && !hasHandledOAuthCallback) {
      handleCallback()
    }
  }, [searchParams, user, addToast, hasHandledOAuthCallback])

  const loadOrganizationAndConnections = useCallback(async (showToastOnError = true) => {
    console.log('loadOrganizationAndConnections called:', { isLoadingData, hasLoaded: hasLoadedDataRef.current })

    if (isLoadingData || hasLoadedDataRef.current) {
      console.log('Already loading data or data loaded, skipping...')
      return
    }

    console.log('Starting to load organization and connections...')
    setIsLoadingData(true)
    hasLoadedDataRef.current = true
    try {
      console.log('Loading organization and connections...')

      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.log('No session found, user needs to sign in')
        if (showToastOnError) {
          addToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please sign in to view your connected accounts'
          })
        }
        return
      }

      // Get or create organization for the user
      const orgResponse = await fetch('/api/organization', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!orgResponse.ok) {
        throw new Error('Failed to load organization')
      }

      const organization = await orgResponse.json()
      console.log('Organization loaded:', organization)
      setOrganizationId(organization.id)

      // Load connections for this organization
      const connResponse = await fetch(`/api/connectors?organizationId=${organization.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!connResponse.ok) {
        throw new Error('Failed to load connections')
      }

      const connections = await connResponse.json()
      console.log('Connections loaded:', connections)
      setExistingConnections(connections)
    } catch (error) {
      console.error('Failed to load organization and connections:', error)
      if (showToastOnError) {
        addToast({
          type: 'error',
          title: 'Loading Failed',
          message: 'Failed to load your organization data'
        })
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [addToast, isLoadingData])

  const refreshConnections = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Reset the loaded data flag to force reload
      hasLoadedDataRef.current = false
      setIsLoadingData(false) // Reset loading state to allow refresh

      // Call the load function directly without the guard
      console.log('Refreshing connections...')
      setIsLoadingData(true)

      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.log('No session found, user needs to sign in')
        addToast({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please sign in to refresh your connections'
        })
        return
      }

      // Get or create organization for the user
      const orgResponse = await fetch('/api/organization', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!orgResponse.ok) {
        throw new Error('Failed to load organization')
      }

      const organization = await orgResponse.json()
      console.log('Organization loaded:', organization)
      setOrganizationId(organization.id)

      // Load existing connections via API
      const connectionsResponse = await fetch(`/api/connectors?organizationId=${organization.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!connectionsResponse.ok) {
        throw new Error('Failed to load connections')
      }

      const connections = await connectionsResponse.json()
      console.log('Connections loaded:', connections)
      setExistingConnections(connections)

      // Show success toast
      addToast({
        type: 'success',
        title: 'Connections Refreshed',
        message: `Found ${connections.length} connection${connections.length !== 1 ? 's' : ''}`
      })

    } catch (error) {
      console.error('Failed to refresh connections:', error)
      addToast({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh connections. Please try again.'
      })
    } finally {
      setIsLoadingData(false)
      setIsRefreshing(false)
    }
  }, [addToast])

  // Load organization and connections only once when user is available
  useEffect(() => {
    if (user && !hasLoadedDataRef.current) {
      // Check if we're coming from an OAuth callback
      const hasOAuthParams = searchParams.get('error') || searchParams.get('success')
      if (!hasOAuthParams) {
        loadOrganizationAndConnections()
      }
    } else if (!user) {
      // Reset the loaded flag when user logs out
      hasLoadedDataRef.current = false
    }
  }, [user, loadOrganizationAndConnections, searchParams])

  const connectors = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Connect your Google Drive to access documents and folders',
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      status: 'available',
      connected: false
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Access your Dropbox files and folders',
      icon: (
        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
      ),
      status: 'coming-soon',
      connected: false
    },
    {
      id: 'box',
      name: 'Box',
      description: 'Connect to your Box account for file management',
      icon: (
        <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
      ),
      status: 'coming-soon',
      connected: false
    }
  ]

  const handleConnectGoogleDrive = async () => {
    setLoading(true)

    try {
      // Pass the current user ID to the connector
      const userId = user?.id
      const response = await fetch('/api/connectors/google-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initiate', userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate connection')
      }

      const { authUrl } = await response.json()
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: error instanceof Error ? error.message : 'Failed to initiate Google Drive connection'
      })
      setLoading(false)
    }
  }

  const handleTestConnection = async (connectionId: string) => {
    setTestingConnection(connectionId)
    setConnectionTestResult(null)

    try {
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Test the Google Drive connection
      const response = await fetch(`/api/connectors/google-drive/test?connectionId=${connectionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to test connection')
      }

      const result = await response.json()
      setConnectionTestResult(result)
      setIsTestModalOpen(true)
      addToast({
        type: 'success',
        title: 'Connection Test Successful',
        message: 'Your Google Drive connection is working properly!'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Connection Test Failed',
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setTestingConnection(null)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Disconnect the connector via API
      const response = await fetch('/api/connectors', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      // Mark the connection as disconnected instead of removing it
      setExistingConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'REVOKED' as const }
            : conn
        )
      )

      addToast({
        type: 'success',
        title: 'Account Disconnected',
        message: 'Google Drive account has been disconnected successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Disconnect Failed',
        message: 'Failed to disconnect account'
      })
    }
  }

  const handleReconnect = async (connectionId: string, email: string) => {
    try {
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Pass the current user ID and email to the connector for quick reauth
      const userId = user?.id
      const response = await fetch('/api/connectors/google-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate',
          userId,
          email // Pass the email for quick reauth
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate reconnection')
      }

      const { authUrl } = await response.json()
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Reconnection Failed',
        message: error instanceof Error ? error.message : 'Failed to reconnect Google Drive account'
      })
    }
  }

  const handleRemove = async (connectionId: string) => {
    try {
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Remove the connector via API
      const response = await fetch('/api/connectors', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId, action: 'remove' })
      })

      if (!response.ok) {
        throw new Error('Failed to remove connection')
      }

      // Remove the connection from the local state immediately
      setExistingConnections(prev => prev.filter(conn => conn.id !== connectionId))

      addToast({
        type: 'success',
        title: 'Connection Removed',
        message: 'Google Drive account has been completely removed'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Remove Failed',
        message: 'Failed to remove account'
      })
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-500 mb-8">
        <span className="hover:text-slate-900 cursor-pointer">Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">Connectors</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Connectors</h1>
        <p className="text-slate-500 text-lg">Manage your cloud storage integrations</p>
      </div>

      {/* Main Content */}
      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">

        {/* Left Sidebar - Service List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
          {connectors.map(connector => (
            <button
              key={connector.id}
              onClick={() => setSelectedConnector(connector.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${selectedConnector === connector.id
                ? 'bg-blue-50 border-blue-600'
                : 'border-transparent hover:bg-slate-50'
                }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedConnector === connector.id ? 'bg-white shadow-sm' : 'bg-slate-100'
                }`}>
                {/* Simplified Icons for List */}
                {connector.id === 'google-drive' && (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {connector.id === 'dropbox' && <div className="text-blue-600 font-bold text-xs">D</div>}
                {connector.id === 'box' && <div className="text-blue-500 font-bold text-xs">B</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium truncate ${selectedConnector === connector.id ? 'text-blue-900' : 'text-slate-700'}`}>
                    {connector.name}
                  </span>
                  {/* Status Dot */}
                  {connector.id === 'google-drive' && existingConnections.some(c => c.id.includes('google')) && (
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm" title="Connected"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Panel - Details */}
        <div className="min-h-[400px]">
          {selectedConnector === 'google-drive' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Service Header */}
              <div className="flex items-start gap-5 pb-8 border-b border-slate-200">
                <div className="h-16 w-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-3 shadow-md">
                  <svg className="h-10 w-10" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Google Drive</h2>
                  <p className="text-slate-600 mt-1">
                    Connect your Google Drive to sync files, manage permissions, and analyze usage.
                  </p>
                </div>
              </div>

              {/* Active Connections or Connect CTA */}
              <div className="space-y-6">
                {existingConnections.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Accounts</h3>
                      <button onClick={() => refreshConnections()} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                      </button>
                    </div>

                    {existingConnections.map(connection => (
                      <div key={connection.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 flex-shrink-0">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-bold text-slate-900 truncate">{connection.email}</h4>
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${connection.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : connection.status === 'REVOKED'
                                  ? 'bg-slate-50 text-slate-600 border-slate-200'
                                  : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${connection.status === 'ACTIVE'
                                  ? 'bg-green-500'
                                  : connection.status === 'REVOKED'
                                    ? 'bg-slate-400'
                                    : 'bg-red-500'
                                  }`}></span>
                                {connection.status === 'ACTIVE' ? 'Active' : connection.status === 'REVOKED' ? 'Disconnected' : 'Error'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {new Date(connection.connectedAt).toLocaleDateString()}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>Synced just now</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>Read & Write</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {connection.status === 'ACTIVE' ? (
                            <>
                              <Button
                                onClick={() => handleTestConnection(connection.id)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-slate-600 border-slate-200"
                                disabled={testingConnection === connection.id}
                              >
                                {testingConnection === connection.id ? 'Testing...' : 'Test'}
                              </Button>
                              <Button
                                onClick={() => handleDisconnect(connection.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleReconnect(connection.id, connection.email)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <RefreshCw className="h-3 w-3 mr-1.5" /> Reconnect
                              </Button>
                              <Button
                                onClick={() => handleRemove(connection.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 border-dashed text-center">
                      <p className="text-sm text-slate-500 mb-3">Need to connect another account?</p>
                      <Button onClick={handleConnectGoogleDrive} variant="outline" size="sm" disabled={loading}>
                        <Plus className="h-4 w-4 mr-2" /> Add another account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Google Drive</h3>
                    <p className="text-slate-600 max-w-sm mx-auto mb-6 text-sm">
                      Grant access to your documents to enable automated tagging, search, and insights.
                    </p>
                    <Button
                      onClick={handleConnectGoogleDrive}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                      {loading ? 'Connecting...' : 'Connect Now'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Coming Later</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                The <span className="font-semibold text-slate-700">{connectors.find(c => c.id === selectedConnector)?.name}</span> integration is currently under development.
              </p>
            </div>
          )}
        </div>

      </div>

      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        result={connectionTestResult}
        connectionName="Google Drive"
      />
    </div>
  )
}