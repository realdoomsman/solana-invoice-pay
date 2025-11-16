import { EscrowType } from '@/lib/escrow/types'

interface EscrowTypeDisplayProps {
  type: EscrowType
  className?: string
}

export default function EscrowTypeDisplay({ type, className = '' }: EscrowTypeDisplayProps) {
  const getTypeInfo = () => {
    switch (type) {
      case 'traditional':
        return {
          icon: '🤝',
          label: 'Traditional Escrow',
          description: 'Both parties deposit funds',
          color: 'text-blue-400'
        }
      case 'simple_buyer':
        return {
          icon: '📋',
          label: 'Milestone-Based',
          description: 'Payment released in stages',
          color: 'text-purple-400'
        }
      case 'atomic_swap':
        return {
          icon: '🔄',
          label: 'Atomic Swap',
          description: 'Trustless token exchange',
          color: 'text-green-400'
        }
      default:
        return {
          icon: '📦',
          label: 'Unknown',
          description: '',
          color: 'text-slate-400'
        }
    }
  }

  const info = getTypeInfo()

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-2xl">{info.icon}</span>
      <div>
        <div className={`font-semibold ${info.color}`}>{info.label}</div>
        <div className="text-xs text-slate-500">{info.description}</div>
      </div>
    </div>
  )
}
