'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface MilestoneApprovalProps {
  milestone: {
    id: string
    description: string
    percentage: number
    amount: number
    status: string
    milestone_order: number
    seller_notes?: string
    seller_evidence_urls?: string[]
    seller_submitted_at?: string
  }
  escrowId: string
  buyerWallet: string
  token: string
  onApprovalSuccess: () => void
  onDisputeClick: () => void
  onCancel: () => void
}

export default function MilestoneApproval({
  milestone,
  escrowId,
  buyerWallet,
  token,
  onApprovalSuccess,
  onDisputeClick,
  onCancel,
}: MilestoneApprovalProps) {
  const [notes, setNotes] = useState('')
  const [approving, setApproving] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    const loadingToast = toast.loading('Approving milestone and releasing funds...')

    try {
      const response = await fetch('/api/escrow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: milestone.id,
          buyerWallet,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve milestone')
      }

      if (data.signature) {
        toast.success(
          data.escrowCompleted 
            ? '🎉 All milestones completed! Escrow finished.' 
            : '✓ Milestone approved and funds released!',
          { id: loadingToast, duration: 5000 }
        )
      } else {
        toast.success('Milestone approved!', { id: loadingToast })
      }

      onApprovalSuccess()
    } catch (error: any) {
      console.error('Approve milestone error:', error)
      toast.error(error.message || 'Failed to approve milestone', { id: loadingToast })
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full border border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Review Submitted Work</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded font-medium">
              Milestone #{milestone.milestone_order}
            </span>
            <span className="text-slate-400">{milestone.description}</span>
          </div>
          <div className="mt-2 text-slate-400 text-sm">
            Payment: {milestone.amount} {token} ({milestone.percentage}%)
          </div>
        </div>

        {/* Submitted Work Details */}
        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-400 text-lg">📋</span>
            <h4 className="text-white font-semibold">Seller's Submission</h4>
          </div>
          
          {milestone.seller_submitted_at && (
            <div className="text-xs text-slate-500 mb-3">
              Submitted {new Date(milestone.seller_submitted_at).toLocaleString()}
            </div>
          )}

          {milestone.seller_notes ? (
            <div className="mb-4">
              <div className="text-slate-400 text-xs mb-2">Work Description:</div>
              <div className="text-white text-sm whitespace-pre-wrap bg-slate-900 p-3 rounded border border-slate-700">
                {milestone.seller_notes}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm italic mb-4">
              No description provided
            </div>
          )}

          {milestone.seller_evidence_urls && milestone.seller_evidence_urls.length > 0 && (
            <div>
              <div className="text-slate-400 text-xs mb-2">Evidence Links:</div>
              <div className="space-y-2">
                {milestone.seller_evidence_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>🔗</span>
                    <span className="truncate">{url}</span>
                    <span className="text-slate-500">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Approval Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your Review Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any comments about the work quality, feedback, or approval notes..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            disabled={approving}
          />
        </div>

        {/* Milestone Progress Indicator */}
        <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-green-400 text-xl">💰</span>
            <div className="flex-1">
              <p className="text-sm text-green-300 font-medium mb-1">Payment Release</p>
              <p className="text-xs text-green-400 mb-2">
                Approving will release {milestone.amount} {token} to the seller's wallet
              </p>
              <div className="text-xs text-green-500">
                Platform fee (3%): {(milestone.amount * 0.03).toFixed(4)} {token}
                <br />
                Seller receives: {(milestone.amount * 0.97).toFixed(4)} {token}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {approving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Approve & Release Funds</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDisputeClick}
              disabled={approving}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              ⚠ Raise Dispute
            </button>
            <button
              onClick={onCancel}
              disabled={approving}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm">⚠️</span>
            <p className="text-xs text-yellow-400">
              Once approved, funds will be immediately released to the seller. This action cannot be undone. 
              If you're not satisfied with the work, raise a dispute instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
