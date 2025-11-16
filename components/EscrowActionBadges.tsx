import { EscrowStatus } from '@/lib/escrow/types'

interface EscrowActionBadgesProps {
  escrowType: 'traditional' | 'simple_buyer' | 'atomic_swap'
  status: EscrowStatus
  userRole: 'buyer' | 'seller'
  buyerDeposited: boolean
  sellerDeposited: boolean
  buyerConfirmed: boolean
  sellerConfirmed: boolean
  sellerAmount?: number
  pendingMilestones?: number
  submittedMilestones?: number
  expiresAt?: string
  unreadNotifications?: number
  showAll?: boolean
}

interface Badge {
  type: 'action' | 'warning' | 'info' | 'success' | 'danger' | 'notification'
  message: string
  icon: string
  count?: number
}

export default function EscrowActionBadges({
  escrowType,
  status,
  userRole,
  buyerDeposited,
  sellerDeposited,
  buyerConfirmed,
  sellerConfirmed,
  sellerAmount,
  pendingMilestones = 0,
  submittedMilestones = 0,
  expiresAt,
  unreadNotifications = 0,
  showAll = false
}: EscrowActionBadgesProps) {
  
  const getBadges = (): Badge[] => {
    const badges: Badge[] = []

    // Notification badge
    if (unreadNotifications > 0) {
      badges.push({
        type: 'notification',
        message: unreadNotifications.toString(),
        icon: '🔔',
        count: unreadNotifications
      })
    }

    // Timeout warning badge
    if (expiresAt && status !== 'completed' && status !== 'cancelled') {
      const expiresAtDate = new Date(expiresAt)
      const now = new Date()
      const hoursUntilExpiry = (expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilExpiry < 0) {
        badges.push({
          type: 'danger',
          message: 'Expired',
          icon: '⏰'
        })
      } else if (hoursUntilExpiry < 24) {
        badges.push({
          type: 'warning',
          message: `${Math.floor(hoursUntilExpiry)}h`,
          icon: '⏰'
        })
      } else if (hoursUntilExpiry < 72 && showAll) {
        badges.push({
          type: 'info',
          message: `${Math.floor(hoursUntilExpiry / 24)}d`,
          icon: '⏰'
        })
      }
    }

    // Disputed badge
    if (status === 'disputed') {
      badges.push({
        type: 'danger',
        message: 'Disputed',
        icon: '⚠️'
      })
    }

    // Completion badge
    if (status === 'completed') {
      badges.push({
        type: 'success',
        message: 'Completed',
        icon: '✅'
      })
    }

    // Action required badges
    if (status === 'created' || status === 'buyer_deposited' || status === 'seller_deposited') {
      if (userRole === 'buyer' && !buyerDeposited) {
        badges.push({
          type: 'action',
          message: 'Deposit',
          icon: '💰'
        })
      }
      
      if (userRole === 'seller' && !sellerDeposited && sellerAmount && sellerAmount > 0) {
        badges.push({
          type: 'action',
          message: 'Deposit',
          icon: '💰'
        })
      }
    }

    // Confirmation badges
    if ((status === 'fully_funded' || status === 'active') && escrowType === 'traditional') {
      if (userRole === 'buyer' && !buyerConfirmed) {
        badges.push({
          type: 'action',
          message: 'Confirm',
          icon: '✓'
        })
      }
      
      if (userRole === 'seller' && !sellerConfirmed) {
        badges.push({
          type: 'action',
          message: 'Confirm',
          icon: '✓'
        })
      }
    }

    // Milestone badges
    if (escrowType === 'simple_buyer') {
      if (userRole === 'buyer' && submittedMilestones > 0) {
        badges.push({
          type: 'action',
          message: 'Review',
          icon: '📋',
          count: submittedMilestones
        })
      }
      
      if (showAll && pendingMilestones > 0) {
        badges.push({
          type: 'info',
          message: 'Pending',
          icon: '⏳',
          count: pendingMilestones
        })
      }
    }

    return badges
  }

  const badges = getBadges()
  
  if (badges.length === 0) {
    return null
  }

  const getBadgeStyles = (type: Badge['type']) => {
    switch (type) {
      case 'action':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      case 'warning':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
      case 'danger':
        return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'notification':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-400'
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges.map((badge, index) => (
        <span
          key={`${badge.type}-${badge.message}-${index}`}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeStyles(badge.type)}`}
        >
          <span>{badge.icon}</span>
          <span>{badge.message}</span>
          {badge.count && badge.count > 1 && (
            <span className="ml-0.5">({badge.count})</span>
          )}
        </span>
      ))}
    </div>
  )
}
