'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationPanel from './NotificationPanel'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/escrow', label: 'Escrow' },
    { href: '/splits', label: 'Splits' },
    { href: '/crowdfunding', label: 'Goals' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/referrals', label: 'Earn' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <LogoIcon className="h-7 w-7 text-white transition-transform group-hover:scale-105" />
            <span className="text-xl font-semibold tracking-tight text-white hidden sm:block">NOVIQ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <NotificationPanel />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${pathname === link.href
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <WalletMultiButton />
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <NotificationPanel />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10">
          <nav className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 px-4">
              <WalletMultiButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
