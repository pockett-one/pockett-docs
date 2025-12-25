import { LogOut, Shield, Trash2 } from "lucide-react"
import { DocSection } from "@/components/docs/doc-section"
import { InfoBox } from "@/components/docs/info-box"
import { StepList } from "@/components/docs/step-list"

export default function LogoutPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Logout</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Securely end your Pockett session and protect your account.
                </p>
            </div>

            {/* Logout Process */}
            <DocSection title="How to Logout" icon={LogOut} color="blue">
                <p className="text-gray-600 mb-4">
                    Logging out is quick and ensures your account remains secure.
                </p>
                <StepList
                    title="Steps to logout:"
                    steps={[
                        "Click on your profile picture or name in the top-right corner",
                        "Select <strong>\"Logout\"</strong> from the dropdown menu",
                        "You'll be immediately signed out and redirected to the homepage"
                    ]}
                />
            </DocSection>

            {/* What Happens */}
            <DocSection title="What Happens When You Logout" icon={Shield} color="purple">
                <p className="text-gray-600 mb-4">
                    When you logout, we ensure your session is completely terminated.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Session cleanup:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>Your authentication session is terminated</li>
                        <li>Session cookies are cleared from your browser</li>
                        <li>You're redirected to the public homepage</li>
                        <li>Any cached data in your browser remains (for faster re-login)</li>
                    </ul>
                </div>
                <InfoBox type="info" title="Multi-Device Sessions">
                    <p>
                        Logging out on one device <strong>does not</strong> automatically log you out on other devices.
                        Each device maintains its own session.
                    </p>
                    <p className="mt-2">
                        If you want to log out of all devices, you'll need to manually log out on each one.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Security Best Practices */}
            <DocSection title="Security Best Practices" icon={Shield} color="green">
                <p className="text-gray-600 mb-4">
                    Follow these best practices to keep your account secure.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">✓ Always Logout When:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Using a shared or public computer</li>
                            <li>Finishing work on a borrowed device</li>
                            <li>Leaving your computer unattended</li>
                            <li>Switching between multiple accounts</li>
                        </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">⚠️ Be Cautious:</h3>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Don't save passwords on shared devices</li>
                            <li>Clear browser data after using public computers</li>
                            <li>Close all browser tabs after logging out</li>
                            <li>Don't leave your session open overnight</li>
                        </ul>
                    </div>
                </div>
            </DocSection>

            {/* Automatic Logout */}
            <DocSection title="Automatic Session Expiration" icon={Trash2} color="amber">
                <p className="text-gray-600 mb-4">
                    For security, sessions automatically expire after a period of inactivity.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Session expiration:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>Maximum session duration:</strong> 7 days</li>
                        <li><strong>Inactivity timeout:</strong> Sessions remain active as long as you use the app</li>
                        <li><strong>Auto-renewal:</strong> Sessions automatically renew with each interaction</li>
                    </ul>
                </div>
                <InfoBox type="warning" title="Session Expired">
                    <p>
                        If your session expires, you'll be automatically redirected to the signin page.
                        Simply sign in again to continue where you left off.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Tips</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Keyboard Shortcut</h3>
                        <p className="text-xs text-gray-600">
                            You can quickly access the logout option by clicking your profile picture in the header.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Stay Signed In</h3>
                        <p className="text-xs text-gray-600">
                            On your personal devices, you can stay signed in for convenience. Sessions auto-renew with use.
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Forgot to Logout?</h3>
                        <p className="text-xs text-gray-600">
                            If you forgot to logout on a public computer, you can remotely end that session by changing your password (coming soon).
                        </p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">Re-login</h3>
                        <p className="text-xs text-gray-600">
                            After logging out, you can sign back in anytime using the same authentication method you used during signup.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
