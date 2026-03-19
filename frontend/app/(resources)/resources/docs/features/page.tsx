
import { FileText, History, Activity, Filter, Eye, Download } from "lucide-react"
import Link from "next/link"

export default function FeaturesDocsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Features</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Pockett provides powerful tools to manage, preview, and track your Google Drive documents
                    with an intuitive interface and advanced filtering capabilities.
                </p>
            </div>

            {/* Document Preview */}
            <div className="border-l-4 border-blue-500 pl-6 py-2">
                <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 m-0">Document Preview</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Preview your Google Docs, Sheets, and Slides directly within Pockett without leaving the dashboard.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">How to use:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Navigate to your dashboard and locate any document</li>
                        <li>Click the three-dot menu (⋮) next to the document</li>
                        <li>Select <strong>"Preview"</strong> from the dropdown</li>
                        <li>The document opens in a side drawer with full Google Docs viewer</li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-3">
                        <strong>Note:</strong> Preview mode is read-only. To edit, click "Open in Google Docs" from the preview drawer.
                    </p>
                </div>
            </div>

            {/* Activity & Version History */}
            <div className="border-l-4 border-purple-500 pl-6 py-2">
                <div className="flex items-center gap-3 mb-3">
                    <Activity className="h-6 w-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900 m-0">Activity & Version History</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Track all changes to your documents with a comprehensive activity timeline and version history.
                </p>

                <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-600" />
                            Activity Tab
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            See a chronological timeline of all document events:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Document creation</li>
                            <li>Edits and modifications</li>
                            <li>Renames and moves</li>
                            <li>Sharing permission changes</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">
                            Shows actual user names who performed each action.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <History className="h-4 w-4 text-blue-600" />
                            Version History
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Access and restore previous versions:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>View all saved revisions</li>
                            <li>See who made each change</li>
                            <li>Download specific versions</li>
                            <li>Compare changes over time</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">
                            Supports both text documents and binary files.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">How to access:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Click the three-dot menu (⋮) next to any document</li>
                        <li>Select <strong>"Version History"</strong></li>
                        <li>Use the tabs to switch between <strong>Activity</strong> and <strong>History</strong></li>
                    </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <h3 className="font-semibold text-amber-900 mb-2">⚠️ Setup Required</h3>
                    <p className="text-sm text-amber-800 mb-2">
                        To see actual user names in the Activity tab (instead of "User"), you must:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                        <li>Enable the <strong>Google People API</strong> in your Google Cloud Console</li>
                        <li>Disconnect and reconnect your Google Drive account in Pockett</li>
                    </ol>
                    <p className="text-xs text-amber-700 mt-2">
                        This grants the necessary permissions to resolve user identities.
                    </p>
                </div>
            </div>

            {/* Smart Filtering */}
            <div className="border-l-4 border-green-500 pl-6 py-2">
                <div className="flex items-center gap-3 mb-3">
                    <Filter className="h-6 w-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900 m-0">Smart Filtering with .pockettignore</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Control which files appear in your Pockett dashboard using a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.pockettignore</code> file,
                    similar to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.gitignore</code>.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">How it works:</h3>
                    <p className="text-sm text-gray-600">
                        Create a file named <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.pockettignore</code> in the root of your Google Drive.
                        Add patterns to exclude specific files or folders from appearing in Pockett.
                    </p>

                    <div className="bg-white border border-gray-200 rounded p-3">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Example .pockettignore:</h4>
                        <pre className="text-xs text-gray-800 font-mono">
                            {`# Exclude all files in the Archive folder
Archive/

# Exclude all PDFs
*.pdf

# Exclude specific file by ID
file:1a2b3c4d5e6f7g8h9i0j

# Exclude temporary files
*~
*.tmp`}
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Supported patterns:</h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li><code className="bg-gray-100 px-1 rounded">FolderName/</code> - Exclude entire folder</li>
                            <li><code className="bg-gray-100 px-1 rounded">*.extension</code> - Exclude by file type</li>
                            <li><code className="bg-gray-100 px-1 rounded">file:FILE_ID</code> - Exclude specific file by Google Drive ID</li>
                            <li><code className="bg-gray-100 px-1 rounded"># comment</code> - Add comments</li>
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500">
                        <strong>Tip:</strong> Changes to <code className="bg-gray-100 px-1 rounded">.pockettignore</code> take effect immediately.
                        Refresh your dashboard to see updated results.
                    </p>
                </div>
            </div>

            {/* Document Downloads */}
            <div className="border-l-4 border-indigo-500 pl-6 py-2">
                <div className="flex items-center gap-3 mb-3">
                    <Download className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900 m-0">Secure Downloads</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Download documents and specific versions directly through Pockett's secure proxy.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">Download options:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>
                            <strong>Current version:</strong> Click the three-dot menu → "Download"
                        </li>
                        <li>
                            <strong>Specific version:</strong> Open Version History → Click download icon next to any revision
                        </li>
                        <li>
                            <strong>Format conversion:</strong> Google Docs are automatically converted to appropriate formats
                            (Docs → .docx, Sheets → .xlsx, Slides → .pptx)
                        </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                        All downloads are streamed through our secure infrastructure. See our{" "}
                        <Link href="/docs/security" className="text-blue-600 hover:underline">
                            Security & Privacy
                        </Link>{" "}
                        page for details.
                    </p>
                </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Reference</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Document Actions Menu</h3>
                        <p className="text-xs text-gray-600">
                            Click the <strong>⋮</strong> icon next to any document to access Preview, Version History, and Download options.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Filter Documents</h3>
                        <p className="text-xs text-gray-600">
                            Use the filter dropdown in the dashboard to show only specific file types (Docs, Sheets, Slides, PDFs, etc.).
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Search</h3>
                        <p className="text-xs text-gray-600">
                            Use the search bar to find documents by name. Supports real-time filtering as you type.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Manage Connections</h3>
                        <p className="text-xs text-gray-600">
                            Visit the Connectors page to add, remove, or reconnect your Google Drive accounts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
