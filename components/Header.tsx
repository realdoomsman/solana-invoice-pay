'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

// Icon Components - clean SVG icons
const Icons = {
  home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  chart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  target: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  grid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  dollar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  file: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  x: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  chevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
}

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: '/', label: 'Home', icon: Icons.home },
    { href: '/escrow', label: 'Escrow', icon: Icons.lock },
    { href: '/splits', label: 'Splits', icon: Icons.chart },
    { href: '/crowdfunding', label: 'Goals', icon: Icons.target },
    { href: '/dashboard', label: 'Dashboard', icon: Icons.grid },
    { href: '/referrals', label: 'Earn', icon: Icons.dollar },
    { href: '/whitepaper', label: 'Docs', icon: Icons.file },
  ]

  return (
    <>
      {/* Menu Bar - macOS style */}
      <header className="sys-menubar fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo and Nav */}
          <div className="flex items-center">
            <Link href="/" className="sys-menubar-item font-semibold">
              PAYDOS
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              {navItems.slice(1, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sys-menubar-item ${pathname === item.href ? 'bg-white/10' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Status and Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
              <div className="sys-status sys-status-online"></div>
              <span>Mainnet</span>
            </div>

            <span className="text-xs mono hidden sm:block" style={{ color: 'var(--sys-text-tertiary)' }}>
              {time}
            </span>

            <WalletMultiButton />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1"
              style={{ color: 'var(--sys-text-secondary)' }}
            >
              {mobileMenuOpen ? <Icons.x /> : <Icons.menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'var(--sys-bg)', paddingTop: '28px' }}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sys-sidebar-item ${isActive ? 'sys-sidebar-item-active' : ''}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
