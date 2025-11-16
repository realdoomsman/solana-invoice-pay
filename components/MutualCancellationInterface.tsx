'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Alert } from './ui/Alert'
import { useToast } from '@/hooks/useToast'

interface CancellationRequest {
  id: string
  escrow_id: string
  requested_by: string
  requested_by_role: 'buyer' | 'seller'
  buyer_approved: boolean
  seller_approved: boolean
  buyer_approved_at?: string
  seller_approved_at?: string
  reason: string
  notes?: string
  status: 'pending' | 'approved' | 'executed' | 'rejected'
  created_at: string
}

interface MutualCancellationInterfaceProps {
  escrowId: string
  userWallet: string
  userRole: 'buyer' | 'seller' | 'observer'
  escrowStatus: string
  onCancellationExecuted?: () => void
}

export function MutualCancellationInterface({
  escrowId,
  userWallet,
  userRole,
  escrowStatus,
  onCancellationExecuted,
}: MutualCancellationInterfaceProps) {
  const [cancellationRequest, setCancellationRequest] = useState<CancellationRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const toast = useToast()

  // Load cancellation request status
  useEffect(() => {
    loadCancellationStatus()
  }, [escrowId])

  const loadCancellationStatus = async () => {
    try {
      const response = await fetch(`/api/escrow/cancel/status?escrowId=${escrowId}`)
      const data = await response.json()

      if (data.success && data.cancellationRequest) {
        setCancellationRequest(data.cancellationRequest)
      }
    } catch (error) {
      console.error('Failed to load cancellation status:', error)
    }
  }

  const handleRequestCancellation = async () => {
    if (!reason.trim() || reason.length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/escrow/cancel/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId,
          requestorWallet: userWallet,
          reason,
          notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Cancellation request sent. Waiting for counterparty approval.')
        setCancellationRequest(data.cancellationRequest)
        setShowRequestForm(false)
        setReason('')
        setNotes('')
      } else {
        toast.error(data.error || 'Failed to request cancellation')
      }
    } catch (error) {
      console.error('Request cancellation error:', error)
      toast.error('Failed to request cancellation')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveCancellation = async () => {
    if (!cancellationRequest) return

    setLoading(true)
    try {
      const response = await fetch('/api/escrow/cancel/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationId: cancellationRequest.id,
          approverWallet: userWallet,
          escrowId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.executed) {
          toast.success('Cancellation approved and executed! Refunds have been processed.')
          if (onCancellationExecuted) {
            onCancellationExecuted()
          }
        } else {
          toast.success('Cancellation approved. Waiting for counterparty.')
        }
        await loadCancellationStatus()
      } else {
        toast.error(data.error || 'Failed to approve cancellation')
      }
    } catch (error) {
      console.error('Approve cancellation error:', error)
      toast.error('Failed to approve cancellation')
    } finally {
      setLoading(false)
    }
  }

  // Don't show for completed, cancelled, or refunded escrows
  if (['completed', 'cancelled', 'refunded'].includes(escrowStatus)) {
    return null
  }

  // Observer cannot request cancellation
  if (userRole === 'observer') {
    return null
  }

  // Show existing cancellation request
  if (cancellationRequest && cancellationRequest.status === 'pending') {
    const isRequestor = cancellationRequest.requested_by === userWallet
    const hasApproved =
      (userRole === 'buyer' && cancellationRequest.buyer_approved) ||
      (userRole === 'seller' && cancellationRequest.seller_approved)
    const counterpartyApproved =
      (userRole === 'buyer' && cancellationRequest.seller_approved) ||
      (userRole === 'seller' && cancellationRequest.buyer_approved)

    return (
      <Card className="p-6 border-orange-200 bg-orange-50">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900">
                Cancellation Request Pending
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                {isRequestor ? 'You requested' : `${cancellationRequest.requested_by_role} requested`} to cancel this escrow
              </p>
            </div>
            <div className="flex items-center gap-2">
              {cancellationRequest.buyer_approved && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Buyer ✓
                </span>
              )}
              {cancellationRequest.seller_approved && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Seller ✓
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-orange-200">
            <p className="text-sm font-medium text-gray-700">Reason:</p>
            <p className="text-sm text-gray-600 mt-1">{cancellationRequest.reason}</p>
            {cancellationRequest.notes && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-3">Notes:</p>
                <p className="text-sm text-gray-600 mt-1">{cancellationRequest.notes}</p>
              </>
            )}
          </div>

          {hasApproved ? (
            <Alert variant="info">
              You have approved this cancellation.{' '}
              {counterpartyApproved
                ? 'Both parties approved - processing refunds...'
                : 'Waiting for counterparty approval.'}
            </Alert>
          ) : (
            <div className="space-y-3">
              <Alert variant="warning">
                Both parties must agree to cancel. Deposits will be refunded minus a 1% cancellation fee.
              </Alert>
              <Button
                onClick={handleApproveCancellation}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Approve Cancellation'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Show request cancellation button/form
  if (!showRequestForm) {
    return (
      <Button
        onClick={() => setShowRequestForm(true)}
        variant="outline"
        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
      >
        Request Mutual Cancellation
      </Button>
    )
  }

  // Show request form
  return (
    <Card className="p-6 border-orange-200 bg-orange-50">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-orange-900">Request Cancellation</h3>
          <p className="text-sm text-orange-700 mt-1">
            Both parties must agree to cancel. Deposits will be refunded minus a 1% cancellation fee.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Cancellation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you want to cancel this escrow (minimum 10 characters)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{reason.length} / 10 characters minimum</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={2}
          />
        </div>

        <Alert variant="warning">
          The counterparty will be notified and must approve before cancellation is executed.
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={handleRequestCancellation}
            disabled={loading || reason.length < 10}
            className="flex-1"
          >
            {loading ? 'Sending...' : 'Send Cancellation Request'}
          </Button>
          <Button
            onClick={() => {
              setShowRequestForm(false)
              setReason('')
              setNotes('')
            }}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
