'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEnhancedToast } from '@/hooks/useToast'
import { 
  getEscrowByPaymentId, 
  getEscrowMilestones, 
  getEscrowActions,
  raiseDispute
} from '@/lib/escrow'
import type { EscrowContract, EscrowMilestone, EscrowAction } from '@/lib/escrow/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PageLoadingSkeleton } from '@/components/ui/LoadingState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessAnimation } from '@/components/ui/SuccessAnimation'
import TraditionalEscrowDepositStatus from '@/components/TraditionalEscrowDepositStatus'
import TraditionalEscrowConfirmation from '@/components/TraditionalEscrowConfirmation'
import MilestoneWorkSubmission from '@/components/MilestoneWorkSubmission'
import MilestoneApproval from '@/components/MilestoneApproval'
import MilestoneProgress from '@/components/MilestoneProgress'
import AtomicSwapStatus from '@/components/AtomicSwapStatus'
import EscrowTypeDisplay from '@/components/EscrowTypeDisplay'
import EscrowStatusBadge from '@/components/EscrowStatusBadge'
import EscrowPartyInfo from '@/components/EscrowPartyInfo'
import EscrowAmountDisplay from '@/components/EscrowAmountDisplay'
import EscrowActivityTimeline from '@/components/EscrowActivityTimeline'
import EscrowActionButtons from '@/components/EscrowActionButtons'
import MultiSigTransactionStatus from '@/components/MultiSigTransactionStatus'

