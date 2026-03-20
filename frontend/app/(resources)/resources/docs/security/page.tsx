
import { Shield, Lock, Server, EyeOff, FileCheck } from "lucide-react"

export default function SecurityDocsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Security & Privacy</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    At Pockett, we prioritize the confidentiality and integrity of your data.
                    Our architecture is designed to act as a secure pass-through, ensuring that your files
                    are never stored on our infrastructure.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Server className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Zero-Storage Policy</h3>
                            <p className="text-sm text-gray-600">
                                We do not persist your files. When you access or download a document,
                                it streams entirely through our server's volatile memory (RAM) and is
                                immediately discarded after delivery.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Lock className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Encrypted in Transit</h3>
                            <p className="text-sm text-gray-600">
                                All data transmission occurs over encrypted channels.
                                From Google Drive to our servers, and from our servers to your browser,
                                your data is protected by industry-standard TLS encryption.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="prose prose-gray max-w-none">

                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 my-6">
                    <h3 className="text-lg font-semibold text-gray-900 m-0">Secure Download Architecture</h3>
                    <p className="text-gray-600 mt-2">
                        When you initiate a file download, Pockett establishes a secure tunnel.
                        The file content is streamed directly from Google's secure servers to your device.
                        This process ensures that no complete file is ever written to our disks, maintaining strict data hygiene.
                    </p>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-6">Data Access & Control</h2>

                <div className="not-prose space-y-4">
                    <div className="flex items-start gap-3">
                        <EyeOff className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                            <span className="font-medium text-gray-900 block">Token Security</span>
                            <span className="text-gray-600">
                                Your Google Drive access tokens are encrypted at rest in our database
                                and are never exposed to the client-side browser.
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <FileCheck className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                            <span className="font-medium text-gray-900 block">Granular Permissions</span>
                            <span className="text-gray-600">
                                We only request the permissions strictly necessary to list and download your files.
                                You can revoke access at any time from your Google Account settings or the Pockett dashboard.
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
