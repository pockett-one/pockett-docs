"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  X, 
  Users, 
  Mail, 
  Shield, 
  Eye, 
  Edit, 
  AlertCircle,
  Info
} from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  projectId: string
}

interface SharePermission {
  id: string
  email: string
  name: string
  role: 'editor' | 'commentor' | 'viewer'
  avatar?: string
  status: 'pending' | 'active'
}

export function ShareModal({ isOpen, onClose, projectName, projectId }: ShareModalProps) {
  const [nameInput, setNameInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [selectedRole, setSelectedRole] = useState<'editor' | 'commentor' | 'viewer'>('editor')
  const [showPermissionTooltip, setShowPermissionTooltip] = useState(false)
  const [permissions, setPermissions] = useState<SharePermission[]>([
    {
      id: '1',
      email: 'john.doe@company.com',
      name: 'John Doe',
      role: 'editor',
      status: 'active'
    },
    {
      id: '2',
      email: 'sarah.smith@company.com',
      name: 'Sarah Smith',
      role: 'editor',
      status: 'active'
    },
    {
      id: '3',
      email: 'daniel.delaney@company.com',
      name: 'Daniel Delaney',
      role: 'commentor',
      status: 'active'
    },
    {
      id: '4',
      email: 'mike.cook@company.com',
      name: 'Mike Cook',
      role: 'viewer',
      status: 'active'
    }
  ])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)

  // Mock email suggestions
  const emailSuggestions = [
    { email: 'emily.davis@company.com', name: 'Emily Davis' },
    { email: 'alex.rodriguez@company.com', name: 'Alex Rodriguez' },
    { email: 'lisa.wang@company.com', name: 'Lisa Wang' },
    { email: 'david.thompson@company.com', name: 'David Thompson' },
    { email: 'rachel.green@company.com', name: 'Rachel Green' },
    { email: 'tom.wilson@company.com', name: 'Tom Wilson' },
    { email: 'maria.garcia@company.com', name: 'Maria Garcia' },
    { email: 'james.lee@company.com', name: 'James Lee' }
  ]

  const filteredSuggestions = emailSuggestions.filter(suggestion => 
    suggestion.email.toLowerCase().includes(emailInput.toLowerCase()) ||
    suggestion.name.toLowerCase().includes(emailInput.toLowerCase())
  )

  const handleAddPermission = () => {
    if (nameInput.trim() && emailInput.trim() && emailInput.includes('@')) {
      const newPermission: SharePermission = {
        id: Date.now().toString(),
        email: emailInput.trim(),
        name: nameInput.trim(),
        role: selectedRole,
        status: 'pending'
      }
      setPermissions([...permissions, newPermission])
      setNameInput("")
      setEmailInput("")
      setShowEmailSuggestions(false)
    }
  }

  const handleRemovePermission = (id: string) => {
    setPermissions(permissions.filter(p => p.id !== id))
  }

  const handleRoleChange = (id: string, newRole: 'editor' | 'commentor' | 'viewer') => {
    setPermissions(permissions.map(p => 
      p.id === id ? { ...p, role: newRole } : p
    ))
  }


  const getRoleIcon = (role: 'editor' | 'commentor' | 'viewer') => {
    switch (role) {
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'commentor':
        return <Shield className="h-4 w-4 text-orange-600" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: 'editor' | 'commentor' | 'viewer') => {
    switch (role) {
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'commentor':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleDescription = (role: 'editor' | 'commentor' | 'viewer') => {
    switch (role) {
      case 'editor':
        return 'Can edit, comment, and share'
      case 'commentor':
        return 'Can comment and view'
      case 'viewer':
        return 'Can view only'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Share &quot;{projectName}&quot;</h2>
              <p className="text-sm text-gray-500">Choose who can access this project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Add People Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Add people and groups</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter full name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1 relative">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value)
                      setShowEmailSuggestions(e.target.value.length > 0)
                    }}
                    onFocus={() => setShowEmailSuggestions(emailInput.length > 0)}
                    className="w-full"
                  />
                
                {/* Email Suggestions */}
                {showEmailSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setNameInput(suggestion.name)
                          setEmailInput(suggestion.email)
                          setShowEmailSuggestions(false)
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {suggestion.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                          <div className="text-xs text-gray-500">{suggestion.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'editor' | 'commentor' | 'viewer')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="commentor">Commentor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowPermissionTooltip(true)}
                      onMouseLeave={() => setShowPermissionTooltip(false)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-50"
                      title="Permission levels guide"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                    
                    {showPermissionTooltip && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-blue-50 border border-blue-200 text-xs rounded-lg p-3 shadow-lg z-[9999]">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon('editor')}
                            <span className="text-sm text-blue-800">Editor: {getRoleDescription('editor')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon('commentor')}
                            <span className="text-sm text-blue-800">Commentor: {getRoleDescription('commentor')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon('viewer')}
                            <span className="text-sm text-blue-800">Viewer: {getRoleDescription('viewer')}</span>
                          </div>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-200"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button onClick={handleAddPermission} disabled={!nameInput.trim() || !emailInput.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </div>


          {/* Permissions List */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">People with access</span>
            </div>
            
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">
                        {permission.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                      <div className="text-xs text-gray-500">{permission.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={permission.role}
                      onChange={(e) => handleRoleChange(permission.id, e.target.value as 'editor' | 'commentor' | 'viewer')}
                      className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(permission.role)}`}
                    >
                      <option value="editor">Editor</option>
                      <option value="commentor">Commentor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    
                    <button
                      onClick={() => handleRemovePermission(permission.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>Changes are saved automatically</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
