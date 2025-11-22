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
  disputed_milestones: number
  total_milestones: number
  completed_milestones: number
  last_dispute_at: string | null
  last_approval_at: string | null
}

interface DisputeQueueItem {
  id: string
  escrow_id: string
  raised_by: string
  party_role: string
  reason: string
  description: string
  status: string
  priority: string
  created_at: string
  evidence_count: number
  buyer_evidence_count: number
  seller_evidence_count: number
  escrow_contracts: any
}

interface OverviewStats {
  total_escrow_volume: number
  volume_by_token: Record<string, number>
  dispute_rate: number
  avg_resolution_time_hours: number
  active_escrows_count: number
  total_escrows: number
  total_disputes: number
  completion_rate: number
  avg_escrow_duration_hours: number
  escrows_by_type: {
    traditional: number
    simple_buyer: number
    atomic_swap: number
  }
  escrows_by_status: Record<string, number>
  disputes_by_status: Record<string, number>
  recent_activity: {
    new_escrows_7d: number
    new_disputes_7d: number
    completed_escrows_7d: number
  }
}

export default function AdminEscrowDashboard() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [escrows, setEscrows] = useState<EscrowQueueItem[]>([])
  const [disputes, setDisputes] = useState<DisputeQueueItem[]>([])
  const [disputeStats, setDisputeStats] = useState<any>(null)
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'disputes' | 'escrows'>('overview')
  const [adminWallets] = useState<string[]>([
    // Add your admin wallet addresses here
    process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
  ])

  useEffect(() => {
    loadOverview()
    loadEscrows()
    loadDisputes()
  }, [])

  const loadOverview = async () => {
    try {
      const response = await fetch('/api/admin/escrow/overview')
      const data = await response.json()
      if (data.success) {
        setOverviewStats(data.overview)
      }
    } catch (error) {
      console.error('Error loading overview:', error)
    }
  }

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

  const loadDisputes = async () => {
    try {
      const response = await fetch('/api/admin/escrow/disputes')
      const data = await response.json()
      if (data.success) {
        setDisputes(data.disputes)
        setDisputeStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading disputes:', error)
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

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'disputes'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Dispute Queue {disputeStats && `(${disputeStats.total})`}
          </button>
          <button
            onClick={() => setActiveTab('escrows')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'escrows'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All Escrows ({escrows.length})
          </button>
          <button
            onClick={() => router.push('/admin/escrow/audit-log')}
            className="px-6 py-3 rounded-lg font-semibold transition-colors bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Audit Log
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overviewStats && (
          <>
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="text-sm opacity-90 mb-1">
                  Total Escrow Volume
                </div>
                <div className="text-3xl font-bold mb-2">
                  {overviewStats.total_escrow_volume.toFixed(2)} SOL
                </div>
                <div className="text-xs opacity-75">
                  Across {overviewStats.total_escrows} escrows
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="text-sm opacity-90 mb-1">
                  Active Escrows
                </div>
                <div className="text-3xl font-bold mb-2">
                  {overviewStats.active_escrows_count}
                </div>
                <div className="text-xs opacity-75">
                  Currently in progress
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                <div className="text-sm opacity-90 mb-1">
                  Dispute Rate
                </div>
                <div className="text-3xl font-bold mb-2">
                  {overviewStats.dispute_rate}%
                </div>
                <div className="text-xs opacity-75">
                  {overviewStats.total_disputes} total disputes
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="text-sm opacity-90 mb-1">
                  Avg Resolution Time
                </div>
                <div className="text-3xl font-bold mb-2">
                  {overviewStats.avg_resolution_time_hours.toFixed(1)}h
                </div>
                <div className="text-xs opacity-75">
                  For resolved disputes
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Escrow Types
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Traditional</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {overviewStats.escrows_by_type.traditional}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Simple Buyer</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {overviewStats.escrows_by_type.simple_buyer}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Atomic Swap</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {overviewStats.escrows_by_type.atomic_swap}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Completion Rate</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {overviewStats.completion_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Avg Duration</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {overviewStats.avg_escrow_duration_hours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Completed</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {overviewStats.escrows_by_status.completed || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Recent Activity (7 days)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">New Escrows</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {overviewStats.recent_activity.new_escrows_7d}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">New Disputes</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {overviewStats.recent_activity.new_disputes_7d}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Completed</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {overviewStats.recent_activity.completed_escrows_7d}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume by Token */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Volume by Token
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(overviewStats.volume_by_token).map(([token, volume]) => (
                  <div key={token} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {token}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {(volume as number).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute Status Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Dispute Status Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">
                    Open
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {overviewStats.disputes_by_status.open || 0}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    Under Review
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {overviewStats.disputes_by_status.under_review || 0}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                    Resolved
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {overviewStats.disputes_by_status.resolved || 0}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Closed
                  </div>
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {overviewStats.disputes_by_status.closed || 0}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Stats */}
        {activeTab === 'disputes' && disputeStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Total Disputes
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {disputeStats.total}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Urgent Priority
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {disputeStats.by_priority.urgent}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Under Review
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {disputeStats.by_status.under_review}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Open
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {disputeStats.by_status.open}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'escrows' && (
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
                Disputed Milestones
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {escrows.reduce((sum, e) => sum + (e.disputed_milestones || 0), 0)}
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
        )}

        {/* Dispute Queue */}
        {activeTab === 'disputes' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Dispute Queue
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Review disputes, examine evidence from both parties, and make resolution decisions
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400 mt-4">Loading disputes...</p>
              </div>
            ) : disputes.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  No active disputes. All escrows are running smoothly!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {disputes.map((dispute) => {
                  const escrow = dispute.escrow_contracts
                  const priorityColors = {
                    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
                    normal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                    low: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400',
                  }

                  return (
                    <div
                      key={dispute.id}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {escrow?.description || 'Untitled Escrow'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[dispute.priority as keyof typeof priorityColors]}`}>
                              {dispute.priority.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs font-semibold rounded-full">
                              {dispute.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                              Reason: {dispute.reason}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              {dispute.description}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                              Raised by {dispute.party_role} on {new Date(dispute.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <div>
                              <strong>Escrow Type:</strong> {escrow?.escrow_type?.replace('_', ' ')}
                            </div>
                            <div>
                              <strong>Amount:</strong> {escrow?.buyer_amount} {escrow?.token}
                            </div>
                            <div>
                              <strong>Evidence:</strong> {dispute.buyer_evidence_count} from buyer, {dispute.seller_evidence_count} from seller ({dispute.evidence_count} total)
                            </div>
                            <div>
                              <strong>Buyer:</strong>{' '}
                              <span className="font-mono text-xs">
                                {escrow?.buyer_wallet?.slice(0, 8)}...{escrow?.buyer_wallet?.slice(-6)}
                              </span>
                            </div>
                            <div>
                              <strong>Seller:</strong>{' '}
                              <span className="font-mono text-xs">
                                {escrow?.seller_wallet?.slice(0, 8)}...{escrow?.seller_wallet?.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/escrow/${escrow?.id}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Review & Resolve →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Escrow Queue */}
        {activeTab === 'escrows' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Disputed Escrows
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Only escrows with active disputes are shown. Normal escrows auto-release.
              </p>
            </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Loading escrows...</p>
            </div>
          ) : escrows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No disputes right now. All escrows are running smoothly!
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Normal escrows auto-release when buyer approves. You only see disputes here.
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
                        {(escrow.disputed_milestones || 0) > 0 && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">
                            {escrow.disputed_milestones} Disputed
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
                        <strong>Dispute raised</strong>
                        {escrow.last_dispute_at && (
                          <span> - {new Date(escrow.last_dispute_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
