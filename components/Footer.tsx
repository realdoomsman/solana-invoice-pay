'use client'

import Link from 'next/link'

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`w-6 h-6 rounded flex items-center justify-center ${className}`} style={{ background: 'var(--sys-accent)' }}>
      <span className="text-white font-bold text-xs">P</span>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="px-4 pb-8">
      <div className="max-w-5xl mx-auto">
        <div className="sys-window">
          <div className="sys-titlebar">
            <div className="sys-controls">
              <span className="sys-control sys-control-close"></span>
              <span className="sys-control sys-control-minimize"></span>
              <span className="sys-control sys-control-maximize"></span>
            </div>
            <span className="sys-titlebar-text">About</span>
            <div style={{ width: '54px' }}></div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LogoIcon />
                  <span className="font-semibold text-sm">PAYDOS</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                  Payment infrastructure for Solana.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--sys-text-secondary)' }}>Products</h4>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                  <li><Link href="/" className="hover:text-[var(--sys-text)] transition-colors">Payments</Link></li>
                  <li><Link href="/escrow" className="hover:text-[var(--sys-text)] transition-colors">Escrow</Link></li>
                  <li><Link href="/splits" className="hover:text-[var(--sys-text)] transition-colors">Splits</Link></li>
                  <li><Link href="/crowdfunding" className="hover:text-[var(--sys-text)] transition-colors">Goals</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--sys-text-secondary)' }}>Resources</h4>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                  <li><Link href="/dashboard" className="hover:text-[var(--sys-text)] transition-colors">Dashboard</Link></li>
                  <li><Link href="/whitepaper" className="hover:text-[var(--sys-text)] transition-colors">Whitepaper</Link></li>
                  <li><Link href="/faq" className="hover:text-[var(--sys-text)] transition-colors">FAQ</Link></li>
                  <li><a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--sys-text)] transition-colors">Solana</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--sys-text-secondary)' }}>Network</h4>
                <div className="flex items-center gap-2 text-xs mb-2">
                  <div className="sys-status sys-status-online"></div>
                  <span style={{ color: 'var(--sys-success)' }}>Mainnet Online</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                  Powered by Solana
                </p>
              </div>
            </div>

            <div className="sys-divider"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex gap-6 text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                <Link href="/terms" className="hover:text-[var(--sys-text)] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[var(--sys-text)] transition-colors">Privacy</Link>
                <Link href="/faq" className="hover:text-[var(--sys-text)] transition-colors">Help</Link>
              </div>
              <p className="text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                2025 PAYDOS
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
