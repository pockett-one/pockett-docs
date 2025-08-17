import { Button } from "@/components/ui/button"
import { FolderOpen, CheckCircle, Users, BarChart3, Shield, Bot } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
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
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="ghost" className="text-gray-600">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <FolderOpen className="h-16 w-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-5xl font-normal text-gray-900 mb-6">
              An Executive Assistant for your Document Store
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Organize, track, and get insights from your documents across Google Drive, Box, and Dropbox
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3 h-12">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Connect multiple document stores</h3>
                <p className="text-gray-600">Integrate with Google Drive, Box, Dropbox and more in one unified workspace.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Track document engagement and usage</h3>
                <p className="text-gray-600">Monitor how your team accesses and collaborates on documents over time.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Smart organization and project management</h3>
                <p className="text-gray-600">Automatically categorize and organize your documents with AI-powered insights.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Sharing controls with expiry dates</h3>
                <p className="text-gray-600">Set time-limited access and manage permissions across all your document stores.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Document summarization with AI</h3>
                <p className="text-gray-600">Get instant summaries and smart tags for all your important documents.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Advanced analytics and insights</h3>
                <p className="text-gray-600">Visualize document usage patterns and team collaboration metrics.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-normal text-center text-gray-900 mb-12">
            See Pockett in Action
          </h2>
          
          {/* Dashboard Preview */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-600">Pockett Dashboard</div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Mock Dashboard */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                  <span className="text-lg font-medium">Pockett</span>
                </div>
                <div className="text-sm text-gray-500">Connected: Google Drive (1,247 documents)</div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-600">Total Documents</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">23</div>
                  <div className="text-sm text-gray-600">Active Contributors</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <Shield className="h-8 w-8 text-yellow-600 mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">89</div>
                  <div className="text-sm text-gray-600">Shared Documents</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <Bot className="h-8 w-8 text-purple-600 mb-2" />
                  <div className="text-2xl font-semibold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">AI Summaries</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                Interactive Dashboard Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Instructions */}
      <section className="py-12 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-medium mb-6">🎮 Interactive Demo Instructions</h2>
          <div className="bg-blue-800 rounded-lg p-6 text-left">
            <ol className="space-y-3 text-blue-100">
              <li className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Click &ldquo;Sign Up&rdquo; to create an account (all fields can be filled with demo data)</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Complete sign up and proceed to sign in</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Enter any email and use OTP code: <strong className="text-yellow-300">123456</strong></span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                <span>Connect Google Drive from the connectors page</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
                <span>Explore the full dashboard with Documents, Engagement, Visualizations, Shared, and Contributors tabs!</span>
              </li>
            </ol>
            <div className="mt-6 text-center">
              <Link href="/dashboard">
                <Button variant="outline" className="bg-white text-blue-900 border-white hover:bg-blue-50">
                  🚀 Skip to Dashboard (for quick preview)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-6 w-6" />
              <span className="text-lg font-medium">Pockett</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 Pockett. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}