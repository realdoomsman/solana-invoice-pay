'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { generatePaymentWallet } from '@/lib/payment-wallet'

export default function Home() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const createPaymentLink = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)

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
    }

    const payments = JSON.parse(localStorage.getItem('payments') || '[]')
    payments.push(paymentData)
    localStorage.setItem('payments', JSON.stringify(payments))

    router.push(`/pay/${paymentId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="text-sm font-semibold">⚡ Powered by Solana</span>
            </div>
            <h1 className="text-6xl font-bold mb-6">
              Get Paid in Crypto,<br />Instantly
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Create payment links in seconds. Accept SOL, USDC, and more. No chargebacks, no middlemen, just instant crypto payments.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Settlement</h3>
              <p className="text-blue-100 text-sm">Payments confirm in seconds on Solana. No waiting days for funds to clear.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Trackable</h3>
              <p className="text-blue-100 text-sm">Each payment gets a unique wallet. Auto-forwards to your address with full transparency.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Low Fees</h3>
              <p className="text-blue-100 text-sm">Solana's ultra-low transaction fees mean you keep more of what you earn.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Form */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 sticky top-8">
              <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">
                Create Payment Link
              </h2>

              <div className="space-y-5">
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Payment Link'}
                </button>
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
    </div>
  )
}
