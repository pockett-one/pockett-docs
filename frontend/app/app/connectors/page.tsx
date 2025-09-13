"use client"

import { useState } from "react"
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
  User
} from "lucide-react"

export default function ConnectorsPage() {
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null)

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

  // Mock data for existing connections
  const existingConnections = [
    {
      id: 'conn-1',
      name: 'Google Drive',
      account: 'john.doe@gmail.com',
      connectedAt: '2024-01-15',
      status: 'active',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    },
    {
      id: 'conn-2',
      name: 'Google Drive',
      account: 'work.account@company.com',
      connectedAt: '2024-01-20',
      status: 'active',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    }
  ]

  const handleDisconnect = (connectionId: string) => {
    // Handle disconnect logic here
    console.log('Disconnecting:', connectionId)
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
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
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
                      Coming Soon
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
                  {connector.status === 'coming-soon' && (
                    <p className="text-xs text-yellow-600">
                      Coming soon
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
            <div className="text-sm text-gray-500">
              {existingConnections.length} connection{existingConnections.length !== 1 ? 's' : ''}
            </div>
          </div>

          {existingConnections.length > 0 ? (
            <div className="space-y-4">
              {existingConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {connection.icon}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {connection.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{connection.account}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Connected {connection.connectedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">Active</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
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
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Service
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}