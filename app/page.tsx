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
  escrow: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  splits: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  goals: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  payments: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  zap: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  code: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  ),
  arrow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
}

// Window Component
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
    <div className={`pd-window ${className}`}>
      <div className="pd-titlebar">
        <div className="pd-controls">
          <span className="pd-control pd-control-close"></span>
          <span className="pd-control pd-control-min"></span>
          <span className="pd-control pd-control-max"></span>
        </div>
        <span className="pd-titlebar-title">{title}</span>
        <div style={{ width: '54px' }}></div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// App Card Component
function AppCard({
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
      className="pd-card text-left hover:border-[var(--pd-border-light)] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div
          className="pd-app-icon"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}
        >
          <div style={{ color }}><Icon /></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--pd-text)]">{title}</h3>
            {badge && (
              <span className="pd-badge pd-badge-success">{badge}</span>
            )}
          </div>
          <p className="text-sm text-[var(--pd-text-muted)] line-clamp-2">{description}</p>
        </div>
        <div className="text-[var(--pd-text-dim)] group-hover:text-[var(--pd-accent)] transition-colors">
          <Icons.arrow />
        </div>
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
      description: 'Trustless P2P transactions with secure fund holding until both parties confirm.',
      icon: Icons.escrow,
      color: 'var(--pd-blue)',
      href: '/escrow',
    },
    {
      title: 'Splits',
      description: 'Automatic revenue distribution to multiple recipients with custom percentages.',
      icon: Icons.splits,
      color: 'var(--pd-purple)',
      href: '/splits',
    },
    {
      title: 'Goals',
      description: 'Crowdfunding with full transparency. Auto-refund if target not reached.',
      icon: Icons.goals,
      color: 'var(--pd-green)',
      href: '/crowdfunding',
    },
    {
      title: 'Payments',
      description: 'Simple payment links. Share via any channel, get paid instantly.',
      icon: Icons.payments,
      color: 'var(--pd-orange)',
      href: '/create/simple',
      badge: 'Popular',
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--pd-bg)' }}>
      <Header />

      <main className="pt-14">
        {/* Hero Section */}
        <section className="px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6" style={{ background: 'var(--pd-accent-glow)', color: 'var(--pd-accent)' }}>
              <div className="pd-status pd-status-online" style={{ width: '6px', height: '6px' }}></div>
              <span className="font-medium">Mainnet Live</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Payment Infrastructure<br />
              <span style={{ color: 'var(--pd-accent)' }}>for Solana</span>
            </h1>

            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--pd-text-muted)' }}>
              Escrow, splits, crowdfunding, and instant payments.
              Non-custodial. No KYC. Built for speed.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => document.getElementById('create-payment')?.scrollIntoView({ behavior: 'smooth' })}
                className="pd-button"
              >
                Create Payment
              </button>
              <button
                onClick={() => router.push('/whitepaper')}
                className="pd-button-secondary"
              >
                Read Whitepaper
              </button>
            </div>
          </div>
        </section>

        {/* Apps Grid */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Apps</h2>
              <span className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>Choose a product</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apps.map((app) => (
                <AppCard key={app.title} {...app} />
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Create Payment Window */}
              <Window title="Quick Payment" id="create-payment">
                <div className="space-y-4">
                  {!isLoggedIn && (
                    <div className="pd-card text-sm" style={{ background: 'var(--pd-accent-glow)', border: 'none' }}>
                      <div className="flex items-start gap-3">
                        <Icons.shield />
                        <div>
                          <p className="font-medium mb-1">Connect Wallet</p>
                          <p style={{ color: 'var(--pd-text-muted)' }}>Connect your wallet to save and track payments.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="pd-label">Recipient Wallet</label>
                    <input
                      type="text"
                      value={merchantWallet}
                      onChange={(e) => setMerchantWallet(e.target.value)}
                      placeholder="Solana wallet address"
                      disabled={isLoggedIn}
                      className="pd-input mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="pd-label">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="pd-input"
                      />
                    </div>
                    <div>
                      <label className="pd-label">Token</label>
                      <select
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="pd-select w-full"
                      >
                        <option value="SOL">SOL</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="pd-label">Description (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this payment for?"
                      rows={2}
                      className="pd-input resize-none"
                    />
                  </div>

                  <button
                    onClick={createPaymentLink}
                    disabled={loading}
                    className="pd-button w-full"
                  >
                    {loading ? 'Creating...' : 'Create Payment Link'}
                  </button>
                </div>
              </Window>

              {/* Stats Window */}
              <Window title="Network Stats">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="pd-card">
                    <div className="pd-stat">
                      <div className="pd-stat-value">&lt;1s</div>
                      <div className="pd-stat-label">Confirmation</div>
                    </div>
                  </div>
                  <div className="pd-card">
                    <div className="pd-stat">
                      <div className="pd-stat-value">$0.0003</div>
                      <div className="pd-stat-label">Avg Fee</div>
                    </div>
                  </div>
                  <div className="pd-card">
                    <div className="pd-stat">
                      <div className="pd-stat-value" style={{ color: 'var(--pd-success)' }}>Online</div>
                      <div className="pd-stat-label">Network</div>
                    </div>
                  </div>
                  <div className="pd-card">
                    <div className="pd-stat">
                      <div className="pd-stat-value">65K</div>
                      <div className="pd-stat-label">TPS</div>
                    </div>
                  </div>
                </div>

                <div className="pd-divider"></div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Why PAYDOS?</h4>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                    <li className="flex items-center gap-2">
                      <span style={{ color: 'var(--pd-success)' }}><Icons.check /></span>
                      <span>Non-custodial - you control your funds</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span style={{ color: 'var(--pd-success)' }}><Icons.check /></span>
                      <span>No KYC required to get started</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span style={{ color: 'var(--pd-success)' }}><Icons.check /></span>
                      <span>Sub-second transaction finality</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span style={{ color: 'var(--pd-success)' }}><Icons.check /></span>
                      <span>Built on Solana for maximum speed</span>
                    </li>
                  </ul>
                </div>
              </Window>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <Window title="How It Works">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center mono font-bold text-lg" style={{ background: 'var(--pd-accent-glow)', color: 'var(--pd-accent)' }}>
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Create</h3>
                  <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                    Set amount and description. We generate a unique payment address.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center mono font-bold text-lg" style={{ background: 'var(--pd-accent-glow)', color: 'var(--pd-accent)' }}>
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Share</h3>
                  <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                    Send the payment link via any channel. QR code included.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center mono font-bold text-lg" style={{ background: 'var(--pd-accent-glow)', color: 'var(--pd-accent)' }}>
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Receive</h3>
                  <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                    Funds auto-forward to your wallet. Track in dashboard.
                  </p>
                </div>
              </div>
            </Window>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="pd-card text-center py-12 px-8" style={{ background: 'linear-gradient(135deg, var(--pd-bg-elevated), var(--pd-bg-window))', border: '1px solid var(--pd-border)' }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="mb-6" style={{ color: 'var(--pd-text-muted)' }}>
                Create your first payment link in under 30 seconds.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => router.push('/dashboard')} className="pd-button">
                  Open Dashboard
                </button>
                <button onClick={() => router.push('/whitepaper')} className="pd-button-secondary">
                  Read Documentation
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
