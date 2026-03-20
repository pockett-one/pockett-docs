import { UserPlus, Mail, Shield, CheckCircle2 } from "lucide-react"
import { DocSection } from "@/components/docs/doc-section"
import { InfoBox } from "@/components/docs/info-box"
import { StepList } from "@/components/docs/step-list"

export default function SignupPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Signup</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Create your Pockett account and start securing your Google Drive documents.
                    Our signup process is quick, secure, and offers multiple authentication options.
                </p>
            </div>

            {/* Signup Flow Overview */}
            <DocSection title="Signup Flow" icon={UserPlus} color="blue">
                <p className="text-gray-600 mb-4">
                    The signup process consists of three simple steps:
                </p>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900">Enter Details</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Provide your email, first name, and last name
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900">Choose Auth Method</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Choose Email Code or Sign in with Google
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900">Verify & Create</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Complete verification and create your organization
                        </p>
                    </div>
                </div>
            </DocSection>

            {/* Email Code Authentication */}
            <DocSection title="Email Code (Passwordless)" icon={Mail} color="purple">
                <p className="text-gray-600 mb-4">
                    Sign up without creating a password using a one-time code sent to your email.
                </p>
                <StepList
                    title="How it works:"
                    steps={[
                        "Enter your email, first name, and last name",
                        "Click <strong>\"Continue with Email Code\"</strong>",
                        "Complete the <strong>Turnstile CAPTCHA</strong> to verify you're human",
                        "Check your email for a 6-digit verification code",
                        "Enter the code to verify your email",
                        "Your account and organization are automatically created"
                    ]}
                />
                <InfoBox type="tip" title="Why Passwordless?">
                    <p>
                        Passwordless authentication is more secure than traditional passwords because:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>No password to remember or forget</li>
                        <li>No password to be stolen or leaked</li>
                        <li>Each code is single-use and expires quickly</li>
                        <li>More secure against unauthorized access</li>
                    </ul>
                </InfoBox>
            </DocSection>

            {/* Sign in with Google */}
            <DocSection title="Sign in with Google" icon={Shield} color="green">
                <p className="text-gray-600 mb-4">
                    Sign up instantly using your existing Google account.
                </p>
                <StepList
                    title="How it works:"
                    steps={[
                        "Enter your email, first name, and last name",
                        "Click <strong>\"Continue with Google\"</strong>",
                        "You'll be redirected to Google's secure login page",
                        "Sign in with your Google account",
                        "Grant Pockett the necessary permissions",
                        "You'll be redirected back and your account is created"
                    ]}
                />
                <InfoBox type="info" title="Permissions Required">
                    <p>
                        When signing up with Google, Pockett requests permission to:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>View your basic profile information (name, email)</li>
                        <li>Authenticate your identity</li>
                    </ul>
                    <p className="mt-2">
                        We <strong>do not</strong> access your Google Drive during signup.
                        Drive access is only requested when you connect a Google Drive account in the Connectors page.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Turnstile Protection */}
            <DocSection title="Bot Protection" icon={Shield} color="amber">
                <p className="text-gray-600 mb-4">
                    We use Cloudflare Turnstile to protect against automated bot signups and email spam.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">When you'll see Turnstile:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>When clicking "Continue with Email Code" during signup</li>
                        <li>When requesting a new verification code (resend)</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                        <strong>Note:</strong> The verification step is not shown when signing up with Google,
                        as Google handles bot protection automatically.
                    </p>
                </div>
                <InfoBox type="tip" title="Why Turnstile?">
                    <p>
                        Turnstile protects our email sending infrastructure from abuse by:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Preventing bots from exhausting our email quota</li>
                        <li>Stopping spam signups with fake emails</li>
                        <li>Ensuring service availability for legitimate users</li>
                    </ul>
                    <p className="mt-2">
                        Most users will complete Turnstile instantly without any interaction.
                    </p>
                </InfoBox>
            </DocSection>

            {/* Organization Creation */}
            <DocSection title="Organization Setup" icon={CheckCircle2} color="indigo">
                <p className="text-gray-600 mb-4">
                    After verifying your email or signing in with Google, your account is automatically created.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">What happens automatically:</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>Organization created with a unique slug based on your email</li>
                        <li>You're added as the organization owner</li>
                        <li>Your profile is populated with your name and email</li>
                        <li>You're redirected to the dashboard</li>
                    </ul>
                </div>
                <InfoBox type="info" title="Next Steps">
                    <p>
                        After signup, you'll be taken to the dashboard where you can:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Connect your Google Drive account</li>
                        <li>Start monitoring your documents</li>
                        <li>View security insights</li>
                        <li>Invite team members (coming soon)</li>
                    </ul>
                </InfoBox>
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
                        <h3 className="font-semibold text-gray-900 mb-1">Turnstile not loading?</h3>
                        <p className="text-sm text-gray-600">
                            Ensure you're not using an ad blocker that might block Cloudflare Turnstile. Try disabling it temporarily.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email already exists?</h3>
                        <p className="text-sm text-gray-600">
                            If you already have an account, use the signin page instead. Click the "Sign in" link at the bottom of the signup form.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
