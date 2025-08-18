"use client"

import { AppLayout } from "@/components/layouts/app-layout"
import { EngagementTab } from "@/components/dashboard/engagement-tab"

export default function EngagementPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        {/* Connection Status */}
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-blue-800">Connected: Google Drive (1,247 documents)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <EngagementTab />
        </div>
      </div>
    </AppLayout>
  )
}