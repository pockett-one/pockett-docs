"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { 
  Plus, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Presentation,
  FolderOpen
} from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  dueDate: string
  documentCount: number
  progress: number
  color: string
}

interface Document {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'pdf'
  size: number
  modifiedTime: string
  contributor: string
}

export default function ProjectKanbanPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [kanbanColumns, setKanbanColumns] = useState<{id: string, title: string, documents: Document[]}[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjectData = () => {
      // Define projects
      const projects: Project[] = [
        {
          id: "q1-strategic",
          name: "Q1 2025 Strategic Initiative",
          description: "Strategic planning and execution for Q1 2025",
          status: 'active',
          dueDate: "2025-12-31",
          documentCount: 20,
          progress: 65,
          color: "bg-blue-500"
        },
        {
          id: "marketing-campaign",
          name: "Q1 Marketing Campaign",
          description: "Digital marketing campaign for Q1 2025",
          status: 'active',
          dueDate: "2025-11-30",
          documentCount: 12,
          progress: 45,
          color: "bg-blue-500"
        },
        {
          id: "financial-review",
          name: "Q4 Financial Review",
          description: "Quarterly financial analysis and reporting",
          status: 'completed',
          dueDate: "2025-10-15",
          documentCount: 8,
          progress: 100,
          color: "bg-green-500"
        },
        {
          id: "hr-policies",
          name: "HR Policy Updates",
          description: "Update and review HR policies and procedures",
          status: 'on-hold',
          dueDate: "2025-12-15",
          documentCount: 6,
          progress: 25,
          color: "bg-amber-500"
        },
        {
          id: "product-launch",
          name: "Product Launch Preparation",
          description: "Prepare for new product launch in Q2",
          status: 'active',
          dueDate: "2026-01-31",
          documentCount: 15,
          progress: 30,
          color: "bg-blue-500"
        }
      ]
      
      const currentProject = projects.find(p => p.id === params.projectId)
      
      if (!currentProject) {
        router.push('/demo/projects')
        return
      }
      
      setProject(currentProject)
      
      // Create mock documents for the project
      const mockDocuments: Document[] = [
        {
          id: "doc-1",
          name: "Project Requirements Document",
          type: "document",
          size: 245760,
          modifiedTime: "2025-01-15T10:30:00Z",
          contributor: "Sarah Johnson"
        },
        {
          id: "doc-2",
          name: "Budget Spreadsheet Q1",
          type: "spreadsheet",
          size: 512000,
          modifiedTime: "2025-01-20T14:15:00Z",
          contributor: "Mike Chen"
        },
        {
          id: "doc-3",
          name: "Project Timeline Presentation",
          type: "presentation",
          size: 1024000,
          modifiedTime: "2025-01-18T09:45:00Z",
          contributor: "Emily Davis"
        },
        {
          id: "doc-4",
          name: "Technical Specifications",
          type: "document",
          size: 368640,
          modifiedTime: "2025-01-22T16:20:00Z",
          contributor: "Alex Rodriguez"
        },
        {
          id: "doc-5",
          name: "Resource Allocation Plan",
          type: "spreadsheet",
          size: 307200,
          modifiedTime: "2025-01-25T11:30:00Z",
          contributor: "Lisa Wang"
        },
        {
          id: "doc-6",
          name: "Stakeholder Meeting Notes",
          type: "document",
          size: 184320,
          modifiedTime: "2025-01-28T13:45:00Z",
          contributor: "David Thompson"
        },
        {
          id: "doc-7",
          name: "Risk Assessment Matrix",
          type: "spreadsheet",
          size: 204800,
          modifiedTime: "2025-01-30T15:10:00Z",
          contributor: "Rachel Green"
        },
        {
          id: "doc-8",
          name: "Progress Report Template",
          type: "document",
          size: 122880,
          modifiedTime: "2025-02-01T08:30:00Z",
          contributor: "Tom Wilson"
        },
        {
          id: "doc-9",
          name: "Team Communication Plan",
          type: "document",
          size: 163840,
          modifiedTime: "2025-02-03T12:00:00Z",
          contributor: "Maria Garcia"
        },
        {
          id: "doc-10",
          name: "Quality Assurance Checklist",
          type: "spreadsheet",
          size: 153600,
          modifiedTime: "2025-02-05T10:15:00Z",
          contributor: "James Lee"
        }
      ]
      
      // Distribute documents across Kanban columns
      const columns = [
        {
          id: "backlog",
          title: "Backlog",
          documents: mockDocuments.slice(0, 2)
        },
        {
          id: "in-progress",
          title: "In Progress",
          documents: mockDocuments.slice(2, 4)
        },
        {
          id: "in-review",
          title: "In Review",
          documents: mockDocuments.slice(4, 6)
        },
        {
          id: "in-acceptance",
          title: "In Acceptance",
          documents: mockDocuments.slice(6, 8)
        },
        {
          id: "done",
          title: "Done",
          documents: mockDocuments.slice(8, 10)
        }
      ]
      
      setKanbanColumns(columns)
      setIsLoading(false)
    }

    loadProjectData()
  }, [params.projectId, router])

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'on-hold':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'completed':
        return 'Completed'
      case 'on-hold':
        return 'On Hold'
    }
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'on-hold':
        return 'text-orange-600 bg-orange-50'
    }
  }

  const getDocumentIcon = (doc: Document) => {
    switch (doc.type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />
      case 'presentation':
        return <Presentation className="h-4 w-4 text-orange-600" />
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex-1 p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <Button onClick={() => router.push('/demo/projects')}>
              Back to Projects
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 p-6">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 mb-6">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/demo/projects')}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Projects</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {project.name}
            </span>
          </div>
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${project.color.replace('bg-', 'bg-').replace('-500', '-100')} rounded-lg flex items-center justify-center`}>
              <div className="w-5 h-5 bg-blue-600 rounded"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)}
                <span className="font-medium">{getStatusText(project.status)}</span>
              </div>
              <div>
                <span>Due: {formatDate(project.dueDate)}</span>
              </div>
              <div>
                <span>{project.documentCount} documents</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex flex-col items-end space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-600 w-32">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${project.progress}%`,
                    backgroundColor: project.status === 'completed' ? '#10b981' : 
                                    project.status === 'active' ? '#3b82f6' : '#f59e0b'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {kanbanColumns.map((column) => (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{column.title}</h3>
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                  {column.documents.length}
                </span>
              </div>
              <div 
                className="h-2 rounded-full"
                style={{
                  width: '100%',
                  backgroundColor: column.id === 'backlog' ? '#dcfce7' :
                                 column.id === 'in-progress' ? '#bbf7d0' :
                                 column.id === 'in-review' ? '#86efac' :
                                 column.id === 'in-acceptance' ? '#4ade80' :
                                 '#22c55e' // done
                }}
              ></div>
            </div>
            
            <div className="space-y-3">
              {column.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getDocumentIcon(doc)}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>{formatRelativeTime(doc.modifiedTime)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{doc.contributor}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {column.id === "backlog" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </AppLayout>
  )
}
