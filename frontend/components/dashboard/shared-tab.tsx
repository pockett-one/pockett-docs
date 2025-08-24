"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { FileText, File, Share2, ExternalLink, Settings, AlertTriangle, CheckCircle, Clock, FolderOpen } from "lucide-react"
import { getMockData, getSharedDocuments, formatRelativeTime } from "@/lib/mock-data"
import { DocumentIcon } from "@/components/ui/document-icon"

export function SharedTab() {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const mockData = getMockData()
  const sharedDocuments = getSharedDocuments()
  const totalPages = Math.ceil(sharedDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = sharedDocuments.slice(startIndex, endIndex)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "expiring":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "expired":
        return <Clock className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-700 bg-green-50 border-green-200"
      case "expiring":
        return "text-yellow-700 bg-yellow-50 border-yellow-200"
      case "expired":
        return "text-red-700 bg-red-50 border-red-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  const getExpiryWarning = (expiryDate: string | null, status: string) => {
    if (status === "expiring") {
      return "Expires in 3 days"
    }
    if (status === "expired") {
      return "Expired"
    }
    return null
  }

  const formatExpiryDate = (expiryDate: string | null) => {
    if (!expiryDate) return "Permanent"
    const date = new Date(expiryDate)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatCreatedDate = (createdDate: string | null) => {
    if (!createdDate) return "N/A"
    const date = new Date(createdDate)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on documents:`, selectedDocs)
    setSelectedDocs([])
  }

  const handleCreateShare = () => {
    console.log("Creating new share...")
  }

  const handleManagePermissions = () => {
    console.log("Managing permissions...")
  }

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const activeCount = mockData.summary.sharingStatus.active
  const expiringCount = mockData.summary.sharingStatus.expiring
  const expiredCount = mockData.summary.sharingStatus.expired

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Shared Documents Management</h2>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleManagePermissions}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Permissions
          </Button>
          <Button onClick={handleCreateShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Create New Share
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">Expiring Soon</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{expiringCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Expired</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{expiredCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Total Shared</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{sharedDocuments.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Extend Expiring Shares</div>
              <div className="text-sm text-gray-600 mt-1">Add 30 days to {expiringCount} expiring shares</div>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Review External Shares</div>
              <div className="text-sm text-gray-600 mt-1">Check documents shared outside organization</div>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Bulk Permission Update</div>
              <div className="text-sm text-gray-600 mt-1">Update multiple share permissions at once</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("extend")}>
                Extend Access
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("revoke")}>
                Revoke Access
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedDocs([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedDocs.length === currentDocuments.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDocs(currentDocuments.map(doc => doc.id))
                  } else {
                    setSelectedDocs([])
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-4">Document Name</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2">Expires</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {currentDocuments.map((doc) => {
            const warning = getExpiryWarning(doc.sharing.expiryDate, doc.sharing.sharingStatus)
            
            return (
              <div 
                key={doc.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  selectedDocs.includes(doc.id) ? "bg-blue-50" : ""
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleDocumentSelection(doc.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon mimeType={doc.mimeType} size={20} />
                      <div>
                        <div className="text-gray-900 hover:text-blue-600 cursor-pointer">
                          {doc.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Shared with {doc.sharing.sharedWith.length} recipient{doc.sharing.sharedWith.length > 1 ? "s" : ""} • {doc.engagement.viewCount} views
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-sm text-gray-600">
                    {formatCreatedDate(doc.sharing.createdDate)}
                  </div>
                  
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">{formatExpiryDate(doc.sharing.expiryDate)}</div>
                    {warning && (
                      <div className="text-xs text-red-600 font-medium">{warning}</div>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs font-medium ${getStatusColor(doc.sharing.sharingStatus)}`}>
                      {getStatusIcon(doc.sharing.sharingStatus)}
                      <span className="capitalize">{doc.sharing.sharingStatus}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" title="Open">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <PaginationInfo
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={sharedDocuments.length}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}