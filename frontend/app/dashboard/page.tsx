"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EngagementTab } from "@/components/dashboard/engagement-tab"
import { VisualizationsTab } from "@/components/dashboard/visualizations-tab"
import { SharedTab } from "@/components/dashboard/shared-tab"
import { ContributorsTab } from "@/components/dashboard/contributors-tab"
import { 
  FolderOpen, 
  ChevronDown, 
  User, 
  Search,
  FileText,
  File,
  Image,
  ArrowUpDown,
  MoreHorizontal,
  Calendar,
  Users,
  BarChart3,
  Share2
} from "lucide-react"

// Mock data
const documents = [
  { id: 1, name: "Project Alpha", type: "folder", icon: FolderOpen, modified: "Today", size: "-", owner: "Me" },
  { id: 2, name: "Q4 Planning.docx", type: "doc", icon: FileText, modified: "Yesterday", size: "2.1MB", owner: "Me" },
  { id: 3, name: "Budget Analysis.xlsx", type: "sheet", icon: File, modified: "3 days ago", size: "890KB", owner: "Alice" },
  { id: 4, name: "Meeting Notes.docx", type: "doc", icon: FileText, modified: "1 week ago", size: "456KB", owner: "Bob" },
  { id: 5, name: "Archive", type: "folder", icon: FolderOpen, modified: "2 weeks ago", size: "-", owner: "Me" },
  { id: 6, name: "Proposal.pdf", type: "pdf", icon: File, modified: "3 weeks ago", size: "1.2MB", owner: "Carol" },
  { id: 7, name: "Specs.docx", type: "doc", icon: FileText, modified: "1 month ago", size: "678KB", owner: "Dave" },
  { id: 8, name: "Metrics.xlsx", type: "sheet", icon: File, modified: "1 month ago", size: "1.1MB", owner: "Alice" },
  { id: 9, name: "Draft.docx", type: "doc", icon: FileText, modified: "2 months ago", size: "234KB", owner: "Me" },
  { id: 10, name: "Old Projects", type: "folder", icon: FolderOpen, modified: "3 months ago", size: "-", owner: "Me" }
]

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentDocuments = filteredDocuments.slice(0, currentPage * itemsPerPage)
  const hasMore = filteredDocuments.length > currentPage * itemsPerPage

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder": return FolderOpen
      case "doc": return FileText
      case "sheet": return File
      case "pdf": return File
      case "image": return Image
      default: return File
    }
  }

  const getFileColor = (type: string) => {
    switch (type) {
      case "folder": return "text-blue-600"
      case "doc": return "text-blue-500"
      case "sheet": return "text-green-600"
      case "pdf": return "text-red-500"
      case "image": return "text-purple-500"
      default: return "text-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-white">
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

      {/* Connection Status */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-blue-800">Connected: Google Drive (1,247 documents)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Engagement</span>
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Visualizations</span>
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Shared</span>
            </TabsTrigger>
            <TabsTrigger value="contributors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Contributors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            {/* Breadcrumb and Search */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium text-gray-900">My Documents</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                  <div className="col-span-5 flex items-center space-x-2">
                    <span>Name</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <span>Modified</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <span>Size</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-1"></div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {currentDocuments.map((doc) => {
                  const IconComponent = getFileIcon(doc.type)
                  const iconColor = getFileColor(doc.type)
                  
                  return (
                    <div 
                      key={doc.id}
                      className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <IconComponent className={`h-5 w-5 ${iconColor}`} />
                          <span className="text-gray-900 hover:text-blue-600 truncate">
                            {doc.name}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {doc.modified}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {doc.size}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600 capitalize">
                          {doc.type === "folder" ? "Folder" : doc.type}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="border-t border-gray-200 px-6 py-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    View More ({filteredDocuments.length - currentDocuments.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementTab />
          </TabsContent>

          <TabsContent value="visualizations">
            <VisualizationsTab />
          </TabsContent>

          <TabsContent value="shared">
            <SharedTab />
          </TabsContent>

          <TabsContent value="contributors">
            <ContributorsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}