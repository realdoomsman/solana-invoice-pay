import { EscrowContract, EscrowMilestone } from '@/lib/escrow/types'
import { useRouter } from 'next/navigation'

interface EscrowActionButtonsProps {
  escrow: EscrowContract
  milestones?: EscrowMilestone[]
  currentUserWallet?: string
  depositStatus?: any
  onConfirm?: () => void
  onDispute?: () => void
  onCancel?: () => void
}

export default function EscrowActionButtons({
  escrow,
  milestones = [],
  currentUserWallet,
  depositStatus,
  onConfirm,
  onDispute,
  onCancel
}: EscrowActionButtonsProps) {
  const router = useRouter()
  
  if (!currentUserWallet) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
        <div className="text-slate-400 mb-4">
          Connect your wallet to interact with this escrow
        </div>
      </div>
    )
  }

  const isBuyer = currentUserWallet === escrow.buyer_wallet
  const isSeller = currentUserWallet === escrow.seller_wallet
  const isParty = isBuyer || isSeller

  // Observer view - no actions available
  if (!isParty) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
        <div className="text-slate-400">
          👀 You are viewing this escrow as an observer
        </div>
        <div className="text-sm text-slate-500 mt-2">
          Only the buyer and seller can take actions
        </div>
      </div>
    )
  }

  // Completed/Cancelled states - no actions
  if (['completed', 'cancelled', 'refunded'].includes(escrow.status)) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
        <div className="text-slate-400">
          {escrow.status === 'completed' && '✅ This escrow has been completed'}
          {escrow.status === 'cancelled' && '❌ This escrow has been cancelled'}
          {escrow.status === 'refunded' && '↩️ This escrow has been refunded'}
        </div>
      </div>
    )
  }

  // Disputed state - limited actions
  if (escrow.status === 'disputed') {
    return (
      <div className="bg-red-900/20 rounded-xl p-6 border border-red-800">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-red-400 font-semibold">Escrow Under Dispute</div>
            <div className="text-sm text-slate-400">
              An admin is reviewing this case. No further actions can be taken.
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/escrow/${escrow.payment_id}/evidence`)}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          📎 Submit Additional Evidence
        </button>
      </div>
    )
  }

  // Traditional Escrow Actions
  if (escrow.escrow_type === 'traditional') {
    // Waiting for deposits
    if (!depositStatus?.fully_funded) {
      const needsDeposit = (isBuyer && !depositStatus?.buyer_deposited) || 
                          (isSeller && !depositStatus?.seller_deposited)
      
      if (needsDeposit) {
        return (
          <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-blue-400 font-semibold">Deposit Required</div>
                <div className="text-sm text-slate-400">
                  {isBuyer && `Please deposit ${escrow.buyer_amount} ${escrow.token}`}
                  {isSeller && `Please deposit ${escrow.seller_amount} ${escrow.token} (security deposit)`}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Deposit to the escrow wallet shown above to activate this escrow
            </div>
          </div>
        )
      }

      return (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
          <div className="text-slate-400">
            ⏳ Waiting for {isBuyer ? 'seller' : 'buyer'} to deposit
          </div>
        </div>
      )
    }

    // Fully funded - waiting for confirmations
    const userConfirmed = isBuyer ? escrow.buyer_confirmed : escrow.seller_confirmed
    const otherConfirmed = isBuyer ? escrow.seller_confirmed : escrow.buyer_confirmed

    if (userConfirmed) {
      return (
        <div className="bg-green-900/20 rounded-xl p-6 border border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-green-400 font-semibold">You've Confirmed</div>
              <div className="text-sm text-slate-400">
                {otherConfirmed 
                  ? 'Both parties confirmed! Funds will be released shortly.'
                  : `Waiting for ${isBuyer ? 'seller' : 'buyer'} to confirm completion.`
                }
              </div>
            </div>
          </div>
          {!otherConfirmed && onDispute && (
            <button
              onClick={onDispute}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              ⚠️ Raise Dispute
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🤝</span>
          <div>
            <div className="text-white font-semibold">Ready to Confirm?</div>
            <div className="text-sm text-slate-400">
              Confirm that the transaction has been completed successfully
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              ✓ Confirm Completion
            </button>
          )}
          {onDispute && (
            <button
              onClick={onDispute}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              ⚠️ Dispute
            </button>
          )}
        </div>
      </div>
    )
  }

  // Simple Buyer (Milestone) Actions
  if (escrow.escrow_type === 'simple_buyer') {
    const pendingMilestones = milestones.filter(m => m.status === 'pending')
    const submittedMilestones = milestones.filter(m => m.status === 'work_submitted')
    const completedMilestones = milestones.filter(m => m.status === 'released')
    
    if (isSeller) {
      if (pendingMilestones.length > 0) {
        return (
          <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📝</span>
              <div>
                <div className="text-blue-400 font-semibold">Work Submission Available</div>
                <div className="text-sm text-slate-400">
                  {pendingMilestones.length} milestone{pendingMilestones.length > 1 ? 's' : ''} ready for work submission
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Submit your work for the next milestone in the milestones section below
            </div>
          </div>
        )
      }

      if (submittedMilestones.length > 0) {
        return (
          <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <div className="text-purple-400 font-semibold">Awaiting Buyer Review</div>
                <div className="text-sm text-slate-400">
                  {submittedMilestones.length} milestone{submittedMilestones.length > 1 ? 's' : ''} under review
                </div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="bg-green-900/20 rounded-xl p-6 border border-green-800 text-center">
          <div className="text-green-400 font-semibold mb-2">
            🎉 All Milestones Completed
          </div>
          <div className="text-sm text-slate-400">
            {completedMilestones.length} of {milestones.length} milestones released
          </div>
        </div>
      )
    }

    if (isBuyer) {
      if (submittedMilestones.length > 0) {
        return (
          <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">👀</span>
              <div>
                <div className="text-yellow-400 font-semibold">Review Required</div>
                <div className="text-sm text-slate-400">
                  {submittedMilestones.length} milestone{submittedMilestones.length > 1 ? 's' : ''} awaiting your approval
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Review the submitted work in the milestones section below
            </div>
          </div>
        )
      }

      if (pendingMilestones.length > 0) {
        return (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
            <div className="text-slate-400">
              ⏳ Waiting for seller to submit work
            </div>
            <div className="text-sm text-slate-500 mt-2">
              {pendingMilestones.length} milestone{pendingMilestones.length > 1 ? 's' : ''} pending
            </div>
          </div>
        )
      }

      return (
        <div className="bg-green-900/20 rounded-xl p-6 border border-green-800 text-center">
          <div className="text-green-400 font-semibold mb-2">
            ✅ Project Complete
          </div>
          <div className="text-sm text-slate-400">
            All milestones have been approved and paid
          </div>
        </div>
      )
    }
  }

  // Atomic Swap Actions
  if (escrow.escrow_type === 'atomic_swap') {
    if (escrow.swap_executed) {
      return (
        <div className="bg-green-900/20 rounded-xl p-6 border border-green-800 text-center">
          <div className="text-green-400 font-semibold mb-2">
            🔄 Swap Completed
          </div>
          <div className="text-sm text-slate-400">
            Assets have been exchanged successfully
          </div>
        </div>
      )
    }

    const userDeposited = isBuyer ? escrow.buyer_deposited : escrow.seller_deposited
    const otherDeposited = isBuyer ? escrow.seller_deposited : escrow.buyer_deposited

    if (!userDeposited) {
      return (
        <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-blue-400 font-semibold">Deposit Required</div>
              <div className="text-sm text-slate-400">
                {isBuyer && `Deposit ${escrow.buyer_amount} ${escrow.swap_asset_buyer || escrow.token}`}
                {isSeller && `Deposit ${escrow.seller_amount} ${escrow.swap_asset_seller || escrow.token}`}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Once both parties deposit, the swap will execute automatically
          </div>
        </div>
      )
    }

    return (
      <div className="bg-green-900/20 rounded-xl p-6 border border-green-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="text-green-400 font-semibold">You've Deposited</div>
            <div className="text-sm text-slate-400">
              {otherDeposited 
                ? 'Both parties deposited! Swap executing...'
                : `Waiting for ${isBuyer ? 'Party B' : 'Party A'} to deposit`
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
      <div className="text-slate-400">No actions available at this time</div>
    </div>
  )
}
