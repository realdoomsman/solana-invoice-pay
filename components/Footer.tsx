import { LogoIcon } from './Logo'

export default function Footer() {
  return (
    <footer className="bg-black text-slate-300 py-12 mt-20 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
            <LogoIcon className="h-7 w-7" />
            <span className="text-xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              NOVIQ
            </span>
          </div>
            <p className="text-sm text-slate-400">
              Next-generation payment infrastructure. Built on Solana. Powered by innovation.
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
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">
                Mainnet Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Powered by Solana
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <p className="text-sm text-slate-500">© 2025 NOVIQ. Built on Solana.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
