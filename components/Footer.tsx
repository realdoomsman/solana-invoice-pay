'use client'

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`${className} flex items-center justify-center`}>💸</span>
  )
}

export default function Footer() {
  return (
    <footer className="win95-window mx-4 mb-16">
      <div className="win95-title-bar">
        <span className="text-sm">ℹ️ About PAYDOS</span>
        <div className="flex gap-[2px]">
          <button className="win95-control-btn">_</button>
          <button className="win95-control-btn">□</button>
          <button className="win95-control-btn">×</button>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💸</span>
              <span className="font-bold">PAYDOS 95</span>
            </div>
            <p className="text-xs">
              Payment infrastructure for Solana. Built for speed.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2 underline">Products</p>
            <ul className="space-y-1 text-xs">
              <li><a href="/" className="hover:underline">📄 Simple Payments</a></li>
              <li><a href="/create/split" className="hover:underline">📊 Split Payments</a></li>
              <li><a href="/create/escrow" className="hover:underline">🔒 Escrow</a></li>
              <li><a href="/create/goal" className="hover:underline">🎯 Funding Goals</a></li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-2 underline">Resources</p>
            <ul className="space-y-1 text-xs">
              <li><a href="/dashboard" className="hover:underline">📁 Dashboard</a></li>
              <li><a href="/faq" className="hover:underline">❓ FAQ</a></li>
              <li><a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="hover:underline">🌐 Solana.com</a></li>
              <li><a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" className="hover:underline">🔍 Explorer</a></li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-2 underline">Network</p>
            <div className="flex items-center gap-2 text-xs mb-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-700 font-bold">Mainnet Online</span>
            </div>
            <p className="text-xs">Powered by Solana</p>
          </div>
        </div>

        <div className="win95-divider"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
          <div className="flex gap-4">
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/faq" className="hover:underline">Help</a>
          </div>
          <p>© 2025 PAYDOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
