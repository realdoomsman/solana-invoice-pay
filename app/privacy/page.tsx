export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
          Privacy Policy
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect the following information:
          </p>
          <ul>
            <li>Wallet addresses (public blockchain data)</li>
            <li>Payment transaction details</li>
            <li>Usage data and analytics</li>
            <li>Email addresses (if provided)</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use your information to:
          </p>
          <ul>
            <li>Process payments and transactions</li>
            <li>Provide customer support</li>
            <li>Improve our services</li>
            <li>Send transaction notifications</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Storage</h2>
          <p>
            Your data is stored securely using industry-standard encryption. Payment data is stored on secure servers with encrypted private keys.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with:
          </p>
          <ul>
            <li>Service providers (hosting, email)</li>
            <li>Law enforcement (when required by law)</li>
            <li>Business partners (with your consent)</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Blockchain Transparency</h2>
          <p>
            All transactions on Solana are public and permanently recorded on the blockchain. Wallet addresses and transaction amounts are publicly visible.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Cookies</h2>
          <p>
            We use cookies and similar technologies to improve user experience and analyze usage patterns.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal data</li>
            <li>Request data deletion</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Security</h2>
          <p>
            We implement appropriate security measures to protect your data. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            Our service is not intended for users under 18 years of age. We do not knowingly collect data from children.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Changes to Privacy Policy</h2>
          <p>
            We may update this policy from time to time. Continued use of the service constitutes acceptance of changes.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">11. Contact Us</h2>
          <p>
            For privacy-related questions, please contact us through our support channels.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
          <a
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
