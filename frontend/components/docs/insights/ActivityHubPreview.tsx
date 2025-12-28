"use client"

import { useState } from "react"
import { Clock, TrendingUp, HardDrive, Users, Check, Share2, Filter, ChevronDown, RotateCw } from "lucide-react"
import { DocumentListCard } from "@/components/dashboard/document-list-card"
import { DriveFile } from "@/lib/types"

// --- Mock Data ---

const mockRecentFiles: DriveFile[] = [
    {
        id: "1",
        name: "Project_Alpha_Q3_Report.pdf",
        mimeType: "application/pdf",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/pdf_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "alice@example.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        size: "2.4 MB",
        lastAction: "Edited",
        badges: []
    },
    {
        id: "2",
        name: "Budget_FY24.xlsx",
        mimeType: "application/vnd.google-apps.spreadsheet",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/sheets_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "me@example.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        viewedByMeTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        size: "1.1 MB",
        lastAction: "Viewed",
        badges: [{ type: 'attention', text: 'External Share' }]
    },
    {
        id: "3",
        name: "Marketing_Assets",
        mimeType: "application/vnd.google-apps.folder",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/drive_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "marketing@example.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        size: 0,
        lastAction: "Renamed",
        badges: []
    }
]

const mockTrendingFiles: DriveFile[] = [
    {
        id: "4",
        name: "Q4_All_Hands.pptx",
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/slides_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "ceo@example.com" }],
        modifiedTime: new Date().toISOString(),
        viewedByMeTime: new Date().toISOString(),
        size: "15 MB",
        activityCount: 124,
        badges: [{ type: 'risk', text: 'Public Link' }]
    },
    {
        id: "5",
        name: "Onboarding_Guide.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/docs_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "hr@example.com" }],
        modifiedTime: new Date().toISOString(),
        viewedByMeTime: new Date().toISOString(),
        size: "500 KB",
        activityCount: 45,
        badges: []
    }
]

const mockStorageFiles: DriveFile[] = [
    {
        id: "6",
        name: "Raw_Footage_Campaign_A.mov",
        mimeType: "video/quicktime",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/drive_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "creative@example.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(), // 100 days ago
        size: 2500000000, // 2.5 GB
        badges: [{ type: 'cleanup', text: 'Cleanup Candidate' }]
    },
    {
        id: "7",
        name: "Archive_2023.zip",
        mimeType: "application/zip",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/drive_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "sysadmin@example.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(), // 200 days ago
        size: 5368709120, // 5 GB
        badges: [{ type: 'cleanup', text: 'Cleanup Candidate' }]
    }
]

const mockSharingFiles: DriveFile[] = [
    {
        id: "9",
        name: "Quarterly_Budget_Overview.xlsx",
        mimeType: "application/vnd.google-apps.spreadsheet",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/sheets_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "finance@example.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        size: "29.48 KB",
        lastAction: "Shared By You",
        actorEmail: "me@example.com",
        badges: [{ type: 'risk', text: 'RISK' }]
    },
    {
        id: "10",
        name: "Logo_Assets_Final.zip",
        mimeType: "application/zip",
        iconLink: "https://fonts.gstatic.com/s/i/productlogos1x/drive_48dp.png",
        webViewLink: "#",
        owners: [{ displayName: "agency@creative.com" }],
        modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        size: "154 MB",
        lastAction: "Shared With You",
        actorEmail: "agency@creative.com",
        badges: []
    }
]


// --- Static Components for Docs ---

