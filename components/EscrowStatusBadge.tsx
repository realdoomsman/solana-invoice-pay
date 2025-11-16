import { EscrowStatus } from '@/lib/escrow/types'

interface EscrowStatusBadgeProps {
  status: EscrowStatus
  className?: string
}

export default function EscrowStatusBadge({ status, className = '' }: EscrowStatusBadgeProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'created':
        return {
          label: 'Created',
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
          icon: '📝'
        }
      case 'buyer_deposited':
        return {
          label: 'Buyer Deposited',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          icon: '💰'
        }
      case 'seller_deposited':
        return {
          label: 'Seller Deposited',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          icon: '💰'
        }
      case 'fully_funded':
        return {
          label: 'Fully Funded',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          icon: '✅'
        }
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          icon: '⚡'
        }
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          icon: '🎉'
        }
      case 'disputed':
        return {
          label: 'Disputed',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: '⚠️'
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
          icon: '❌'
        }
      case 'refunded':
        return {
          label: 'Refunded',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          icon: '↩️'
        }
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
          icon: '❓'
        }
    }
  }

  const info = getStatusInfo()

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${info.color} ${className}`}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  )
}
