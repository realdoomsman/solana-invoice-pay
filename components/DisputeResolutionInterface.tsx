'use client'

import { useState } from 'react'

interface DisputeResolutionInterfaceProps {
  dispute: {
    id: string
    reason: string
    description: string
    party_role: string
    created_at: string
  }
  escrow: {
    id: string
    total_amount: number
    buyer_amount: number
    token: string
    buyer_wallet: string
    seller_wallet: string
  }
  adminWallet: string
  onResolve: (resolution: ResolutionData) => Promise<void>
  onCancel: () => void
  processing?: boolean
}

export interface ResolutionData {
  disputeId: string
  escrowId: string
  adminWallet: string
  resolutionAction: 'release_to_seller' | 'refund_to_buyer' | 'partial_split' | 'other'
  notes: string
  amountToBuyer?: number
  amountToSeller?: number
}

export default function DisputeResolutionInterface({
  dispute,
  escrow,
  adminWallet,
  onResolve,
  onCancel,
  processing = false,
}: DisputeResolutionInterfaceProps) {
  const [resolutionAction, setResolutionAction] = useState<ResolutionData['resolutionAction']>('release_to_seller')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [splitAmountBuyer, setSplitAmountBuyer] = useState(escrow.buyer_amount / 2)
  const [splitAmountSeller, setSplitAmountSeller] = useState(escrow.buyer_amount / 2)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateResolution = (): boolean => {
    setValidationError(null)

    // Validate notes length
    if (resolutionNotes.trim().length < 20) {
      setValidationError('Resolution notes must be at least 20 characters')
      return false
    }

    // Validate partial split amounts
    if (resolutionAction === 'partial_split') {
      if (splitAmountBuyer < 0 || splitAmountSeller < 0) {
        setValidationError('Split amounts cannot be negative')
        return false
      }

      const total = splitAmountBuyer + splitAmountSeller
      if (total > escrow.buyer_amount) {
        setValidationError(`Split amounts (${total.toFixed(2)}) exceed escrow amount (${escrow.buyer_amount})`)
        return false
      }

      if (total === 0) {
        setValidationError('At least one party must receive funds')
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateResolution()) {
      return
    }

    const confirmMessage = resolutionAction === 'partial_split'
      ? `Split ${splitAmountBuyer} ${escrow.token} to buyer and ${splitAmountSeller} ${escrow.token} to seller?`
      : `${resolutionAction.replace('_', ' ')}?`

    if (!confirm(`Resolve dispute: ${confirmMessage}\n\nThis action is final and cannot be undone.`)) {
      return
    }

    const resolutionData: ResolutionData = {
      disputeId: dispute.id,
      escrowId: escrow.id,
      adminWallet,
      resolutionAction,
      notes: resolutionNotes,
    }

    if (resolutionAction === 'partial_split') {
      resolutionData.amountToBuyer = splitAmountBuyer
      resolutionData.amountToSeller = splitAmountSeller
    }

    await onResolve(resolutionData)
  }

  const getActionDescription = () => {
    switch (resolutionAction) {
      case 'release_to_seller':
        return `Release all ${escrow.buyer_amount} ${escrow.token} to seller`
      case 'refund_to_buyer':
        return `Refund all ${escrow.buyer_amount} ${escrow.token} to buyer`
      case 'partial_split':
        return 'Split funds between buyer and seller'
      case 'other':
        return 'Manual intervention required (no automatic transaction)'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Resolve Dispute
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Make a final decision on this dispute
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Dispute Information */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-red-900 dark:text-red-300">
                {dispute.reason}
              </h3>
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                {dispute.party_role.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-red-800 dark:text-red-400 mb-2">
              {dispute.description}
            </p>
            <p className="text-xs text-red-700 dark:text-red-500">
              Raised on {new Date(dispute.created_at).toLocaleString()}
            </p>
          </div>

          {/* Escrow Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
              Escrow Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                  {escrow.buyer_amount} {escrow.token}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Buyer:</span>
                <span className="ml-2 font-mono text-xs text-slate-900 dark:text-white">
                  {escrow.buyer_wallet.slice(0, 8)}...
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-600 dark:text-slate-400">Seller:</span>
                <span className="ml-2 font-mono text-xs text-slate-900 dark:text-white">
                  {escrow.seller_wallet.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Action Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Resolution Action *
            </label>
            <select
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value as ResolutionData['resolutionAction'])}
              disabled={processing}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="release_to_seller">✓ Release all funds to seller</option>
              <option value="refund_to_buyer">↩ Refund all funds to buyer</option>
              <option value="partial_split">⚖️ Partial split between parties</option>
              <option value="other">⚙️ Other (manual intervention)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {getActionDescription()}
            </p>
          </div>

          {/* Partial Split Configuration */}
          {resolutionAction === 'partial_split' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                Configure Split Amounts
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Amount to Buyer
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={escrow.buyer_amount}
                      value={splitAmountBuyer}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setSplitAmountBuyer(value)
                        setSplitAmountSeller(escrow.buyer_amount - value)
                      }}
                      disabled={processing}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-2 text-sm text-slate-500">
                      {escrow.token}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Amount to Seller
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={escrow.buyer_amount}
                      value={splitAmountSeller}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setSplitAmountSeller(value)
                        setSplitAmountBuyer(escrow.buyer_amount - value)
                      }}
                      disabled={processing}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-2 text-sm text-slate-500">
                      {escrow.token}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Split:</span>
                <span className={`font-semibold ${
                  (splitAmountBuyer + splitAmountSeller) > escrow.buyer_amount
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {(splitAmountBuyer + splitAmountSeller).toFixed(4)} / {escrow.buyer_amount} {escrow.token}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const half = escrow.buyer_amount / 2
                    setSplitAmountBuyer(half)
                    setSplitAmountSeller(half)
                  }}
                  disabled={processing}
                  className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  50/50 Split
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitAmountBuyer(escrow.buyer_amount * 0.75)
                    setSplitAmountSeller(escrow.buyer_amount * 0.25)
                  }}
                  disabled={processing}
                  className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  75/25 Buyer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitAmountBuyer(escrow.buyer_amount * 0.25)
                    setSplitAmountSeller(escrow.buyer_amount * 0.75)
                  }}
                  disabled={processing}
                  className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  75/25 Seller
                </button>
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Resolution Notes * (minimum 20 characters)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={5}
              placeholder="Provide a detailed explanation of your decision, including:&#10;- Why you chose this resolution&#10;- What evidence you considered&#10;- Any relevant policies or guidelines&#10;- Advice for both parties going forward"
              disabled={processing}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${
                resolutionNotes.length < 20
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {resolutionNotes.length} / 20 characters minimum
              </p>
              <p className="text-xs text-slate-500">
                {2000 - resolutionNotes.length} characters remaining
              </p>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                ⚠️ {validationError}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-1">
              ⚠️ Final Decision Warning
            </p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 ml-4 list-disc">
              <li>This action is final and cannot be undone</li>
              <li>On-chain transactions will be executed immediately</li>
              <li>Both parties will be notified of your decision</li>
              <li>Your decision will be recorded in the audit log</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || resolutionNotes.length < 20}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                ✓ Resolve Dispute
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
