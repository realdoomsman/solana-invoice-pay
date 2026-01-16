'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

// Window Component
function Window({
  title,
  children,
  className = '',
  onClose,
  showControls = true
}: {
  title: string
  children: React.ReactNode
  className?: string
  onClose?: () => void
  showControls?: boolean
}) {
  return (
    <div className={`win95-window ${className}`}>
      <div className="win95-title-bar">
        <div className="flex items-center gap-1">
          <span className="text-sm">{title}</span>
        </div>
        {showControls && (
          <div className="flex gap-[2px]">
            <button className="win95-control-btn">_</button>
            <button className="win95-control-btn">□</button>
            <button className="win95-control-btn" onClick={onClose}>×</button>
          </div>
        )}
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
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
  const [showWelcome, setShowWelcome] = useState(true)

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

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--win95-cyan)' }}>
      <Header />

      {/* Desktop Area */}
      <div className="p-4 md:p-8">
        {/* Desktop Icons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--win95-blue)]/30 rounded w-[80px]"
          >
            <span className="text-4xl">📁</span>
            <span className="text-white text-xs text-center drop-shadow-[1px_1px_0_black]">My Payments</span>
          </button>
          <button
            onClick={() => router.push('/escrow')}
            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--win95-blue)]/30 rounded w-[80px]"
          >
            <span className="text-4xl">🔒</span>
            <span className="text-white text-xs text-center drop-shadow-[1px_1px_0_black]">Escrow</span>
          </button>
          <button
            onClick={() => router.push('/splits')}
            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--win95-blue)]/30 rounded w-[80px]"
          >
            <span className="text-4xl">📊</span>
            <span className="text-white text-xs text-center drop-shadow-[1px_1px_0_black]">Splits</span>
          </button>
          <button
            onClick={() => router.push('/crowdfunding')}
            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--win95-blue)]/30 rounded w-[80px]"
          >
            <span className="text-4xl">🎯</span>
            <span className="text-white text-xs text-center drop-shadow-[1px_1px_0_black]">Goals</span>
          </button>
        </div>

        {/* Main Windows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">

          {/* Welcome Window */}
          {showWelcome && (
            <Window
              title="Welcome to PAYDOS 95"
              className="lg:col-span-2"
              onClose={() => setShowWelcome(false)}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <span className="text-6xl">💸</span>
                  <div>
                    <h1 className="text-2xl md:text-3xl mb-2">Welcome to PAYDOS</h1>
                    <p className="text-sm mb-4">
                      The retro payment infrastructure for Solana. Create payment links,
                      escrow transactions, split payments, and fund goals - all on the fastest blockchain.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowWelcome(false)}
                        className="win95-button"
                      >
                        Get Started
                      </button>
                      <button
                        onClick={() => window.open('https://solana.com', '_blank')}
                        className="win95-button"
                      >
                        Learn About Solana
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Window>
          )}

          {/* Create Payment Window */}
          <Window title="💳 Create Payment - PAYDOS">
            <div className="p-2">
              {!isLoggedIn && (
                <div className="win95-inset p-2 mb-4">
                  <div className="flex items-start gap-2">
                    <span>ℹ️</span>
                    <div className="text-sm">
                      <p className="font-bold">Tip:</p>
                      <p>Connect your wallet to save payment links.</p>
                      <button
                        onClick={() => router.push('/login')}
                        className="text-[var(--win95-blue)] underline"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Your Wallet Address:</label>
                  <input
                    type="text"
                    value={merchantWallet}
                    onChange={(e) => setMerchantWallet(e.target.value)}
                    placeholder="Enter your Solana wallet address"
                    disabled={isLoggedIn}
                    className="win95-input w-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">Amount:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="win95-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Token:</label>
                    <select
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="win95-select w-full"
                    >
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Description (Optional):</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this payment for?"
                    rows={2}
                    className="win95-input w-full resize-none"
                  />
                </div>

                <button
                  onClick={createPaymentLink}
                  disabled={loading}
                  className="win95-button w-full py-2"
                >
                  {loading ? '⏳ Creating...' : '✨ Create Payment Link'}
                </button>

                <div className="win95-divider"></div>

                <p className="text-sm text-center">Or choose a payment type:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push('/create/split')}
                    className="win95-button text-sm py-2"
                  >
                    📊 Split
                  </button>
                  <button
                    onClick={() => router.push('/create/escrow')}
                    className="win95-button text-sm py-2"
                  >
                    🔒 Escrow
                  </button>
                  <button
                    onClick={() => router.push('/create/goal')}
                    className="win95-button text-sm py-2"
                  >
                    🎯 Goal
                  </button>
                </div>
              </div>
            </div>
          </Window>

          {/* Features Window */}
          <Window title="📋 Features - README.txt">
            <div className="win95-inset p-3 h-[300px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {`PAYDOS v1.0 - Payment Infrastructure for Solana
================================================

FEATURES:
---------
🔒 ESCROW
   Trustless P2P transactions. Both 
   parties deposit into escrow. Auto
   release on mutual confirmation.

📊 SPLITS  
   Multi-recipient distribution. Set
   percentages. Instant settlement.

🎯 FUNDING GOALS
   Crowdfunding with transparency.
   Real-time tracking. Auto refunds.

💳 SIMPLE PAYMENTS
   Create payment links in seconds.
   Share via any channel.

STATS:
------
⚡ <1s    - Average confirmation
💰 $0.0003 - Average transaction fee
🔒 100%   - Non-custodial

REQUIREMENTS:
-------------
- Solana Wallet (Phantom, Solflare)
- SOL for transaction fees

Press F1 for help...`}
              </pre>
            </div>
          </Window>

          {/* How It Works Window */}
          <Window title="❓ How It Works - HELP.exe" className="lg:col-span-2">
            <div className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="win95-inset p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">1️⃣</span>
                    <span className="font-bold">Create Your Link</span>
                  </div>
                  <p className="text-sm">
                    Enter amount and description. We generate a unique payment wallet.
                  </p>
                </div>
                <div className="win95-inset p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">2️⃣</span>
                    <span className="font-bold">Share with Customer</span>
                  </div>
                  <p className="text-sm">
                    Send via email, text, or social. They scan QR or connect wallet.
                  </p>
                </div>
                <div className="win95-inset p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">3️⃣</span>
                    <span className="font-bold">Get Paid Instantly</span>
                  </div>
                  <p className="text-sm">
                    Funds auto-forward to your wallet. Track in dashboard.
                  </p>
                </div>
              </div>
            </div>
          </Window>

          {/* Use Cases Window */}
          <Window title="💼 Use Cases - ABOUT.txt">
            <div className="win95-inset p-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>✅</span>
                  <span><strong>Freelancers</strong> - Invoice clients in crypto</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✅</span>
                  <span><strong>Online Stores</strong> - Accept crypto payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✅</span>
                  <span><strong>Creators</strong> - Receive tips & donations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✅</span>
                  <span><strong>Teams</strong> - Split revenue automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✅</span>
                  <span><strong>P2P Trades</strong> - Secure escrow transactions</span>
                </li>
              </ul>
            </div>
          </Window>

          {/* Stats Window */}
          <Window title="📈 System Monitor - STATS.exe">
            <div className="grid grid-cols-2 gap-2 p-2">
              <div className="win95-inset p-3 text-center">
                <div className="text-2xl font-bold text-[var(--win95-blue)]">&lt;1s</div>
                <div className="text-xs">Confirmation Time</div>
              </div>
              <div className="win95-inset p-3 text-center">
                <div className="text-2xl font-bold text-[var(--win95-blue)]">$0.0003</div>
                <div className="text-xs">Avg Tx Fee</div>
              </div>
              <div className="win95-inset p-3 text-center">
                <div className="text-2xl font-bold text-green-700">ONLINE</div>
                <div className="text-xs">Network Status</div>
              </div>
              <div className="win95-inset p-3 text-center">
                <div className="text-2xl font-bold text-[var(--win95-blue)]">65,000</div>
                <div className="text-xs">TPS Capacity</div>
              </div>
            </div>

            {/* Fake Progress Bar */}
            <div className="p-2">
              <p className="text-xs mb-1">Network Load:</p>
              <div className="win95-progress">
                <div className="win95-progress-bar" style={{ width: '35%' }}></div>
              </div>
            </div>
          </Window>
        </div>
      </div>

      <Footer />
    </div>
  )
}
