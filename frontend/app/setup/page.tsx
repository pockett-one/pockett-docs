"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FolderOpen, ChevronDown, User } from "lucide-react"
import Link from "next/link"

export default function ConnectorsSetupPage() {
  const [connectedServices, setConnectedServices] = useState<string[]>([])

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
    }
  ]

  const handleConnect = (connectorId: string) => {
    if (connectorId === "google-drive") {
      // Redirect to Google Drive authorization
      window.location.href = "/auth/google-drive"
    } else {
      // For demo purposes, show coming soon message
      alert(`${connectorId} integration coming soon!`)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-semibold text-gray-900">Pockett</span>
            </div>
            <div className="relative">
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-normal text-gray-900 mb-4">
              Connect Your Documents
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose which document stores you&rsquo;d like to connect to Pockett. 
              You can always add more services later.
            </p>
          </div>

          {/* Connector Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {connectors.map((connector) => (
              <div
                key={connector.id}
                className={`bg-white border rounded-lg p-6 text-center transition-all duration-200 ${
                  connector.available 
                    ? "border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer" 
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="mb-4">
                  <div 
                    className={`w-16 h-16 ${connector.color} rounded-lg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3`}
                  >
                    {connector.icon}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {connector.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {connector.description}
                  </p>
                </div>
                
                {connector.available ? (
                  <Button
                    onClick={() => handleConnect(connector.id)}
                    className="w-full"
                  >
                    Connect
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full"
                  >
                    Coming Soon
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Connected Services Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Connected Services
            </h2>
            
            {connectedServices.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No services connected yet
                </p>
                <p className="text-sm text-gray-500">
                  Connect your first service above to get started with Pockett
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedServices.map((service) => (
                  <div key={service} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </div>
                      <span className="font-medium text-gray-900">{service}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help connecting your services?{" "}
              <button 
              type="button"
              onClick={() => window.open('/help', '_blank')}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              View our setup guide
            </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}