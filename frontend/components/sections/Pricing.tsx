"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, CheckCircle, User, ArrowRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Pricing() {
    return (
        <section id="pricing" className="py-16 px-4 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-visible z-0">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-visible">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-base font-semibold mb-8 shadow-sm border border-blue-200">
                        <Users className="h-5 w-5 mr-3" />
                        Built for freelancers, consultants & small agencies
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Simple Pricing for Every Stage
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Flat pricing that grows with your business. No per-user subscription hell.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
                    {/* Free Plan */}
                    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-2 h-full group">
                        {/* Inner Header Card */}
                        <div className="bg-slate-50 rounded-2xl p-8 flex flex-col items-start text-left relative z-10">
                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                <User className="h-7 w-7 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-700">Free plan</h3>
                            <p className="text-slate-500 mt-2 text-base font-normal">For individuals.</p>
                            <div className="mt-8 mb-8">
                                <span className="text-5xl font-semibold text-slate-800 tracking-tight">$0</span>
                                <span className="text-slate-500 ml-1 text-lg font-normal">/month</span>
                            </div>
                            <Link href="/auth/signup" className="w-full">
                                <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all text-sm h-11 flex items-center justify-between px-6 group/btn">
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                        {/* Features */}
                        <div className="px-8 py-8">
                            <p className="font-semibold text-slate-900 mb-6 text-sm">Free, forever:</p>
                            <ul className="space-y-4">
                                {[
                                    { name: "Connect Google Drive", tooltip: "OAuth connection to fetch file/folder tree" },
                                    { name: "Browse & Metadata Sync", tooltip: "Fetch and sync file/folder metadata" },
                                    { name: "Analytics Dashboard", tooltip: "Visual dashboard with usage insights" },
                                    { name: "Most accessed files (7 days)", tooltip: "Track files accessed in last 7 days" },
                                    { name: "Largest unused files (90+ days)", tooltip: "Find large files not accessed in 90+ days" },
                                    { name: "Risky shares detection", tooltip: "Detect 'Anyone with link = Editor' shares" },
                                    { name: "Insights Cards (Read-Only)", tooltip: "Show risks & inefficiencies (read-only)" }
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-slate-300 mr-3 flex-shrink-0 mt-0.5" />
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-slate-600 text-sm cursor-help hover:text-slate-900 transition-colors font-medium">{feature.name}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Startup (Pro) Plan */}
                    <div className="relative bg-white rounded-3xl border border-purple-100 shadow-[0_0_40px_-10px_rgba(168,85,247,0.15)] ring-1 ring-purple-100 hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.25)] hover:border-purple-200 transition-all duration-300 flex flex-col p-2 h-full z-10">
                        {/* Inner Header Card */}
                        <div className="bg-purple-50 rounded-2xl p-8 flex flex-col items-start text-left relative z-10 w-full overflow-hidden">
                            {/* Subtle Dotted Pattern Overlay */}
                            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d8b4fe 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                            <div className="relative z-10 w-full">
                                <div className="flex justify-between w-full items-start mb-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl border border-purple-100 flex items-center justify-center shadow-sm">
                                        <User className="h-7 w-7 text-purple-500" />
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100 shadow-sm">
                                        Most Popular
                                    </div>
                                </div>

                                <h3 className="text-xl font-medium text-slate-700">Startup</h3>
                                <p className="text-slate-500 mt-2 text-base font-normal">For solopreneurs.</p>
                                <div className="mt-8 mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-semibold text-slate-800 tracking-tight">$9</span>
                                        <span className="text-slate-400 text-2xl line-through font-normal">$19</span>
                                        <span className="text-slate-500 text-lg font-normal">/month</span>
                                    </div>
                                </div>
                                <Link href="/auth/signup" className="w-full">
                                    <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg transition-all text-sm h-11 flex items-center justify-between px-6 group/btn">
                                        Start Trial
                                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        {/* Features */}
                        <div className="px-8 py-8">
                            <p className="font-semibold text-slate-900 mb-6 text-sm">Everything in Free, plus:</p>
                            <ul className="space-y-4">
                                {[
                                    { name: "Watchlist", tooltip: "Pin important docs for quick access" },
                                    { name: "Due Dates & Reminders", tooltip: "Set due dates & reminders for key docs" },
                                    { name: "Storage Cleanup Tools", tooltip: "Tools to clean up storage space" },
                                    { name: "Detect duplicates & near-duplicates", tooltip: "Find and identify duplicate files" },
                                    { name: "Find unused large files", tooltip: "Find large files for deletion/archival" }
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-slate-600 text-sm cursor-help hover:text-slate-900 transition-colors font-medium">{feature.name}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Enterprise (Team) Plan */}
                    <div className="relative bg-white rounded-3xl border border-blue-100 shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)] ring-1 ring-blue-100 hover:shadow-[0_0_50px_-5px_rgba(59,130,246,0.25)] hover:border-blue-200 transition-all duration-300 flex flex-col p-2 h-full">
                        {/* Inner Header Card */}
                        <div className="bg-blue-50 rounded-2xl p-8 flex flex-col items-start text-left relative z-10 w-full">
                            <div className="w-14 h-14 bg-white rounded-2xl border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
                                <Users className="h-7 w-7 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-700">Team</h3>
                            <p className="text-slate-500 mt-2 text-base font-normal">For teams.</p>
                            <div className="mt-8 mb-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-semibold text-slate-800 tracking-tight">$29</span>
                                    <span className="text-slate-400 text-2xl line-through font-normal">$49</span>
                                    <span className="text-slate-500 text-lg font-normal">/month</span>
                                </div>
                            </div>
                            <Link href="/contact" className="w-full">
                                <Button className="w-full rounded-full bg-slate-900 hover:bg-black text-white font-medium shadow-md hover:shadow-lg transition-all text-sm h-11 flex items-center justify-between px-6 group/btn">
                                    Start Trial
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                        {/* Features */}
                        <div className="px-8 py-8">
                            <p className="font-semibold text-slate-900 mb-6 text-sm">Everything in Startup, plus:</p>
                            <ul className="space-y-4">
                                {[
                                    { name: "Project Team Spaces", tooltip: "Group docs/folders into project workrooms" },
                                    { name: "Shared Watchlists", tooltip: "Team-pinned docs for collaboration" },
                                    { name: "Assignment Board (Workload View)", tooltip: "Columns = collaborators, Rows = documents" },
                                    { name: "Drag-and-drop assignment", tooltip: "Drag docs to assign to team members" },
                                    { name: "Access Lifecycle Management", tooltip: "Auto-expire/revoke external access after project completion" },
                                    { name: "Team Engagement Digest", tooltip: "Weekly summary of doc access across projects" },
                                    { name: "Client Portal Links", tooltip: "Branded, expiring, read-only links for clients" }
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-slate-600 text-sm cursor-help hover:text-slate-900 transition-colors font-medium">{feature.name}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
