"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, File, Clock, TrendingDown, FolderOpen } from "lucide-react"
import { getMockData, getDocumentsByPeriod, formatRelativeTime, getFileIconComponent } from "@/lib/mock-data"

export function EngagementTab() {
  const [activeFilter, setActiveFilter] = useState("7days")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const mockData = getMockData()
  
  // Calculate actual counts for each filter
  const getFilterCount = (filterId: string) => {
    return getDocumentsByPeriod(filterId).length
  }
  
  const timeFilters = [
    { id: "hour", label: "Past Hour", count: getFilterCount("hour") },
    { id: "7days", label: "Past 7 days", count: getFilterCount("7days") },
    { id: "30days", label: "Past 30 days", count: getFilterCount("30days") },
    { id: "90days", label: "Past 90 days", count: getFilterCount("90days") },
    { id: "dormant", label: "Dormant", count: getFilterCount("dormant") },
    { id: "duplicates", label: "Duplicates", count: getFilterCount("duplicates") }
  ]

  const currentData = getDocumentsByPeriod(activeFilter)
  const currentDocuments = currentData.slice(0, currentPage * itemsPerPage)
  const hasMore = currentData.length > currentPage * itemsPerPage

  const getAccessFrequencyColor = (count: number) => {
    if (count >= 20) return "bg-red-100 text-red-800"
    if (count >= 10) return "bg-yellow-100 text-yellow-800"
    if (count >= 5) return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-4">Document Access Timeline</h2>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {timeFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              onClick={() => {
                setActiveFilter(filter.id)
                setCurrentPage(1)
              }}
              className="flex items-center space-x-2"
            >
              <span>{filter.label}</span>
              <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs">
                {filter.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Active Filter Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            {activeFilter === "dormant" && <TrendingDown className="h-5 w-5 text-orange-600" />}
            {activeFilter === "duplicates" && <File className="h-5 w-5 text-purple-600" />}
            {!["dormant", "duplicates"].includes(activeFilter) && <Clock className="h-5 w-5 text-blue-600" />}
            <h3 className="font-medium text-gray-900">
              {timeFilters.find(f => f.id === activeFilter)?.label} ({currentData.length} documents accessed)
            </h3>
          </div>
          {activeFilter === "dormant" && (
            <p className="text-sm text-gray-600 mt-1">
              Documents not accessed in 90+ days. Consider archiving or reviewing these files.
            </p>
          )}
          {activeFilter === "duplicates" && (
            <p className="text-sm text-gray-600 mt-1">
              Files with identical names or similar content. Review for consolidation opportunities.
            </p>
          )}
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
              <div className="col-span-6">Document Name</div>
              <div className="col-span-3">Last Accessed</div>
              <div className="col-span-2">Access Count</div>
              <div className="col-span-1">Heat</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {currentDocuments.map((doc) => {
              const iconInfo = getFileIconComponent(doc.mimeType)
              const IconComponent = iconInfo.component === 'FolderOpen' ? FolderOpen : 
                                   iconInfo.component === 'FileText' ? FileText : File
              
              return (
                <div 
                  key={doc.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center space-x-3">
                      <IconComponent className={`h-5 w-5 ${iconInfo.color}`} />
                      <div>
                        <span className="text-gray-900 hover:text-blue-600">
                          {doc.name}
                        </span>
                        {doc.isDuplicate && (
                          <div className="text-xs text-purple-600 mt-1">{doc.duplicateCount} copies found</div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">
                      {formatRelativeTime(doc.lastAccessedTime)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-900 font-medium">
                      {doc.accessCount}
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccessFrequencyColor(doc.accessCount)}`}>
                        {doc.accessCount >= 20 ? "High" : doc.accessCount >= 10 ? "Med" : doc.accessCount >= 5 ? "Low" : "Min"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {(hasMore || currentPage > 1) && (
            <div className="border-t border-gray-200 px-6 py-4 text-center space-x-3">
              {currentPage > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(1)}
                >
                  View Less
                </Button>
              )}
              {hasMore && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  View More ({currentData.length - currentDocuments.length} remaining)
                </Button>
              )}
            </div>
          )}

          {currentDocuments.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600">No documents match the selected time period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}