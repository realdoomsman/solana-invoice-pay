'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function Header() {
  const pathname = usePathname()
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [time, setTime] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  })

  // Update time every minute
  useState(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    }, 60000)
    return () => clearInterval(interval)
  })

  const menuItems = [
    { href: '/', label: '🏠 Home', icon: '🏠' },
    { href: '/escrow', label: '🔒 Escrow', icon: '🔒' },
    { href: '/splits', label: '📊 Splits', icon: '📊' },
    { href: '/crowdfunding', label: '🎯 Goals', icon: '🎯' },
    { href: '/dashboard', label: '📁 Dashboard', icon: '📁' },
    { href: '/referrals', label: '💰 Earn', icon: '💰' },
  ]

  return (
    <>
      {/* Taskbar */}
      <header className="fixed bottom-0 left-0 right-0 z-50 win95-raised" style={{ height: '28px' }}>
        <div className="flex items-center justify-between h-full px-1">
          {/* Start Button */}
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`win95-button flex items-center gap-1 h-[22px] px-2 ${startMenuOpen ? 'border-[var(--win95-dark-gray)] border-r-[var(--win95-white)] border-b-[var(--win95-white)] border-l-[var(--win95-dark-gray)]' : ''}`}
            style={{ minWidth: 'auto' }}
          >
            <span className="text-lg">🪟</span>
            <span className="font-bold text-sm">Start</span>
          </button>

          {/* Quick Launch / Active Windows */}
          <div className="flex-1 flex items-center gap-1 mx-2">
            <div className="h-[20px] w-[1px] mx-1" style={{ borderLeft: '1px solid var(--win95-dark-gray)', borderRight: '1px solid var(--win95-white)' }}></div>
            {pathname !== '/' && (
              <div className="win95-button h-[22px] px-2 flex items-center text-xs truncate max-w-[200px]" style={{ minWidth: 'auto' }}>
                📄 {pathname.replace('/', '').charAt(0).toUpperCase() + pathname.slice(2)}
              </div>
            )}
          </div>

          {/* System Tray */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <WalletMultiButton />
            </div>
            <div className="win95-inset px-2 h-[20px] flex items-center text-xs">
              {time}
            </div>
          </div>
        </div>
      </header>

      {/* Start Menu */}
      {startMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setStartMenuOpen(false)}
          />
          <div className="fixed bottom-[28px] left-0 z-50 win95-window" style={{ width: '200px' }}>
            {/* Blue sidebar */}
            <div className="flex">
              <div
                className="w-[24px] flex items-end p-1"
                style={{
                  background: 'linear-gradient(to top, #000080, #1084d0)',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)'
                }}
              >
                <span className="text-white font-bold text-lg tracking-wider">PAYDOS<span className="font-normal text-sm">95</span></span>
              </div>

              {/* Menu Items */}
              <div className="flex-1 py-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setStartMenuOpen(false)}
                    className={`flex items-center gap-3 px-2 py-1 hover:bg-[var(--win95-blue)] hover:text-white ${pathname === item.href ? 'bg-[var(--win95-blue)] text-white' : ''
                      }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label.split(' ').slice(1).join(' ')}</span>
                  </Link>
                ))}

                <div className="win95-divider mx-1"></div>

                <div className="sm:hidden px-2 py-1">
                  <WalletMultiButton />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
