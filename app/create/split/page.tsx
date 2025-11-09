'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'
import { SplitRecipient } from '@/lib/types'

export default function CreateSplitPayment() {
  const router = useRouter()
  const [user, setUser] = useState<{ walletAddress: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [splitRecipients, setSplitRecipients] = useState<SplitRecipient[]>([
    { address: '', percentage: 100, name: '' }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setSplitRecipients([{ address: currentUser.walletAddress, percentage: 100, name: 'You' }])
    }
  }, [])

  const addRecipient = () => {
    setSplitRecipients([...splitRecipients, { address: '', percentage: 0, name: '' }])
  }

  const removeRecipient = (index: number) => {
    setSplitRecipients(splitRecipients.filter((_, i) => i !== index))
  }

  const updateRecipient = (index: number, field: keyof SplitRecipient, value: string | number) => {
    const updated = [...splitRecipients]
    updated[index] = { ...updated[index], [field]: value }
    setSplitRecipients(updated)
  }

  const getTotalPercentage = () => {
    return splitRecipients.reduce((sum, r) => sum + Number(r.percentage), 0)
  }

  const createPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const total = getTotalPercentage()
    if (total !== 100) {
      alert(`Split percentages must equal 100% (currently ${total}%)`)
      return
    }

    if (splitRecipients.some(r => !r.address)) {
      alert('Please fill in all recipient addresses')
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
      merchantWallet: splitRecipients[0].address,
      type: 'split',
      splitRecipients,
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
            Split Payment
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Divide one payment between multiple recipients
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Amount and Token */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Token
                </label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this payment for?"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Recipients */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recipients
                </label>
                <span className={`text-sm font-semibold ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {getTotalPercentage()}%
                </span>
              </div>
              
              <div className="space-y-3">
                {splitRecipients.map((recipient, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Wallet address"
                      value={recipient.address}
                      onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={recipient.name}
                      onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="%"
                      value={recipient.percentage}
                      onChange={(e) => updateRecipient(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    />
                    {splitRecipients.length > 1 && (
                      <button
                        onClick={() => removeRecipient(index)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addRecipient}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Add Recipient
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={createPayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Split Payment Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
