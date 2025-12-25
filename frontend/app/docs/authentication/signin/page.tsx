import { LogIn, Mail, Shield, KeyRound } from "lucide-react"
import { DocSection } from "@/components/docs/doc-section"
import { InfoBox } from "@/components/docs/info-box"
import { StepList } from "@/components/docs/step-list"

export default function SigninPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Signin</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Access your Pockett account using your preferred authentication method.
                    Our signin process is secure, fast, and offers multiple options.
                </p>
            </div>

            {/* Signin Flow Overview */}
            <DocSection title="Signin Flow" icon={LogIn} color="blue">
                <p className="text-gray-600 mb-4">
                    The signin process is simple and secure:
                </p>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900">Enter Email</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Provide the email address associated with your account
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900">Verify & Access</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Complete verification via Email Code or Sign in with Google
                        </p>
                    </div>
                </div>
            </DocSection>

            {/* Email Code Signin */}
            <DocSection title="Email Code Signin" icon={Mail} color="purple">
                <p className="text-gray-600 mb-4">
                    Sign in without a password using a one-time code sent to your email.
                </p>
                <StepList
                    title="How it works:"
                    steps={[
                        "Enter your email address",
                        "Click <strong>\"Continue with Email\"</strong>",
                        "Complete the <strong>Turnstile CAPTCHA</strong> verification",
                        "Check your email for a 6-digit verification code",
                        "Enter the code to sign in",
                        "You'll be redirected to your dashboard"
                    ]}
                />
                <InfoBox type="info" title="Code Expiration">
                    <p>
                        Verification codes expire after <strong>10 minutes</strong> for security.
                        If your code expires, simply request a new one by clicking "Resend code".
                    </p>
                </InfoBox>
            </DocSection>

            {/* Sign in with Google */}
            <DocSection title="Sign in with Google" icon={Shield} color="green">
                <p className="text-gray-600 mb-4">
                    Sign in instantly using your Google account.
                </p>
                <StepList
                    title="How it works:"
                    steps={[
                        "Enter your email address",
                        "Click <strong>\"Continue with Google\"</strong>",
                        "You'll be redirected to Google's secure login page",
                        "Sign in with your Google account",
                        "You'll be redirected back to your Pockett dashboard"
                    ]}
                />
                <InfoBox type="tip" title="Faster Signin">
                    <p>
                        If you're already signed in to Google in your browser, the signin process
                        is nearly instant - just one click!
                    </p>
                </InfoBox>
            </DocSection>

            {/* Session Management */}
            <DocSection title="Session Management" icon={KeyRound} color="indigo">
                <p className="text-gray-600 mb-4">
                    Your Pockett session is managed securely using industry-standard practices.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Session Details:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li><strong>Duration:</strong> Sessions remain active for 7 days</li>
                        <li><strong>Auto-renewal:</strong> Sessions automatically renew when you use the app</li>
                        <li><strong>Security:</strong> Sessions are encrypted and stored securely</li>
                        <li><strong>Multi-device:</strong> You can be signed in on multiple devices</li>
                    </ul>
                </div>
                <InfoBox type="warning" title="Shared Devices">
                    <p>
                        If you're using a shared or public computer, always remember to sign out when you're done.
                        This prevents others from accessing your account.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Turnstile Protection */}
            <DocSection title="Bot Protection" icon={Shield} color="amber">
                <p className="text-gray-600 mb-4">
                    Email OTP signin is protected by Cloudflare Turnstile to prevent automated attacks.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">When you'll see Turnstile:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>When clicking "Continue with Email" during signin</li>
                        <li>When requesting a new verification code (resend)</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                        <strong>Note:</strong> The verification step is not shown when signing in with Google.
                    </p>
                </div>
            </DocSection>

            {/* Troubleshooting */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Didn't receive the verification code?</h3>
                        <p className="text-sm text-gray-600">
                            Check your spam folder. If still not received, click "Resend code" and complete the Turnstile verification again.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Code expired?</h3>
                        <p className="text-sm text-gray-600">
                            Verification codes expire after 10 minutes. Request a new code by clicking "Resend code".
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email not recognized?</h3>
                        <p className="text-sm text-gray-600">
                            Make sure you're using the email address you signed up with. If you don't have an account yet,
                            click "Sign up" to create one.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Google OAuth not working?</h3>
                        <p className="text-sm text-gray-600">
                            Ensure pop-ups are enabled for Pockett in your browser. Google OAuth requires opening a new window.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
