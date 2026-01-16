'use client'

import Link from 'next/link'

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${className}`} style={{ background: 'var(--gradient-2)' }}>
      <span className="text-white font-bold text-xs">P</span>
    </div>
  )
}

const Icons = {
  globe: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
}

export default function Footer() {
  return (
    <footer className="px-4 pb-8">
      <div className="max-w-5xl mx-auto">
        <div className="window">
          <div className="window-header">
            <div className="traffic-lights">
              <span className="traffic-light traffic-light-red"></span>
              <span className="traffic-light traffic-light-yellow"></span>
              <span className="traffic-light traffic-light-green"></span>
            </div>
            <span className="window-title">About PayOS</span>
            <div style={{ width: '54px' }}></div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <LogoIcon />
                  <span className="font-semibold text-sm">PayOS</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                  Payment infrastructure for Solana. Fast, secure, non-custodial.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Products</h4>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <li><Link href="/" className="hover:text-[var(--text)] transition-colors">Payments</Link></li>
                  <li><Link href="/escrow" className="hover:text-[var(--text)] transition-colors">Escrow</Link></li>
                  <li><Link href="/splits" className="hover:text-[var(--text)] transition-colors">Splits</Link></li>
                  <li><Link href="/crowdfunding" className="hover:text-[var(--text)] transition-colors">Goals</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Resources</h4>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <li><Link href="/dashboard" className="hover:text-[var(--text)] transition-colors">Dashboard</Link></li>
                  <li><Link href="/whitepaper" className="hover:text-[var(--text)] transition-colors">Whitepaper</Link></li>
                  <li><Link href="/faq" className="hover:text-[var(--text)] transition-colors">FAQ</Link></li>
                  <li><a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">Solana</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Network</h4>
                <div className="flex items-center gap-2 text-xs mb-3">
                  <div className="status-dot status-online"></div>
                  <span style={{ color: 'var(--success)' }}>Mainnet Online</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <Icons.globe />
                  <span>Powered by Solana</span>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex gap-6 text-xs" style={{ color: 'var(--text-subtle)' }}>
                <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
                <Link href="/faq" className="hover:text-[var(--text)] transition-colors">Help</Link>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                2025 PayOS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
