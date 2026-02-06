'use client'

import React from 'react'

interface ProjectInsightsDashboardProps {
    projectId: string
}

export function ProjectInsightsDashboard({ projectId }: ProjectInsightsDashboardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder Cards */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Documents Processed</h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Pending Review</h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Risky Shares</h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>

            <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                <p>Connect a data source to see insights for Project {projectId}</p>
            </div>
        </div>
    )
}
