'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Alert } from './ui/Alert'

interface MultiSigTransaction {
  id: string
  escrow_id: string
  multisig_wallet: string
  provider: string
  required_signatures: number
  current_signatures: number
  signed_by: string[]
  status: 'pending' | 'partially_signed' | 'ready' | 'executed' | 'cancelled'
  created_at: string
}

interface MultiSigTransactionStatusProps {
  escrowId: string
  userWallet?: string
  onSignatureAdded?: () => void
}

export default function MultiSigTransactionStatus({
  escrowId,
  userWallet,
  onSignatureAdded
}: MultiSigTransactionStatusProps) {
  const [transactions, setTransactions] = useState<MultiSigTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [escrowId])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/escrow/multisig/${escrowId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load multi-sig transactions')
      }
      
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err: any) {
      console.error('Load transactions error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async (transactionId: string) => {
    if (!userWallet) {
      setError('Please connect your wallet to sign')
      return
    }

    try {
      setSigning(transactionId)
      setError(null)

      const response = await fetch(`/api/escrow/multisig/${transactionId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerWallet: userWallet })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record signature')
      }

      // Reload transactions
      await loadTransactions()
      
      if (onSignatureAdded) {
        onSignatureAdded()
      }
    } catch (err: any) {
      console.error('Sign error:', err)
      setError(err.message)
    } finally {
      setSigning(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
      pending: 'warning',
      partially_signed: 'warning',
      ready: 'success',
      executed: 'default',
      cancelled: 'danger'
    }

    const labels: Record<string, string> = {
      pending: 'Pending Signatures',
      partially_signed: 'Partially Signed',
      ready: 'Ready to Execute',
      executed: 'Executed',
      cancelled: 'Cancelled'
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const canUserSign = (tx: MultiSigTransaction): boolean => {
    if (!userWallet) return false
    if (tx.status === 'executed' || tx.status === 'cancelled') return false
    if (tx.signed_by.includes(userWallet)) return false
    return true
  }

  const hasUserSigned = (tx: MultiSigTransaction): boolean => {
    return userWallet ? tx.signed_by.includes(userWallet) : false
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Multi-Signature Transactions
      </h3>

      {error && (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </Alert>
      )}

      {transactions.map((tx) => (
        <Card key={tx.id} className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">
                    Multi-Sig Transaction
                  </h4>
                  {getStatusBadge(tx.status)}
                </div>
                <p className="text-sm text-gray-500">
                  Provider: {tx.provider.charAt(0).toUpperCase() + tx.provider.slice(1)}
                </p>
              </div>
            </div>

            {/* Signature Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Signatures Collected
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {tx.current_signatures} / {tx.required_signatures}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(tx.current_signatures / tx.required_signatures) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Signers List */}
            {tx.signed_by.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Signed By:
                </p>
                <div className="space-y-1">
                  {tx.signed_by.map((signer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-mono text-xs">
                        {signer.slice(0, 4)}...{signer.slice(-4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Signatures */}
            {tx.current_signatures < tx.required_signatures && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ... Waiting for {tx.required_signatures - tx.current_signatures} more{' '}
                  {tx.required_signatures - tx.current_signatures === 1 ? 'signature' : 'signatures'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {canUserSign(tx) && (
                <Button
                  onClick={() => handleSign(tx.id)}
                  disabled={signing === tx.id}
                  className="flex-1"
                >
                  {signing === tx.id ? 'Signing...' : 'Sign Transaction'}
                </Button>
              )}

              {hasUserSigned(tx) && (
                <div className="flex-1 flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  You have signed this transaction
                </div>
              )}

              {tx.status === 'ready' && (
                <div className="flex-1 flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Ready to execute
                </div>
              )}
            </div>

            {/* Transaction Info */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              <p>Multi-sig wallet: {tx.multisig_wallet.slice(0, 8)}...{tx.multisig_wallet.slice(-8)}</p>
              <p>Created: {new Date(tx.created_at).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
