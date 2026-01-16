'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

// Icons
const Icons = {
  lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  card: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  arrow: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
}

// System Window Component
function Window({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`sys-window ${className}`}>
      <div className="sys-titlebar">
        <div className="sys-controls">
          <span className="sys-control sys-control-close"></span>
          <span className="sys-control sys-control-minimize"></span>
          <span className="sys-control sys-control-maximize"></span>
        </div>
        <span className="sys-titlebar-text">{title}</span>
        <div style={{ width: '54px' }}></div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// App List Item
function AppItem({
  title,
  description,
  icon: Icon,
  color,
  href,
  badge
}: {
  title: string
  description: string
  icon: () => JSX.Element
  color: string
  href: string
  badge?: string
}) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(href)}
      className="sys-list-item w-full text-left group cursor-pointer"
    >
      <div className="sys-icon" style={{ background: color }}>
        <div style={{ color: 'white' }}><Icon /></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: 'var(--sys-text)' }}>{title}</span>
          {badge && <span className="sys-badge sys-badge-success">{badge}</span>}
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sys-text-tertiary)' }}>{description}</p>
      </div>
      <div style={{ color: 'var(--sys-text-tertiary)' }} className="group-hover:translate-x-1 transition-transform">
        <Icons.arrow />
      </div>
    </button>
  )
}

