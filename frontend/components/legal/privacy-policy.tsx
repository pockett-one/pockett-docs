export function PrivacyPolicy() {
  return (
    <div className="prose prose-gray max-w-none">
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">1. Information We Collect</h3>
          <p className="text-gray-600 mb-3">
            We collect information you provide directly to us, such as when you create an account, 
            connect your Google Drive, or contact us for support.
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Account information (name, email address)</li>
            <li>Google Drive connection data (document metadata, not content)</li>
            <li>Usage analytics and interaction data</li>
            <li>Communication preferences and support requests</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-xl font-semibold text-green-900 mb-3">2. How We Use Your Information</h3>
          <p className="text-gray-600 mb-3">
            We use the information we collect to provide, maintain, and improve our services:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Provide document analytics and insights</li>
            <li>Process your account and manage your subscription</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Improve our services and develop new features</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="text-xl font-semibold text-purple-900 mb-3">3. Information Sharing</h3>
          <p className="text-gray-600">
            We do not sell, trade, or otherwise transfer your personal information to third parties. 
            We may share information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-3">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>With service providers who assist in our operations</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-xl font-semibold text-orange-900 mb-3">4. Data Security</h3>
          <p className="text-gray-600">
            We implement appropriate technical and organizational security measures to protect your 
            personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </div>

        <div className="border-l-4 border-indigo-500 pl-4">
          <h3 className="text-xl font-semibold text-indigo-900 mb-3">5. Your Rights</h3>
          <p className="text-gray-600 mb-3">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Access and update your personal information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </div>

        <div className="border-l-4 border-teal-500 pl-4">
          <h3 className="text-xl font-semibold text-teal-900 mb-3">6. Contact Us</h3>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:info@pockett.io" className="text-blue-600 hover:underline">
            info@pockett.io
            </a>
          </p>
        </div>

        <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
          <p>Last updated: January 2025</p>
        </div>
      </div>
    </div>
  )
}