function TimeframeToggle({ options, activeOption }: { options: string[], activeOption: string }) {
    return (
        <div className="flex bg-gray-100 p-0.5 rounded-lg">
            {options.map(opt => (
                <div
                    key={opt}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all cursor-default ${opt === activeOption
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500'
                        }`}
                >
                    {opt}
                </div>
            ))}
        </div>
    )
}

function DropdownFilter({ label, activeValue, hasSelection = false }: { label: string, activeValue?: string, hasSelection?: boolean }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg shadow-sm bg-white border-gray-200 text-gray-700 opacity-60 cursor-not-allowed">
            <span>{label}</span>
            {hasSelection && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />}
            <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
    )
}


export function ActivityHubPreview() {
    const [activeTab, setActiveTab] = useState<'recent' | 'trending' | 'storage' | 'sharing'>('sharing')

    return (
        <div className="bg-white my-8">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                Activity Hub
                <span className="p-1 bg-gray-100 rounded text-gray-400">
                    <RotateCw className="h-3.5 w-3.5" />
                </span>
            </h3>

            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {/* Header Section */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/10 flex flex-col gap-4">

                    {/* Top Row: Tabs left, Timeframe right */}
                    <div className="flex items-center justify-between">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                            {['recent', 'trending', 'storage', 'sharing'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Top-Right Widget (Timeframe or Count) */}
                        <div className="flex items-center gap-2">
                            {/* Specific to Sharing tab in screenshot: shows "4w" label + "All Time" blue pill, but mimicking generic timeframe for simplicity or specific per tab */}
                            {activeTab === 'sharing' && (
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <div className="text-[10px] px-2 py-1 rounded-md font-medium text-gray-400">4w</div>
                                    <div className="text-[10px] px-2 py-1 rounded-md font-medium bg-white text-indigo-600 shadow-sm border border-indigo-100">All Time</div>
                                </div>
                            )}
                            {activeTab !== 'sharing' && (
                                <TimeframeToggle
                                    options={
                                        activeTab === 'recent' ? ['24h', '1w', '2w'] :
                                            activeTab === 'trending' ? ['24h', '1w', '1m'] :
                                                ['4w', 'All']
                                    }
                                    activeOption={activeTab === 'recent' ? '24h' : '1w'}
                                />
                            )}
                        </div>
                    </div>

                    {/* Filter Row */}
                    <div className="flex items-center justify-between">
                        {/* Left Filters */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">
                                <Filter className="h-4 w-4" />
                            </span>

                            {activeTab === 'sharing' ? (
                                <>
                                    <DropdownFilter label="Type" hasSelection={true} />
                                    <DropdownFilter label="Risk" />
                                    <DropdownFilter label="All Shared" />
                                </>
                            ) : activeTab === 'storage' ? (
                                <>
                                    <DropdownFilter label="Size: 1GB+" />
                                    <DropdownFilter label="Oldest First" />
                                </>
                            ) : (
                                <DropdownFilter label="Type" />
                            )}
                        </div>

                        {/* Right Summary/Badge */}
                        {activeTab === 'recent' && (
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                3 modified
                            </div>
                        )}
                        {activeTab === 'trending' && (
                            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3" />
                                169 actions
                            </div>
                        )}
                        {activeTab === 'storage' && (
                            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <HardDrive className="h-3 w-3" />
                                2 large file(s)
                            </div>
                        )}
                        {activeTab === 'sharing' && (
                            <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                2 shared file(s)
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-0">
                    {activeTab === 'recent' && (
                        <DocumentListCard
                            title="Recent"
                            icon={<Clock className="h-5 w-5" />}
                            files={mockRecentFiles}
                            variant="flat"
                            hideTitle={true}
                            enableFilter={false}
                            showActions={false}
                            className="!rounded-t-none !border-none"
                        />
                    )}
                    {activeTab === 'trending' && (
                        <DocumentListCard
                            title="Trending"
                            icon={<TrendingUp className="h-5 w-5" />}
                            files={mockTrendingFiles}
                            variant="flat"
                            hideTitle={true}
                            enableFilter={false}
                            showRank={false}
                            showActions={false}
                            primaryDate="viewed"
                            className="!rounded-t-none !border-none"
                        />
                    )}
                    {activeTab === 'storage' && (
                        <DocumentListCard
                            title="Large Files"
                            icon={<HardDrive className="h-5 w-5" />}
                            files={mockStorageFiles}
                            variant="flat"
                            hideTitle={true}
                            enableFilter={false}
                            showActions={false}
                            className="!rounded-t-none !border-none"
                            primaryDate="modified"
                        />
                    )}
                    {activeTab === 'sharing' && (
                        <DocumentListCard
                            title="Sharing Activity"
                            icon={<Users className="h-5 w-5" />}
                            files={mockSharingFiles}
                            variant="flat"
                            hideTitle={true}
                            enableFilter={false}
                            showRank={false}
                            showActions={false}
                            primaryDate="modified"
                            className="!rounded-t-none !border-none"
                        />
                    )}
                </div>

                <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-500 italic">Data in this preview is for demonstration purposes.</p>
                </div>
            </div>
        </div>
    )
}
