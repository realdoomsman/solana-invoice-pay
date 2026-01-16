'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

// Icons - all SVG, no emojis
const Icons = {
  lock: (props: { size?: number }) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  chart: (props: { size?: number }) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  target: (props: { size?: number }) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  card: (props: { size?: number }) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  zap: (props: { size?: number }) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  shield: (props: { size?: number }) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  arrow: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
}

// Window component
function Window({
  title,
  children,
  className = '',
  tabs,
  activeTab,
  onTabChange,
}: {
  title?: string
  children: React.ReactNode
  className?: string
  tabs?: { id: string; label: string }[]
  activeTab?: string
  onTabChange?: (id: string) => void
}) {
  return (
    <div className={`window ${className}`}>
      <div className="window-header">
        <div className="traffic-lights">
          <span className="traffic-light traffic-light-red"></span>
          <span className="traffic-light traffic-light-yellow"></span>
          <span className="traffic-light traffic-light-green"></span>
        </div>

        {tabs ? (
          <div className="flex-1 flex justify-center">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-base)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span className="window-title">{title}</span>
        )}

        <div style={{ width: '54px' }}></div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// Sidebar Item
function SidebarButton({
  label,
  icon: Icon,
  active,
  onClick,
  color,
}: {
  label: string
  icon: (props: { size?: number }) => JSX.Element
  active?: boolean
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
        ? 'bg-[var(--bg-elevated)] shadow-lg'
        : 'hover:bg-[var(--bg-subtle)]'
        }`}
      style={active ? { borderLeft: `3px solid ${color}` } : {}}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: active ? color : 'var(--bg-muted)' }}
      >
        <div style={{ color: active ? 'white' : 'var(--text-muted)' }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-left">
        <div className={`text-sm font-medium ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
          {label}
        </div>
      </div>
    </button>
  )
}

export default function Home() {
  const router = useRouter()
  const [activeApp, setActiveApp] = useState('payment')
  const [activeTab, setActiveTab] = useState('create')
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
      toast.error('Please enter a valid wallet address')
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
      toast.error('Failed to create payment link')
      setLoading(false)
    }
  }

  const apps = [
    { id: 'payment', label: 'Payment', icon: Icons.card, color: '#f97316', href: null },
    { id: 'escrow', label: 'Escrow', icon: Icons.lock, color: '#3b82f6', href: '/escrow' },
    { id: 'splits', label: 'Splits', icon: Icons.chart, color: '#8b5cf6', href: '/splits' },
    { id: 'goals', label: 'Goals', icon: Icons.target, color: '#22c55e', href: '/crowdfunding' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header />

      <main className="pt-12 pb-20">
        {/* Hero */}
        <section className="px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6 glass">
              <div className="status-dot status-online"></div>
              <span style={{ color: 'var(--text-muted)' }}>Connected to Solana Mainnet</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">
              Payment Infrastructure
              <br />
              <span className="gradient-text">for Solana</span>
            </h1>

            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Create payment links, escrow transactions, splits, and crowdfunding campaigns.
              Non-custodial, instant, and secure.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-primary"
              >
                <Icons.plus />
                Create Payment
              </button>
              <button
                onClick={() => router.push('/whitepaper')}
                className="btn btn-secondary"
              >
                Documentation
              </button>
            </div>
          </div>
        </section>

        {/* Main App Interface */}
        <section className="px-4" id="app">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="window p-3">
                  <div className="space-y-1">
                    {apps.map((app) => (
                      <SidebarButton
                        key={app.id}
                        label={app.label}
                        icon={app.icon}
                        color={app.color}
                        active={activeApp === app.id}
                        onClick={() => {
                          if (app.href) {
                            router.push(app.href)
                          } else {
                            setActiveApp(app.id)
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <Window
                  tabs={[
                    { id: 'create', label: 'Create' },
                    { id: 'recent', label: 'Recent' },
                    { id: 'settings', label: 'Settings' },
                  ]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                >
                  {activeTab === 'create' && (
                    <div className="space-y-5">
                      {!isLoggedIn && (
                        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--accent-muted)' }}>
                          <div style={{ color: 'var(--accent)' }}><Icons.info /></div>
                          <div className="text-sm">
                            <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>Connect Wallet</p>
                            <p style={{ color: 'var(--text-muted)' }}>Connect your wallet to save and track payments.</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="label">Recipient Address</label>
                        <input
                          type="text"
                          value={merchantWallet}
                          onChange={(e) => setMerchantWallet(e.target.value)}
                          placeholder="Solana wallet address"
                          disabled={isLoggedIn}
                          className="input mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="label">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Token</label>
                          <select
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="select w-full"
                          >
                            <option value="SOL">SOL</option>
                            <option value="USDC">USDC</option>
                            <option value="USDT">USDT</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="label">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Optional note"
                          rows={3}
                          className="input textarea"
                        />
                      </div>

                      <button
                        onClick={createPaymentLink}
                        disabled={loading}
                        className="btn btn-primary w-full justify-center"
                      >
                        {loading ? 'Creating...' : 'Create Payment Link'}
                      </button>
                    </div>
                  )}

                  {activeTab === 'recent' && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
                        <Icons.card size={28} />
                      </div>
                      <h3 className="font-medium mb-2">No Recent Payments</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Create your first payment to get started
                      </p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="btn btn-secondary mt-4"
                      >
                        Create Payment
                      </button>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                        <div>
                          <p className="font-medium text-sm">Default Token</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Token used for new payments</p>
                        </div>
                        <select className="select" defaultValue="SOL">
                          <option value="SOL">SOL</option>
                          <option value="USDC">USDC</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                        <div>
                          <p className="font-medium text-sm">Notifications</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email when payment received</p>
                        </div>
                        <button className="btn btn-secondary text-xs px-4 h-8">Enable</button>
                      </div>
                    </div>
                  )}
                </Window>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { value: '<1s', label: 'Confirmation', color: 'var(--accent)' },
                { value: '$0.0003', label: 'Avg Fee', color: 'var(--accent)' },
                { value: 'Online', label: 'Network', color: 'var(--success)' },
                { value: '65K', label: 'TPS', color: 'var(--accent)' },
              ].map((stat, i) => (
                <div key={i} className="card glow">
                  <div className="card-body text-center">
                    <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[
                { icon: Icons.zap, title: 'Instant Settlement', desc: 'Sub-second transaction finality' },
                { icon: Icons.shield, title: 'Non-Custodial', desc: 'Full control of your funds' },
                { icon: Icons.lock, title: 'Trustless Escrow', desc: 'Smart contract security' },
              ].map((feature, i) => (
                <div key={i} className="card glow">
                  <div className="card-body text-center">
                    <div className="feature-icon mx-auto">
                      <feature.icon size={22} />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Why PayOS */}
            <div className="window mt-6">
              <div className="window-header">
                <div className="traffic-lights">
                  <span className="traffic-light traffic-light-red"></span>
                  <span className="traffic-light traffic-light-yellow"></span>
                  <span className="traffic-light traffic-light-green"></span>
                </div>
                <span className="window-title">Why PayOS</span>
                <div style={{ width: '54px' }}></div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Non-custodial — you control your funds',
                    'No KYC required to get started',
                    'Sub-second transaction finality',
                    'Built on Solana for speed',
                  ].map((item, i) => (
                    <div key={i} className="check-item">
                      <span className="check-icon"><Icons.check /></span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
