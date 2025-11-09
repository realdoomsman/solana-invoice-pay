export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
          Terms of Service
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using this payment platform, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Use of Service</h2>
          <p>
            This platform allows you to create payment links and accept cryptocurrency payments on the Solana blockchain. You agree to:
          </p>
          <ul>
            <li>Provide accurate information</li>
            <li>Not use the service for illegal activities</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not attempt to abuse or exploit the platform</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Fees</h2>
          <p>
            The platform charges a service fee on transactions. The current fee is displayed during payment creation. Fees are subject to change with notice.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Cryptocurrency Risks</h2>
          <p>
            You acknowledge that cryptocurrency transactions are irreversible and that you are responsible for:
          </p>
          <ul>
            <li>Verifying wallet addresses before sending payments</li>
            <li>Understanding the risks of cryptocurrency volatility</li>
            <li>Securing your private keys and wallet access</li>
            <li>Any losses due to incorrect addresses or user error</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. No Warranty</h2>
          <p>
            The service is provided "as is" without warranty of any kind. We do not guarantee uninterrupted or error-free service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            We are not liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. User Responsibilities</h2>
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining the security of your account</li>
            <li>All activities under your account</li>
            <li>Compliance with tax obligations</li>
            <li>Reporting any security breaches</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Prohibited Activities</h2>
          <p>
            You may not use this service to:
          </p>
          <ul>
            <li>Engage in fraudulent activities</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit malware or harmful code</li>
            <li>Abuse or overload the platform</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Termination</h2>
          <p>
            We reserve the right to terminate or suspend access to the service immediately, without prior notice, for conduct that we believe violates these Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">11. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable laws.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact</h2>
          <p>
            For questions about these Terms, please contact us through our support channels.
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
