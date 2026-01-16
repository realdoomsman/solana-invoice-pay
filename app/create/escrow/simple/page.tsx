'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { Milestone } from '@/lib/types'
import MultiSigWalletBadge from '@/components/MultiSigWalletBadge'
import FeeInfo from '@/components/FeeInfo'

export default function CreateSimpleBuyerEscrow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const escrowType = searchParams.get('type') || 'simple_buyer'
  const [user, setUser] = useState<{ walletAddress: string } | null>(null)
  const [buyerWallet, setBuyerWallet] = useState('')
  const [sellerWallet, setSellerWallet] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: nanoid(6), description: '', percentage: 100, status: 'pending' }
  ])
  const [loading, setLoading] = useState(false)
  const [showBuyerMultiSig, setShowBuyerMultiSig] = useState(false)
  const [showSellerMultiSig, setShowSellerMultiSig] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setBuyerWallet(currentUser.walletAddress)
    }
    
    // Validate that we're on the correct page for the escrow type
    if (escrowType !== 'simple_buyer') {
      toast.error('Invalid escrow type for this page')
      router.push('/create/escrow/select')
    }
  }, [escrowType, router])

  const addMilestone = () => {
    const remaining = 100 - getTotalPercentage()
    const suggestedPercentage = remaining > 0 ? remaining : 0
    setMilestones([...milestones, { 
      id: nanoid(6), 
      description: '', 
      percentage: suggestedPercentage, 
      status: 'pending' 
    }])
  }

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index))
    } else {
      toast.error('You must have at least one milestone')
    }
  }

  const updateMilestone = (index: number, field: string, value: string | number) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
  }

  const getTotalPercentage = () => {
    return milestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0)
  }

  const getRemainingPercentage = () => {
    return 100 - getTotalPercentage()
  }

  const distributeEvenly = () => {
    const evenPercentage = parseFloat((100 / milestones.length).toFixed(2))
    let total = evenPercentage * milestones.length
    
    const updated = milestones.map((m, index) => {
      // Adjust last milestone to account for rounding
      if (index === milestones.length - 1) {
        return { ...m, percentage: parseFloat((100 - (evenPercentage * (milestones.length - 1))).toFixed(2)) }
      }
      return { ...m, percentage: evenPercentage }
    })
    
    setMilestones(updated)
    toast.success('Percentages distributed evenly')
  }

  const autoFillRemaining = (index: number) => {
    const remaining = getRemainingPercentage()
    if (remaining > 0) {
      updateMilestone(index, 'percentage', parseFloat(remaining.toFixed(2)))
      toast.success(`Set to remaining ${remaining.toFixed(2)}%`)
    }
  }

  const createEscrow = async () => {
    if (!buyerWallet || !sellerWallet) {
      toast.error('Please enter both buyer and seller wallet addresses')
      return
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error('Please enter a valid total amount')
      return
    }

    const total = getTotalPercentage()
    if (total !== 100) {
      toast.error(`Milestone percentages must equal 100% (currently ${total}%)`)
      return
    }

    if (milestones.some(m => !m.description)) {
      toast.error('Please fill in all milestone descriptions')
      return
    }

    const loadingToast = toast.loading('Creating milestone escrow...')
    setLoading(true)

    try {
      // TODO: Implement actual escrow creation
      // Pass escrow type to API
      const escrowData = {
        escrowType: 'simple_buyer',
        buyerWallet,
        sellerWallet,
        totalAmount: parseFloat(totalAmount),
        token,
        description,
        milestones: milestones.map((m, index) => ({
          ...m,
          order: index + 1,
          amount: (parseFloat(totalAmount) * m.percentage) / 100
        }))
      }
      
      console.log('Creating milestone escrow:', escrowData)
      
      toast.success('Milestone escrow created!', { id: loadingToast })
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating escrow:', error)
      toast.error(`Failed to create escrow: ${error.message}`, { id: loadingToast })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/create/escrow/select')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Escrow Types
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Milestone Escrow
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Release funds in milestones as work is completed
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Buyer Wallet */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Buyer Wallet (who pays)
              </label>
              <input
                type="text"
                value={buyerWallet}
                onChange={(e) => {
                  setBuyerWallet(e.target.value)
                  setShowBuyerMultiSig(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(e.target.value))
                }}
                placeholder="Buyer's Solana wallet address"
                disabled={!!user}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm disabled:opacity-60"
              />
              {showBuyerMultiSig && buyerWallet && (
                <div className="mt-2">
                  <MultiSigWalletBadge 
                    walletAddress={buyerWallet} 
                    showDetails={true}
                  />
                </div>
              )}
            </div>

            {/* Seller Wallet */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Seller Wallet (who receives)
              </label>
              <input
                type="text"
                value={sellerWallet}
                onChange={(e) => {
                  setSellerWallet(e.target.value)
                  setShowSellerMultiSig(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(e.target.value))
                }}
                placeholder="Seller's Solana wallet address"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
              />
              {showSellerMultiSig && sellerWallet && (
                <div className="mt-2">
                  <MultiSigWalletBadge 
                    walletAddress={sellerWallet} 
                    showDetails={true}
                  />
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total Project Amount
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <select
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Milestones */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Payment Milestones
                </label>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    getTotalPercentage() === 100 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : getTotalPercentage() > 100
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {getTotalPercentage() === 100 ? '✓ ' : ''}
                    Total: {getTotalPercentage().toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Percentage Calculator Summary */}
              <div className={`mb-4 p-3 rounded-lg border-2 ${
                getTotalPercentage() === 100
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : getTotalPercentage() > 100
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {getTotalPercentage() === 100 ? '✓' : getTotalPercentage() > 100 ? '!' : '%'}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${
                        getTotalPercentage() === 100
                          ? 'text-green-800 dark:text-green-200'
                          : getTotalPercentage() > 100
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {getTotalPercentage() === 100 
                          ? 'Perfect! All milestones add up to 100%'
                          : getTotalPercentage() > 100
                          ? `Over by ${(getTotalPercentage() - 100).toFixed(1)}%`
                          : `Remaining: ${getRemainingPercentage().toFixed(1)}%`
                        }
                      </p>
                      {totalAmount && getTotalPercentage() !== 100 && (
                        <p className={`text-xs ${
                          getTotalPercentage() > 100
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {getTotalPercentage() > 100
                            ? `Reduce by ${((parseFloat(totalAmount) * (getTotalPercentage() - 100)) / 100).toFixed(2)} ${token}`
                            : `${((parseFloat(totalAmount) * getRemainingPercentage()) / 100).toFixed(2)} ${token} unallocated`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  {milestones.length > 1 && getTotalPercentage() !== 100 && (
                    <button
                      onClick={distributeEvenly}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium"
                    >
                      Distribute Evenly
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Milestone Description
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Initial design mockups"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Payment Percentage
                          </label>
                          <div className="flex gap-2 items-center flex-wrap">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                value={milestone.percentage || ''}
                                onChange={(e) => updateMilestone(index, 'percentage', parseFloat(e.target.value) || 0)}
                                className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                              />
                              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">%</span>
                            </div>
                            {getRemainingPercentage() > 0 && milestone.percentage !== getRemainingPercentage() && (
                              <button
                                onClick={() => autoFillRemaining(index)}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                title={`Set to remaining ${getRemainingPercentage().toFixed(1)}%`}
                              >
                                Use remaining {getRemainingPercentage().toFixed(1)}%
                              </button>
                            )}
                            {totalAmount && milestone.percentage > 0 && (
                              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                                = {((parseFloat(totalAmount) * milestone.percentage) / 100).toFixed(2)} {token}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMilestone(index)}
                        disabled={milestones.length === 1}
                        className="flex-shrink-0 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={milestones.length === 1 ? "Cannot remove last milestone" : "Remove milestone"}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={addMilestone}
                className="mt-3 w-full py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span>
                Add Another Milestone
                {getRemainingPercentage() > 0 && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded">
                    {getRemainingPercentage().toFixed(1)}% remaining
                  </span>
                )}
              </button>

              {/* Validation Messages */}
              {milestones.length > 0 && (
                <div className="mt-3 space-y-2">
                  {milestones.some(m => !m.description) && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        All milestones need descriptions
                      </p>
                    </div>
                  )}
                  {milestones.some(m => m.percentage <= 0) && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        All milestones need a percentage greater than 0%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fee Information */}
            {totalAmount && parseFloat(totalAmount) > 0 && (
              <FeeInfo
                amount={parseFloat(totalAmount)}
                token={token}
                escrowType="simple_buyer"
                showBreakdown={true}
              />
            )}

            {/* Info Box */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                How Milestone Escrow Works:
              </h4>
              <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-decimal list-inside">
                <li>Buyer deposits full amount into escrow</li>
                <li>Seller completes work and submits milestone</li>
                <li>Buyer reviews and approves milestone</li>
                <li>Funds for that milestone release to seller</li>
                <li>Repeat for each milestone</li>
              </ol>
            </div>

            {/* Create Button */}
            <button
              onClick={createEscrow}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Milestone Escrow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
