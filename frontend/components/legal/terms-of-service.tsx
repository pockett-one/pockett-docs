import { Check } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="prose prose-slate prose-lg max-w-none">
      <div className="space-y-12">

        {/* Intro */}
        <div>
          <p className="text-slate-600 leading-relaxed mb-6">
            Welcome to <strong>Pockett</strong>. By accessing our platform, you agree to bound by these Terms of Service. This agreement specifically governs the relationship between Pockett ("we", "us") and the Strategic Advisors, Consultants, and Firms ("you") who use our services to manage client portals.
          </p>
        </div>

        {/* Section 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">1</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Non-Custodial Service Model</h3>
            <p className="text-slate-600 mb-4">
              Pockett operates on a <strong>Non-Custodial</strong> architecture. We provide an interface to organize and govern files that reside in <strong>your</strong> Google Drive.
            </p>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>We do not take ownership of your intellectual property.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>We do not store file content on our servers.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span>You retain full liability for the content you share via our platform.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">2</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Subscription & Usage</h3>
            <p className="text-slate-600 mb-4">
              Access to Pockett is provided on a subscription basis (Monthly or Annual).
            </p>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Fair Use:</strong> API limits may apply to prevent abuse of the Google Drive integration.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Cancellation:</strong> You may cancel at any time. Your portals will remain active until the end of the billing cycle.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><Check className="w-4 h-4 text-purple-600" /></div>
                <span><strong>Termination:</strong> We reserve the right to suspend accounts that attempt to reverse-engineer our governance protocols.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">3</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Liability Disclaimer</h3>
            <p className="text-slate-600">
              Pockett is a tool for governance and organization. We are not a legal compliance firm. While our tools assist in protecting your IP ("Zombie Links"), we do not guarantee against all forms of data exfiltration by your clients. The service is provided "AS IS" without warranties of any kind.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">4</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Intellectual Property Rights</h3>
            <p className="text-slate-600 text-lg">
              The Pockett platform, including its source code, governance algorithms, and visual interfaces, is the exclusive property of Pockett.
            </p>
          </div>
        </div>

        {/* Section 5 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mt-1">5</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Contact Information</h3>
            <p className="text-slate-600">
              For questions regarding these Terms, please contact: {' '}
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
