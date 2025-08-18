export function CookiePolicy() {
  return (
    <div className="prose prose-gray max-w-none">
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">What Are Cookies?</h3>
          <p className="text-gray-600">
            Cookies are small text files that are placed on your device when you visit our website. 
            They help us provide you with a better experience and understand how you use our services.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Types of Cookies We Use</h3>
          
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-lg font-medium text-green-900 mb-2">Essential Cookies</h4>
              <p className="text-green-800 mb-2">
                These cookies are necessary for the website to function properly. They enable basic 
                functions like page navigation and access to secure areas.
              </p>
              <ul className="list-disc list-inside text-green-800 space-y-1 ml-4">
                <li>Authentication cookies</li>
                <li>Security cookies</li>
                <li>Session management cookies</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-lg font-medium text-blue-900 mb-2">Analytics Cookies</h4>
              <p className="text-blue-800 mb-2">
                These cookies help us understand how visitors interact with our website by collecting 
                and reporting information anonymously.
              </p>
              <ul className="list-disc list-inside text-blue-800 space-y-1 ml-4">
                <li>Google Analytics cookies</li>
                <li>Performance monitoring cookies</li>
                <li>User behavior tracking cookies</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="text-lg font-medium text-purple-900 mb-2">Functional Cookies</h4>
              <p className="text-purple-800 mb-2">
                These cookies enable enhanced functionality and personalization, such as remembering 
                your preferences and settings.
              </p>
              <ul className="list-disc list-inside text-purple-800 space-y-1 ml-4">
                <li>Language preference cookies</li>
                <li>Theme preference cookies</li>
                <li>Feature preference cookies</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Cookies</h3>
          <p className="text-gray-600 mb-3">
            We may use third-party services that place cookies on your device:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Google Analytics for website analytics</li>
            <li>Google OAuth for authentication</li>
            <li>Support tools for customer service</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Managing Your Cookie Preferences</h3>
          <p className="text-gray-600 mb-3">
            You can control and manage cookies in several ways:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Browser settings: Most browsers allow you to refuse or delete cookies</li>
            <li>Cookie consent: Use our cookie consent banner to manage preferences</li>
            <li>Third-party opt-outs: Visit third-party websites to opt out of their cookies</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Cookie Duration</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent cookies:</strong> Remain on your device for a set period</li>
            <li><strong>Third-party cookies:</strong> Subject to third-party privacy policies</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Updates to This Policy</h3>
          <p className="text-gray-600">
            We may update this Cookie Policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </div>

        <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
          <p>Last updated: January 2025</p>
        </div>
      </div>
    </div>
  )
}
