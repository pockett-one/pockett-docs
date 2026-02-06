"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Download, BarChart3 } from "lucide-react"
import { logger } from '@/lib/logger'

// Mock data for charts
const fileTypeData = [
  { name: "Docs", value: 45, count: 561 },
  { name: "Sheets", value: 30, count: 374 },
  { name: "PDFs", value: 15, count: 187 },
  { name: "Images", value: 10, count: 125 }
]

const activityData = [
  { hour: "9 AM", Monday: 12, Tuesday: 15, Wednesday: 8, Thursday: 18, Friday: 14, Saturday: 2, Sunday: 1 },
  { hour: "10 AM", Monday: 18, Tuesday: 22, Wednesday: 16, Thursday: 25, Friday: 20, Saturday: 3, Sunday: 2 },
  { hour: "11 AM", Monday: 25, Tuesday: 28, Wednesday: 22, Thursday: 32, Friday: 28, Saturday: 4, Sunday: 3 },
  { hour: "12 PM", Monday: 20, Tuesday: 24, Wednesday: 18, Thursday: 28, Friday: 25, Saturday: 5, Sunday: 4 },
  { hour: "1 PM", Monday: 15, Tuesday: 18, Wednesday: 12, Thursday: 22, Friday: 18, Saturday: 3, Sunday: 2 },
  { hour: "2 PM", Monday: 22, Tuesday: 26, Wednesday: 20, Thursday: 30, Friday: 25, Saturday: 4, Sunday: 3 },
  { hour: "3 PM", Monday: 28, Tuesday: 32, Wednesday: 25, Thursday: 35, Friday: 30, Saturday: 5, Sunday: 4 },
  { hour: "4 PM", Monday: 24, Tuesday: 28, Wednesday: 22, Thursday: 32, Friday: 28, Saturday: 4, Sunday: 3 },
  { hour: "5 PM", Monday: 16, Tuesday: 20, Wednesday: 14, Thursday: 24, Friday: 18, Saturday: 3, Sunday: 2 }
]

const folderStructureData = [
  { name: "Projects", value: 45, children: [
    { name: "Active", value: 30 },
    { name: "Archive", value: 15 }
  ]},
  { name: "Documents", value: 25, children: [
    { name: "Templates", value: 10 },
    { name: "Reports", value: 15 }
  ]},
  { name: "Media", value: 20, children: [
    { name: "Images", value: 12 },
    { name: "Videos", value: 8 }
  ]},
  { name: "Admin", value: 10 }
]

// Custom colors for consistency with Google Drive theme - using Tremor color names
const customColors = ["blue-600", "green-600", "yellow-500", "red-600", "purple-600", "orange-600"]
const customColorHex = ["#1a73e8", "#34a853", "#fbbc04", "#ea4335", "#9c27b0", "#ff9800"]

export function VisualizationsTab() {
  const handleExport = (chartType: string) => {
    logger.debug(`Exporting ${chartType} chart...`)
    // In a real app, this would trigger chart export
  }

  // Calculate total documents
  const totalDocs = fileTypeData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900">Document Analytics & Insights</h2>
        <Button variant="outline" onClick={() => handleExport("all")}>
          <Download className="h-4 w-4 mr-2" />
          Export All Charts
        </Button>
      </div>

      {/* Top Row - File Types and Activity Heatmap */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* File Types Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">File Types Distribution</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleExport("file-types")}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={fileTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {fileTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={customColorHex[index]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {fileTypeData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: customColorHex[index] }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-gray-600">
                  {item.count.toLocaleString()} ({item.value}%)
                </div>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Documents</span>
                <span>{totalDocs.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Activity Heatmap</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleExport("heatmap")}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 mb-4">Document access patterns by day and hour</p>
          
          {/* Simplified heatmap representation */}
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-1 text-xs text-gray-600 mb-2">
              <div></div>
              <div className="text-center">Mon</div>
              <div className="text-center">Tue</div>
              <div className="text-center">Wed</div>
              <div className="text-center">Thu</div>
              <div className="text-center">Fri</div>
              <div className="text-center">Sat</div>
              <div className="text-center">Sun</div>
            </div>
            
            {activityData.slice(2, 7).map((row, rowIndex) => (
              <div key={row.hour} className="grid grid-cols-8 gap-1">
                <div className="text-xs text-gray-600 text-right pr-2">{row.hour}</div>
                <div className={`h-4 rounded-sm ${row.Monday > 20 ? 'bg-blue-600' : row.Monday > 15 ? 'bg-blue-400' : row.Monday > 10 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                <div className={`h-4 rounded-sm ${row.Tuesday > 20 ? 'bg-blue-600' : row.Tuesday > 15 ? 'bg-blue-400' : row.Tuesday > 10 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                <div className={`h-4 rounded-sm ${row.Wednesday > 20 ? 'bg-blue-600' : row.Wednesday > 15 ? 'bg-blue-400' : row.Wednesday > 10 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                <div className={`h-4 rounded-sm ${row.Thursday > 20 ? 'bg-blue-600' : row.Thursday > 15 ? 'bg-blue-400' : row.Thursday > 10 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                <div className={`h-4 rounded-sm ${row.Friday > 20 ? 'bg-blue-600' : row.Friday > 15 ? 'bg-blue-400' : row.Friday > 10 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                <div className={`h-4 rounded-sm ${row.Saturday > 5 ? 'bg-blue-400' : row.Saturday > 2 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                <div className={`h-4 rounded-sm ${row.Sunday > 5 ? 'bg-blue-400' : row.Sunday > 2 ? 'bg-blue-200' : 'bg-gray-100'}`} />
              </div>
            ))}
            
            <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Folder Structure Sunburst */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Folder Structure Overview</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleExport("sunburst")}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-600 mb-6">Hierarchical view of your document organization</p>
        
        {/* Simplified folder structure visualization */}
        <div className="bg-gray-50 rounded-lg p-8">
          <div className="relative">
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              Root
            </div>
            
            {/* Outer segments */}
            <div className="relative w-80 h-80 mx-auto">
              {folderStructureData.map((folder, index) => (
                <div key={folder.name} className="absolute inset-0">
                  <div 
                    className={`absolute w-full h-full border-8 rounded-full`}
                    style={{
                      borderColor: index % 2 === 0 ? customColorHex[index] : 'transparent',
                      transform: `rotate(${index * 90}deg)`,
                      borderTopColor: customColorHex[index],
                      borderRightColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderLeftColor: 'transparent'
                    }}
                  />
                  <div 
                    className="absolute text-sm font-medium"
                    style={{
                      top: index === 0 ? '10%' : index === 1 ? '50%' : index === 2 ? '85%' : '50%',
                      left: index === 0 ? '50%' : index === 1 ? '85%' : index === 2 ? '50%' : '10%',
                      transform: 'translate(-50%, -50%)',
                      color: customColorHex[index]
                    }}
                  >
                    {folder.name}
                    <div className="text-xs text-gray-600">{folder.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {folderStructureData.map((folder, index) => (
              <div key={folder.name} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: customColorHex[index] }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{folder.name}</div>
                  <div className="text-xs text-gray-600">{folder.value}% of total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Peak Activity</span>
            </div>
            <p className="text-sm text-blue-800">
              Highest document usage occurs on Thursdays between 2-3 PM
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Popular Format</span>
            </div>
            <p className="text-sm text-green-800">
              Word documents account for 45% of your document library
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Organization</span>
            </div>
            <p className="text-sm text-yellow-800">
              Active projects folder contains 30% of all documents
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}