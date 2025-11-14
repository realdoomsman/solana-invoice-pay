'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'

interface EscrowItem {
  id: string
  description: string
  amount: number
  token: string
  status: string
  role: 'buyer' | 'seller'
  created_at: string
}

export function EscrowList() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [escrows, setEscrows] = useState<EscrowItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (publicKey) {
      loadEscrows()
    }
  }, [publicKey])

  const loadEscrows = () => {
    // Load from localStorage for now
    const payments = JSON.parse(localStorage.getItem('payments') || '[]')
    const escrowPayments = payments
      .filter((p: any) => p.type === 'escrow')
      .map((p: any) => ({
        id: p.id,
        description: p.description,
        amount: p.amount,
        token: p.token,
        status: p.status,
        role: publicKey?.toString() === p.merchantWallet ? 'seller' : 'buyer',
        created_at: p.createdAt,
      }))
    
    setEscrows(escrowPayments)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'funded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'disputed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  if (!publicKey) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400">Connect wallet to view escrows</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (escrows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">No escrow contracts yet</p>
        <button
          onClick={() => router.push('/create/escrow')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          Create Escrow
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {escrows.map((escrow) => (
        <div
          key={escrow.id}
          onClick={() => router.push(`/escrow/${escrow.id}`)}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                {escrow.description || 'Escrow Contract'}
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {escrow.amount} {escrow.token} • {escrow.role === 'buyer' ? '💰 Buyer' : '🛠️ Seller'}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(escrow.status)}`}>
              {escrow.status.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            Created {new Date(escrow.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )
}
