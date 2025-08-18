export function Support() {
  return (
    <div className="prose prose-gray max-w-none">
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">Get Help & Support</h3>
          <p className="text-gray-600">
            We're here to help you get the most out of Pockett. Choose the support option that 
            works best for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">📚 Documentation</h4>
            <p className="text-blue-800 mb-4">
              Comprehensive guides and tutorials to help you get started and master Pockett's features.
            </p>
            <ul className="text-blue-800 space-y-2">
              <li>• Getting Started Guide</li>
              <li>• Feature Documentation</li>
              <li>• API Reference</li>
              <li>• Best Practices</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-3">🎯 FAQ</h4>
            <p className="text-green-800 mb-4">
              Quick answers to common questions about Pockett's features and functionality.
            </p>
            <ul className="text-green-800 space-y-2">
              <li>• Account Setup</li>
              <li>• Google Drive Integration</li>
              <li>• Analytics & Reports</li>
              <li>• Troubleshooting</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact Support</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-2">📧 Email Support</h4>
              <p className="text-gray-600 mb-3">
                For technical issues, account questions, or feature requests, email our support team.
              </p>
              <a 
                href="mailto:info@pockett.io" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                info@pockett.io
              </a>
            </div>

            {/* <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-2">💬 Live Chat</h4>
              <p className="text-gray-600 mb-3">
                Get instant help from our support team during business hours (9 AM - 6 PM EST).
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Start Chat
              </button>
            </div> */}

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-2">🐛 Bug Reports</h4>
              <p className="text-gray-600 mb-3">
                Found a bug? Help us improve by reporting issues with detailed information.
              </p>
              <a 
                href="mailto:info@pockett.io" 
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Report Bug
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Response Times</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">4-8 hours</div>
              <div className="text-blue-800">Email Support</div>
            </div>
            {/* <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Instant</div>
              <div className="text-green-800">Live Chat</div>
            </div> */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">24 hours</div>
              <div className="text-orange-800">Bug Reports</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Hours</h3>
          <p className="text-gray-600">
            Our support team is available Monday through Friday, 9:00 AM to 6:00 PM UTC. 
            For urgent issues outside business hours, please email us and we will respond as soon as possible.
          </p>
        </div>

        <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
          <p>Need immediate help? Check our <a href="#" className="text-blue-600 hover:underline">Knowledge Base</a> for instant answers.</p>
        </div>
      </div>
    </div>
  )
}
