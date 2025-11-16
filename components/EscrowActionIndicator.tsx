import { EscrowStatus } from '@/lib/escrow/types'

interface EscrowActionIndicatorProps {
  escrowType: 'traditional' | 'simple_buyer' | 'atomic_swap'
  status: EscrowStatus
  userRole: 'buyer' | 'seller'
  buyerDeposited: boolean
  sellerDeposited: boolean
  buyerConfirmed: boolean
  sellerConfirmed: boolean
  sellerAmount?: number
  submittedMilestones?: number
  expiresAt?: string
  className?: string
}

interface ActionIndicator {
  type: 'action' | 'warning' | 'info' | 'success' | 'danger'
  message: string
  icon: string
  priority: 'high' | 'medium' | 'low'
}

export default function EscrowActionIndicator({
  escrowType,
  status,
  userRole,
  buyerDeposited,
  sellerDeposited,
  buyerConfirmed,
  sellerConfirmed,
  sellerAmount,
  submittedMilestones = 0,
  expiresAt,
  className = ''
}: EscrowActionIndicatorProps) {
  
  const getActionIndicators = (): ActionIndicator[] => {
    const indicators: ActionIndicator[] = []

    // Check for timeout warnings
    if (expiresAt && status !== 'completed' && status !== 'cancelled') {
      const expiresAtDate = new Date(expiresAt)
      const now = new Date()
      const hoursUntilExpiry = (expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilExpiry < 0) {
        indicators.push({
          type: 'danger',
          message: 'Expired',
          icon: '⏰',
          priority: 'high'
        })
      } else if (hoursUntilExpiry < 24) {
        indicators.push({
          type: 'warning',
          message: `Expires in ${Math.floor(hoursUntilExpiry)}h`,
          icon: '⏰',
          priority: 'high'
        })
      } else if (hoursUntilExpiry < 72) {
        indicators.push({
          type: 'warning',
          message: `Expires in ${Math.floor(hoursUntilExpiry / 24)}d`,
          icon: '⏰',
          priority: 'medium'
        })
      }
    }

    // Check for disputed status
    if (status === 'disputed') {
      indicators.push({
        type: 'danger',
        message: 'Under Admin Review',
        icon: '⚠️',
        priority: 'high'
      })
      return indicators // Disputed is highest priority, show only this
    }

    // Check for completion
    if (status === 'completed') {
      indicators.push({
        type: 'success',
        message: 'Completed',
        icon: '✅',
        priority: 'low'
      })
      return indicators
    }

    // Check for deposit requirements
    if (status === 'created' || status === 'buyer_deposited' || status === 'seller_deposited') {
      if (userRole === 'buyer' && !buyerDeposited) {
        indicators.push({
          type: 'action',
          message: 'Deposit Required',
          icon: '💰',
          priority: 'high'
        })
      }
      
      if (userRole === 'seller' && !sellerDeposited && sellerAmount && sellerAmount > 0) {
        indicators.push({
          type: 'action',
          message: 'Deposit Required',
          icon: '💰',
          priority: 'high'
        })
      }
    }

    // Check for confirmation requirements (traditional escrow)
    if ((status === 'fully_funded' || status === 'active') && escrowType === 'traditional') {
      if (userRole === 'buyer' && !buyerConfirmed) {
        indicators.push({
          type: 'action',
          message: 'Confirmation Required',
          icon: '✓',
          priority: 'high'
        })
      }
      
      if (userRole === 'seller' && !sellerConfirmed) {
        indicators.push({
          type: 'action',
          message: 'Confirmation Required',
          icon: '✓',
          priority: 'high'
        })
      }
    }

    // Check for milestone approvals (simple buyer)
    if (escrowType === 'simple_buyer' && userRole === 'buyer' && submittedMilestones > 0) {
      indicators.push({
        type: 'action',
        message: `${submittedMilestones} Milestone${submittedMilestones > 1 ? 's' : ''} to Review`,
        icon: '📋',
        priority: 'high'
      })
    }

    // Check for work submission (simple buyer seller)
    if (escrowType === 'simple_buyer' && userRole === 'seller' && status === 'active') {
      indicators.push({
        type: 'info',
        message: 'Work in Progress',
        icon: '🛠️',
        priority: 'low'
      })
    }

    // Check for atomic swap waiting
    if (escrowType === 'atomic_swap' && (status === 'buyer_deposited' || status === 'seller_deposited')) {
      indicators.push({
        type: 'info',
        message: 'Waiting for Counterparty',
        icon: '⏳',
        priority: 'medium'
      })
    }

    return indicators
  }

  const indicators = getActionIndicators()
  
  if (indicators.length === 0) {
    return null
  }

  // Show only the highest priority indicator
  const sortedIndicators = indicators.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const primaryIndicator = sortedIndicators[0]

  const getIndicatorStyles = (type: ActionIndicator['type']) => {
    switch (type) {
      case 'action':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'danger':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${getIndicatorStyles(primaryIndicator.type)} ${className}`}>
      <span className="text-base">{primaryIndicator.icon}</span>
      <span className="font-semibold text-sm whitespace-nowrap">
        {primaryIndicator.message}
      </span>
      {sortedIndicators.length > 1 && (
        <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-xs">
          +{sortedIndicators.length - 1}
        </span>
      )}
    </div>
  )
}
