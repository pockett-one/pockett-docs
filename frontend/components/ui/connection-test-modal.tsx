"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, User, Calendar, HardDrive, FileText } from "lucide-react"

interface ConnectionTestResult {
  userInfo: {
    email: string
    name: string
    quotaBytesUsed: string
    quotaBytesTotal: string
  }
  files: Array<{
    name: string
    mimeType: string
    modifiedTime: string
    size?: string
  }>
  totalFiles: number
}

interface ConnectionTestModalProps {
  isOpen: boolean
  onClose: () => void
  result: ConnectionTestResult | null
  connectionName: string
}

export function ConnectionTestModal({ isOpen, onClose, result, connectionName }: ConnectionTestModalProps) {
  if (!isOpen || !result) return null

  const formatBytes = (bytes: string) => {
    const numBytes = parseInt(bytes)
    if (numBytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(numBytes) / Math.log(k))
    return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatFileSize = (size?: string) => {
    if (!size) return 'Unknown size'
    return formatBytes(size)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Connection Test Results
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Account Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Account Information</span>
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{result.userInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{result.userInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Used:</span>
                  <span className="font-medium">{formatBytes(result.userInfo.quotaBytesUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Total:</span>
                  <span className="font-medium">{formatBytes(result.userInfo.quotaBytesTotal)}</span>
                </div>
              </div>
            </div>

            {/* Files */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Recent Files ({result.totalFiles} total)</span>
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {result.files.length > 0 ? (
                  <div className="space-y-3">
                    {result.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.mimeType}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-500">
                            {new Date(file.modifiedTime).toLocaleDateString()}
                          </p>
                          {file.size && (
                            <p className="text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No files found</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
