'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js'
import { QRCodeSVG } from 'qrcode.react'
import { getEscrowByPaymentId, getEscrowMilestones, getEscrowActions, markEscrowFunded, EscrowContract, EscrowMilestone, EscrowAction } from '@/lib/escrow'

interface PaymentData {
  id: string
  amount: number
  token: string
  description: string
  status: string
  createdAt: string
  paymentWallet: string
  merchantWallet: string
  txSignature?: string
  type?: 'simple' | 'split' | 'escrow' | 'goal'
  splitRecipients?: any[]
  mintNFT?: boolean
  isGoal?: boolean
  goalAmount?: number
  currentAmount?: number
  escrowEnabled?: boolean
  milestones?: any[]
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey, sendTransaction } = useWallet()
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [checking, setChecking] = useState(false)
  const [balance, setBalance] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'address' | 'wallet'>('address')
  const [processing, setProcessing] = useState(false)
  
  // Escrow state
  const [escrow, setEscrow] = useState<EscrowContract | null>(null)
  const [milestones, setMilestones] = useState<EscrowMilestone[]>([])
  const [actions, setActions] = useState<EscrowAction[]>([])
  const [submittingMilestone, setSubmittingMilestone] = useState<string | null>(null)
  const [approvingMilestone, setApprovingMilestone] = useState<string | null>(null)
  const [releasingMilestone, setReleasingMilestone] = useState<string | null>(null)

  useEffect(() => {
    const payments = JSON.parse(localStorage.getItem('payments') || '[]')
    const found = payments.find((p: PaymentData) => p.id === params.id)
    if (found) {
      // Redirect to escrow management page if this is an escrow payment
      if (found.type === 'escrow' && found.status !== 'pending') {
        router.push(`/escrow/${params.id}`)
        return
      }
      
      setPayment(found)
      if (found.status === 'pending') {
        startBalanceCheck(found)
      }
      // Load escrow data if this is an escrow payment
      if (found.type === 'escrow') {
        loadEscrowData(found.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadEscrowData = async (paymentId: string) => {
    try {
      const escrowData = await getEscrowByPaymentId(paymentId)
      if (escrowData) {
        setEscrow(escrowData)
        const milestonesData = await getEscrowMilestones(escrowData.id)
        setMilestones(milestonesData)
        const actionsData = await getEscrowActions(escrowData.id)
        setActions(actionsData)
      }
    } catch (error) {
      console.error('Error loading escrow data:', error)
    }
  }

  const startBalanceCheck = async (paymentData: PaymentData) => {
    setChecking(true)
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    const endpoint = rpcUrl || (
      network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : `https://api.${network}.solana.com`
    )

    const connection = new Connection(endpoint, 'confirmed')
    const paymentPubkey = new PublicKey(paymentData.paymentWallet)

    const interval = setInterval(async () => {
      try {
        const balance = await connection.getBalance(paymentPubkey)
        const solBalance = balance / LAMPORTS_PER_SOL
        console.log(`[Balance Check] Wallet: ${paymentPubkey.toString()}, Balance: ${solBalance} SOL, Expected: ${paymentData.amount} SOL`)
        setBalance(solBalance)

        if (solBalance >= paymentData.amount) {
          console.log('[Payment Detected] Balance sufficient, starting forward...')
          clearInterval(interval)

          const payments = JSON.parse(localStorage.getItem('payments') || '[]')
          const paymentWithKey = payments.find((p: any) => p.id === paymentData.id)

          // Check if this is an escrow payment
          if (paymentData.type === 'escrow') {
            // For escrow, just mark as funded - don't forward yet
            console.log('[Escrow] Marking as funded, funds will be held in escrow')
            try {
              const escrowData = await getEscrowByPaymentId(paymentData.id)
              if (escrowData) {
                await markEscrowFunded(escrowData.id)
                const updated = payments.map((p: any) =>
                  p.id === paymentData.id ? { ...p, status: 'funded' } : p
                )
                localStorage.setItem('payments', JSON.stringify(updated))
                setPayment({ ...paymentData, status: 'funded' })
                await loadEscrowData(paymentData.id)
              }
            } catch (error) {
              console.error('Error marking escrow as funded:', error)
            }
          } else if (paymentWithKey && paymentWithKey.privateKey) {
            // Normal payment - forward immediately
            try {
              console.log('[Forward API] Calling /api/forward-payment...')
              const response = await fetch('/api/forward-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: paymentData.id,
                  privateKey: paymentWithKey.privateKey,
                  merchantWallet: paymentData.merchantWallet,
                  splitRecipients: paymentWithKey.splitRecipients,
                }),
              })
              console.log('[Forward API] Response status:', response.status)

              const result = await response.json()

              if (result.success) {
                const updated = payments.map((p: any) =>
                  p.id === paymentData.id
                    ? { ...p, status: 'paid', txSignature: result.signature }
                    : p
                )
                localStorage.setItem('payments', JSON.stringify(updated))
                setPayment({
                  ...paymentData,
                  status: 'paid',
                  txSignature: result.signature,
                })
              } else {
                console.error('Forward API error:', result.error, result.details)
                alert(`Payment forward failed: ${result.error || 'Unknown error'}. Payment ID: ${paymentData.id}`)
                setChecking(false)
              }
            } catch (error) {
              console.error('Error forwarding payment:', error)
              alert(`Payment forward failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support with payment ID: ${paymentData.id}`)
              setChecking(false)
            }
          }
        }
      } catch (error) {
        console.error('Error checking balance:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }

  const handleWalletPayment = async () => {
    if (!publicKey || !payment) return

    setProcessing(true)
    try {
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
      const endpoint = rpcUrl || (
        network === 'mainnet-beta'
          ? 'https://api.mainnet-beta.solana.com'
          : `https://api.${network}.solana.com`
      )

      const connection = new Connection(endpoint, 'confirmed')
      const paymentPubkey = new PublicKey(payment.paymentWallet)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: paymentPubkey,
          lamports: payment.amount * LAMPORTS_PER_SOL,
        })
      )

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      alert('Payment sent! Waiting for confirmation...')
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Escrow functions
  const handleSubmitMilestone = async (milestoneId: string) => {
    if (!publicKey || !escrow) return
    
    const notes = prompt('Add notes about the completed work (optional):')
    
    setSubmittingMilestone(milestoneId)
    try {
      const response = await fetch('/api/escrow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          sellerWallet: publicKey.toString(),
          notes,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert('Milestone submitted for review!')
        await loadEscrowData(payment!.id)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error submitting milestone:', error)
      alert('Failed to submit milestone')
    } finally {
      setSubmittingMilestone(null)
    }
  }

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!publicKey || !escrow) return
    
    if (!confirm('Approve this milestone and release funds to the seller?')) return
    
    const notes = prompt('Add approval notes (optional):')
    
    setApprovingMilestone(milestoneId)
    try {
      // First approve
      const approveResponse = await fetch('/api/escrow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          buyerWallet: publicKey.toString(),
          notes,
        }),
      })

      const approveResult = await approveResponse.json()
      if (!approveResult.success) {
        alert(`Error: ${approveResult.error}`)
        return
      }

      // Then auto-release funds
      setReleasingMilestone(milestoneId)
      const releaseResponse = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId }),
      })

      const releaseResult = await releaseResponse.json()
      if (releaseResult.success) {
        alert(`Milestone approved! ${releaseResult.amount} ${payment!.token} released to seller.`)
        await loadEscrowData(payment!.id)
      } else {
        alert(`Error releasing funds: ${releaseResult.error}`)
      }
    } catch (error) {
      console.error('Error approving milestone:', error)
      alert('Failed to approve milestone')
    } finally {
      setApprovingMilestone(null)
      setReleasingMilestone(null)
    }
  }

  const handleRaiseDispute = async (milestoneId: string) => {
    if (!publicKey || !escrow) return
    
    const reason = prompt('Describe the issue:')
    if (!reason) return
    
    try {
      const response = await fetch('/api/escrow/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: escrow.id,
          milestoneId,
          actorWallet: publicKey.toString(),
          reason,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert('Dispute raised. Funds are now frozen.')
        await loadEscrowData(payment!.id)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error raising dispute:', error)
      alert('Failed to raise dispute')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Pending' },
      work_submitted: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Awaiting Buyer' },
      approved: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Approved' },
      released: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Released' },
      disputed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Disputed - Admin Review' },
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-xl text-slate-600 dark:text-slate-400">Payment not found</p>
      </div>
    )
  }

  const paymentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const solanaPayUrl = `solana:${payment.paymentWallet}?amount=${payment.amount}&label=${encodeURIComponent(payment.description || 'Payment')}`
  
  // Escrow role detection
  const isBuyer = escrow && publicKey && escrow.buyer_wallet === publicKey.toString()
  const isSeller = escrow && publicKey && escrow.seller_wallet === publicKey.toString()
  const isParty = isBuyer || isSeller
  const completedMilestones = milestones.filter(m => m.status === 'released').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {payment.status === 'paid' ? (
          // Success State
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
              Payment Received!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {balance > 0 ? `${balance.toFixed(4)} SOL` : `${payment.amount} SOL`}{' '}
              received and forwarded
            </p>
            
            {/* Back to Home Button */}
            <div className="mb-6">
              <a
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                ← Back to Home
              </a>
            </div>

            <div className="space-y-2">
              <a
                href={`https://explorer.solana.com/address/${payment.paymentWallet}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View Payment Wallet →
              </a>
              {payment.txSignature && (
                <>
                  <br />
                  <a
                    href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    View Transaction →
                  </a>
                </>
              )}
            </div>
          </div>
        ) : payment.type === 'escrow' && escrow && (payment.status === 'funded' || payment.status === 'paid') ? (
          // Escrow Management Interface
          <div className="space-y-6">
            {/* Role Indicator */}
            {publicKey && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                {isBuyer && (
                  <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <span className="text-3xl">👤</span>
                    <div>
                      <div className="font-bold text-blue-900 dark:text-blue-300">You are the BUYER</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        You can approve milestones and release funds
                      </div>
                    </div>
                  </div>
                )}
                {isSeller && (
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <span className="text-3xl">🛠️</span>
                    <div>
                      <div className="font-bold text-green-900 dark:text-green-300">You are the SELLER</div>
                      <div className="text-sm text-green-700 dark:text-green-400">
                        You can submit completed work for review
                      </div>
                    </div>
                  </div>
                )}
                {!isParty && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <span className="text-3xl">👁️</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-300">You are viewing this escrow</div>
                      <div className="text-sm text-gray-700 dark:text-gray-400">
                        Only the buyer and seller can take actions
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Escrow Progress</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {completedMilestones}/{milestones.length} milestones completed
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${(completedMilestones / milestones.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Milestone {index + 1}: {milestone.description}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {milestone.amount} {payment.token} ({milestone.percentage}%)
                      </p>
                    </div>
                    {getStatusBadge(milestone.status)}
                  </div>

                  {/* Milestone Actions */}
                  {milestone.status === 'pending' && isSeller && (
                    <button
                      onClick={() => handleSubmitMilestone(milestone.id)}
                      disabled={submittingMilestone === milestone.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submittingMilestone === milestone.id ? 'Submitting...' : '✓ Submit Work for Review'}
                    </button>
                  )}

                  {milestone.status === 'work_submitted' && (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                        <p className="text-sm text-yellow-900 dark:text-yellow-300">
                          {isBuyer ? 'Seller submitted work. Review and approve to release funds.' : 'Work submitted. Waiting for buyer approval.'}
                        </p>
                        {milestone.seller_notes && (
                          <p className="text-sm mt-2 text-yellow-800 dark:text-yellow-400">
                            <strong>Notes:</strong> {milestone.seller_notes}
                          </p>
                        )}
                      </div>
                      {isBuyer && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveMilestone(milestone.id)}
                            disabled={approvingMilestone === milestone.id || releasingMilestone === milestone.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {approvingMilestone === milestone.id || releasingMilestone === milestone.id
                              ? 'Processing...'
                              : `✓ Approve & Release ${milestone.amount} ${payment.token}`}
                          </button>
                          <button
                            onClick={() => handleRaiseDispute(milestone.id)}
                            className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            ⚠️ Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {milestone.status === 'approved' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        ✓ Buyer approved! Funds are being released to seller...
                      </p>
                      {milestone.buyer_notes && (
                        <p className="text-sm mt-2 text-blue-700 dark:text-blue-400">
                          <strong>Buyer notes:</strong> {milestone.buyer_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {milestone.status === 'released' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-300">
                        ✓ Funds released on {new Date(milestone.released_at!).toLocaleDateString()}
                      </p>
                      {milestone.tx_signature && (
                        <a
                          href={`https://explorer.solana.com/tx/${milestone.tx_signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Transaction →
                        </a>
                      )}
                    </div>
                  )}

                  {milestone.status === 'disputed' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-300">
                        ⚠️ This milestone is under dispute. Funds are frozen. NOVIQ admin will review and make a decision.
                      </p>
                      <p className="text-sm mt-2 text-red-700 dark:text-red-400">
                        Both parties can submit evidence. Admin will decide to release funds to seller or refund to buyer.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Activity Timeline */}
            {actions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Activity Timeline</h3>
                <div className="space-y-3">
                  {actions.slice(0, 5).map((action, index) => (
                    <div key={action.id} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        {index < Math.min(actions.length, 5) - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="font-medium text-slate-900 dark:text-white">{action.action}</p>
                        {action.notes && (
                          <p className="text-slate-600 dark:text-slate-400">{action.notes}</p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(action.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connect Wallet Prompt */}
            {!publicKey && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Connect your wallet to manage this escrow
                </p>
                <WalletMultiButton />
              </div>
            )}
          </div>
        ) : (
          // Payment Form
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              {/* Payment Type Badge */}
              {payment.type && payment.type !== 'simple' && (
                <div className="inline-block mb-3">
                  {payment.type === 'split' && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                      Split Payment
                    </span>
                  )}
                  {payment.type === 'escrow' && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
                      Escrow Payment
                    </span>
                  )}
                  {payment.type === 'goal' && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                      Funding Goal
                    </span>
                  )}
                </div>
              )}
              
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {payment.amount} {payment.token}
              </h2>
              
              {payment.isGoal && payment.goalAmount && (
                <div className="mt-3 mb-3">
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {payment.currentAmount || 0} / {payment.goalAmount} {payment.token}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${Math.min(((payment.currentAmount || 0) / payment.goalAmount) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {payment.description && (
                <p className="text-slate-600 dark:text-slate-400">{payment.description}</p>
              )}
              
              {payment.mintNFT && (
                <div className="mt-3 inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                    Includes NFT Receipt
                  </span>
                </div>
              )}
              
              {checking && balance > 0 && (
                <div className="mt-3 inline-block px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Received: {balance.toFixed(4)} SOL
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPaymentMethod('address')}
                className={`px-4 py-2 font-medium transition-colors ${
                  paymentMethod === 'address'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Send to Address
              </button>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`px-4 py-2 font-medium transition-colors ${
                  paymentMethod === 'wallet'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Connect Wallet
              </button>
            </div>

            {paymentMethod === 'address' ? (
              // Send to Address Method
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <QRCodeSVG value={solanaPayUrl} size={200} />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Payment Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={payment.paymentWallet}
                      readOnly
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(payment.paymentWallet)
                        alert('Address copied!')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    How to pay:
                  </h3>
                  <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>1. Scan QR code with your Solana wallet</li>
                    <li>2. Or copy the address and send manually</li>
                    <li>
                      3. Send exactly {payment.amount} {payment.token}
                    </li>
                    <li>4. Payment confirms automatically</li>
                  </ol>
                </div>
              </>
            ) : (
              // Connect Wallet Method
              <div className="space-y-6">
                <div className="text-center">
                  <WalletMultiButton />
                </div>

                {publicKey && (
                  <button
                    onClick={handleWalletPayment}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing
                      ? 'Processing...'
                      : `Pay ${payment.amount} ${payment.token}`}
                  </button>
                )}

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Connect your Solana wallet and pay directly from this page. Supports
                    Phantom, Solflare, and other popular wallets.
                  </p>
                </div>
              </div>
            )}

            {checking && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Watching for payment...
                </div>
              </div>
            )}

            {/* Share Link */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Share this payment link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentUrl)
                    alert('Link copied!')
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
