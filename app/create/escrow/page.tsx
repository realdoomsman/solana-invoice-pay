'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { generatePaymentWallet } from '@/lib/payment-wallet'
import { getCurrentUser } from '@/lib/auth'
import { Milestone } from '@/lib/types'

export default function CreateEscrowPayment() {
  const router = useRouter()
  const [user, setUser] = useState<{ walletAddress: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [merchantWallet, setMerchantWallet] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: nanoid(6), description: '', percentage: 100, status: 'pending' }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setMerchantWallet(currentUser.walletAddress)
    }
  }, [])

  const addMilestone = () => {
    setMilestones([...milestones, { id: nanoid(6), description: '', percentage: 0, status: 'pending' }])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const updateMilestone = (index: number, field: string, value: string | number) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
  }

  const getTotalPercentage = () => {
    return milestones.reduce((sum, m) => sum + Number(m.percentage), 0)
  }

  const createPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!merchantWallet) {
      alert('Please enter your wallet address')
      return
    }

    const total = getTotalPercentage()
    if (total !== 100) {
      alert(`Milestone percentages must equal 100% (currently ${total}%)`)
      return
    }

    if (milestones.some(m => !m.description)) {
      alert('Please fill in all milestone descriptions')
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
      type: 'escrow',
      escrowEnabled: true,
      milestones,
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
            Escrow Payment
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Release funds in milestones as work is completed
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm disabled:opacity-60"
              />
            </div>

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
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project or service"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Milestones */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Payment Milestones
                </label>
                <span className={`text-sm font-semibold ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {getTotalPercentage()}%
                </span>
              </div>
              
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Milestone description"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="%"
                      value={milestone.percentage}
                      onChange={(e) => updateMilestone(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    />
                    {milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(index)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addMilestone}
                className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Add Milestone
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={createPayment}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Escrow Payment Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
