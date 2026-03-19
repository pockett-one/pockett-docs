import { Menu, Eye, History, Download, ExternalLink, FileText, Copy } from "lucide-react"
import { DocSection } from "@/components/docs/doc-section"
import { InfoBox } from "@/components/docs/info-box"
import { StepList } from "@/components/docs/step-list"
import { CodeBlock } from "@/components/docs/code-block"

export default function DocumentActionsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Document Actions</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Access powerful document management features through the action menu. Preview files,
                    track changes, download documents, and view detailed metadata.
                </p>
            </div>

            {/* Action Menu Overview */}
            <DocSection title="Document Action Menu" icon={Menu} color="blue">
                <p className="text-gray-600 mb-4">
                    Every document in your dashboard has an action menu (⋮) that provides quick access to common operations.
                </p>
                <StepList
                    title="How to access:"
                    steps={[
                        "Navigate to your dashboard",
                        "Find any document in the list",
                        "Click the <strong>three-dot menu (⋮)</strong> icon",
                        "Select the action you want to perform"
                    ]}
                />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Available Actions:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Preview document</li>
                            <li>View version history & activity</li>
                            <li>Download document</li>
                            <li>Open in Google Docs</li>
                            <li>Copy filename</li>
                            <li>View file information</li>
                        </ul>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Quick Info:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>File type icon (color-coded)</li>
                            <li>Created date & author</li>
                            <li>Last modified date & author</li>
                            <li>File size</li>
                            <li>Sharing status</li>
                        </ul>
                    </div>
                </div>
            </DocSection>

            {/* Document Preview */}
            <DocSection title="Document Preview" icon={Eye} color="purple">
                <p className="text-gray-600 mb-4">
                    Preview Google Docs, Sheets, and Slides directly within Pockett without leaving the dashboard.
                </p>
                <StepList
                    title="How to preview:"
                    steps={[
                        "Click the three-dot menu (⋮) next to any document",
                        "Select <strong>\"Preview\"</strong>",
                        "The document opens in a side drawer with full Google Docs viewer",
                        "Use the toolbar to zoom, navigate pages, or open in Google Docs"
                    ]}
                />
                <InfoBox type="info" title="Preview Limitations">
                    <p>
                        Preview mode is <strong>read-only</strong>. To edit the document, click
                        "Open in Google Docs" from the preview drawer.
                    </p>
                    <p className="mt-2">
                        Some file types (PDFs, images) may have limited preview functionality depending
                        on Google Drive's viewer capabilities.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Version History & Activity */}
            <DocSection title="Version History & Activity" icon={History} color="indigo">
                <p className="text-gray-600 mb-4">
                    Track all changes to your documents with comprehensive activity timeline and version history.
                </p>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <History className="h-4 w-4 text-indigo-600" />
                            Activity Tab
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Chronological timeline of all document events:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Document creation</li>
                            <li>Edits and modifications</li>
                            <li>Renames and moves</li>
                            <li>Sharing permission changes</li>
                        </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
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
                    </div>
                </div>
                <StepList
                    title="How to access:"
                    steps={[
                        "Click the three-dot menu (⋮) next to any document",
                        "Select <strong>\"Version History\"</strong>",
                        "Use the tabs to switch between <strong>Activity</strong> and <strong>History</strong>"
                    ]}
                />
                <InfoBox type="warning" title="Setup Required for User Names">
                    <p>
                        To see actual user names in the Activity tab (instead of "User"), you'll need to
                        reconnect your Google Drive with additional permissions.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Downloads */}
            <DocSection title="Secure Downloads" icon={Download} color="green">
                <p className="text-gray-600 mb-4">
                    Download documents and specific versions directly through Pockett's secure proxy.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                </div>
                <InfoBox type="tip" title="Bulk Downloads">
                    <p>
                        Coming soon: Ability to download multiple documents at once as a ZIP archive.
                    </p>
                </InfoBox>
            </DocSection>

            {/* File Information */}
            <DocSection title="File Information" icon={FileText} color="amber">
                <p className="text-gray-600 mb-4">
                    View detailed information about each document directly from the action menu.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Information displayed:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>File type:</strong> Color-coded icon indicating document type</li>
                        <li><strong>Created:</strong> Date and author who created the document</li>
                        <li><strong>Modified:</strong> Last modification date and author</li>
                        <li><strong>File size:</strong> Document size in human-readable format</li>
                        <li><strong>Sharing status:</strong> Public, shared, or private</li>
                        <li><strong>Full filename:</strong> Hover to see complete filename, click to copy</li>
                    </ul>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Copy className="h-4 w-4 text-blue-600" />
                        Copy Filename
                    </h3>
                    <p className="text-sm text-gray-600">
                        Click the filename in the action menu to copy it to your clipboard.
                        Useful for referencing documents in other tools or documentation.
                    </p>
                </div>
            </DocSection>

            {/* File Type Icons */}
            <DocSection title="File Type Icons" icon={FileText} color="indigo">
                <p className="text-gray-600 mb-4">
                    Documents are color-coded by type for easy identification.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="bg-blue-50 border border-blue-100 rounded p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                DOC
                            </div>
                            <span className="text-sm font-medium text-gray-900">Google Docs</span>
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                XLS
                            </div>
                            <span className="text-sm font-medium text-gray-900">Google Sheets</span>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                PPT
                            </div>
                            <span className="text-sm font-medium text-gray-900">Google Slides</span>
                        </div>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                PDF
                            </div>
                            <span className="text-sm font-medium text-gray-900">PDF Files</span>
                        </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                IMG
                            </div>
                            <span className="text-sm font-medium text-gray-900">Images</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                FILE
                            </div>
                            <span className="text-sm font-medium text-gray-900">Other Files</span>
                        </div>
                    </div>
                </div>
            </DocSection>

            {/* Quick Reference */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Reference</h2>
                <div className="grid gap-3 md:grid-cols-2">
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
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Keyboard Shortcuts</h3>
                        <p className="text-xs text-gray-600">
                            Press <kbd className="bg-gray-100 px-1 rounded">Esc</kbd> to close preview or version history drawers.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Bulk Actions</h3>
                        <p className="text-xs text-gray-600">
                            Coming soon: Select multiple documents and perform actions on all of them at once.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
