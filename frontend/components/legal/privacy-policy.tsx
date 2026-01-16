import { Check } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="prose prose-slate prose-lg max-w-none">
      <div className="space-y-12">

        {/* Intro */}
        <div>
          <p className="text-slate-600 leading-relaxed mb-6">
            At <strong>Pockett</strong> ("we", "us", or "our"), we respect your privacy and are committed to protecting the proprietary assets you intrust to our platform. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service, specifically tailored for Strategic Advisors and Consultants.
          </p>
        </div>

        {/* Section 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">1</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Information We Collect</h3>
            <p className="text-slate-600 mb-4">
              Our platform is designed to be <strong className="text-slate-900">Non-Custodial</strong> regarding your intellectual property. We minimize data collection to the absolute essentials required for service delivery.
            </p>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Account Identity:</strong> Basic profile information (Name, Email, Organization).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Google Drive Metadata:</strong> We request access to file names, folder structures, and permission settings to organize your client portal. <span className="text-purple-700 font-medium">We do not store the actual content of your files.</span></span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Usage Telemetry:</strong> Anonymized data on how you interact with the platform to improve performance.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">2</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">How We Use Your Information</h3>
            <p className="text-slate-600 mb-4">
              We use your data solely to facilitate the secure delivery of your professional services:
            </p>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>Automating the creation and management of Client Portals.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>Enforcing access control and revocation policies ("Zombie Link" prevention).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>Sending critical security alerts regarding your shared assets.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>Generating audit logs for your engagements.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">3</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Data Sovereignty & Sharing</h3>
            <p className="text-slate-600 mb-4">
              Your client data remains in your Google Drive. <strong>We do not sell your data.</strong> We do not share your data with third parties, except:
            </p>
            <ul className="space-y-3 ml-1 mt-2">
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Service Providers:</strong> AWS/Vercel (Hosting), Supabase (Database), Stripe (Payments) – strictly for infrastructure.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Legal Compliance:</strong> If compelled by law enforcement (highly specific and rare).</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">4</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Security & Retention</h3>
            <p className="text-slate-600">
              We employ enterprise-grade encryption (TLS 1.2+) for all data in transit. Since we do not store your files, the security of your documents rests primarily on Google's world-class infrastructure, layered with our access governance.
            </p>
            <p className="text-slate-600 mt-4">
              When you delete your Pockett account, all metadata stored on our servers is permanently erased within 30 days. Your actual files in Google Drive remain untouched.
            </p>
          </div>
        </div>

        {/* Section 5: Cookie Policy */}
        <div id="cookies" className="flex gap-4 scroll-mt-36">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">5</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Cookie Policy</h3>
            <p className="text-slate-600 mb-6">
              We use cookies to improve your experience, analyze site traffic, and deliver personalized content. You can adjust your preferences at any time via the "Cookie Settings" link in the footer.
            </p>

            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h4 className="font-bold text-slate-900">Strictly Necessary</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These cookies are essential for the operation of our secure portal. They handle user authentication, session security, and fraud prevention. You cannot opt-out of these as they are required for the service to function.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h4 className="font-bold text-slate-900">Analytics & Performance</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We use these to understand how you interact with Pockett (e.g., page visit counts, load times, errors). This data is aggregated and anonymized to help us improve platform performance and usability.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <h4 className="font-bold text-slate-900">Marketing & Targeting</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These cookies may be set by our advertising partners to build a profile of your interests and show you relevant ads on other sites. They do not store direct personal information but uniquely identify your browser and device.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <h4 className="font-bold text-slate-900">Personalization</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These allow the website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">6</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Contact Us</h3>
            <p className="text-slate-600">
              For any privacy concerns or data requests, please contact our Data Protection Officer at{' '}
              <a href="mailto:info@pockett.io" className="text-purple-600 font-bold hover:text-purple-800 hover:underline decoration-2 underline-offset-2 transition-colors">
                info@pockett.io
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
