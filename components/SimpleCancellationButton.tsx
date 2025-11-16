'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from './ui/Button'
import { useToast } from '@/hooks/useToast'

interface SimpleCancellationButtonProps {
  escrowId: string
  onCancelled?: () => void
}

/**
 * Simple Cancellation Button
 * Allows creator to cancel unfunded escrow
 * Requirements: 15.1
 */
export default function SimpleCancellationButton({
  escrowId,
  onCancelled,
}: SimpleCancellationButtonProps) {
  const { publicKey } = useWallet()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [canCancel, setCanCancel] = useState<boolean | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('')

  // Check if escrow can be cancelled
  const checkEligibility = async () => {
    if (!publicKey) return

    try {
      const response = await fetch(
        `/api/escrow/cancel?escrowId=${escrowId}&wallet=${publicKey.toBase58()}`
      )
      const data = await response.json()

      setCanCancel(data.canCancel)
      setCancelReason(data.reason || '')
    } catch (error) {
      console.error('Failed to check cancellation eligibility:', error)
    }
  }

  // Check eligibility on mount
  useState(() => {
    checkEligibility()
  })

  const handleCancel = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/escrow/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId,
          creatorWallet: publicKey.toBase58(),
          reason: reason.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel escrow')
      }

      toast.success(data.message || 'Escrow cancelled successfully')
      setShowConfirm(false)
      
      if (onCancelled) {
        onCancelled()
      }
    } catch (error: any) {
      console.error('Cancel escrow error:', error)
      toast.error(error.message || 'Failed to cancel escrow')
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if we know it can't be cancelled
  if (canCancel === false) {
    return null
  }

  if (!showConfirm) {
    return (
      <Button
        onClick={() => setShowConfirm(true)}
        variant="outline"
        className="border-red-500 text-red-500 hover:bg-red-50"
      >
        Cancel Escrow
      </Button>
    )
  }

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Cancel Escrow
      </h3>
      <p className="text-sm text-red-700 mb-4">
        This will cancel the escrow and refund any deposits. This action cannot be undone.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason (optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you cancelling this escrow?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCancel}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          variant="outline"
          disabled={loading}
        >
          Keep Escrow
        </Button>
      </div>
    </div>
  )
}
