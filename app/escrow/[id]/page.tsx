'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { 
  getEscrowByPaymentId, 
  getEscrowMilestones, 
  getEscrowActions,
  submitMilestone,
  approveMilestone,
  raiseDispute,
  EscrowContract,
  EscrowMilestone,
  EscrowAction
} from '@/lib/escrow'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function EscrowManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey, sendTransaction } = useWallet()
  
  const [escrow, setEscrow] = useState<EscrowContract | null>(null)
  const [milestones, setMilestones] = useState<EscrowMilestone[]>([])
  const [actions, setActions] = useState<EscrowAction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState<EscrowMilestone | null>(null)
  const [notes, setNotes] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  useEffect(() => {
    loadEscrowData()
  }, [params.id])

  const loadEscrowData = async () => {
    try {
      setLoading(true)
      const escrowData = await getEscrowByPaymentId(params.id as string)
      if (escrowData) {
        setEscrow(escrowData)
        const milestonesData = await getEscrowMilestones(escrowData.id)
        setMilestones(milestonesData)
        const actionsData = await getEscrowActions(escrowData.id)
        setActions(actionsData)
      }
    } catch (error) {
      console.error('Error loading escrow:', error)
      toast.error('Failed to load escrow data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWork = async (milestone: EscrowMilestone) => {
    if (!publicKey || !escrow) return
    
    if (publicKey.toString() !== escrow.seller_wallet) {
      toast.error('Only the seller can submit work')
      return
    }

    const loadingToast = toast.loading('Submitting work...')
    try {
      await submitMilestone(milestone.id, publicKey.toString(), notes)
      toast.success('Work submitted for review!', { id: loadingToast })
      setNotes('')
      setSelectedMilestone(null)
      await loadEscrowData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit work', { id: loadingToast })
    }
  }

  const handleApproveWork = async (milestone: EscrowMilestone) => {
    if (!publicKey || !escrow) return
    
    if (publicKey.toString() !== escrow.buyer_wallet) {
      toast.error('Only the buyer can approve work')
      return
    }

    const loadingToast = toast.loading('Approving work...')
    try {
      // First approve in database
      await approveMilestone(milestone.id, publicKey.toString(), notes)
      
      // Then release funds on-chain
      await releaseFunds(milestone)
      
      toast.success('Work approved and funds released!', { id: loadingToast })
      setNotes('')
      setSelectedMilestone(null)
      await loadEscrowData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve work', { id: loadingToast })
    }
  }

  const releaseFunds = async (milestone: EscrowMilestone) => {
    if (!publicKey || !escrow || !sendTransaction) {
      throw new Error('Wallet not connected')
    }

    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    const endpoint = rpcUrl || (
      network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : `https://api.${network}.solana.com`
    )
    const connection = new Connection(endpoint, 'confirmed')

    // Decrypt escrow wallet private key and send funds
    const escrowWallet = new PublicKey(escrow.payment_wallet)
    const sellerWallet = new PublicKey(escrow.seller_wallet)
    const amountLamports = milestone.amount * LAMPORTS_PER_SOL

    // Create transaction to send from escrow wallet to seller
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet,
        toPubkey: sellerWallet,
        lamports: amountLamports,
      })
    )

    // Note: In production, this would need proper key management
    // For now, we'll use the buyer's wallet to sign (simplified)
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction(signature, 'confirmed')

    // Update milestone with tx signature
    const { releaseMilestoneFunds } = await import('@/lib/escrow')
    await releaseMilestoneFunds(milestone.id, signature)

    return signature
  }

  const handleRaiseDispute = async () => {
    if (!publicKey || !escrow || !disputeReason) return

    const loadingToast = toast.loading('Raising dispute...')
    try {
      await raiseDispute(
        escrow.id,
        selectedMilestone?.id || null,
        publicKey.toString(),
        disputeReason
      )
      toast.success('Dispute raised. Admin will review.', { id: loadingToast })
      setShowDisputeModal(false)
      setDisputeReason('')
      await loadEscrowData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to raise dispute', { id: loadingToast })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'work_submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'released': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'disputed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const isSeller = publicKey && escrow && publicKey.toString() === escrow.seller_wallet
  const isBuyer = publicKey && escrow && publicKey.toString() === escrow.buyer_wallet

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading escrow...</div>
      </div>
    )
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Escrow Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="text-blue-400 hover:underline"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Escrow Management</h1>
            <WalletMultiButton />
          </div>
          <p className="text-slate-400">{escrow.description}</p>
        </div>

        {/* Escrow Status */}
        <div className="bg-slate-900 rounded-xl p-6 mb-8 border border-slate-800">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-slate-400 text-sm mb-1">Status</div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(escrow.status)}`}>
                {escrow.status.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-white">{escrow.total_amount} {escrow.token}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Your Role</div>
              <div className="text-white font-semibold">
                {isSeller ? '🛠️ Seller' : isBuyer ? '💰 Buyer' : '👀 Observer'}
              </div>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="text-slate-400 text-sm mb-2">Buyer</div>
            <div className="font-mono text-sm text-white break-all">{escrow.buyer_wallet}</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="text-slate-400 text-sm mb-2">Seller</div>
            <div className="font-mono text-sm text-white break-all">{escrow.seller_wallet}</div>
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Milestones</h2>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-white">#{index + 1}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(milestone.status)}`}>
                        {milestone.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{milestone.description}</h3>
                    <div className="text-slate-400 text-sm">
                      {milestone.percentage}% • {milestone.amount} {escrow.token}
                    </div>
                  </div>
                </div>

                {/* Seller Actions */}
                {isSeller && milestone.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedMilestone(milestone)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Submit Work
                    </button>
                  </div>
                )}

                {/* Buyer Actions */}
                {isBuyer && milestone.status === 'work_submitted' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {milestone.seller_notes && (
                      <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                        <div className="text-slate-400 text-xs mb-1">Seller's Notes:</div>
                        <div className="text-white text-sm">{milestone.seller_notes}</div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedMilestone(milestone)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                      >
                        ✓ Approve & Release Funds
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMilestone(milestone)
                          setShowDisputeModal(true)
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                      >
                        ⚠ Raise Dispute
                      </button>
                    </div>
                  </div>
                )}

                {/* Released Info */}
                {milestone.status === 'released' && milestone.tx_signature && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="text-green-400 text-sm">
                      ✓ Funds released
                      <a
                        href={`https://explorer.solana.com/tx/${milestone.tx_signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 underline"
                      >
                        View Transaction
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Activity Log</h2>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="space-y-3">
              {actions.length === 0 ? (
                <div className="text-slate-400 text-center py-4">No activity yet</div>
              ) : (
                actions.map((action) => (
                  <div key={action.id} className="flex gap-3 text-sm">
                    <div className="text-slate-500">
                      {new Date(action.created_at).toLocaleString()}
                    </div>
                    <div className="text-slate-400">•</div>
                    <div className="text-white flex-1">
                      <span className="font-semibold">{action.action}</span>
                      {action.notes && <span className="text-slate-400"> - {action.notes}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Work Modal */}
      {selectedMilestone && selectedMilestone.status === 'pending' && isSeller && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4">Submit Work</h3>
            <p className="text-slate-400 mb-4">
              Submit your completed work for milestone: {selectedMilestone.description}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the completed work..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmitWork(selectedMilestone)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Submit for Review
              </button>
              <button
                onClick={() => {
                  setSelectedMilestone(null)
                  setNotes('')
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Work Modal */}
      {selectedMilestone && selectedMilestone.status === 'work_submitted' && isBuyer && !showDisputeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4">Approve Work</h3>
            <p className="text-slate-400 mb-4">
              Approving will release {selectedMilestone.amount} {escrow.token} to the seller.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add approval notes (optional)..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleApproveWork(selectedMilestone)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                Approve & Release Funds
              </button>
              <button
                onClick={() => {
                  setSelectedMilestone(null)
                  setNotes('')
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-red-800">
            <h3 className="text-xl font-bold text-white mb-4">Raise Dispute</h3>
            <p className="text-slate-400 mb-4">
              Explain why you're disputing this milestone. An admin will review and make a decision.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRaiseDispute}
                disabled={!disputeReason}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Submit Dispute
              </button>
              <button
                onClick={() => {
                  setShowDisputeModal(false)
                  setDisputeReason('')
                  setSelectedMilestone(null)
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
