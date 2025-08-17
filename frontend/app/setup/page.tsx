"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { CheckCircle, AlertCircle, Plus, FolderOpen } from "lucide-react"
import Link from "next/link"

export default function ConnectorsSetupPage() {
  const [connectedServices, setConnectedServices] = useState<string[]>(["google-drive"])

  const connectors = [
    {
      id: "google-drive",
      name: "Google Drive",
      icon: "G",
      color: "bg-blue-600",
      available: true,
      description: "Connect your Google Drive files and folders"
    },
    {
      id: "box",
      name: "Box",
      icon: "B",
      color: "bg-blue-700",
      available: false,
      description: "Box integration coming soon"
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "D",
      color: "bg-blue-500",
      available: false,
      description: "Dropbox integration coming soon"
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: "O",
      color: "bg-blue-800",
      available: false,
      description: "Microsoft OneDrive integration coming soon"
    },
    {
      id: "notion",
      name: "Notion",
      icon: "N",
      color: "bg-gray-800",
      available: false,
      description: "Notion workspace integration coming soon"
    },
    {
      id: "confluence",
      name: "Confluence",
      icon: "C",
      color: "bg-blue-900",
      available: false,
      description: "Atlassian Confluence integration coming soon"
    }
  ]

  const getConnectionStatus = (connectorId: string) => {
    if (connectedServices.includes(connectorId)) {
      return { 
        status: 'connected', 
        text: 'Connected', 
        icon: CheckCircle, 
        color: 'text-green-600' 
      }
    }
    return { 
      status: 'disconnected', 
      text: 'Not Connected', 
      icon: AlertCircle, 
      color: 'text-gray-400' 
    }
  }

  const handleDisconnect = (connectorId: string) => {
    setConnectedServices(prev => prev.filter(id => id !== connectorId))
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-normal text-gray-900 mb-4">
                Document Connectors
              </h1>
              <p className="text-lg text-gray-600">
                Connect your document storage services to Pockett. You can add multiple services and manage them all from one place.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          
          {/* Connected Services Summary */}
          {connectedServices.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-blue-900 mb-2">
                Active Connections
              </h2>
              <p className="text-sm text-blue-800 mb-4">
                You have {connectedServices.length} service{connectedServices.length !== 1 ? 's' : ''} connected
              </p>
              <div className="flex items-center space-x-4">
                {connectedServices.map((serviceId) => {
                  const connector = connectors.find(c => c.id === serviceId)
                  return connector ? (
                    <div key={serviceId} className="flex items-center space-x-2">
                      <div className={`w-6 h-6 ${connector.color} rounded flex items-center justify-center text-white text-xs font-bold`}>
                        {connector.icon}
                      </div>
                      <span className="text-sm font-medium text-blue-900">{connector.name}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Available Connectors */}
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Available Connectors</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectors.map((connector) => {
                const connectionStatus = getConnectionStatus(connector.id)
                
                return (
                  <div 
                    key={connector.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${connector.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                          {connector.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{connector.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <connectionStatus.icon className={`h-4 w-4 ${connectionStatus.color}`} />
                            <span className={`text-xs font-medium ${connectionStatus.color}`}>
                              {connectionStatus.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{connector.description}</p>
                    
                    <div className="space-y-2">
                      {connector.available ? (
                        connectionStatus.status === 'connected' ? (
                          <div className="space-y-2">
                            <Link href="/dashboard">
                              <Button variant="outline" className="w-full">
                                View Documents
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDisconnect(connector.id)}
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <Link href={`/auth/${connector.id}`}>
                            <Button className="w-full">
                              <Plus className="h-4 w-4 mr-2" />
                              Connect {connector.name}
                            </Button>
                          </Link>
                        )
                      ) : (
                        <Button disabled className="w-full" variant="outline">
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Need Help?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Setup Guide</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Step-by-step instructions for connecting your services
                </p>
                <Button variant="outline" size="sm">
                  View Guide
                </Button>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Troubleshooting</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Common issues and solutions for connection problems
                </p>
                <Button variant="outline" size="sm">
                  Get Help
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}