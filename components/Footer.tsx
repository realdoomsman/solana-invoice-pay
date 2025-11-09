export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Solana Pay</h3>
            <p className="text-sm text-slate-400">
              Accept crypto payments instantly on Solana's lightning-fast blockchain.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Simple Payments</a></li>
              <li><a href="/create/split" className="hover:text-white transition-colors">Split Payments</a></li>
              <li><a href="/create/escrow" className="hover:text-white transition-colors">Escrow</a></li>
              <li><a href="/create/goal" className="hover:text-white transition-colors">Funding Goals</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/status" className="hover:text-white transition-colors">System Status</a></li>
              <li><a href="https://docs.solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Solana Docs</a></li>
              <li><a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Explorer</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Network</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>
                {process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' 
                  ? 'Mainnet Live' 
                  : 'Devnet Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
                ? 'Production ready'
                : 'Testing environment'}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          <div className="flex justify-center gap-6 mb-4">
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
          <p>Built on Solana. Open source and non-custodial.</p>
        </div>
      </div>
    </footer>
  )
}
