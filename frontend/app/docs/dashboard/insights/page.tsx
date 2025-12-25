import { BarChart3, Shield, AlertTriangle, Clock, Users, FileWarning } from "lucide-react"
import { DocSection } from "@/components/docs/doc-section"
import { InfoBox } from "@/components/docs/info-box"

export default function InsightsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Insights</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Get real-time security insights and analytics about your Google Drive documents.
                    Identify risks, track sharing patterns, and ensure compliance.
                </p>
            </div>

            {/* Overview */}
            <DocSection title="Drive Insights Overview" icon={BarChart3} color="blue">
                <p className="text-gray-600 mb-4">
                    The Insights page provides a comprehensive view of your Google Drive security posture and document sharing patterns.
                </p>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">What You'll See:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Security alerts and risk indicators</li>
                            <li>File sharing analytics</li>
                            <li>Expiring share links</li>
                            <li>Publicly accessible files</li>
                            <li>Sensitive data detection</li>
                        </ul>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Key Benefits:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Proactive security monitoring</li>
                            <li>Compliance tracking</li>
                            <li>Risk identification</li>
                            <li>Sharing pattern analysis</li>
                            <li>Data governance</li>
                        </ul>
                    </div>
                </div>
            </DocSection>

            {/* Security Alerts */}
            <DocSection title="Security Alerts & Risk Detection" icon={Shield} color="red">
                <p className="text-gray-600 mb-4">
                    Pockett automatically scans your Drive for security risks and alerts you to potential issues.
                </p>
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h3 className="font-semibold text-gray-900">High-Risk Alerts</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Critical security issues that need immediate attention:</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Files shared publicly with "Anyone with the link"</li>
                            <li>Sensitive documents with broad access</li>
                            <li>Files with external domain sharing</li>
                            <li>Documents with edit permissions to unknown users</li>
                        </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <h3 className="font-semibold text-gray-900">Medium-Risk Alerts</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Issues that should be reviewed:</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Files shared with large groups</li>
                            <li>Documents with many collaborators</li>
                            <li>Stale share links (not accessed in 90+ days)</li>
                            <li>Files in shared drives with broad permissions</li>
                        </ul>
                    </div>
                </div>
                <InfoBox type="tip" title="Taking Action">
                    <p>
                        Click on any alert to see the affected files. You can then review permissions
                        and make changes directly in Google Drive by clicking "Open in Google Drive".
                    </p>
                </InfoBox>
            </DocSection>

            {/* File Sharing Analytics */}
            <DocSection title="File Sharing Analytics" icon={Users} color="purple">
                <p className="text-gray-600 mb-4">
                    Understand how your files are being shared and who has access.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Sharing Metrics:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>Total shared files:</strong> Number of files with sharing enabled</li>
                        <li><strong>Public files:</strong> Files accessible to anyone with the link</li>
                        <li><strong>External shares:</strong> Files shared outside your organization</li>
                        <li><strong>Internal shares:</strong> Files shared within your organization</li>
                        <li><strong>Most shared files:</strong> Documents with the most collaborators</li>
                    </ul>
                </div>
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Sharing Trends</h3>
                        <p className="text-sm text-gray-600">
                            Track how sharing patterns change over time. Identify spikes in external
                            sharing or increases in public file exposure.
                        </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Collaboration Insights</h3>
                        <p className="text-sm text-gray-600">
                            See which teams or individuals are most active in sharing and collaborating
                            on documents.
                        </p>
                    </div>
                </div>
            </DocSection>

            {/* Expiring Shares */}
            <DocSection title="Expiring Share Links" icon={Clock} color="amber">
                <p className="text-gray-600 mb-4">
                    Track share links that are about to expire or have recently expired.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">What's tracked:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>Share links expiring in the next 7 days</li>
                        <li>Recently expired links (last 30 days)</li>
                        <li>Files with time-limited access</li>
                        <li>Temporary collaborator permissions</li>
                    </ul>
                </div>
                <InfoBox type="info" title="Proactive Management">
                    <p>
                        Get notified before share links expire so you can renew them if needed or
                        ensure access is properly removed for security.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Public Files */}
            <DocSection title="Public File Detection" icon={FileWarning} color="red">
                <p className="text-gray-600 mb-4">
                    Identify files that are publicly accessible and may pose a security risk.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Public file categories:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>"Anyone with the link":</strong> Files accessible to anyone who has the URL</li>
                        <li><strong>"Public on the web":</strong> Files indexed by search engines</li>
                        <li><strong>Domain-wide sharing:</strong> Files shared with entire organization</li>
                    </ul>
                </div>
                <InfoBox type="warning" title="Security Risk">
                    <p>
                        Public files can be accessed by anyone, including competitors, malicious actors,
                        or search engines. Review these files regularly and restrict access when appropriate.
                    </p>
                    <p className="mt-2">
                        <strong>Best practice:</strong> Only make files public if they're intended for
                        public consumption (e.g., marketing materials, public documentation).
                    </p>
                </InfoBox>
            </DocSection>

            {/* Sensitive Data */}
            <DocSection title="Sensitive Data Identification" icon={Shield} color="indigo">
                <p className="text-gray-600 mb-4">
                    Pockett helps identify files that may contain sensitive information.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Detection patterns:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>Files with keywords like "confidential", "private", "internal"</li>
                        <li>Financial documents (invoices, budgets, reports)</li>
                        <li>HR documents (resumes, contracts, reviews)</li>
                        <li>Legal documents (agreements, NDAs, contracts)</li>
                    </ul>
                </div>
                <InfoBox type="tip" title="Coming Soon">
                    <p>
                        Advanced content scanning to detect PII (personally identifiable information),
                        credit card numbers, social security numbers, and other sensitive data patterns.
                    </p>
                </InfoBox>
            </DocSection>

            {/* How to Use Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use Insights</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Regular Reviews</h3>
                        <p className="text-xs text-gray-600">
                            Check your Insights dashboard weekly to stay on top of security risks and sharing patterns.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Act on Alerts</h3>
                        <p className="text-xs text-gray-600">
                            Address high-risk alerts immediately. Review and update file permissions as needed.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Track Trends</h3>
                        <p className="text-xs text-gray-600">
                            Monitor how your sharing patterns change over time. Look for unusual spikes or patterns.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Educate Your Team</h3>
                        <p className="text-xs text-gray-600">
                            Use insights to educate your team about secure file sharing practices and policies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
