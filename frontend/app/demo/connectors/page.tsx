"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { CheckCircle, AlertCircle, Plus, HelpCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { getConnections, saveConnections } from "@/lib/connection-utils"

export default function ConnectorsPage() {
  const [connectedServices, setConnectedServices] = useState<string[]>([])
  
  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour, forceStartTour } = useTourGuide('Connectors')

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Connectors',
      content: 'This page allows you to connect and manage your cloud storage and productivity services.',
      target: '.connectors-header',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'service-list',
      title: 'Available Services',
      content: 'Browse and connect to popular cloud services like Google Drive, Dropbox, Box, and more.',
      target: '.services-grid',
      position: 'top',
      action: 'hover',
      actionText: 'Hover over service cards'
    },
    {
      id: 'connection-status',
      title: 'Connection Status',
      content: 'See which services are connected and manage your existing connections.',
      target: '.connection-status',
      position: 'bottom',
      action: 'hover',
      actionText: 'Check connection details'
    }
  ]

  // Sync with localStorage on mount and listen for updates
  useEffect(() => {
    const syncConnections = () => {
      const connections = getConnections()
      const connectedIds = connections
        .filter((conn: any) => conn.status === 'connected')
        .map((conn: any) => conn.id)
      setConnectedServices(connectedIds)
    }

    // Initial sync
    syncConnections()

    // Listen for connection updates from other components
    const handleConnectionsUpdate = () => {
      syncConnections()
    }

    window.addEventListener('pockett-connections-updated', handleConnectionsUpdate)
    window.addEventListener('storage', handleConnectionsUpdate)

    return () => {
      window.removeEventListener('pockett-connections-updated', handleConnectionsUpdate)
      window.removeEventListener('storage', handleConnectionsUpdate)
    }
  }, [])

  const getConnectorIcon = (iconType: string, size: 'small' | 'large' = 'large') => {
    const iconSize = size === 'small' ? 'w-4 h-4' : 'w-8 h-8'
    
    switch (iconType) {
      case 'google-drive':
        return (
          <svg className={iconSize} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 23.8z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        )
      case 'dropbox':
        return (
          <Image 
            src="/images/brand-logos/dropbox-logo.png" 
            alt="Dropbox" 
            width={iconSize === 'w-4 h-4' ? 16 : 32}
            height={iconSize === 'w-4 h-4' ? 16 : 32}
            className={`${iconSize} object-contain`}
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'box':
        return (
          <Image 
            src="/images/brand-logos/box-logo.png" 
            alt="Box" 
            width={iconSize === 'w-4 h-4' ? 16 : 32}
            height={iconSize === 'w-4 h-4' ? 16 : 32}
            className={`${iconSize} object-contain`}
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'onedrive':
        return (
          <Image 
            src="/images/brand-logos/onedrive-logo.png" 
            alt="OneDrive" 
            width={iconSize === 'w-4 h-4' ? 16 : 32}
            height={iconSize === 'w-4 h-4' ? 16 : 32}
            className={`${iconSize} object-contain`}
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'notion':
        return (
          <Image 
            src="/images/brand-logos/notion-logo.png" 
            alt="Notion" 
            width={iconSize === 'w-4 h-4' ? 16 : 32}
            height={iconSize === 'w-4 h-4' ? 16 : 32}
            className={`${iconSize} object-contain`}
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'confluence':
        return (
          <Image 
            src="/images/brand-logos/confluence-logo.png" 
            alt="Confluence" 
            width={iconSize === 'w-4 h-4' ? 16 : 32}
            height={iconSize === 'w-4 h-4' ? 16 : 32}
            className={`${iconSize} object-contain`}
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      default:
        return (
          <span className="text-white font-bold text-lg">{iconType}</span>
        )
    }
  }

  const connectors = [
    {
      id: "google-drive",
      name: "Google Drive",
      icon: "google-drive",
      color: "bg-white",
      available: true,
      description: "Connect your Google Drive files and folders"
    },
    {
      id: "box",
      name: "Box",
      icon: "box",
      color: "bg-white",
      available: false,
      description: "Box integration coming soon"
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "dropbox",
      color: "bg-white",
      available: false,
      description: "Dropbox integration coming soon"
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: "onedrive",
      color: "bg-white",
      available: false,
      description: "Microsoft OneDrive integration coming soon"
    },
    {
      id: "notion",
      name: "Notion",
      icon: "notion",
      color: "bg-white",
      available: false,
      description: "Notion workspace integration coming soon"
    },
    {
      id: "confluence",
      name: "Confluence",
      icon: "confluence",
      color: "bg-white",
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
    // Remove from local state
    setConnectedServices(prev => prev.filter(id => id !== connectorId))
    
    // Update localStorage using utility function
    const connections = getConnections()
    const updatedConnections = connections.filter((conn: any) => conn.id !== connectorId)
    saveConnections(updatedConnections)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('pockett-connections-updated'))
  }

  return (
    <AppLayout
      showTopBar={true}
      topBarProps={{
        onStartTour: forceStartTour,
        showTourButton: true,
        tourButtonText: "Take Tour"
      }}
    >
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
                      <div className={`w-6 h-6 ${connector.color} rounded flex items-center justify-center border border-gray-200`}>
                        {getConnectorIcon(connector.icon, 'small')}
                      </div>
                      <span className="text-sm font-medium text-blue-900">{connector.name}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Header with Tour Button */}
          <div className="flex items-center justify-between mb-6 connectors-header">
            <h2 className="text-xl font-medium text-gray-900">Document Cloud Connectors</h2>
            

          </div>

          {/* Available Connectors */}
          <div className="mb-8">
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch services-grid">
              {connectors.map((connector) => {
                const connectionStatus = getConnectionStatus(connector.id)
                
                return (
                  <div 
                    key={connector.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full min-h-[216px]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${connector.color} rounded-lg flex items-center justify-center border border-gray-200`}>
                          {getConnectorIcon(connector.icon, 'large')}
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
                    
                    <p className="text-sm text-gray-600 mb-4 flex-1">{connector.description}</p>
                    
                    <div className="space-y-2 mt-auto">
                      {connector.available ? (
                        connectionStatus.status === 'connected' ? (
                          <div className="space-y-2">
                            <Link href="/demo/documents">
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
                          <Link href={`/demo/auth/${connector.id}`}>
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

      {/* Tour Guide */}
      <TourGuide
        isOpen={isTourOpen}
        onClose={closeTour}
        steps={tourSteps}
        pageName="Connectors"
        onComplete={() => console.log('🎯 Connectors tour completed!')}
      />
      

    </AppLayout>
  )
}