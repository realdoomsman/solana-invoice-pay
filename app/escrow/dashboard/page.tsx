'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { formatDistanceToNow } from 'date-fns'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import EscrowStatusBadge from '@/components/EscrowStatusBadge'
import EscrowTypeDisplay from '@/components/EscrowTypeDisplay'
import EscrowActionIndicator from '@/components/EscrowActionIndicator'
import EscrowActionBadges from '@/components/EscrowActionBadges'
import LoadingSpinner from '@/components/LoadingSpinner'

import { EscrowStatus } from '@/lib/escrow/types'

interface EscrowDashboardItem {
  id: string
  escrow_type: 'traditional' | 'simple_buyer' | 'atomic_swap'
  payment_id: string
  buyer_wallet: string
  seller_wallet: string
  buyer_amount: number
  seller_amount?: number
  token: string
  status: EscrowStatus
  description?: string
  created_at: string
  expires_at?: string
  buyer_deposited: boolean
  seller_deposited: boolean
  buyer_confirmed: boolean
  seller_confirmed: boolean
  user_role: 'buyer' | 'seller'
  counterparty_wallet: string
  pending_milestones: number
  submitted_milestones: number
  unread_notifications: number
}

type FilterStatus = 'all' | 'created' | 'active' | 'completed' | 'disputed'
type FilterType = 'all' | 'traditional' | 'simple_buyer' | 'atomic_swap'
type SortBy = 'date' | 'amount' | 'status'
type SortOrder = 'asc' | 'desc'

