'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import EscrowStatusBadge from './EscrowStatusBadge'
import EscrowActionIndicator from './EscrowActionIndicator'
import { EscrowStatus } from '@/lib/escrow/types'

interface EscrowItem {
  id: string
  description: string
  amount: number
  token: string
  status: EscrowStatus
  role: 'buyer' | 'seller'
  created_at: string
  escrow_type?: 'traditional' | 'simple_buyer' | 'atomic_swap'
  buyer_deposited?: boolean
  seller_deposited?: boolean
  buyer_confirmed?: boolean
  seller_confirmed?: boolean
  seller_amount?: number
  submitted_milestones?: number
  expires_at?: string
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

  const getActionRequired = (escrow: EscrowItem): boolean => {
    const { status, role, buyer_deposited, seller_deposited, buyer_confirmed, seller_confirmed, submitted_milestones, escrow_type } = escrow

    // Deposit required
    if (status === 'created' || status === 'buyer_deposited' || status === 'seller_deposited') {
      if (role === 'buyer' && !buyer_deposited) return true
      if (role === 'seller' && !seller_deposited && escrow.seller_amount) return true
    }

    // Confirmation required (traditional escrow)
    if (status === 'fully_funded' || status === 'active') {
      if (escrow_type === 'traditional') {
        if (role === 'buyer' && !buyer_confirmed) return true
        if (role === 'seller' && !seller_confirmed) return true
      }
    }

    // Milestone approval required (simple buyer)
    if (escrow_type === 'simple_buyer' && role === 'buyer' && submitted_milestones && submitted_milestones > 0) {
      return true
    }

    return false
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
      {escrows.map((escrow) => {
        const actionRequired = getActionRequired(escrow)
        
        return (
          <div
            key={escrow.id}
            onClick={() => router.push(`/escrow/${escrow.id}`)}
            className={`bg-white dark:bg-slate-800 rounded-xl p-6 border cursor-pointer transition-all ${
              actionRequired 
                ? 'border-yellow-500/50 dark:border-yellow-500/50 shadow-lg shadow-yellow-500/10' 
                : escrow.status === 'disputed'
                ? 'border-red-500/50 dark:border-red-500/50 shadow-lg shadow-red-500/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {escrow.description || 'Escrow Contract'}
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {escrow.amount} {escrow.token} • {escrow.role === 'buyer' ? 'Buyer' : '🛠️ Seller'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EscrowStatusBadge status={escrow.status} />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-500">
                Created {new Date(escrow.created_at).toLocaleDateString()}
              </div>
              
              {actionRequired && escrow.escrow_type && (
                <EscrowActionIndicator
                  escrowType={escrow.escrow_type}
                  status={escrow.status}
                  userRole={escrow.role}
                  buyerDeposited={escrow.buyer_deposited || false}
                  sellerDeposited={escrow.seller_deposited || false}
                  buyerConfirmed={escrow.buyer_confirmed || false}
                  sellerConfirmed={escrow.seller_confirmed || false}
                  sellerAmount={escrow.seller_amount}
                  submittedMilestones={escrow.submitted_milestones}
                  expiresAt={escrow.expires_at}
                  className="text-xs"
                />
              )}
            </div>

            {escrow.status === 'disputed' && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Disputed
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
