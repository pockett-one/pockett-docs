"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { ShareModal } from "@/components/ui/share-modal"
import { 
  Plus, 
  Kanban,
  Clock,
  CheckCircle,
  AlertCircle,
  Users
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  // Tour functionality
  const { isTourOpen, closeTour, forceStartTour } = useTourGuide('Projects')
  
  // Define tour steps for Projects page
  const tourSteps: TourStep[] = [
    {
      id: 'projects-header',
      title: 'Projects Overview',
      content: 'Welcome to the Projects page! Here you can view and manage all your active projects with their progress and status.',
      target: '.projects-header',
      position: 'bottom'
    },
    {
      id: 'create-project',
      title: 'Create New Project',
      content: 'Click this button to create a new project and start organizing your work.',
      target: '.create-project-btn',
      position: 'bottom'
    },
    {
      id: 'project-cards',
      title: 'Project Cards',
      content: 'Each project card shows key information: name, description, status, due date, document count, and progress.',
      target: '.project-card',
      position: 'top'
    },
    {
      id: 'project-status',
      title: 'Project Status',
      content: 'Projects can be Active (blue), Completed (green), or On Hold (amber). Status helps you prioritize your work.',
      target: '.project-status',
      position: 'right'
    },
    {
      id: 'project-progress',
      title: 'Progress Tracking',
      content: 'The progress bar shows completion percentage. Click on any project to open its detailed Workload board.',
      target: '.project-progress',
      position: 'left'
    }
  ]

  useEffect(() => {
    const loadProjectsData = () => {
      // Create hardcoded projects
      const projectList: Project[] = [
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
        },
        {
          id: "customer-feedback",
          name: "Customer Feedback Analysis",
          description: "Analyze customer feedback and implement improvements",
          status: 'active',
          dueDate: "2025-12-10",
          documentCount: 8,
          progress: 60,
          color: "bg-blue-500"
        },
        {
          id: "team-training",
          name: "Team Training Program",
          description: "Develop and implement comprehensive training program",
          status: 'on-hold',
          dueDate: "2026-02-15",
          documentCount: 12,
          progress: 20,
          color: "bg-amber-500"
        },
        {
          id: "security-audit",
          name: "Security Audit & Compliance",
          description: "Conduct security audit and ensure compliance standards",
          status: 'active',
          dueDate: "2025-11-25",
          documentCount: 6,
          progress: 75,
          color: "bg-blue-500"
        },
        {
          id: "mobile-app",
          name: "Mobile App Development",
          description: "Develop mobile application for iOS and Android",
          status: 'active',
          dueDate: "2026-03-30",
          documentCount: 25,
          progress: 40,
          color: "bg-blue-500"
        },
        {
          id: "data-migration",
          name: "Data Migration Project",
          description: "Migrate legacy data to new system architecture",
          status: 'completed',
          dueDate: "2025-10-20",
          documentCount: 18,
          progress: 100,
          color: "bg-green-500"
        },
        {
          id: "api-integration",
          name: "Third-party API Integration",
          description: "Integrate with external APIs and services",
          status: 'active',
          dueDate: "2025-12-05",
          documentCount: 10,
          progress: 55,
          color: "bg-blue-500"
        },
        {
          id: "performance-optimization",
          name: "Performance Optimization",
          description: "Optimize application performance and reduce load times",
          status: 'active',
          dueDate: "2025-11-15",
          documentCount: 7,
          progress: 80,
          color: "bg-blue-500"
        }
      ]
      
      setProjects(projectList)
      setIsLoading(false)
    }

    loadProjectsData()
  }, [])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleProjectClick = (projectId: string) => {
    window.location.href = `/demo/projects/${projectId}`
  }

  const handleShareClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent project card click
    setSelectedProject(project)
    setShareModalOpen(true)
  }

  const handleCloseShareModal = () => {
    setShareModalOpen(false)
    setSelectedProject(null)
  }

  // Pagination logic
  const totalPages = Math.ceil(projects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProjects = projects.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
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
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 projects-header">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage project workflows and tasks</p>
          </div>
          <Button className="flex items-center space-x-2 create-project-btn">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer project-card"
            onClick={() => handleProjectClick(project.id)}
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
              </div>
              <button
                onClick={(e) => handleShareClick(project, e)}
                className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                title="Share project"
              >
                <Users className="h-4 w-4" />
              </button>
            </div>

            {/* Project Description */}
            <p className="text-sm text-gray-600 mb-4">{project.description}</p>

            {/* Project Stats */}
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium project-status ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span>{getStatusText(project.status)}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {project.progress}% complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 project-progress">
                <div 
                  className={`h-2 rounded-full ${project.color}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <span>Due: {formatDate(project.dueDate)}</span>
                </div>
                <div>
                  <span>{project.documentCount} docs</span>
                </div>
              </div>

              {/* View Project Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation()
                  handleProjectClick(project.id)
                }}
              >
                <span>View Project</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {projects.length > itemsPerPage && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <PaginationInfo
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={projects.length}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showPageNumbers={5}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Kanban className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to start organizing your work</p>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        </div>
      )}
      </div>

      {/* Share Modal */}
      {selectedProject && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          projectName={selectedProject.name}
          projectId={selectedProject.id}
        />
      )}

      {/* Tour Guide */}
      <TourGuide
        isOpen={isTourOpen}
        onClose={closeTour}
        steps={tourSteps}
        pageName="Projects"
        onComplete={() => console.log('🎯 Projects tour completed!')}
      />
    </AppLayout>
  )
}
