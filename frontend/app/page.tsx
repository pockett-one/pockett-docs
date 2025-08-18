import { Button } from "@/components/ui/button"
import { FolderOpen, CheckCircle, Users, BarChart3, Shield, Bot, Cloud, Database, Workflow, TrendingUp, FileText, Share2, Activity, Zap } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Pockett</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                  <Zap className="h-4 w-4 mr-2" />
                  AI-Powered Document Intelligence
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  An{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Executive Assistant
                  </span>{" "}
                  for your Document Store
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Organize, track, and get insights from your documents across Google Drive, Box, and Dropbox with AI-powered analytics and smart automation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button size="lg" className="text-lg px-8 py-4 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1">
                      Get Started Free
                      <TrendingUp className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-14 border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      View Demo Dashboard
                      <Activity className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Right side - Visual diagram */}
            <div className="relative">
              {/* Central Dashboard Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded">
                      <FolderOpen className="h-4 w-4 text-white m-1" />
                    </div>
                    <span className="font-semibold">Pockett Dashboard</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Mini dashboard stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600 mb-1" />
                    <div className="text-sm font-semibold">1,247</div>
                    <div className="text-xs text-gray-600">Documents</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 mb-1" />
                    <div className="text-sm font-semibold">23</div>
                    <div className="text-xs text-gray-600">Contributors</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Share2 className="h-5 w-5 text-purple-600 mb-1" />
                    <div className="text-sm font-semibold">89</div>
                    <div className="text-xs text-gray-600">Shared</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <Bot className="h-5 w-5 text-orange-600 mb-1" />
                    <div className="text-sm font-semibold">156</div>
                    <div className="text-xs text-gray-600">AI Insights</div>
                  </div>
                </div>
                
                {/* Activity indicator */}
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Live Analytics</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating connector cards */}
              <div className="absolute -top-4 -left-8 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Google Drive</div>
                    <div className="text-xs text-gray-500">Connected</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-8 -right-6 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Dropbox</div>
                    <div className="text-xs text-gray-500">Ready</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Box</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                </div>
              </div>
              
              {/* Data flow animations */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to manage your documents
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for modern teams and executives
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Connect multiple document stores</h3>
              </div>
              <p className="text-gray-600">Integrate with Google Drive, Box, Dropbox and more in one unified workspace.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Track document engagement and usage</h3>
              </div>
              <p className="text-gray-600">Monitor how your team accesses and collaborates on documents over time.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Smart organization and project management</h3>
              </div>
              <p className="text-gray-600">Automatically categorize and organize your documents with AI-powered insights.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Sharing controls with expiry dates</h3>
              </div>
              <p className="text-gray-600">Set time-limited access and manage permissions across all your document stores.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Document summarization with AI</h3>
              </div>
              <p className="text-gray-600">Get instant summaries and smart tags for all your important documents.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Advanced analytics and insights</h3>
              </div>
              <p className="text-gray-600">Visualize document usage patterns and team collaboration metrics.</p>
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