export default function EscrowManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const toast = useEnhancedToast()
  
  const [escrow, setEscrow] = useState<EscrowContract | null>(null)
  const [milestones, setMilestones] = useState<EscrowMilestone[]>([])
  const [actions, setActions] = useState<EscrowAction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState<EscrowMilestone | null>(null)
  const [notes, setNotes] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showWorkSubmissionModal, setShowWorkSubmissionModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [depositStatus, setDepositStatus] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
        
        // Load deposit status for traditional escrow
        if (escrowData.escrow_type === 'traditional') {
          const depositResponse = await fetch(`/api/escrow/deposit?escrowId=${escrowData.id}`)
          if (depositResponse.ok) {
            const depositData = await depositResponse.json()
            setDepositStatus(depositData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading escrow:', error)
      toast.handleError(error, 'Failed to load escrow data')
    } finally {
      setLoading(false)
    }
  }





  const handleConfirmEscrow = async () => {
    if (!publicKey || !escrow) return

    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: escrow.id,
          confirmerWallet: publicKey.toString(),
          notes: notes || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm')
      }

      setShowConfirmModal(false)
      setNotes('')
      setSuccessMessage('Transaction confirmed!')
      setShowSuccess(true)
      
      setTimeout(async () => {
        await loadEscrowData()
        setShowSuccess(false)
      }, 2000)
    } catch (error: any) {
      toast.handleError(error, 'Failed to confirm escrow')
    }
  }

  const handleRaiseDispute = async () => {
    if (!publicKey || !escrow || !disputeReason) return

    try {
      await raiseDispute(
        escrow.id,
        selectedMilestone?.id || null,
        publicKey.toString(),
        disputeReason
      )
      
      setShowDisputeModal(false)
      setDisputeReason('')
      setSuccessMessage('Dispute raised successfully')
      setShowSuccess(true)
      
      setTimeout(async () => {
        await loadEscrowData()
        setShowSuccess(false)
      }, 2000)
    } catch (error: any) {
      toast.handleError(error, 'Failed to raise dispute')
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
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <PageLoadingSkeleton />
        </div>
        <Footer />
      </div>
    )
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <ErrorMessage
              type="error"
              title="Escrow Not Found"
              message="The escrow you're looking for doesn't exist or has been removed."
              action={{
                label: 'Go Home',
                onClick: () => router.push('/')
              }}
            />
          </div>
        </div>
        <Footer />
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
            <h1 className="text-3xl font-bold text-white">Escrow Details</h1>
            <WalletMultiButton />
          </div>
          {escrow.description && (
            <p className="text-slate-400">{escrow.description}</p>
          )}
        </div>

        {/* Escrow Overview Card */}
        <div className="bg-slate-900 rounded-xl p-6 mb-8 border border-slate-800">
          <div className="grid md:grid-cols-3 gap-6 mb-4">
            <div>
              <div className="text-slate-400 text-sm mb-2">Escrow Type</div>
              <EscrowTypeDisplay type={escrow.escrow_type} />
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-2">Status</div>
              <EscrowStatusBadge status={escrow.status} />
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-2">Escrow ID</div>
              <div className="font-mono text-sm text-white break-all">
                {escrow.payment_id}
              </div>
            </div>
          </div>
          
          {/* Timestamps */}
          <div className="pt-4 border-t border-slate-800 grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Created:</span>{' '}
              <span className="text-slate-300">
                {new Date(escrow.created_at).toLocaleDateString()}
              </span>
            </div>
            {escrow.funded_at && (
              <div>
                <span className="text-slate-500">Funded:</span>{' '}
                <span className="text-slate-300">
                  {new Date(escrow.funded_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {escrow.completed_at && (
              <div>
                <span className="text-slate-500">Completed:</span>{' '}
                <span className="text-slate-300">
                  {new Date(escrow.completed_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {escrow.expires_at && !escrow.completed_at && (
              <div>
                <span className="text-slate-500">Expires:</span>{' '}
                <span className="text-yellow-400">
                  {new Date(escrow.expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          {/* Evidence Link - Show for parties involved */}
          {(isBuyer || isSeller) && (
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => router.push(`/escrow/${params.id}/evidence`)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                📎 View & Submit Evidence
              </button>
            </div>
          )}
        </div>

        {/* Amount Display */}
        <div className="mb-8">
          <EscrowAmountDisplay
            type={escrow.escrow_type}
            buyerAmount={escrow.buyer_amount}
            sellerAmount={escrow.seller_amount}
            token={escrow.token}
            swapAssetBuyer={escrow.swap_asset_buyer}
            swapAssetSeller={escrow.swap_asset_seller}
            currentUserWallet={publicKey?.toString()}
            buyerWallet={escrow.buyer_wallet}
            sellerWallet={escrow.seller_wallet}
          />
        </div>

        {/* Parties */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Parties</h2>
          <EscrowPartyInfo
            type={escrow.escrow_type}
            buyerWallet={escrow.buyer_wallet}
            sellerWallet={escrow.seller_wallet}
            buyerAmount={escrow.buyer_amount}
            sellerAmount={escrow.seller_amount}
            swapAssetBuyer={escrow.swap_asset_buyer}
            swapAssetSeller={escrow.swap_asset_seller}
            token={escrow.token}
            currentUserWallet={publicKey?.toString()}
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Actions</h2>
          <EscrowActionButtons
            escrow={escrow}
            milestones={milestones}
            currentUserWallet={publicKey?.toString()}
            depositStatus={depositStatus}
            onConfirm={() => setShowConfirmModal(true)}
            onDispute={() => setShowDisputeModal(true)}
          />
        </div>

        {/* Multi-Sig Transaction Status */}
        {(isBuyer || isSeller) && (
          <div className="mb-8">
            <MultiSigTransactionStatus
              escrowId={escrow.id}
              userWallet={publicKey?.toString()}
              onSignatureAdded={loadEscrowData}
            />
          </div>
        )}

        {/* Traditional Escrow - Deposit Status */}
        {escrow.escrow_type === 'traditional' && depositStatus && !depositStatus.fully_funded && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Deposit Status</h2>
            <TraditionalEscrowDepositStatus
              escrowId={escrow.id}
              escrowWallet={escrow.escrow_wallet}
              buyerWallet={escrow.buyer_wallet}
              sellerWallet={escrow.seller_wallet}
              buyerAmount={depositStatus.buyer_amount}
              sellerAmount={depositStatus.seller_amount}
              token={depositStatus.token}
              buyerDeposited={depositStatus.buyer_deposited}
              sellerDeposited={depositStatus.seller_deposited}
              fullyFunded={depositStatus.fully_funded}
              onDepositDetected={loadEscrowData}
            />
          </div>
        )}

        {/* Traditional Escrow - Confirmation */}
        {escrow.escrow_type === 'traditional' && depositStatus?.fully_funded && (
          <div className="mb-8">
            <TraditionalEscrowConfirmation
              escrowId={escrow.id}
              buyerWallet={escrow.buyer_wallet}
              sellerWallet={escrow.seller_wallet}
              buyerConfirmed={escrow.buyer_confirmed || false}
              sellerConfirmed={escrow.seller_confirmed || false}
              fullyFunded={depositStatus.fully_funded}
              status={escrow.status}
              onConfirmationSuccess={loadEscrowData}
            />
          </div>
        )}

        {/* Atomic Swap Status */}
        {escrow.escrow_type === 'atomic_swap' && (
          <div className="mb-8">
            <AtomicSwapStatus
              escrow={escrow}
              onRefresh={loadEscrowData}
            />
          </div>
        )}

        {/* Milestone Progress (for simple_buyer escrow) */}
        {escrow.escrow_type === 'simple_buyer' && milestones.length > 0 && (
          <div className="mb-8">
            <MilestoneProgress milestones={milestones} token={escrow.token} />
          </div>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
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
                      onClick={() => {
                        setSelectedMilestone(milestone)
                        setShowWorkSubmissionModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Submit Work
                    </button>
                  </div>
                )}

                {/* Work Submitted - Seller can see status */}
                {isSeller && milestone.status === 'work_submitted' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-blue-400 text-sm">✓ Work submitted - waiting for buyer review</span>
                    </div>
                    {milestone.seller_notes && (
                      <div className="p-3 bg-slate-800 rounded-lg mb-3">
                        <div className="text-slate-400 text-xs mb-1">Your submission:</div>
                        <div className="text-white text-sm">{milestone.seller_notes}</div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone)
                        setShowWorkSubmissionModal(true)
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Update Submission
                    </button>
                  </div>
                )}

                {/* Buyer Actions */}
                {isBuyer && milestone.status === 'work_submitted' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400 text-lg"></span>
                        <span className="text-blue-300 font-semibold text-sm">Work submitted - awaiting your review</span>
                      </div>
                      {milestone.seller_notes && (
                        <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-700">
                          <div className="text-slate-400 text-xs mb-1">Seller's Notes:</div>
                          <div className="text-white text-sm">{milestone.seller_notes}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedMilestone(milestone)
                          setShowApprovalModal(true)
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        ✓ Review & Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMilestone(milestone)
                          setShowDisputeModal(true)
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        ⚠ Dispute
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
                        href={`https://explorer.solana.com/tx/${milestone.tx_signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}`}
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
        )}

        {/* Activity Timeline */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Activity Timeline</h2>
          <EscrowActivityTimeline 
            actions={actions} 
            network={process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}
          />
        </div>
      </div>

      {/* Work Submission Modal */}
      {showWorkSubmissionModal && selectedMilestone && isSeller && escrow && (
        <MilestoneWorkSubmission
          milestone={{
            id: selectedMilestone.id,
            description: selectedMilestone.description,
            percentage: selectedMilestone.percentage,
            amount: selectedMilestone.amount,
            status: selectedMilestone.status,
            milestone_order: selectedMilestone.milestone_order,
          }}
          escrowId={escrow.id}
          sellerWallet={publicKey?.toString() || ''}
          token={escrow.token}
          onSubmitSuccess={() => {
            setShowWorkSubmissionModal(false)
            setSelectedMilestone(null)
            loadEscrowData()
          }}
          onCancel={() => {
            setShowWorkSubmissionModal(false)
            setSelectedMilestone(null)
          }}
        />
      )}

      {/* Milestone Approval Modal */}
      {showApprovalModal && selectedMilestone && isBuyer && escrow && (
        <MilestoneApproval
          milestone={{
            id: selectedMilestone.id,
            description: selectedMilestone.description,
            percentage: selectedMilestone.percentage,
            amount: selectedMilestone.amount,
            status: selectedMilestone.status,
            milestone_order: selectedMilestone.milestone_order,
            seller_notes: selectedMilestone.seller_notes,
            seller_evidence_urls: selectedMilestone.seller_evidence_urls,
            seller_submitted_at: selectedMilestone.seller_submitted_at,
          }}
          escrowId={escrow.id}
          buyerWallet={publicKey?.toString() || ''}
          token={escrow.token}
          onApprovalSuccess={() => {
            setShowApprovalModal(false)
            setSelectedMilestone(null)
            loadEscrowData()
          }}
          onDisputeClick={() => {
            setShowApprovalModal(false)
            setShowDisputeModal(true)
          }}
          onCancel={() => {
            setShowApprovalModal(false)
            setSelectedMilestone(null)
          }}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-green-800">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Transaction</h3>
            <p className="text-slate-400 mb-4">
              By confirming, you acknowledge that the transaction has been completed successfully. 
              {escrow.buyer_confirmed || escrow.seller_confirmed 
                ? ' Once both parties confirm, funds will be automatically released.'
                : ' You are the first to confirm. Waiting for counterparty confirmation.'}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add confirmation notes (optional)..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleConfirmEscrow}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                Confirm Transaction
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
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

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        title={successMessage}
        icon="check"
        duration={2000}
      />
    </div>
  )
}
