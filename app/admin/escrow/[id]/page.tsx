'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import AdminAuditLog from '@/components/AdminAuditLog'
import DisputeResolutionInterface, { ResolutionData } from '@/components/DisputeResolutionInterface'

export default function AdminEscrowDetail() {
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const [escrow, setEscrow] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [evidence, setEvidence] = useState<any[]>([])
  const [adminActions, setAdminActions] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [adminWallets] = useState<string[]>([
    process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
  ])

  useEffect(() => {
    if (params.id) {
      loadEscrowDetails()
    }
  }, [params.id])

  const loadEscrowDetails = async () => {
    try {
      const response = await fetch(`/api/admin/escrow/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setEscrow(data.escrow)
        setMilestones(data.milestones)
        setActions(data.actions)
        setEvidence(data.evidence)
        setAdminActions(data.adminActions)
      }

      // Load disputes for this escrow
      const disputesResponse = await fetch(`/api/admin/escrow/disputes?escrowId=${params.id}`)
      const disputesData = await disputesResponse.json()
      if (disputesData.success) {
        setDisputes(disputesData.disputes || [])
      }
    } catch (error) {
      console.error('Error loading escrow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseFunds = async (milestoneId: string) => {
    if (!publicKey) return
    
    const notes = prompt('Add notes about this release decision:')
    if (!notes) return

    setProcessing(true)
    try {
      // Admin approves release
      const response = await fetch('/api/admin/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          adminWallet: publicKey.toString(),
          notes,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert(`Funds released! Transaction: ${result.signature}`)
        await loadEscrowDetails()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error releasing funds:', error)
      alert('Failed to release funds')
    } finally {
      setProcessing(false)
    }
  }

  const handleRefund = async (milestoneId: string | null) => {
    if (!publicKey) return
    
    const notes = prompt('Add notes about this refund decision:')
    if (!notes) return

    if (!confirm('Refund funds to buyer? This cannot be undone.')) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/escrow/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: params.id,
          milestoneId,
          adminWallet: publicKey.toString(),
          notes,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert(`Refund processed! Transaction: ${result.signature}`)
        await loadEscrowDetails()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      alert('Failed to process refund')
    } finally {
      setProcessing(false)
    }
  }

  const handleResolveDispute = async (resolutionData: ResolutionData) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/escrow/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolutionData),
      })

      const result = await response.json()
      if (result.success) {
        alert('Dispute resolved successfully!')
        setShowResolutionModal(false)
        setSelectedDispute(null)
        await loadEscrowDetails()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      alert('Failed to resolve dispute')
    } finally {
      setProcessing(false)
    }
  }

  const isAdmin = publicKey && adminWallets.includes(publicKey.toString())

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading escrow details...</p>
        </div>
      </div>
    )
  }

  if (!publicKey || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Unauthorized
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Admin access required
          </p>
          <WalletMultiButton />
        </div>
      </div>
    )
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Escrow Not Found
          </h1>
          <button
            onClick={() => router.push('/admin/escrow')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <button
              onClick={() => router.push('/admin/escrow')}
              className="text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {escrow.description || 'Escrow Review'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Escrow ID: {escrow.id}
            </p>
          </div>
          <WalletMultiButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Escrow Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Escrow Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Amount</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {escrow.total_amount} {escrow.token}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Status</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {escrow.status}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Buyer</div>
                  <div className="font-mono text-xs text-slate-900 dark:text-white">
                    {escrow.buyer_wallet}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Seller</div>
                  <div className="font-mono text-xs text-slate-900 dark:text-white">
                    {escrow.seller_wallet}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Created</div>
                  <div className="text-slate-900 dark:text-white">
                    {new Date(escrow.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Funded</div>
                  <div className="text-slate-900 dark:text-white">
                    {escrow.funded_at ? new Date(escrow.funded_at).toLocaleString() : 'Not funded'}
                  </div>
                </div>
              </div>
            </div>

            {/* Disputes */}
            {disputes.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Active Disputes
                </h2>
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                              {dispute.priority.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                              {dispute.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                            {dispute.reason}
                          </h3>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {dispute.description}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Raised by {dispute.party_role} on {new Date(dispute.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute)
                            setShowResolutionModal(true)
                          }}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Resolve Dispute →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Milestones
              </h2>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Milestone {index + 1}: {milestone.description}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {milestone.amount} {escrow.token} ({milestone.percentage}%)
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          milestone.status === 'released'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : milestone.status === 'approved'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : milestone.status === 'disputed'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {milestone.status}
                      </span>
                    </div>

                    {milestone.seller_notes && (
                      <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                        <strong>Seller notes:</strong> {milestone.seller_notes}
                      </div>
                    )}

                    {milestone.buyer_notes && (
                      <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                        <strong>Buyer notes:</strong> {milestone.buyer_notes}
                      </div>
                    )}

                    {milestone.status === 'approved' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleReleaseFunds(milestone.id)}
                          disabled={processing}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50"
                        >
                          ✓ Release {milestone.amount} {escrow.token} to Seller
                        </button>
                        <button
                          onClick={() => handleRefund(milestone.id)}
                          disabled={processing}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50"
                        >
                          Refund to Buyer
                        </button>
                      </div>
                    )}

                    {milestone.status === 'released' && milestone.tx_signature && (
                      <a
                        href={`https://explorer.solana.com/tx/${milestone.tx_signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Transaction →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence */}
            {evidence.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Evidence Submitted
                </h2>
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.party_role === 'buyer' ? 'Buyer' : 'Seller'}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                            {item.evidence_type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {item.description}
                      </p>
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                        >
                          View Attachment →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Audit Log for this Escrow */}
            <div className="mt-6">
              <AdminAuditLog escrowId={params.id as string} limit={20} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Actions History */}
            {adminActions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Admin Actions
                </h2>
                <div className="space-y-3">
                  {adminActions.map((action) => (
                    <div
                      key={action.id}
                      className="text-sm border-l-2 border-blue-500 pl-3"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {action.action}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {action.notes}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(action.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Activity Log
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="text-sm border-l-2 border-slate-300 dark:border-slate-600 pl-3"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {action.action}
                    </div>
                    {action.notes && (
                      <div className="text-slate-600 dark:text-slate-400">
                        {action.notes}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(action.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Modal */}
        {showResolutionModal && selectedDispute && publicKey && (
          <DisputeResolutionInterface
            dispute={selectedDispute}
            escrow={{
              id: escrow.id,
              total_amount: escrow.total_amount,
              buyer_amount: escrow.buyer_amount || escrow.total_amount,
              token: escrow.token,
              buyer_wallet: escrow.buyer_wallet,
              seller_wallet: escrow.seller_wallet,
            }}
            adminWallet={publicKey.toString()}
            onResolve={handleResolveDispute}
            onCancel={() => {
              setShowResolutionModal(false)
              setSelectedDispute(null)
            }}
            processing={processing}
          />
        )}
      </div>
    </div>
  )
}
