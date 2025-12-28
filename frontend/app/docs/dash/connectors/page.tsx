import { Plug, Shield, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { DocSection } from "@/components/docs/doc-section"
import { InfoBox } from "@/components/docs/info-box"
import { StepList } from "@/components/docs/step-list"

export default function ConnectorsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Connectors</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Connect your Google Drive to Pockett and start monitoring your documents for security risks,
                    sharing patterns, and compliance issues.
                </p>
            </div>

            {/* Overview */}
            <DocSection title="What are Connectors?" icon={Plug} color="blue">
                <p className="text-gray-600 mb-4">
                    Connectors allow Pockett to securely access your Google Drive and provide insights into your documents.
                    Each connector represents a connection to a specific Google account.
                </p>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">✓ What Connectors Enable:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>View all your Google Drive documents</li>
                            <li>Monitor file sharing and permissions</li>
                            <li>Track document activity and changes</li>
                            <li>Identify security risks and compliance issues</li>
                        </ul>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">🔒 Security & Privacy:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Secure authentication with Google</li>
                            <li>Secure connection to your Drive</li>
                            <li>No data stored on our servers</li>
                            <li>Revoke access anytime</li>
                        </ul>
                    </div>
                </div>
            </DocSection>

            {/* Connecting Google Drive */}
            <DocSection title="Connecting Google Drive" icon={Plug} color="purple">
                <p className="text-gray-600 mb-4">
                    Connect your Google Drive account in just a few clicks.
                </p>
                <StepList
                    title="How to connect:"
                    steps={[
                        "Navigate to the <strong>Connectors</strong> page from the dashboard",
                        "Click <strong>\"Connect Google Drive\"</strong>",
                        "You'll be redirected to Google's secure login page",
                        "Select the Google account you want to connect",
                        "Review the permissions Pockett is requesting",
                        "Click <strong>\"Allow\"</strong> to grant access",
                        "You'll be redirected back to Pockett with your Drive connected"
                    ]}
                />
                <InfoBox type="info" title="Multiple Accounts">
                    <p>
                        You can connect multiple Google Drive accounts to the same Pockett organization.
                        This is useful if you manage documents across multiple Google accounts.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Permissions Required */}
            <DocSection title="Permissions Required" icon={Shield} color="green">
                <p className="text-gray-600 mb-4">
                    Pockett requests specific permissions to provide you with comprehensive insights.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">What Pockett can access:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>View files and folders:</strong> Access to see your documents</li>
                        <li><strong>View file details:</strong> Access to creation dates, modification dates, and sharing settings</li>
                        <li><strong>View sharing permissions:</strong> See who has access to your files</li>
                        <li><strong>View activity:</strong> Track changes and version history</li>
                        <li><strong>View user information:</strong> Identify who made changes</li>
                    </ul>
                </div>
                <InfoBox type="warning" title="What Pockett CANNOT Do">
                    <p>
                        Pockett cannot:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Delete files</li>
                        <li>Share files on your behalf</li>
                    </ul>
                </InfoBox>
            </DocSection>

            {/* Connector Status */}
            <DocSection title="Connector Status" icon={CheckCircle2} color="indigo">
                <p className="text-gray-600 mb-4">
                    Each connector has a status that indicates its current state.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">Active</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Connector is working properly and syncing data
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <h3 className="font-semibold text-gray-900">Warning</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Connector needs attention (e.g., permissions revoked)
                        </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="h-5 w-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">Syncing</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Connector is currently fetching data from Google Drive
                        </p>
                    </div>
                </div>
            </DocSection>

            {/* Managing Connectors */}
            <DocSection title="Managing Connectors" icon={RefreshCw} color="amber">
                <p className="text-gray-600 mb-4">
                    You can manage your connected Google Drive accounts from the Connectors page.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Available actions:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>Reconnect:</strong> If permissions are revoked, reconnect to restore access</li>
                        <li><strong>Refresh:</strong> Manually trigger a sync to fetch latest data</li>
                        <li><strong>Disconnect:</strong> Remove the connector and stop syncing data</li>
                        <li><strong>View details:</strong> See connector status, last sync time, and account info</li>
                    </ul>
                </div>
                <InfoBox type="tip" title="Automatic Syncing">
                    <p>
                        Pockett automatically syncs your Google Drive data periodically. You don't need to manually
                        refresh unless you want to see the latest changes immediately.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Troubleshooting */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Connector shows "Warning" status?</h3>
                        <p className="text-sm text-gray-600">
                            This usually means permissions were revoked. Click "Reconnect" to re-authorize Pockett.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Not seeing all my files?</h3>
                        <p className="text-sm text-gray-600">
                            Ensure the connector has finished its initial sync. Large Google Drives may take some time to fully sync.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Activity shows "User" instead of names?</h3>
                        <p className="text-sm text-gray-600">
                            You'll need to reconnect your Google Drive to enable this feature.
                            See the Document Actions documentation for details.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">How do I revoke access?</h3>
                        <p className="text-sm text-gray-600">
                            Click "Disconnect" on the connector, or visit{" "}
                            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Google Account Permissions
                            </a>{" "}
                            to revoke access directly from Google.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
