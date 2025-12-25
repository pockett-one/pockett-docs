import Link from "next/link"
import { UserPlus, LogIn, Plug, BarChart3, Menu, Shield, ArrowRight } from "lucide-react"

export default function DocsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Pockett Docs</h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                    Learn how to use Pockett to secure your Google Drive, monitor document sharing,
                    and gain insights into your organization's data.
                </p>
            </div>

            {/* Getting Started */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-3">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">1. Create Account</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Sign up with email OTP or Google OAuth
                        </p>
                        <Link
                            href="/docs/authentication/signup"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            Learn more <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center text-white mb-3">
                            <Plug className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">2. Connect Drive</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Link your Google Drive account securely
                        </p>
                        <Link
                            href="/docs/dashboard/connectors"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            Learn more <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center text-white mb-3">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">3. View Insights</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Monitor security risks and sharing patterns
                        </p>
                        <Link
                            href="/docs/dashboard/insights"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            Learn more <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Authentication */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
                <p className="text-gray-600 mb-6">
                    Learn about Pockett's secure authentication methods and account management.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                    <Link
                        href="/docs/authentication/signup"
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Signup</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Create your account with email OTP or Google OAuth
                        </p>
                    </Link>
                    <Link
                        href="/docs/authentication/signin"
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <LogIn className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Signin</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Access your account securely with multiple auth methods
                        </p>
                    </Link>
                    <Link
                        href="/docs/authentication/logout"
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Logout</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            End your session securely and manage account access
                        </p>
                    </Link>
                </div>
            </div>

            {/* Dashboard */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Features</h2>
                <p className="text-gray-600 mb-6">
                    Explore powerful features for managing and securing your Google Drive documents.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                    <Link
                        href="/docs/dashboard/connectors"
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Plug className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Connectors</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Connect and manage your Google Drive accounts
                        </p>
                    </Link>
                    <Link
                        href="/docs/dashboard/insights"
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Insights</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Security alerts, sharing analytics, and risk detection
                        </p>
                    </Link>
                    <Link
                        href="/docs/dashboard/document-actions"
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Menu className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Document Actions</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Preview, download, and manage your documents
                        </p>
                    </Link>
                </div>
            </div>

            {/* Security */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-6 w-6 text-gray-700" />
                    <h2 className="text-xl font-bold text-gray-900 m-0">Security & Privacy</h2>
                </div>
                <p className="text-gray-600 mb-4">
                    Learn about how Pockett protects your data and maintains your privacy.
                </p>
                <Link
                    href="/docs/security"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    Read our security documentation <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Need Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Need Help?</h2>
                <p className="text-gray-600 mb-4">
                    Can't find what you're looking for? We're here to help!
                </p>
                <div className="flex gap-3">
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Contact Support
                    </Link>
                    <a
                        href="mailto:info@pockett.io"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                        Email Us
                    </a>
                </div>
            </div>
        </div>
    )
}
