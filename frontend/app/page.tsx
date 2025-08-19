"use client"
import { Button } from "@/components/ui/button"
import { FolderOpen, CheckCircle, Users, BarChart3, Shield, Bot, Cloud, Database, Workflow, TrendingUp, FileText, Share2, Activity } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import { CookiePolicy } from "@/components/legal/cookie-policy"
import { TermsOfService } from "@/components/legal/terms-of-service"
import { Support } from "@/components/legal/support"
import { CookieConsent } from "@/components/ui/cookie-consent"

export default function LandingPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const openModal = (modalName: string) => {
    setActiveModal(modalName)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  return (
    <>


      
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
              <Link href="/demo/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all">Demo Sign In</Button>
              </Link>
              <Link href="/demo/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">Demo Sign Up</Button>
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
                  <Bot className="h-4 w-4 mr-1" />Data-Driven Insights&nbsp;&nbsp;
                  <BarChart3 className="h-4 w-4 mr-2" />Document Analysis
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Data-Driven Insights
                  </span>{" "}
                  to Supercharge Your Document Cloud
                </h1>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Stop losing documents in the cloud. Get data-driven insights that surface what matters, declutter storage, and protect your sensitive files.
                </p>
                <div className="mb-6 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>Focus:</strong> Identify your most important documents right now</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>Storage:</strong> Automatically find stale, large, and duplicate files to clean up</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>Security:</strong> Spot risky shares and expiring permissions before they become problems</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/demo/signup">
                    <Button size="lg" className="text-lg px-8 py-4 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1">
                      Get Data Insights Free
                      <Bot className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/demo/app">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-14 border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      See Insights in Action
                      <BarChart3 className="h-5 w-5 ml-2" />
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
                    <Bot className="h-5 w-5 text-blue-600 mb-1" />
                    <div className="text-sm font-semibold">15</div>
                    <div className="text-xs text-gray-600">Data Focus Items</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600 mb-1" />
                    <div className="text-sm font-semibold">89</div>
                    <div className="text-xs text-gray-600">Storage Issues</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600 mb-1" />
                    <div className="text-sm font-semibold">12</div>
                    <div className="text-xs text-gray-600">Security Alerts</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600 mb-1" />
                    <div className="text-sm font-semibold">2.1GB</div>
                    <div className="text-xs text-gray-600">Space Saved</div>
                  </div>
                </div>
                
                {/* Activity indicator */}
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Insights Active</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600">Scanning</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating connector cards */}
              <div className="absolute -top-6 -left-12 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform -rotate-12 hover:rotate-0 transition-transform duration-300 z-20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                    <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 23.8z" fill="#ea4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium">Google Drive</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-6 -right-10 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform rotate-12 hover:rotate-0 transition-transform duration-300 z-20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                    <img src="/images/brand-logos/dropbox-logo.png" alt="Dropbox" className="h-4 w-4 object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Dropbox</div>
                    <div className="text-xs text-gray-500">Comming Soon</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-8 left-2 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform rotate-6 hover:rotate-0 transition-transform duration-300 z-20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                    <img src="/images/brand-logos/box-logo.png" alt="Box" className="h-4 w-4 object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Box</div>
                    <div className="text-xs text-gray-500">Coming Soon</div>
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
              Everything you need for document cloud usage reports & insights
            </h2>
            <p className="text-lg text-gray-600">
              Powerful reporting features designed for freelancers & teams
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="currentColor"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="currentColor"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 23.8z" fill="currentColor"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="currentColor"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="currentColor"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Google Drive Integration</h3>
                </div>
                <p className="text-gray-600">Connect your Google Drive workspace for unified document analytics, insights, and team collaboration tracking.</p>
              </div>
              <div className="bg-green-100 text-green-700 text-center py-2 text-xs font-medium border-t border-green-200 mt-auto">
                Featured
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Track document engagement and usage</h3>
                </div>
                <p className="text-gray-600">Monitor how your team accesses and collaborates on documents over time.</p>
              </div>
              <div className="bg-green-100 text-green-700 text-center py-2 text-xs font-medium border-t border-green-200 mt-auto">
                Featured
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Advanced reports and insights</h3>
                </div>
                <p className="text-gray-600">Visualize document usage patterns and team collaboration metrics.</p>
              </div>
              <div className="bg-green-100 text-green-700 text-center py-2 text-xs font-medium border-t border-green-200 mt-auto">
                Featured
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Share2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Document Cloud Connectors+</h3>
                </div>
                <p className="text-gray-600">Connect with Dropbox, Box, OneDrive, Confluence, and Notion. Expand your document ecosystem beyond Google Drive.</p>
              </div>
              <div className="bg-gray-100 text-gray-600 text-center py-2 text-xs font-medium border-t border-gray-200 mt-auto">
                Coming Soon
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Document summarization with data</h3>
                </div>
                <p className="text-gray-600">Get instant summaries and smart tags for all your important documents.</p>
              </div>
              <div className="bg-gray-100 text-gray-600 text-center py-2 text-xs font-medium border-t border-gray-200 mt-auto">
                Coming Soon
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Workflow className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Document workflow management</h3>
                </div>
                <p className="text-gray-600">Streamline document approval processes and track workflow progress across internal & client teams.</p>
              </div>
              <div className="bg-gray-100 text-gray-600 text-center py-2 text-xs font-medium border-t border-gray-200 mt-auto">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about Pockett
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How does Pockett connect to my Google Drive?
              </h3>
              <p className="text-gray-600">
                Pockett uses secure OAuth 2.0 authentication to connect to your Google Drive. We only access the documents you authorize, and we never store your actual document content - just metadata for analytics and insights.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What kind of insights can I get from Pockett?
              </h3>
                              <p className="text-gray-600">
                  Pockett provides document usage analytics, team collaboration metrics, engagement tracking, sharing patterns, and data-driven document summarization. You&apos;ll get insights into how your team uses documents and identify opportunities for better organization.
                </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is my data secure with Pockett?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade security measures including end-to-end encryption, secure API connections, and strict access controls. Your data is never shared with third parties and is stored in secure, compliant data centers.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                When will you support other platforms like Dropbox and Box?
              </h3>
                              <p className="text-gray-600">
                  We&apos;re actively working on expanding our integrations. Dropbox, Box, OneDrive, Confluence, and Notion support are coming soon. Sign up for updates to be notified when new integrations become available.
                </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do I need IT admin permissions to use Pockett?
              </h3>
              <p className="text-gray-600">
                No! Pockett is designed for freelancers, small teams, and individuals who need document insights without complex IT setup. You can connect your own accounts and start getting insights immediately.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How much does Pockett cost?
              </h3>
              <p className="text-gray-600">
                Pockett offers a free tier to get you started, with premium plans for advanced features and higher usage limits. Our pricing is designed to be accessible for freelancers and small teams, with no hidden fees or long-term contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-t border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Pockett</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Transform your document cloud usage into actionable insights with powerful analytics and reporting tools designed for modern teams.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="mailto:info@pockett.io"
                  className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="/demo/app" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</a></li>
                <li><a href="/demo/signup" className="text-gray-600 hover:text-blue-600 transition-colors">Sign Up</a></li>
                <li><a href="/demo/signin" className="text-gray-600 hover:text-blue-600 transition-colors">Sign In</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><button onClick={() => openModal('privacy')} className="text-gray-600 hover:text-blue-600 transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => openModal('cookies')} className="text-gray-600 hover:text-blue-600 transition-colors text-left">Cookie Policy</button></li>
                <li><button onClick={() => openModal('terms')} className="text-gray-600 hover:text-blue-600 transition-colors text-left">Terms of Service</button></li>
                <li><button onClick={() => openModal('support')} className="text-gray-600 hover:text-blue-600 transition-colors text-left">Support</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-100 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © 2025 Pockett. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <span>Document usage insights for improved visibility & efficiency</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <Modal isOpen={activeModal === 'privacy'} onClose={closeModal} title="Privacy Policy">
        <PrivacyPolicy />
      </Modal>

      <Modal isOpen={activeModal === 'cookies'} onClose={closeModal} title="Cookie Policy">
        <CookiePolicy />
      </Modal>

      <Modal isOpen={activeModal === 'terms'} onClose={closeModal} title="Terms of Service">
        <TermsOfService />
      </Modal>

      <Modal isOpen={activeModal === 'support'} onClose={closeModal} title="Support">
        <Support />
      </Modal>

      {/* Cookie Consent Banner */}
      <CookieConsent />
      </div>
    </>
  )
}