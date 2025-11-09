'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'

export default function CreateNFTPayment() {
  const router = useRouter()
  const [user, setUser] = useState<{ walletAddress: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [merchantWallet, setMerchantWallet] = useState('')
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setMerchantWallet(currentUser.walletAddress)
    }
  }, [])

  const createPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!merchantWallet) {
      alert('Please enter your wallet address')
      return
    }

    if (!nftName) {
      alert('Please enter an NFT name')
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
      merchantWallet,
      type: 'simple',
      mintNFT: true,
      nftName,
      nftDescription: nftDescription || description,
      nftMinted: false,
    }

    const payments = JSON.parse(localStorage.getItem('payments') || '[]')
    payments.push(paymentData)
    localStorage.setItem('payments', JSON.stringify(payments))

    router.push(`/pay/${paymentId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            Back
          </button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Payment with NFT Receipt
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create a collectible NFT as proof of payment
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Your Wallet Address
              </label>
              <input
                type="text"
                value={merchantWallet}
                onChange={(e) => setMerchantWallet(e.target.value)}
                placeholder="Enter your Solana wallet address"
                disabled={!!user}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm disabled:opacity-60"
              />
            </div>

            {/* Amount and Token */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Token
                </label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            {/* Payment Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this payment for?"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* NFT Details */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                NFT Receipt Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    NFT Name
                  </label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    placeholder="e.g., Premium Membership Receipt, Event Ticket #001"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    NFT Description (Optional)
                  </label>
                  <textarea
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    placeholder="Additional details about this NFT receipt"
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">
                NFT Receipt Benefits:
              </h3>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Permanent proof of payment on blockchain</li>
                <li>• Collectible and tradeable</li>
                <li>• Can include perks or access rights</li>
                <li>• Perfect for event tickets, memberships, or special purchases</li>
              </ul>
            </div>

            {/* Create Button */}
            <button
              onClick={createPayment}
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Payment with NFT Receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
