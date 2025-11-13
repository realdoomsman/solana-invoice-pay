'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

interface EscrowQueueItem {
  id: string
  payment_id: string
  buyer_wallet: string
  seller_wallet: string
  total_amount: number
  token: string
  description: string
  escrow_status: string
  created_at: string
  funded_at: string
  open_disputes: number
  pending_releases: number
  total_milestones: number
  completed_milestones: number
  last_dispute_at: string | null
  last_approval_at: string | null
}

export default function AdminEscrowDashboard() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [escrows, setEscrows] = useState<EscrowQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adminWallets] = useState<string[]>([
    // Add your admin wallet addresses here
    process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
  ])

  useEffect(() => {
    loadEscrows()
  }, [])

  const loadEscrows = async () => {
    try {
      const response = await fetch('/api/admin/escrow/queue')
      const data = await response.json()
      if (data.success) {
        setEscrows(data.escrows)
      }
    } catch (error) {
      console.error('Error loading escrows:', error)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = publicKey && adminWallets.includes(publicKey.toString())

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connect your admin wallet to access the dashboard
          </p>
          <WalletMultiButton />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Unauthorized
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This wallet is not authorized to access the admin dashboard.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Escrow Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage escrows, review disputes, and release funds
            </p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Escrows
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {escrows.length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Open Disputes
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {escrows.reduce((sum, e) => sum + e.open_disputes, 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Pending Releases
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {escrows.reduce((sum, e) => sum + e.pending_releases, 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Value
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {escrows.reduce((sum, e) => sum + e.total_amount, 0).toFixed(2)} SOL
            </div>
          </div>
        </div>

        {/* Escrow Queue */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Escrows Needing Attention
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Loading escrows...</p>
            </div>
          ) : escrows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No escrows need attention right now. Great job! 🎉
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {escrows.map((escrow) => (
                <div
                  key={escrow.id}
                  className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {escrow.description || 'Untitled Escrow'}
                        </h3>
                        {escrow.open_disputes > 0 && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">
                            {escrow.open_disputes} Dispute{escrow.open_disputes > 1 ? 's' : ''}
                          </span>
                        )}
                        {escrow.pending_releases > 0 && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                            {escrow.pending_releases} Pending
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div>
                          <strong>Amount:</strong> {escrow.total_amount} {escrow.token}
                        </div>
                        <div>
                          <strong>Progress:</strong> {escrow.completed_milestones}/{escrow.total_milestones} milestones
                        </div>
                        <div>
                          <strong>Buyer:</strong>{' '}
                          <span className="font-mono text-xs">
                            {escrow.buyer_wallet.slice(0, 8)}...{escrow.buyer_wallet.slice(-6)}
                          </span>
                        </div>
                        <div>
                          <strong>Seller:</strong>{' '}
                          <span className="font-mono text-xs">
                            {escrow.seller_wallet.slice(0, 8)}...{escrow.seller_wallet.slice(-6)}
                          </span>
                        </div>
                        <div>
                          <strong>Created:</strong> {new Date(escrow.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/escrow/${escrow.id}`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Review →
                    </button>
                  </div>

                  {/* Priority Indicators */}
                  {escrow.open_disputes > 0 && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-300">
                        ⚠️ <strong>Dispute raised</strong>
                        {escrow.last_dispute_at && (
                          <span> - {new Date(escrow.last_dispute_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  )}
                  {escrow.pending_releases > 0 && !escrow.open_disputes && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        ✓ <strong>Buyer approved</strong> - Ready for fund release
                        {escrow.last_approval_at && (
                          <span> - {new Date(escrow.last_approval_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
