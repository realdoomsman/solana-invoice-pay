'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminAction {
  id: string
  escrow_id: string
  dispute_id: string | null
  milestone_id: string | null
  admin_wallet: string
  action: string
  decision: string | null
  amount_to_buyer: number | null
  amount_to_seller: number | null
  tx_signature_buyer: string | null
  tx_signature_seller: string | null
  notes: string
  metadata: any
  created_at: string
  escrow_contracts?: {
    id: string
    payment_id: string
    buyer_wallet: string
    seller_wallet: string
    total_amount: number
    token: string
    description: string
    status: string
    escrow_type: string
  }
  escrow_disputes?: {
    id: string
    reason: string
    status: string
    raised_by: string
    party_role: string
  }
}

interface AuditLogStats {
  total_actions: number
  by_action: Record<string, number>
  by_admin: Record<string, number>
  by_decision: Record<string, number>
}

interface AdminAuditLogProps {
  escrowId?: string
  disputeId?: string
  limit?: number
}

export default function AdminAuditLog({ escrowId, disputeId, limit = 50 }: AdminAuditLogProps) {
  const router = useRouter()
  const [auditLog, setAuditLog] = useState<AdminAction[]>([])
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    action: '',
    adminWallet: '',
  })
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadAuditLog()
  }, [escrowId, disputeId, filter, offset])

  const loadAuditLog = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (escrowId) params.append('escrow_id', escrowId)
      if (disputeId) params.append('dispute_id', disputeId)
      if (filter.action) params.append('action', filter.action)
      if (filter.adminWallet) params.append('admin_wallet', filter.adminWallet)

      const response = await fetch(`/api/admin/escrow/audit-log?${params}`)
      const data = await response.json()

      if (data.success) {
        setAuditLog(data.audit_log)
        setStats(data.stats)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error loading audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      resolved_dispute: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      reviewed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      approved_release: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      approved_refund: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      requested_more_info: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    }
    return colors[action] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
  }

  const getDecisionBadgeColor = (decision: string) => {
    const colors: Record<string, string> = {
      release_to_seller: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      refund_to_buyer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      partial_split: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      other: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400',
    }
    return colors[decision] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
  }

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && auditLog.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading audit log...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && !escrowId && !disputeId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Actions
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total_actions}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Disputes Resolved
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.by_action.resolved_dispute || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Active Admins
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(stats.by_admin).length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Releases to Seller
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.by_decision.release_to_seller || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!escrowId && !disputeId && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Filter by Action
              </label>
              <select
                value={filter.action}
                onChange={(e) => {
                  setFilter({ ...filter, action: e.target.value })
                  setOffset(0)
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="resolved_dispute">Resolved Dispute</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved_release">Approved Release</option>
                <option value="approved_refund">Approved Refund</option>
                <option value="requested_more_info">Requested More Info</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Filter by Admin
              </label>
              <select
                value={filter.adminWallet}
                onChange={(e) => {
                  setFilter({ ...filter, adminWallet: e.target.value })
                  setOffset(0)
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Admins</option>
                {stats && Object.keys(stats.by_admin).map((wallet) => (
                  <option key={wallet} value={wallet}>
                    {formatWallet(wallet)} ({stats.by_admin[wallet]} actions)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Admin Audit Log
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Complete history of all admin actions and resolutions
          </p>
        </div>

        {auditLog.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              No admin actions recorded yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {auditLog.map((action) => (
              <div
                key={action.id}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(action.action)}`}>
                      {action.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {action.decision && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDecisionBadgeColor(action.decision)}`}>
                        {action.decision.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(action.created_at)}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Admin Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Admin:
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {formatWallet(action.admin_wallet)}
                    </span>
                  </div>

                  {/* Escrow Info */}
                  {action.escrow_contracts && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Escrow:
                      </span>{' '}
                      <button
                        onClick={() => router.push(`/admin/escrow/${action.escrow_id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {action.escrow_contracts.description || action.escrow_contracts.payment_id}
                      </button>
                      {' '}
                      <span className="text-slate-600 dark:text-slate-400">
                        ({action.escrow_contracts.total_amount} {action.escrow_contracts.token})
                      </span>
                    </div>
                  )}

                  {/* Dispute Info */}
                  {action.escrow_disputes && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Dispute:
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-400">
                        {action.escrow_disputes.reason} (raised by {action.escrow_disputes.party_role})
                      </span>
                    </div>
                  )}

                  {/* Amounts */}
                  {(action.amount_to_buyer !== null || action.amount_to_seller !== null) && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Distribution:
                      </span>{' '}
                      {action.amount_to_buyer !== null && action.amount_to_buyer > 0 && (
                        <span className="text-blue-600 dark:text-blue-400">
                          {action.amount_to_buyer} to buyer
                        </span>
                      )}
                      {action.amount_to_buyer !== null && action.amount_to_buyer > 0 && 
                       action.amount_to_seller !== null && action.amount_to_seller > 0 && (
                        <span className="text-slate-600 dark:text-slate-400"> • </span>
                      )}
                      {action.amount_to_seller !== null && action.amount_to_seller > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          {action.amount_to_seller} to seller
                        </span>
                      )}
                    </div>
                  )}

                  {/* Transaction Signatures */}
                  {(action.tx_signature_buyer || action.tx_signature_seller) && (
                    <div className="text-sm space-y-1">
                      {action.tx_signature_buyer && (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Buyer TX:
                          </span>{' '}
                          <a
                            href={`https://explorer.solana.com/tx/${action.tx_signature_buyer}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {formatWallet(action.tx_signature_buyer)}
                          </a>
                        </div>
                      )}
                      {action.tx_signature_seller && (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Seller TX:
                          </span>{' '}
                          <a
                            href={`https://explorer.solana.com/tx/${action.tx_signature_seller}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {formatWallet(action.tx_signature_seller)}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Notes:
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {action.notes}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} actions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