export default function EscrowDashboard() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()
  const [escrows, setEscrows] = useState<EscrowDashboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and sorting
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    if (connected && publicKey) {
      loadEscrows()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const loadEscrows = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/escrow/list?wallet=${publicKey.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load escrows')
      }

      setEscrows(data.escrows || [])
    } catch (err: any) {
      console.error('Error loading escrows:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getActionRequired = (escrow: EscrowDashboardItem): boolean => {
    const { status, user_role, buyer_deposited, seller_deposited, buyer_confirmed, seller_confirmed, submitted_milestones } = escrow

    // Deposit required
    if (status === 'created' || status === 'buyer_deposited' || status === 'seller_deposited') {
      if (user_role === 'buyer' && !buyer_deposited) return true
      if (user_role === 'seller' && !seller_deposited && escrow.seller_amount) return true
    }

    // Confirmation required (traditional escrow)
    if (status === 'fully_funded' || status === 'active') {
      if (escrow.escrow_type === 'traditional') {
        if (user_role === 'buyer' && !buyer_confirmed) return true
        if (user_role === 'seller' && !seller_confirmed) return true
      }
    }

    // Milestone approval required (simple buyer)
    if (escrow.escrow_type === 'simple_buyer' && user_role === 'buyer' && submitted_milestones > 0) {
      return true
    }

    return false
  }

  const getActionText = (escrow: EscrowDashboardItem): string => {
    const { status, user_role, buyer_deposited, seller_deposited, buyer_confirmed, seller_confirmed, submitted_milestones } = escrow

    if (status === 'created' || status === 'buyer_deposited' || status === 'seller_deposited') {
      if (user_role === 'buyer' && !buyer_deposited) return 'Deposit Required'
      if (user_role === 'seller' && !seller_deposited && escrow.seller_amount) return 'Deposit Required'
    }

    if (status === 'fully_funded' || status === 'active') {
      if (escrow.escrow_type === 'traditional') {
        if (user_role === 'buyer' && !buyer_confirmed) return 'Confirmation Required'
        if (user_role === 'seller' && !seller_confirmed) return 'Confirmation Required'
      }
    }

    if (escrow.escrow_type === 'simple_buyer' && user_role === 'buyer' && submitted_milestones > 0) {
      return `${submitted_milestones} Milestone${submitted_milestones > 1 ? 's' : ''} to Review`
    }

    return ''
  }

  const getTimeoutWarning = (escrow: EscrowDashboardItem): { warning: boolean; message: string } => {
    if (!escrow.expires_at) return { warning: false, message: '' }

    const expiresAt = new Date(escrow.expires_at)
    const now = new Date()
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilExpiry < 0) {
      return { warning: true, message: 'Expired' }
    } else if (hoursUntilExpiry < 24) {
      return { warning: true, message: `Expires in ${Math.floor(hoursUntilExpiry)}h` }
    }

    return { warning: false, message: '' }
  }

  // Filter and sort escrows
  const getFilteredAndSortedEscrows = (): EscrowDashboardItem[] => {
    let filtered = [...escrows]

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(e => ['fully_funded', 'active'].includes(e.status))
      } else {
        filtered = filtered.filter(e => e.status === filterStatus)
      }
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.escrow_type === filterType)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = a.buyer_amount - b.buyer_amount
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }

  const filteredEscrows = getFilteredAndSortedEscrows()

  if (!connected) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-slate-400 mb-6">
              Connect your wallet to view your escrow contracts
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              My Escrows
            </h1>
            <p className="text-slate-400">
              Manage all your escrow contracts
            </p>
          </div>
          <button
            onClick={() => router.push('/create/escrow/select')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            + Create Escrow
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-1">Total Escrows</p>
            <p className="text-3xl font-bold text-white">{escrows.length}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-blue-400">
              {escrows.filter(e => ['fully_funded', 'active'].includes(e.status)).length}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-1">Action Required</p>
            <p className="text-3xl font-bold text-yellow-400">
              {escrows.filter(e => getActionRequired(e)).length}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-400">
              {escrows.filter(e => e.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Filters and Sorting */}
        {!loading && !error && escrows.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="created">Created</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="traditional">Traditional</option>
                  <option value="simple_buyer">Simple Buyer</option>
                  <option value="atomic_swap">Atomic Swap</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-slate-400">
              Showing {filteredEscrows.length} of {escrows.length} escrow{escrows.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-8">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadEscrows}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && escrows.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Escrows Yet</h2>
            <p className="text-slate-400 mb-6">
              Create your first escrow contract to get started
            </p>
            <button
              onClick={() => router.push('/create/escrow/select')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Create Escrow
            </button>
          </div>
        )}

        {/* Escrow List */}
        {!loading && !error && escrows.length > 0 && (
          <div className="space-y-4">
            {filteredEscrows.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <p className="text-slate-400 mb-4">No escrows match your filters</p>
                <button
                  onClick={() => {
                    setFilterStatus('all')
                    setFilterType('all')
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredEscrows.map((escrow) => {
              const actionRequired = getActionRequired(escrow)

              return (
                <div
                  key={escrow.id}
                  onClick={() => router.push(`/escrow/${escrow.id}`)}
                  className={`bg-slate-900/50 border rounded-xl p-6 cursor-pointer transition-all hover:border-blue-500 ${
                    actionRequired ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 
                    escrow.status === 'disputed' ? 'border-red-500/50 shadow-lg shadow-red-500/10' :
                    escrow.status === 'completed' ? 'border-green-500/30' :
                    'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">
                          {escrow.description || 'Escrow Contract'}
                        </h3>
                        <EscrowTypeDisplay type={escrow.escrow_type} />
                        <EscrowStatusBadge status={escrow.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                        <span className="font-semibold text-white">
                          {escrow.buyer_amount} {escrow.token}
                        </span>
                        <span>•</span>
                        <span>
                          {escrow.user_role === 'buyer' ? '💰 Buyer' : '🛠️ Seller'}
                        </span>
                        <span>•</span>
                        <span>
                          Created {formatDistanceToNow(new Date(escrow.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Badges */}
                    <div className="flex items-start gap-2">
                      <EscrowActionBadges
                        escrowType={escrow.escrow_type}
                        status={escrow.status}
                        userRole={escrow.user_role}
                        buyerDeposited={escrow.buyer_deposited}
                        sellerDeposited={escrow.seller_deposited}
                        buyerConfirmed={escrow.buyer_confirmed}
                        sellerConfirmed={escrow.seller_confirmed}
                        sellerAmount={escrow.seller_amount}
                        pendingMilestones={escrow.pending_milestones}
                        submittedMilestones={escrow.submitted_milestones}
                        expiresAt={escrow.expires_at}
                        unreadNotifications={escrow.unread_notifications}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-sm flex-wrap">
                      <div>
                        <span className="text-slate-500">Counterparty:</span>
                        <span className="text-slate-300 ml-2 font-mono">
                          {escrow.counterparty_wallet.slice(0, 4)}...{escrow.counterparty_wallet.slice(-4)}
                        </span>
                      </div>
                      {escrow.escrow_type === 'simple_buyer' && escrow.pending_milestones > 0 && (
                        <div className="text-slate-400">
                          {escrow.pending_milestones} milestone{escrow.pending_milestones > 1 ? 's' : ''} pending
                        </div>
                      )}
                    </div>

                    {/* Primary Action Indicator */}
                    {actionRequired && (
                      <EscrowActionIndicator
                        escrowType={escrow.escrow_type}
                        status={escrow.status}
                        userRole={escrow.user_role}
                        buyerDeposited={escrow.buyer_deposited}
                        sellerDeposited={escrow.seller_deposited}
                        buyerConfirmed={escrow.buyer_confirmed}
                        sellerConfirmed={escrow.seller_confirmed}
                        sellerAmount={escrow.seller_amount}
                        submittedMilestones={escrow.submitted_milestones}
                        expiresAt={escrow.expires_at}
                      />
                    )}
                  </div>

                  {/* Dispute Alert */}
                  {escrow.status === 'disputed' && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Dispute in Progress - Under Admin Review
                      </div>
                    </div>
                  )}
                </div>
              )
            })
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
