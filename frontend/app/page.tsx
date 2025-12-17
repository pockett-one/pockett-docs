"use client"
import { Button } from "@/components/ui/button"
import { FolderOpen, CheckCircle, Users, BarChart3, Shield, Bot, Cloud, Database, Workflow, TrendingUp, FileText, Share2, Activity, Crosshair, HardDrive, Info, PlayCircle, User, Building2, ArrowRight, Puzzle, Sparkles, MessageSquare, Twitter, Linkedin, Instagram, Youtube, Check, Mail } from "lucide-react"
import Logo from "../components/Logo"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import { CookiePolicy } from "@/components/legal/cookie-policy"
import { TermsOfService } from "@/components/legal/terms-of-service"
import { Support } from "@/components/legal/support"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { FAQModal } from "@/components/ui/faq-modal"
import { Header } from "@/components/layout/Header"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pricing } from "@/components/sections/Pricing"


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
        <Header onOpenModal={openModal} />

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <div className="text-center lg:text-left">
                <div className="mb-6">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                    <Shield className="h-4 w-4 mr-1" />Simple Insights & Control&nbsp;&nbsp;
                    <Users className="h-4 w-4 mr-2" />Flat Pricing
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Supercharge Your Google Drive Experience
                    </span>{" "}
                    <br className="hidden lg:block" />
                    Without Google Workspace baggage
                  </h1>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed font-medium">
                    Freelancers, consultants, and small agencies: Stop struggling with messy Google Drives, risky sharing, and client onboarding overhead. Get simple insights & control with flat pricing that avoids the per-seat tax.
                  </p>
                  <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-1 tracking-tight">Simple Insights</div>
                        <div className="text-slate-600">Surface the problems in your Google Drive with clear analytics</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:border-green-200 transition-all duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-1 tracking-tight">Productivity</div>
                        <div className="text-slate-600">Watchlist, due dates & reminders, storage cleanup tools, duplicate detection</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:border-purple-200 transition-all duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-1 tracking-tight">Project-Focused</div>
                        <div className="text-slate-600">Collaborate without Google Workspace baggage. Project Team spaces for internal and client collaboration</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:border-orange-200 transition-all duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <HardDrive className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-1 tracking-tight">You Own Your Data</div>
                        <div className="text-slate-600">Your documents stay in your Google Drive. We give you the power to master your Google Drive with insights & productivity tools</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right side - Visual diagram */}
              <div className="relative pt-4 pb-4">
                {/* Central Dashboard Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded">
                        <FolderOpen className="h-5 w-5 text-white m-1.5" />
                      </div>
                      <span className="font-semibold text-lg">Pockett Docs</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Mini dashboard stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-5 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-blue-600 mb-2" />
                      <div className="text-base font-semibold">Analytics</div>
                      <div className="text-sm text-gray-600">Free Tier</div>
                    </div>
                    <div className="bg-green-50 p-5 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                      <div className="text-base font-semibold">Watchlist & Reminders</div>
                      <div className="text-sm text-gray-600">Pro Tier</div>
                    </div>
                    <div className="bg-purple-50 p-5 rounded-xl">
                      <Shield className="h-6 w-6 text-purple-600 mb-2" />
                      <div className="text-base font-semibold">Security</div>
                      <div className="text-sm text-gray-600">Free Tier</div>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-xl">
                      <Users className="h-6 w-6 text-orange-600 mb-2" />
                      <div className="text-base font-semibold">Project Team Spaces</div>
                      <div className="text-sm text-gray-600">Team Tier</div>
                    </div>
                  </div>

                  {/* Activity indicator */}
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium">Data Insights Active</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                        <span className="text-sm text-gray-600">Scanning</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Section */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      Recent Activity
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Q4 Planning.docx accessed</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Budget.xlsx shared with team</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600">Meeting notes updated</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">Proposal.pdf downloaded</span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Floating connector cards */}
                <div className="absolute -top-6 -left-12 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform -rotate-12 hover:rotate-0 transition-transform duration-300 z-20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                      <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 23.8z" fill="#ea4335" />
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Google Drive</div>
                      <div className="text-xs text-gray-500">Available</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-6 -right-12 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform rotate-12 hover:rotate-0 transition-transform duration-300 z-20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                      <Image src="/images/brand-logos/dropbox-logo.png" alt="Dropbox" width={16} height={16} className="h-4 w-4 object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">Dropbox</div>
                      <div className="text-xs text-gray-500">Coming Later</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-36 -right-12 bg-white rounded-xl shadow-lg p-3 border border-gray-200 transform -rotate-6 hover:rotate-0 transition-transform duration-300 z-20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                      <Image src="/images/brand-logos/box-logo.png" alt="Box" width={16} height={16} className="h-4 w-4 object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">Box</div>
                      <div className="text-xs text-gray-500">Coming Later</div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-8 mb-8 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/demo/signup">
                    <Button className="rounded-full text-sm w-full sm:w-[240px] px-6 py-3 h-auto bg-slate-900 hover:bg-black text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-medium justify-between group">
                      Try the Demo App
                      <TrendingUp className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#video-demo">
                    <Button className="rounded-full text-sm w-full sm:w-[240px] px-6 py-3 h-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium justify-between group">
                      Watch the Demo Video
                      <PlayCircle className="h-4 w-4 ml-2 text-slate-500 group-hover:scale-110 transition-transform" />
                    </Button>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Video Showcase Section */}
        <section id="video-demo" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
                See Pockett Docs in Action
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                Watch how Pockett transforms your document cloud into actionable insights with our interactive demo
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Pricing-style Card Container */}
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-2 group">

                {/* Inner Card (Video Holder) - Matches Pricing Header */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-8 relative z-10 overflow-hidden border border-slate-100">
                  {/* Subtle Pattern Background similar to Pricing */}
                  <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                  {/* Video Container */}
                  <div className="relative z-10 bg-white rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200">
                    <iframe
                      src="https://www.loom.com/embed/162f2cbce41d41ecb425fafbf5af44d4?hide_owner=true&hideEmbedTopBar=true&hide_title=true&hide_share=true"
                      frameBorder="0"
                      allowFullScreen
                      className="w-full"
                      style={{
                        width: '100%',
                        height: '28.65vw',
                        border: 'none',
                        borderRadius: '12px'
                      }}
                      title="Pockett Demo Video"
                    />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="w-0 h-0 border-l-[12px] border-l-blue-600 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Content (Description) - Matches Pricing Features Area */}
                <div className="px-6 py-6 text-center">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2 tracking-tight">
                    Interactive Demo Walkthrough
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                    Experience Pockett&apos;s powerful document analytics, insights dashboard, and cloud connector features
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-slate-600 font-medium">
                    <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Demo</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Interactive Features</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Real-time Insights</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <Pricing />

        {/* Future Roadmap Section */}
        <section className="py-16 bg-white relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
                Future Roadmap
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                Exciting features coming soon to enhance your document management experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-2 h-full group">
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-start relative z-10">
                  <div className="flex items-center space-x-3 mb-4 w-full">
                    <div className="h-10 w-10 bg-white rounded-xl border border-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Puzzle className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 tracking-tight leading-tight">Document Cloud Connectors+</h3>
                  </div>
                  <div className="w-full flex justify-center mt-3">
                    <span className="bg-slate-700 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Coming Later</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm leading-relaxed">Connect with Dropbox, Box, OneDrive, Confluence, and Notion. Expand your document ecosystem beyond Google Drive.</p>
                </div>
              </div>

              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-2 h-full group">
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-start relative z-10">
                  <div className="flex items-center space-x-3 mb-4 w-full">
                    <div className="h-10 w-10 bg-white rounded-xl border border-pink-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="h-5 w-5 text-pink-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 tracking-tight leading-tight">AI Document Intelligence</h3>
                  </div>
                  <div className="w-full flex justify-center mt-3">
                    <span className="bg-slate-700 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Coming Later</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm leading-relaxed">Smart document analysis, auto-tagging, content summarization, and natural language search across all your cloud files</p>
                </div>
              </div>

              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-2 h-full group">
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-start relative z-10">
                  <div className="flex items-center space-x-3 mb-4 w-full">
                    <div className="h-10 w-10 bg-white rounded-xl border border-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <MessageSquare className="h-5 w-5 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 tracking-tight leading-tight">Advanced Collaboration Hub</h3>
                  </div>
                  <div className="w-full flex justify-center mt-3">
                    <span className="bg-slate-700 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Coming Later</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm leading-relaxed">Real-time collaborative editing, advanced commenting system, version control, and integrated team communication</p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Brand Column (Left) */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <Logo size="md" />
                </div>
                <p className="text-slate-500 text-sm mb-6 max-w-sm leading-relaxed">
                  Simple insights & control over Google Drive for freelancers, consultants & small agencies. No per-seat tax.
                </p>

                {/* Social Icons (Email only) */}
                <div className="flex space-x-4 mb-8">
                  <a href="mailto:info@pockett.io" className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                    <Mail className="h-5 w-5" />
                    <span className="text-sm font-medium">info@pockett.io</span>
                  </a>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm mb-8">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2 relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">All services are online</span>
                </div>


              </div>

              {/* Links Column 1: Product */}
              <div>
                <h3 className="font-bold text-slate-900 mb-4 text-sm">Product</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="#video-demo" className="text-slate-500 hover:text-blue-600 transition-colors">Watch Demo</a></li>
                  <li><Link href="/demo/app" className="text-slate-500 hover:text-blue-600 transition-colors">Try Demo</Link></li>
                  <li><a href="#pricing" className="text-slate-500 hover:text-blue-600 transition-colors">Pricing</a></li>
                  <li><Link href="/dash/auth" className="text-slate-500 hover:text-blue-600 transition-colors">Get Started</Link></li>
                </ul>
              </div>

              {/* Links Column 3: Support */}
              <div>
                <h3 className="font-bold text-slate-900 mb-4 text-sm">Support</h3>
                <ul className="space-y-3 text-sm">
                  <li><button onClick={() => openModal('privacy')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Privacy Policy</button></li>
                  <li><button onClick={() => openModal('cookies')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Cookie Policy</button></li>
                  <li><button onClick={() => openModal('terms')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Terms of Service</button></li>
                  <li><button onClick={() => openModal('faqs')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">FAQs</button></li>
                  <li><button onClick={() => openModal('support')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Contact</button></li>
                </ul>
                <div className="mt-8 text-slate-400 text-sm font-medium text-right">
                  © 2025 Pockett Docs. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>

      </div >

      {/* FAQ Modal */}
      <FAQModal isOpen={activeModal === 'faqs'} onClose={closeModal} />

      {/* Legal Modals */}
      < Modal isOpen={activeModal === 'privacy'} onClose={closeModal} title="Privacy Policy" >
        <PrivacyPolicy />
      </Modal >

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
    </>
  )
}