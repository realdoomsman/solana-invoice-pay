'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationPanel from './NotificationPanel'

function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M 8 8 L 8 24 L 11 24 L 11 14 L 21 24 L 24 24 L 24 8 L 21 8 L 21 18 L 11 8 Z" 
        fill="currentColor"
      />
    </svg>
  )
}

export default function Header() {
  const pathname = usePathname()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <LogoIcon className="h-7 w-7 text-white transition-transform group-hover:scale-105" />
            <span className="text-xl font-semibold tracking-tight text-white hidden sm:block">NOVIQ</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <NotificationPanel />
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
              href="/referrals"
              className={`text-sm font-medium transition-colors ${
                pathname === '/referrals'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Earn
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
