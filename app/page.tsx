'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'
import Footer from '@/components/Footer'
import AIAssistant from '@/components/AIAssistant'

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
      alert('Please enter a valid amount')
      return
    }

    if (!merchantWallet || merchantWallet.length < 32) {
      alert('Please enter a valid Solana wallet address')
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

      // Save to localStorage
      const payments = JSON.parse(localStorage.getItem('payments') || '[]')
      payments.push(paymentData)
      localStorage.setItem('payments', JSON.stringify(payments))

      router.push(`/pay/${paymentId}`)
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Failed to create payment link. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-black to-black">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-32 relative z-10">
          <div className="text-center mb-20">
            {/* Logo/Brand */}
            <div className="mb-8">
              <h1 className="text-7xl md:text-9xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                NOVIQ
              </h1>
              <p className="text-slate-400 text-lg tracking-[0.3em] uppercase font-light">
                Payment Infrastructure
              </p>
            </div>
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-sm rounded-full mb-12 border border-green-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">Mainnet Live</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Enterprise-Grade Crypto<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Payment Infrastructure</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Lightning-fast settlements. AI-powered insights. Institutional-grade security.<br />Built on Solana for the future of finance.
            </p>
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-12">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">&lt;1s</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider">Settlement</div>
              </div>
              <div className="text-center border-x border-slate-800">
                <div className="text-5xl font-black text-white mb-2">$0.0003</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider">Avg Fee</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">99.9%</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider">Uptime</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Lightning Fast</h3>
              <p className="text-slate-400 leading-relaxed">Sub-second confirmations. Instant settlements. No waiting.</p>
            </div>
            <div className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Enterprise Security</h3>
              <p className="text-slate-400 leading-relaxed">Non-custodial. Encrypted. Audited. Bank-grade protection.</p>
            </div>
            <div className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 hover:border-green-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">AI-Powered</h3>
              <p className="text-slate-400 leading-relaxed">Smart insights. Fraud detection. Automated optimization.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Section */}
      <div className="bg-gradient-to-b from-black via-slate-900 to-black py-24 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 mb-6">
              <span className="text-purple-400 font-semibold text-sm">$NOVIQ TOKEN</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Lock Tokens, Reduce Fees
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Lock $NOVIQ tokens to slash platform fees and earn from revenue distribution. Simple, powerful, profitable.
            </p>
          </div>

          {/* Fee Tiers */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-center">
              <div className="text-sm text-slate-500 mb-2">No Tokens</div>
              <div className="text-4xl font-black text-red-400 mb-2">3%</div>
              <div className="text-xs text-slate-600">Platform Fee</div>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-blue-500/30 text-center">
              <div className="text-sm text-blue-400 mb-2">Lock 500K</div>
              <div className="text-4xl font-black text-blue-400 mb-2">2%</div>
              <div className="text-xs text-slate-600">33% Savings</div>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-purple-500/30 text-center">
              <div className="text-sm text-purple-400 mb-2">Lock 1M</div>
              <div className="text-4xl font-black text-purple-400 mb-2">1%</div>
              <div className="text-xs text-slate-600">66% Savings</div>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-green-500/30 text-center">
              <div className="text-sm text-green-400 mb-2">Lock 10M</div>
              <div className="text-4xl font-black text-green-400 mb-2">0.25%</div>
              <div className="text-xs text-slate-600">92% Savings</div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Massive Fee Reduction</h3>
                  <p className="text-slate-400">Lock tokens to reduce fees from 3% down to 0.25%. Process $100K/month? Save $2,750/month.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Revenue Distribution</h3>
                  <p className="text-slate-400">15% of platform fees distributed to locked token holders. Earn passive income proportional to your lock.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-sm text-slate-500 mb-2">Total Supply</div>
                <div className="text-3xl font-bold text-white">1B $NOVIQ</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-sm text-slate-500 mb-2">Liquidity</div>
                <div className="text-3xl font-bold text-white">100% Burned</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-2">Launch</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16 bg-black">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Form */}
          <div>
            <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 sticky top-8 border border-slate-800">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Create Payment
                </h2>
                <p className="text-slate-400">Generate a payment link in seconds</p>
              </div>

              <div className="space-y-5">
                {!isLoggedIn && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Want to save your payment links?
                        </p>
                        <button
                          onClick={() => router.push('/login')}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          Sign in with your wallet
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Your Wallet Address
                    </label>
                    {isLoggedIn && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={merchantWallet}
                    onChange={(e) => setMerchantWallet(e.target.value)}
                    placeholder="Enter your Solana wallet address"
                    disabled={isLoggedIn}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Payments will be forwarded to this address
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Token
                    </label>
                    <select
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this payment for?"
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <button
                  onClick={createPaymentLink}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Payment Link'
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">
                      or choose advanced options
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => router.push('/create/split')}
                    className="group px-4 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:text-white rounded-xl font-semibold transition-all transform hover:scale-105"
                  >
                    <div className="text-sm">Split</div>
                  </button>
                  <button
                    onClick={() => router.push('/create/escrow')}
                    className="group px-4 py-3 border-2 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:text-white rounded-xl font-semibold transition-all transform hover:scale-105"
                  >
                    <div className="text-sm">Escrow</div>
                  </button>
                  <button
                    onClick={() => router.push('/create/goal')}
                    className="group px-4 py-3 border-2 border-green-600 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:text-white rounded-xl font-semibold transition-all transform hover:scale-105"
                  >
                    <div className="text-sm">Goal</div>
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
                >
                  View Dashboard →
                </button>
              </div>
            </div>
          </div>

          {/* Right: How it Works */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                How It Works
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      Create Your Link
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Enter the amount and description. We generate a unique payment wallet for this transaction.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      Share with Customer
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Send the payment link via email, text, or social media. They can scan the QR code or connect their wallet.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      Get Paid Instantly
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Once payment is received, funds automatically forward to your merchant wallet. Track everything in your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Perfect For:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>Freelancers</strong> - Invoice clients and get paid in crypto
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>Online Stores</strong> - Accept crypto payments for products
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>Content Creators</strong> - Receive tips and donations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>Service Providers</strong> - Get paid for consulting, coaching, etc.
                  </span>
                </li>
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  &lt;1s
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Average confirmation time
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  $0.00025
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Average transaction fee
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-1 text-sm">
                    Do customers need a wallet?
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Yes, customers need a Solana wallet like Phantom or Solflare to send payment. They can either scan the QR code or connect their wallet directly.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-1 text-sm">
                    How does auto-forwarding work?
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Each payment link creates a temporary wallet. Once payment is received, funds automatically forward to your configured merchant wallet.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-1 text-sm">
                    What tokens are supported?
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Currently SOL is fully supported. USDC and USDT support coming soon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* AI Assistant */}
      <AIAssistant
        onSuggestion={(data) => {
          if (data.type === 'description') {
            setDescription(data.value)
          } else if (data.type === 'amount') {
            setAmount(data.value.toString())
          }
        }}
      />
    </div>
  )
}
