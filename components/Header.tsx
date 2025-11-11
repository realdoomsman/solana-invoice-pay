'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo, { LogoIcon } from './Logo'

export default function Header() {
  const pathname = usePathname()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <LogoIcon className="h-8 w-8 transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold text-white hidden sm:block">NOVIQ</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/escrow"
              className={`text-sm font-medium transition-colors ${
                pathname === '/escrow'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Escrow
            </Link>
            <Link
              href="/splits"
              className={`text-sm font-medium transition-colors ${
                pathname === '/splits'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Splits
            </Link>
            <Link
              href="/crowdfunding"
              className={`text-sm font-medium transition-colors ${
                pathname === '/crowdfunding'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Goals
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/faq"
              className={`text-sm font-medium transition-colors ${
                pathname === '/faq'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FAQ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
