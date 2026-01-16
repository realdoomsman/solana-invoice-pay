'use client'

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`${className} rounded-lg flex items-center justify-center`} style={{ background: 'linear-gradient(135deg, var(--pd-accent), var(--pd-purple))' }}>
      <span className="text-black font-bold text-xs">P</span>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="pd-window">
          <div className="pd-titlebar">
            <div className="pd-controls">
              <span className="pd-control pd-control-close"></span>
              <span className="pd-control pd-control-min"></span>
              <span className="pd-control pd-control-max"></span>
            </div>
            <span className="pd-titlebar-title">About PAYDOS</span>
            <div style={{ width: '54px' }}></div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <LogoIcon className="w-6 h-6" />
                  <span className="font-semibold">PAYDOS</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                  Payment infrastructure for Solana. Fast, secure, non-custodial.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-sm">Products</h4>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                  <li><a href="/" className="hover:text-[var(--pd-text)] transition-colors">Payments</a></li>
                  <li><a href="/escrow" className="hover:text-[var(--pd-text)] transition-colors">Escrow</a></li>
                  <li><a href="/splits" className="hover:text-[var(--pd-text)] transition-colors">Splits</a></li>
                  <li><a href="/crowdfunding" className="hover:text-[var(--pd-text)] transition-colors">Goals</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-sm">Resources</h4>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                  <li><a href="/dashboard" className="hover:text-[var(--pd-text)] transition-colors">Dashboard</a></li>
                  <li><a href="/whitepaper" className="hover:text-[var(--pd-text)] transition-colors">Whitepaper</a></li>
                  <li><a href="/faq" className="hover:text-[var(--pd-text)] transition-colors">FAQ</a></li>
                  <li><a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--pd-text)] transition-colors">Solana</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-sm">Network</h4>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <div className="pd-status pd-status-online"></div>
                  <span style={{ color: 'var(--pd-success)' }}>Mainnet Online</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                  Built on Solana
                </p>
              </div>
            </div>

            <div className="pd-divider"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-6 text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                <a href="/terms" className="hover:text-[var(--pd-text)] transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-[var(--pd-text)] transition-colors">Privacy</a>
                <a href="/faq" className="hover:text-[var(--pd-text)] transition-colors">Help</a>
              </div>
              <p className="text-sm" style={{ color: 'var(--pd-text-dim)' }}>
                © 2025 PAYDOS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
