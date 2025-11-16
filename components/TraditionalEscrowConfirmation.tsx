'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface ConfirmationProps {
  escrowId: string
  buyerWallet: string
  sellerWallet: string
  buyerConfirmed: boolean
  sellerConfirmed: boolean
  fullyFunded: boolean
  status: string
  onConfirmationSuccess?: () => void
}

export default function TraditionalEscrowConfirmation({
  escrowId,
  buyerWallet,
  sellerWallet,
  buyerConfirmed,
  sellerConfirmed,
  fullyFunded,
  status,
  onConfirmationSuccess
}: ConfirmationProps) {
  const { publicKey } = useWallet()
  const [confirming, setConfirming] = useState(false)
  const [notes, setNotes] = useState('')
  const [showNotesInput, setShowNotesInput] = useState(false)

  const userWallet = publicKey?.toBase58()
  const isBuyer = userWallet === buyerWallet
  const isSeller = userWallet === sellerWallet
  const isParty = isBuyer || isSeller

  const userConfirmed = isBuyer ? buyerConfirmed : sellerConfirmed
  const counterpartyConfirmed = isBuyer ? sellerConfirmed : buyerConfirmed
  const bothConfirmed = buyerConfirmed && sellerConfirmed

  const handleConfirm = async () => {
    if (!userWallet) {
      toast.error('Please connect your wallet')
      return
    }

    if (!isParty) {
      toast.error('Only the buyer or seller can confirm')
      return
    }

    if (userConfirmed) {
      toast.error('You have already confirmed')
      return
    }

    const loadingToast = toast.loading('Confirming transaction...')
    setConfirming(true)

    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId,
          confirmerWallet: userWallet,
          notes: notes || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm')
      }

      toast.success('Confirmation recorded successfully!', { id: loadingToast })
      setShowNotesInput(false)
      setNotes('')

      if (onConfirmationSuccess) {
        onConfirmationSuccess()
      }
    } catch (error: any) {
      console.error('Confirmation error:', error)
      toast.error(`Failed to confirm: ${error.message}`, { id: loadingToast })
    } finally {
      setConfirming(false)
    }
  }

  // Don't show if not fully funded
  if (!fullyFunded) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">
              Confirmation Locked
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Both parties must deposit before confirmation is available
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show completion status if both confirmed
  if (bothConfirmed) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border-2 border-green-500">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Both Parties Confirmed
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Funds have been released automatically
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-slate-900 dark:text-white">Buyer Confirmed</span>
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
              {buyerWallet}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-slate-900 dark:text-white">Seller Confirmed</span>
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
              {sellerWallet}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-2 border-slate-300 dark:border-slate-600">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
        Transaction Confirmation
      </h3>

      <div className="space-y-4">
        {/* Confirmation Status */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Buyer Status */}
          <div className={`rounded-lg p-4 border-2 ${
            buyerConfirmed 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {buyerConfirmed ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={`font-medium ${
                buyerConfirmed 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                Buyer {buyerConfirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
              {buyerWallet}
            </p>
          </div>

          {/* Seller Status */}
          <div className={`rounded-lg p-4 border-2 ${
            sellerConfirmed 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {sellerConfirmed ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={`font-medium ${
                sellerConfirmed 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                Seller {sellerConfirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
              {sellerWallet}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How Confirmation Works:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Both parties must confirm successful transaction completion</li>
            <li>Once both confirm, funds are automatically released</li>
            <li>Buyer payment goes to seller</li>
            <li>Seller security deposit is returned to seller</li>
          </ul>
        </div>

        {/* Action Area */}
        {isParty && !userConfirmed && (
          <div className="space-y-3">
            {!showNotesInput ? (
              <button
                onClick={() => setShowNotesInput(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Confirm Transaction Complete
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Optional Notes (visible to counterparty)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about the transaction..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirming ? 'Confirming...' : 'Confirm Now'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNotesInput(false)
                      setNotes('')
                    }}
                    disabled={confirming}
                    className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isParty && userConfirmed && !counterpartyConfirmed && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Waiting for {isBuyer ? 'seller' : 'buyer'} confirmation
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You've confirmed. Funds will release once the other party confirms.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isParty && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Only the buyer or seller can confirm this transaction
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
