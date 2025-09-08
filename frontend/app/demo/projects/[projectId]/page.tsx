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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableDocumentCard } from './sortable-document-card'
import { DropZone } from './drop-zone'

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
  assignee?: string
  dueDate?: string
  notes?: Array<{
    id: string
    content: string
    author: string
    createdAt: string
  }>
}

export default function ProjectKanbanPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [workloadColumns, setWorkloadColumns] = useState<{id: string, title: string, role: string, documents: Document[]}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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
          contributor: "Sarah Johnson",
          assignee: "John (Editor)",
          dueDate: "2025-10-15",
          notes: [
            {
              id: "note-1",
              content: "Initial requirements gathered from stakeholders",
              author: "John (Editor)",
              createdAt: "2025-01-15T10:30:00Z"
            },
            {
              id: "note-2",
              content: "Need to clarify technical specifications",
              author: "Sarah Johnson",
              createdAt: "2025-01-16T14:20:00Z"
            }
          ]
        },
        {
          id: "doc-2",
          name: "Budget Spreadsheet Q1",
          type: "spreadsheet",
          size: 512000,
          modifiedTime: "2025-01-20T14:15:00Z",
          contributor: "Mike Chen",
          assignee: "Sarah (Editor)",
          dueDate: "2025-11-20",
          notes: [
            {
              id: "note-3",
              content: "Budget approved by finance team",
              author: "Sarah (Editor)",
              createdAt: "2025-01-20T14:15:00Z"
            }
          ]
        },
        {
          id: "doc-3",
          name: "Project Timeline Presentation",
          type: "presentation",
          size: 1024000,
          modifiedTime: "2025-01-18T09:45:00Z",
          contributor: "Emily Davis",
          assignee: "Daniel (Commentor)",
          dueDate: "2025-10-30",
          notes: []
        },
        {
          id: "doc-4",
          name: "Technical Specifications",
          type: "document",
          size: 368640,
          modifiedTime: "2025-01-22T16:20:00Z",
          contributor: "Alex Rodriguez",
          assignee: "John (Editor)",
          dueDate: "2025-12-15",
          notes: [
            {
              id: "note-4",
              content: "Architecture review needed",
              author: "Daniel (Commentor)",
              createdAt: "2025-01-22T16:20:00Z"
            }
          ]
        },
        {
          id: "doc-5",
          name: "Resource Allocation Plan",
          type: "spreadsheet",
          size: 307200,
          modifiedTime: "2025-01-25T11:30:00Z",
          contributor: "Lisa Wang",
          assignee: "Mike (Viewer)",
          dueDate: "2026-01-10",
          notes: []
        },
        {
          id: "doc-6",
          name: "Stakeholder Meeting Notes",
          type: "document",
          size: 184320,
          modifiedTime: "2025-01-28T13:45:00Z",
          contributor: "David Thompson",
          assignee: "Sarah (Editor)",
          dueDate: "2025-11-05",
          notes: [
            {
              id: "note-5",
              content: "Action items from stakeholder meeting",
              author: "Sarah (Editor)",
              createdAt: "2025-01-28T13:45:00Z"
            }
          ]
        },
        {
          id: "doc-7",
          name: "Risk Assessment Matrix",
          type: "spreadsheet",
          size: 204800,
          modifiedTime: "2025-01-30T15:10:00Z",
          contributor: "Rachel Green",
          assignee: "Daniel (Commentor)",
          dueDate: "2025-12-20",
          notes: []
        },
        {
          id: "doc-8",
          name: "Progress Report Template",
          type: "document",
          size: 122880,
          modifiedTime: "2025-02-01T08:30:00Z",
          contributor: "Tom Wilson",
          assignee: "Mike (Viewer)",
          dueDate: "2026-01-15",
          notes: []
        },
        {
          id: "doc-9",
          name: "Team Communication Plan",
          type: "document",
          size: 163840,
          modifiedTime: "2025-02-03T12:00:00Z",
          contributor: "Maria Garcia",
          assignee: "John (Editor)",
          dueDate: "2025-12-30",
          notes: []
        },
        {
          id: "doc-10",
          name: "Quality Assurance Checklist",
          type: "spreadsheet",
          size: 153600,
          modifiedTime: "2025-02-05T10:15:00Z",
          contributor: "James Lee",
          assignee: "Sarah (Editor)",
          dueDate: "2026-01-05",
          notes: []
        },
        {
          id: "doc-11",
          name: "User Research Report",
          type: "document",
          size: 456320,
          modifiedTime: "2025-02-08T09:15:00Z",
          contributor: "Research Team",
          assignee: undefined, // Will go to backlog
          dueDate: "2025-10-25",
          notes: []
        },
        {
          id: "doc-12",
          name: "Competitive Analysis",
          type: "spreadsheet",
          size: 678400,
          modifiedTime: "2025-02-10T14:30:00Z",
          contributor: "Market Research",
          assignee: undefined, // Will go to backlog
          dueDate: "2025-11-10",
          notes: []
        },
        {
          id: "doc-13",
          name: "Design System Guidelines",
          type: "document",
          size: 892160,
          modifiedTime: "2025-02-12T11:45:00Z",
          contributor: "Design Team",
          assignee: undefined, // Will go to backlog
          dueDate: "2025-12-05",
          notes: []
        },
        {
          id: "doc-14",
          name: "API Documentation",
          type: "document",
          size: 1024000,
          modifiedTime: "2025-02-14T16:20:00Z",
          contributor: "Dev Team",
          assignee: undefined, // Will go to backlog
          dueDate: "2026-01-20",
          notes: []
        },
        {
          id: "doc-15",
          name: "Final Project Report",
          type: "document",
          size: 512000,
          modifiedTime: "2025-02-16T10:00:00Z",
          contributor: "Project Manager",
          assignee: "Done", // Will go to Done column
          dueDate: "2025-02-15",
          notes: [
            {
              id: "note-6",
              content: "Project completed successfully",
              author: "Project Manager",
              createdAt: "2025-02-16T10:00:00Z"
            }
          ]
        },
        {
          id: "doc-16",
          name: "Post-Launch Analysis",
          type: "spreadsheet",
          size: 384000,
          modifiedTime: "2025-02-18T13:30:00Z",
          contributor: "Analytics Team",
          assignee: "Done", // Will go to Done column
          dueDate: "2025-02-18",
          notes: []
        }
      ]
      
      // Distribute documents across Workload swimlanes
      const assignees = [
        { id: "backlog", name: "Backlog", role: "" },
        { id: "john", name: "John", role: "Editor" },
        { id: "sarah", name: "Sarah", role: "Editor" },
        { id: "daniel", name: "Daniel", role: "Commentor" },
        { id: "mike", name: "Mike", role: "Viewer" },
        { id: "done", name: "Done", role: "" }
      ]

      const columns = assignees.map(assignee => ({
        id: assignee.id,
        title: assignee.name,
        role: assignee.role,
        documents: mockDocuments.filter(doc => {
          if (assignee.id === "backlog") {
            return !doc.assignee
          } else if (assignee.id === "done") {
            return doc.assignee === "Done"
          } else {
            return doc.assignee === `${assignee.name} (${assignee.role})`
          }
        })
      }))
      
      setWorkloadColumns(columns)
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

  const getColumnAccentColor = (columnId: string) => {
    switch (columnId) {
      case 'backlog':
        return '#d1d5db' // gray-300 - subtle gray
      case 'john':
        return '#93c5fd' // blue-300 - light blue
      case 'sarah':
        return '#93c5fd' // blue-300 - light blue
      case 'daniel':
        return '#fcd34d' // amber-300 - light amber
      case 'mike':
        return '#c4b5fd' // violet-300 - light violet
      case 'done':
        return '#6ee7b7' // emerald-300 - light emerald
      default:
        return undefined
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleAddNote = (docId: string, content: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      content,
      author: "Current User",
      createdAt: new Date().toISOString()
    }

    setWorkloadColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        documents: column.documents.map(doc => 
          doc.id === docId 
            ? { ...doc, notes: [...(doc.notes || []), newNote] }
            : doc
        )
      }))
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    if (draggedId === overId) return

    // Find the source and destination columns
    let sourceColumnIndex = -1
    let destinationColumnIndex = -1
    let sourceDocumentIndex = -1

    workloadColumns.forEach((column, columnIndex) => {
      const docIndex = column.documents.findIndex(doc => doc.id === draggedId)
      if (docIndex !== -1) {
        sourceColumnIndex = columnIndex
        sourceDocumentIndex = docIndex
      }
    })

    // Check if dropping on a column (not a document)
    const isDroppingOnColumn = workloadColumns.some(column => column.id === overId)
    
    if (isDroppingOnColumn) {
      destinationColumnIndex = workloadColumns.findIndex(column => column.id === overId)
    } else {
      // Dropping on another document
      workloadColumns.forEach((column, columnIndex) => {
        const docIndex = column.documents.findIndex(doc => doc.id === overId)
        if (docIndex !== -1) {
          destinationColumnIndex = columnIndex
        }
      })
    }

    if (sourceColumnIndex === -1 || destinationColumnIndex === -1) return

    // Move the document and update assignee
    const newColumns = [...workloadColumns]
    const [movedDocument] = newColumns[sourceColumnIndex].documents.splice(sourceDocumentIndex, 1)
    
    if (destinationColumnIndex !== sourceColumnIndex) {
      // Update assignee based on destination column
      const destinationColumn = newColumns[destinationColumnIndex]
      if (destinationColumn.id === "backlog") {
        movedDocument.assignee = undefined
      } else if (destinationColumn.id === "done") {
        movedDocument.assignee = "Done"
      } else {
        movedDocument.assignee = `${destinationColumn.title} (${destinationColumn.role})`
      }
      newColumns[destinationColumnIndex].documents.push(movedDocument)
    } else {
      // Same column, just reorder
      const destDocIndex = newColumns[destinationColumnIndex].documents.findIndex(doc => doc.id === overId)
      if (destDocIndex !== -1) {
        newColumns[destinationColumnIndex].documents.splice(destDocIndex, 0, movedDocument)
      }
    }

    setWorkloadColumns(newColumns)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
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

      {/* Workload Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-6 gap-4">
          {workloadColumns.map((column) => (
            <DropZone key={column.id} id={column.id} className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{column.title}</h3>
                    {column.role && (
                      <p className="text-xs text-gray-500">({column.role})</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {column.documents.length}
                  </span>
                </div>
                <div 
                  className="h-2 rounded-full"
                  style={{
                    width: '100%',
                    backgroundColor: column.id === 'backlog' ? '#f3f4f6' :
                                   column.id === 'john' ? '#dbeafe' :
                                   column.id === 'sarah' ? '#dbeafe' :
                                   column.id === 'daniel' ? '#fef3c7' :
                                   column.id === 'mike' ? '#f3e8ff' :
                                   '#dcfce7' // done
                  }}
                ></div>
              </div>
              
              <SortableContext items={column.documents.map(doc => doc.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {column.documents.map((doc, index) => (
                    <div key={doc.id}>
                      <SortableDocumentCard
                        doc={doc}
                        getDocumentIcon={getDocumentIcon}
                        formatFileSize={formatFileSize}
                        formatRelativeTime={formatRelativeTime}
                        formatDate={formatDate}
                        onAddNote={handleAddNote}
                        accentColor={getColumnAccentColor(column.id)}
                      />
                      {index < column.documents.length - 1 && (
                        <DropZone 
                          id={`${column.id}-drop-${index}`} 
                          className="h-2 my-1 rounded transition-all duration-200"
                        >
                          <div></div>
                        </DropZone>
                      )}
                    </div>
                  ))}
                  
                  {column.documents.length > 0 && (
                    <DropZone 
                      id={`${column.id}-drop-end`} 
                      className="h-2 rounded transition-all duration-200"
                    >
                      <div></div>
                    </DropZone>
                  )}
                  
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
              </SortableContext>
            </DropZone>
          ))}
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
              <div className="text-sm font-medium text-gray-900">
                {workloadColumns.flatMap(col => col.documents).find(doc => doc.id === activeId)?.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>
    </AppLayout>
  )
}
