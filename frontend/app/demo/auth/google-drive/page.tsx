"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FolderOpen, CheckCircle, Shield, Eye, FileText, Users, Plus } from "lucide-react"
import Link from "next/link"
import { getConnections, saveConnections } from "@/lib/connection-utils"

export default function GoogleDriveAuthPage() {
  const [step, setStep] = useState<"google-signin" | "authorize" | "indexing">("google-signin")
  const [indexProgress, setIndexProgress] = useState(0)
  const [documentsFound, setDocumentsFound] = useState(0)
  const [foldersFound, setFoldersFound] = useState(0)

  useEffect(() => {
    if (step === "indexing") {
      const interval = setInterval(() => {
        setIndexProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          const increment = Math.random() * 10 + 5
          return Math.min(prev + increment, 100)
        })
        
        setDocumentsFound(prev => {
          const target = 1247
          const remaining = target - prev
          if (remaining <= 0) return target
          const increment = Math.min(Math.floor(Math.random() * 150) + 100, remaining)
          return prev + increment
        })
        setFoldersFound(prev => {
          const target = 89
          const remaining = target - prev
          if (remaining <= 0) return target
          const increment = Math.min(Math.floor(Math.random() * 15) + 10, remaining)
          return prev + increment
        })
      }, 300)

      return () => clearInterval(interval)
    }
  }, [step])

  const handleAuthorize = () => {
    // In a real app, this would redirect to Google OAuth
    setStep("indexing")
    setDocumentsFound(0)
    setFoldersFound(0)
    setIndexProgress(0)
  }

  const handleCancel = () => {
            window.location.href = "/demo/connectors"
  }

  const handleGoogleSignIn = () => {
    // Simulate Google sign-in success
    setStep("authorize")
  }

  if (step === "google-signin") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Google OAuth Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white text-lg font-bold">
                G
              </div>
              <span className="text-2xl font-normal text-gray-900">Sign in to Google</span>
            </div>
            <p className="text-gray-600">
              Choose an account to continue to Pockett
            </p>
          </div>

          {/* Google Account Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <div className="space-y-4">
              {/* Pre-filled dummy account */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-blue-500 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">John Doe</div>
                  <div className="text-sm text-gray-600">johndoe@gmail.com</div>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              
              {/* Add account option */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-sm text-gray-600">Use another account</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleGoogleSignIn}
            >
              Continue with johndoe@gmail.com
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to Google&apos;s{" "}
              <button 
                type="button"
                onClick={() => window.open('https://policies.google.com/terms', '_blank')}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button 
                type="button"
                onClick={() => window.open('https://policies.google.com/privacy', '_blank')}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === "authorize") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <FolderOpen className="h-10 w-10 text-blue-600" />
              <div className="text-2xl text-gray-400">→</div>
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white text-lg font-bold">
                G
              </div>
            </div>
            <h1 className="text-2xl font-normal text-gray-900 mb-2">
              Connect Google Drive
            </h1>
            <p className="text-gray-600">
              Authorize Pockett to access your Google Drive
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">
              Pockett needs permission to:
            </h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start space-x-3">
                <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">View your Google Drive files and folders</span>
              </li>
              <li className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Read document metadata and sharing settings</span>
              </li>
              <li className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Track access patterns for insights</span>
              </li>
            </ul>

            <div className="border-t border-blue-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">
                We will NOT:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Store or download your actual documents</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Modify or delete your files</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Share your documents with third parties</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleAuthorize} className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Authorize with Google
            </Button>
            <Button onClick={handleCancel} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By connecting, you agree to our{" "}
              <button 
                type="button"
                onClick={() => window.open('/privacy', '_blank')}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Privacy Policy
              </button>{" "}
              and{" "}
              <button 
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Terms of Service
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            Google Drive Connected
          </h1>
          <p className="text-gray-600">
            Indexing your documents and folders...
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Indexing Progress</span>
              <span className="text-sm text-gray-500">{Math.round(indexProgress)}%</span>
            </div>
            <Progress value={indexProgress} className="h-3" />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {documentsFound.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {foldersFound}
                </div>
                <div className="text-sm text-gray-600">Folders</div>
              </div>
            </div>
          </div>

          {indexProgress >= 100 ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-800">
                    Indexing completed successfully!
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Found {documentsFound.toLocaleString()} documents across {foldersFound} folders
                </p>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => {
                  // Get existing connections
                  let connections = getConnections()
                  
                  // Check if Google Drive connection already exists
                  const existingConnection = connections.find((conn: any) => conn.id === 'google-drive')
                  
                  if (existingConnection) {
                    // Update existing connection status
                    connections = connections.map((conn: any) =>
                      conn.id === 'google-drive' ? { ...conn, status: 'connected' } : conn
                    )
                  } else {
                    // Create new Google Drive connection
                    connections.push({
                      id: 'google-drive',
                      name: 'Google Drive',
                      status: 'connected',
                      icon: 'google-drive',
                      color: 'bg-white',
                      documentCount: 1247
                    })
                  }
                  
                  // Save updated connections using utility function
                  saveConnections(connections)
                  
                  // Notify other components about the connection update
                  window.dispatchEvent(new CustomEvent('pockett-connections-updated'))
                  
                  // Redirect to connectors page to show updated connection status
                  window.location.href = "/demo/connectors"
                }}
              >
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                This may take a few moments for large document collections
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}