export default function Home() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [merchantWallet, setMerchantWallet] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setMerchantWallet(user.walletAddress)
      setIsLoggedIn(true)
    }
  }, [])

  const createPaymentLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!merchantWallet || merchantWallet.length < 32) {
      toast.error('Please enter a valid Solana wallet address')
      return
    }

    setLoading(true)

    try {
      const paymentId = nanoid(10)
      const wallet = generatePaymentWallet()

      const paymentData = {
        id: paymentId,
        amount: parseFloat(amount),
        token,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        paymentWallet: wallet.publicKey,
        privateKey: wallet.privateKey,
        merchantWallet: merchantWallet,
        type: 'simple',
      }

      const payments = JSON.parse(localStorage.getItem('payments') || '[]')
      payments.push(paymentData)
      localStorage.setItem('payments', JSON.stringify(payments))

      router.push(`/pay/${paymentId}`)
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error('Failed to create payment link. Please try again.')
      setLoading(false)
    }
  }

  const apps = [
    {
      title: 'Escrow',
      description: 'Secure P2P transactions with mutual confirmation',
      icon: Icons.lock,
      color: '#3b82f6',
      href: '/escrow',
    },
    {
      title: 'Splits',
      description: 'Automatic revenue distribution to multiple wallets',
      icon: Icons.chart,
      color: '#8b5cf6',
      href: '/splits',
    },
    {
      title: 'Goals',
      description: 'Crowdfunding with auto-refund protection',
      icon: Icons.target,
      color: '#22c55e',
      href: '/crowdfunding',
    },
    {
      title: 'Payments',
      description: 'Simple payment links with QR codes',
      icon: Icons.card,
      color: '#f97316',
      href: '/create/simple',
      badge: 'Popular',
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--sys-bg)' }}>
      <Header />

      <main className="pt-7 pb-20">
        {/* Hero */}
        <section className="px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6" style={{ background: 'var(--sys-bg-3)', border: '1px solid var(--sys-border)' }}>
              <div className="sys-status sys-status-online"></div>
              <span style={{ color: 'var(--sys-text-secondary)' }}>Solana Mainnet</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Payment Infrastructure
              <br />
              <span style={{ color: 'var(--sys-accent)' }}>for Solana</span>
            </h1>

            <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: 'var(--sys-text-secondary)' }}>
              Escrow, splits, crowdfunding, and instant payments.
              Non-custodial. No KYC. Sub-second finality.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' })}
                className="sys-button"
              >
                Create Payment
              </button>
              <button
                onClick={() => router.push('/whitepaper')}
                className="sys-button sys-button-secondary"
              >
                Documentation
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Apps List */}
              <div className="lg:col-span-1">
                <Window title="Applications">
                  <div className="-m-4">
                    {apps.map((app) => (
                      <AppItem key={app.title} {...app} />
                    ))}
                  </div>
                </Window>
              </div>

              {/* Create Payment */}
              <div className="lg:col-span-2" id="create">
                <Window title="New Payment">
                  <div className="space-y-4">
                    {!isLoggedIn && (
                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--sys-bg-3)' }}>
                        <div style={{ color: 'var(--sys-text-tertiary)' }}><Icons.info /></div>
                        <div className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                          <p className="font-medium mb-0.5" style={{ color: 'var(--sys-text)' }}>Connect Wallet</p>
                          <p>Connect your wallet to save and track payments.</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="sys-label">Recipient Address</label>
                      <input
                        type="text"
                        value={merchantWallet}
                        onChange={(e) => setMerchantWallet(e.target.value)}
                        placeholder="Solana wallet address"
                        disabled={isLoggedIn}
                        className="sys-input mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="sys-label">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="sys-input"
                        />
                      </div>
                      <div>
                        <label className="sys-label">Token</label>
                        <select
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className="sys-select w-full"
                        >
                          <option value="SOL">SOL</option>
                          <option value="USDC">USDC</option>
                          <option value="USDT">USDT</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="sys-label">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional note"
                        rows={2}
                        className="sys-input sys-textarea"
                      />
                    </div>

                    <button
                      onClick={createPaymentLink}
                      disabled={loading}
                      className="sys-button w-full justify-center"
                    >
                      {loading ? 'Creating...' : 'Create Payment Link'}
                    </button>
                  </div>
                </Window>
              </div>

            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="sys-card">
                <div className="sys-card-body">
                  <div className="sys-stat">
                    <div className="sys-stat-value" style={{ color: 'var(--sys-accent)' }}>&lt;1s</div>
                    <div className="sys-stat-label">Confirmation</div>
                  </div>
                </div>
              </div>
              <div className="sys-card">
                <div className="sys-card-body">
                  <div className="sys-stat">
                    <div className="sys-stat-value" style={{ color: 'var(--sys-accent)' }}>$0.0003</div>
                    <div className="sys-stat-label">Avg Fee</div>
                  </div>
                </div>
              </div>
              <div className="sys-card">
                <div className="sys-card-body">
                  <div className="sys-stat">
                    <div className="sys-stat-value" style={{ color: 'var(--sys-success)' }}>Online</div>
                    <div className="sys-stat-label">Network</div>
                  </div>
                </div>
              </div>
              <div className="sys-card">
                <div className="sys-card-body">
                  <div className="sys-stat">
                    <div className="sys-stat-value" style={{ color: 'var(--sys-accent)' }}>65K</div>
                    <div className="sys-stat-label">TPS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4">
              <Window title="Features">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="sys-icon mx-auto mb-3" style={{ background: 'var(--sys-bg-3)', width: '40px', height: '40px' }}>
                      <Icons.zap />
                    </div>
                    <h3 className="font-medium text-sm mb-1">Instant Settlement</h3>
                    <p className="text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                      Sub-second transaction finality on Solana
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="sys-icon mx-auto mb-3" style={{ background: 'var(--sys-bg-3)', width: '40px', height: '40px' }}>
                      <Icons.shield />
                    </div>
                    <h3 className="font-medium text-sm mb-1">Non-Custodial</h3>
                    <p className="text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                      You maintain full control of your funds
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="sys-icon mx-auto mb-3" style={{ background: 'var(--sys-bg-3)', width: '40px', height: '40px' }}>
                      <Icons.lock />
                    </div>
                    <h3 className="font-medium text-sm mb-1">Trustless Escrow</h3>
                    <p className="text-xs" style={{ color: 'var(--sys-text-tertiary)' }}>
                      Smart contract secured transactions
                    </p>
                  </div>
                </div>
              </Window>
            </div>

            {/* Why PAYDOS */}
            <div className="mt-4">
              <Window title="Why PAYDOS">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--sys-success)' }}><Icons.check /></span>
                    <span style={{ color: 'var(--sys-text-secondary)' }}>Non-custodial - you control your funds</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--sys-success)' }}><Icons.check /></span>
                    <span style={{ color: 'var(--sys-text-secondary)' }}>No KYC required to get started</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--sys-success)' }}><Icons.check /></span>
                    <span style={{ color: 'var(--sys-text-secondary)' }}>Sub-second transaction finality</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--sys-success)' }}><Icons.check /></span>
                    <span style={{ color: 'var(--sys-text-secondary)' }}>Built on Solana for maximum throughput</span>
                  </li>
                </ul>
              </Window>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
