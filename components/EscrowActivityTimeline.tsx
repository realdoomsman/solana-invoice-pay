import { EscrowAction } from '@/lib/escrow/types'
import { formatDistanceToNow, format } from 'date-fns'

interface EscrowActivityTimelineProps {
  actions: EscrowAction[]
  network?: string
}

export default function EscrowActivityTimeline({ 
  actions, 
  network = 'devnet' 
}: EscrowActivityTimelineProps) {
  // Handle both action_type and action field names
  const getActionType = (action: EscrowAction): string => {
    return (action as any).action_type || (action as any).action || 'unknown'
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return '📝'
      case 'deposited':
        return '💰'
      case 'confirmed':
        return '✅'
      case 'submitted':
        return '📤'
      case 'approved':
        return '👍'
      case 'disputed':
        return '⚠️'
      case 'released':
        return '🎉'
      case 'refunded':
        return '↩️'
      case 'cancelled':
        return '❌'
      case 'swapped':
        return '🔄'
      case 'timeout':
        return '⏰'
      case 'admin_action':
        return '👨‍💼'
      default:
        return '•'
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'text-slate-400'
      case 'deposited':
        return 'text-blue-400'
      case 'confirmed':
      case 'approved':
      case 'released':
        return 'text-green-400'
      case 'submitted':
        return 'text-purple-400'
      case 'disputed':
        return 'text-red-400'
      case 'refunded':
      case 'cancelled':
        return 'text-orange-400'
      case 'swapped':
        return 'text-emerald-400'
      case 'timeout':
        return 'text-yellow-400'
      case 'admin_action':
        return 'text-pink-400'
      default:
        return 'text-slate-400'
    }
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getActionDescription = (action: EscrowAction): string => {
    const actionType = getActionType(action)
    const metadata = action.metadata || {}
    
    // Build context-aware descriptions using metadata
    switch (actionType) {
      case 'created':
        return 'Escrow contract created'
      case 'deposited':
        if (metadata.party_role) {
          return `${metadata.party_role === 'buyer' ? 'Buyer' : 'Seller'} deposited funds`
        }
        return 'Funds deposited'
      case 'confirmed':
        if (metadata.party_role) {
          return `${metadata.party_role === 'buyer' ? 'Buyer' : 'Seller'} confirmed completion`
        }
        return 'Transaction confirmed'
      case 'submitted':
        if (metadata.milestone_order !== undefined) {
          return `Work submitted for milestone #${metadata.milestone_order + 1}`
        }
        return 'Work submitted for review'
      case 'approved':
        if (metadata.milestone_order !== undefined) {
          return `Milestone #${metadata.milestone_order + 1} approved`
        }
        return 'Milestone approved'
      case 'disputed':
        if (metadata.milestone_order !== undefined) {
          return `Dispute raised for milestone #${metadata.milestone_order + 1}`
        }
        return 'Dispute raised'
      case 'released':
        if (metadata.release_type === 'milestone_release') {
          return `Milestone payment released`
        } else if (metadata.release_type === 'security_deposit_return') {
          return `Security deposit returned`
        } else if (metadata.release_type === 'full_release') {
          return `Full payment released`
        }
        return 'Funds released'
      case 'refunded':
        if (metadata.refund_reason) {
          return `Funds refunded: ${metadata.refund_reason}`
        }
        return 'Funds refunded'
      case 'cancelled':
        return 'Escrow cancelled'
      case 'swapped':
        return 'Assets swapped successfully'
      case 'timeout':
        if (metadata.timeout_type) {
          return `Timeout: ${formatActionType(metadata.timeout_type)}`
        }
        return 'Timeout occurred'
      case 'admin_action':
        if (metadata.action) {
          return `Admin: ${formatActionType(metadata.action)}`
        }
        return 'Admin action taken'
      case 'funded':
        return 'Escrow fully funded'
      case 'completed':
        return 'Escrow completed'
      default:
        return formatActionType(actionType)
    }
  }

  const formatWallet = (wallet: string) => {
    if (!wallet || wallet === 'system') return wallet
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  const extractTxSignature = (metadata: any): string | null => {
    if (!metadata) return null
    return metadata.tx_signature || metadata.txSignature || metadata.signature || null
  }

  const getMetadataDisplay = (action: EscrowAction): JSX.Element | null => {
    const metadata = action.metadata || {}
    const txSignature = extractTxSignature(metadata)
    
    // Filter out metadata that's already shown elsewhere
    const filteredMetadata = Object.entries(metadata).filter(([key]) => 
      !['tx_signature', 'txSignature', 'signature'].includes(key)
    )
    
    if (filteredMetadata.length === 0 && !txSignature) return null
    
    return (
      <div className="mt-2 space-y-2">
        {filteredMetadata.length > 0 && (
          <div className="text-xs text-slate-500 space-y-1">
            {filteredMetadata.map(([key, value]) => {
              // Format specific metadata fields
              if (key === 'amount' && metadata.token) {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-slate-600">Amount:</span>
                    <span className="text-slate-400 font-mono">{value} {metadata.token}</span>
                  </div>
                )
              }
              if (key === 'milestone_order') {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-slate-600">Milestone:</span>
                    <span className="text-slate-400">#{Number(value) + 1}</span>
                  </div>
                )
              }
              if (key === 'evidence_count' && Number(value) > 0) {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-slate-600">Evidence:</span>
                    <span className="text-slate-400">{value} file(s) attached</span>
                  </div>
                )
              }
              if (key === 'party_role') {
                return null // Already shown in description
              }
              
              // Default display for other metadata
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-slate-600">{formatActionType(key)}:</span>
                  <span className="text-slate-400">{String(value)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (actions.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 text-center">
        <div className="text-slate-500 text-sm">No activity yet</div>
      </div>
    )
  }

  // Sort actions by created_at descending (most recent first)
  const sortedActions = [...actions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <div className="space-y-4">
        {sortedActions.map((action, index) => {
          const actionType = getActionType(action)
          const txSignature = extractTxSignature(action.metadata)
          const isLast = index === sortedActions.length - 1
          const actionDate = new Date(action.created_at)

          return (
            <div key={action.id} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-800" />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg z-10 ${getActionColor(actionType)}`}>
                  {getActionIcon(actionType)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="flex-1">
                      <div className={`font-semibold ${getActionColor(actionType)}`}>
                        {getActionDescription(action)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs text-slate-500">
                          by {action.actor_wallet === 'system' ? 'System' : formatWallet(action.actor_wallet)}
                        </div>
                        {action.actor_wallet !== 'system' && (
                          <button
                            onClick={() => navigator.clipboard.writeText(action.actor_wallet)}
                            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                            title="Copy full address"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(actionDate, { addSuffix: true })}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {format(actionDate, 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>

                  {action.notes && (
                    <div className="mt-2 p-3 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
                      <div className="text-xs text-slate-500 mb-1">Notes:</div>
                      {action.notes}
                    </div>
                  )}

                  {/* Display metadata */}
                  {getMetadataDisplay(action)}

                  {/* Transaction signature link */}
                  {txSignature && (
                    <div className="mt-3 flex items-center gap-3">
                      <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-800/50 rounded-lg text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 transition-colors"
                      >
                        <span>🔗</span>
                        <span>View on Solana Explorer</span>
                        <span>↗</span>
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(txSignature)}
                        className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                        title="Copy transaction signature"
                      >
                        📋 Copy TX
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
