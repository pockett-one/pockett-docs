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
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null)
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
  }, [user, addToast])

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
  }, [user]) // Only depend on user, not on the function or other state

  const connectors = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Connect your Google Drive to access documents and folders',
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Connectors
        </h1>
        <p className="text-lg text-gray-600">
          Connect your cloud storage services to get started with document insights and productivity tools.
        </p>
        

      </div>

      {/* Two Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Pane - Available Connectors */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Connectors</h2>
          <div className="space-y-4">
            {connectors.map((connector) => (
              <div
                key={connector.id}
                className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-200 cursor-pointer ${
                  selectedConnector === connector.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedConnector(connector.id)}
              >
                {/* Connector Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {connector.icon}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {connector.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {connector.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center space-x-1">
                    {connector.status === 'available' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {connector.status === 'coming-soon' && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3">
                  {connector.status === 'available' && !connector.connected && (
                    <Button 
                      onClick={connector.id === 'google-drive' ? handleConnectGoogleDrive : undefined}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                  
                  {connector.status === 'available' && connector.connected && (
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 text-xs">
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                      <Button variant="outline" className="flex-1 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  )}
                  
                  {connector.status === 'coming-soon' && (
                    <Button disabled className="w-full bg-gray-100 text-gray-500 text-sm">
                      Coming later
                    </Button>
                  )}
                </div>

                {/* Status Text */}
                <div className="mt-2 text-center">
                  {connector.status === 'available' && !connector.connected && (
                    <p className="text-xs text-gray-500">
                      Ready to connect
                    </p>
                  )}
                  {connector.status === 'available' && connector.connected && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Connected
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane - Existing Connections */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  console.log('Refresh button clicked!')
                  refreshConnections()
                }}
                disabled={isRefreshing}
                className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border ${
                  isRefreshing 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                }`}
                title={isRefreshing ? "Refreshing..." : "Refresh connections"}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'text-blue-600 animate-spin' : 'text-gray-600'}`} />
              </button>
              <div className="text-sm text-gray-500">
                {existingConnections.length} connection{existingConnections.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your connections...</p>
              </div>
            </div>
          ) : existingConnections.length > 0 ? (
            <div className="space-y-4">
              {existingConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    {/* Left Section: Service Info */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            Google Drive
                          </h3>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            connection.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                            connection.status === 'EXPIRED' ? 'bg-yellow-100 text-yellow-800' : 
                            connection.status === 'REVOKED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              connection.status === 'ACTIVE' ? 'bg-green-500' : 
                              connection.status === 'EXPIRED' ? 'bg-yellow-500' : 
                              connection.status === 'REVOKED' ? 'bg-gray-500' : 'bg-red-500'
                            }`}></div>
                            {connection.status === 'ACTIVE' ? 'Active' : 
                             connection.status === 'EXPIRED' ? 'Expired' : 
                             connection.status === 'REVOKED' ? 'Disconnected' : 'Error'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">{connection.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-500">Connected {connection.connectedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Section: Action Buttons */}
                    <div className="flex items-center space-x-1 ml-4">
                      {connection.status === 'ACTIVE' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(connection.id)}
                            disabled={testingConnection === connection.id}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title={testingConnection === connection.id ? "Testing connection..." : "Test connection"}
                          >
                            <RefreshCw className={`h-4 w-4 ${testingConnection === connection.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(connection.id)}
                            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Disconnect account"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(connection.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove account completely"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : connection.status === 'ERROR' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(connection.id)}
                            disabled={testingConnection === connection.id}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title={testingConnection === connection.id ? "Testing connection..." : "Test connection"}
                          >
                            <RefreshCw className={`h-4 w-4 ${testingConnection === connection.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconnect(connection.id, connection.email)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Reconnect account"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(connection.id)}
                            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Disconnect account"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(connection.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove account completely"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconnect(connection.id, connection.email)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Reconnect account"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(connection.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove account completely"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No connections yet
              </h3>
              <p className="text-gray-600 mb-4">
                Connect your first cloud storage service to get started with document insights and productivity tools.
              </p>
              <Button 
                onClick={handleConnectGoogleDrive}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Connect Google Drive'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Connection Test Modal */}
      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        result={connectionTestResult}
        connectionName="Google Drive"
      />
    </div>
  )
}