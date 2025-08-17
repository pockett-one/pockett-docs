"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, Title, BarChart } from "@tremor/react"
import { Users, User, MessageSquare, Edit3, FileText, TrendingUp, Award, Clock } from "lucide-react"
import { getMockData, getContributorsByPeriod } from "@/lib/mock-data"

const timeFilters = [
  { id: "hour", label: "Past Hour" },
  { id: "7days", label: "Past 7 days" },
  { id: "30days", label: "Past 30 days" },
  { id: "90days", label: "Past 90 days" }
]

const collaborationMetrics = {
  "hour": {
    mostActiveDoc: "Q4 Planning.docx",
    mostActiveDocContributors: 2,
    totalEdits: 5,
    avgResponseTime: "15 minutes",
    newCollaborators: 0
  },
  "7days": {
    mostActiveDoc: "Q4 Planning.docx",
    mostActiveDocContributors: 5,
    totalEdits: 107,
    avgResponseTime: "2.3 hours",
    newCollaborators: 2
  },
  "30days": {
    mostActiveDoc: "Strategic Plan 2025.docx", 
    mostActiveDocContributors: 8,
    totalEdits: 487,
    avgResponseTime: "1.8 hours",
    newCollaborators: 5
  },
  "90days": {
    mostActiveDoc: "Product Roadmap.xlsx",
    mostActiveDocContributors: 12,
    totalEdits: 1456,
    avgResponseTime: "2.1 hours", 
    newCollaborators: 12
  }
}

export function ContributorsTab() {
  const [activeFilter, setActiveFilter] = useState("7days")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const mockData = getMockData()
  const currentData = mockData.summary.topContributors
  const currentContributors = currentData.slice(0, currentPage * itemsPerPage)
  const hasMore = currentData.length > currentPage * itemsPerPage
  const currentMetrics = collaborationMetrics[activeFilter as keyof typeof collaborationMetrics]

  // Prepare chart data
  const chartData = currentContributors.slice(0, 5).map(contributor => ({
    name: contributor.displayName.split(" ")[0], // First name only for chart
    Documents: contributor.documentsCount,
    Edits: contributor.editsCount,
    Comments: contributor.commentsCount
  }))

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", 
      "bg-pink-500", "bg-indigo-500", "bg-red-500"
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getAvatarInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const getTotalActivity = (contributor: any) => {
    return contributor.documentsCount + contributor.editsCount + contributor.commentsCount
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Top Contributors & Collaboration Insights</h2>
      </div>

      {/* Time Filter Buttons */}
      <div className="flex space-x-2">
        {timeFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            onClick={() => {
              setActiveFilter(filter.id)
              setCurrentPage(1)
            }}
            size="sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Current Period Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          {timeFilters.find(f => f.id === activeFilter)?.label} Activity
        </h3>
        <p className="text-sm text-blue-800">
          {currentData.length} active contributors with {currentData.reduce((sum, c) => sum + getTotalActivity(c), 0)} total interactions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contributors List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Active Contributors</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-5">Contributor</div>
                <div className="col-span-2 text-center">Documents</div>
                <div className="col-span-2 text-center">Edits</div>
                <div className="col-span-2 text-center">Comments</div>
                <div className="col-span-1 text-center">Total</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {currentContributors.map((contributor, index) => (
                <div 
                  key={contributor.emailAddress}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5 flex items-center space-x-3">
                      <div className="relative">
                        <div className={`w-10 h-10 ${getAvatarColor(contributor.displayName)} rounded-full flex items-center justify-center text-white font-medium`}>
                          {getAvatarInitials(contributor.displayName)}
                        </div>
                        {index === 0 && (
                          <Award className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{contributor.displayName}</div>
                        <div className="text-sm text-gray-500">{contributor.emailAddress}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{contributor.documentsCount}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Edit3 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{contributor.editsCount}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{contributor.commentsCount}</span>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="font-semibold text-gray-900">{getTotalActivity(contributor)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {(hasMore || currentPage > 1) && (
              <div className="border-t border-gray-200 px-6 py-4 text-center space-x-3">
                {currentPage > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                  >
                    View Less
                  </Button>
                )}
                {hasMore && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    View More ({currentData.length - currentContributors.length} remaining)
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Activity Breakdown</h3>
          
          <Card>
            <Title>Contributor Activity Comparison</Title>
            <BarChart
              data={chartData}
              index="name"
              categories={["Documents", "Edits", "Comments"]}
              colors={["blue", "green", "purple"]}
              yAxisWidth={40}
              className="h-72 mt-4"
            />
          </Card>
        </div>
      </div>

      {/* Team Collaboration Summary */}
      {currentMetrics && (
        <Card>
          <Title>Team Collaboration Summary</Title>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{currentMetrics.mostActiveDocContributors}</div>
              <div className="text-sm text-gray-600">Contributors on</div>
              <div className="text-sm font-medium text-blue-600">{currentMetrics.mostActiveDoc}</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Edit3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{currentMetrics.totalEdits}</div>
              <div className="text-sm text-gray-600">Total team edits</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{currentMetrics.avgResponseTime}</div>
              <div className="text-sm text-gray-600">Average response time</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{currentMetrics.newCollaborators}</div>
              <div className="text-sm text-gray-600">New collaborators</div>
            </div>
          </div>
        </Card>
      )}

      {/* Collaboration Insights */}
      <Card>
        <Title>Collaboration Insights</Title>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Most Collaborative</span>
            </div>
            <p className="text-sm text-blue-800">
              {currentData[0]?.displayName} leads with {currentData[0]?.editsCount + currentData[0]?.commentsCount} interactions
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Document Owner</span>
            </div>
            <p className="text-sm text-green-800">
              {currentData[0]?.displayName} works on the most documents ({currentData[0]?.documentsCount})
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-900">Communication</span>
            </div>
            <p className="text-sm text-purple-800">
              {currentData.reduce((sum, c) => sum + c.commentsCount, 0)} total comments in this period
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}