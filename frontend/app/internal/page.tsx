"use client"

import Link from "next/link"
import { Link2, Wrench, Home, ChevronRight } from "lucide-react"

const tools = [
    {
        title: "Link Generator",
        description: "Generate and copy UTM-tracked links for social media.",
        href: "/internal/links",
        icon: Link2,
        // Monochrome: White bg, black text, gray borders
        className: "group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm hover:border-gray-400 transition-all duration-200 flex flex-col items-start",
        iconClassName: "w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-gray-100 text-gray-900 group-hover:bg-black group-hover:text-white transition-colors"
    },
    // Add more tools here
]

export default function InternalIndex() {
    return (
        <div className="flex flex-col space-y-8">
            {/* Breadcrumb & Title Section */}
            <div className="flex flex-col space-y-4">
                <nav className="flex items-center text-sm text-gray-500">
                    <Link href="/internal" className="flex items-center hover:text-gray-900 transition-colors">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="font-medium text-gray-900">Tools</span>
                </nav>

                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tools</h1>
                    <p className="text-gray-500 mt-1">Manage your application utilities.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col items-start justify-between min-h-[120px]"
                    >
                        {/* Row 1: Icon, Title, Action */}
                        <div className="flex items-center justify-between w-full mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 text-gray-900 group-hover:bg-black group-hover:text-white transition-colors border border-gray-100">
                                    <tool.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none mt-1">
                                    {tool.title}
                                </h3>
                            </div>
                            <span className="inline-flex items-center text-xs font-semibold bg-gray-100 px-3 py-1 rounded-full text-gray-600 group-hover:bg-black group-hover:text-white transition-colors">
                                Open
                            </span>
                        </div>

                        {/* Row 2: Subtext */}
                        <p className="text-gray-500 text-sm leading-snug text-left pl-[52px]">
                            {tool.description}
                        </p>
                    </Link>
                ))}
                {/* Placeholder for future tools */}
                <div className="border border-gray-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity bg-gray-50/50">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 mb-1">
                        Coming Soon
                    </h3>
                    <p className="text-gray-400 text-xs">
                        More utilities will appear here.
                    </p>
                </div>
            </div>
        </div>
    )
}
