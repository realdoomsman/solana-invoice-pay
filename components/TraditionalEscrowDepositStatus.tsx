'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

interface DepositStatusProps {
  escrowId: string
  escrowWallet: string
  buyerWallet: string
  sellerWallet: string
  buyerAmount: number
  sellerAmount: number
  token: string
  buyerDeposited: boolean
  sellerDeposited: boolean
  fullyFunded: boolean
  onDepositDetected?: () => void
}

export default function TraditionalEscrowDepositStatus({
  escrowId,
  escrowWallet,
  buyerWallet,
  sellerWallet,
  buyerAmount,
  sellerAmount,
  token,
  buyerDeposited,
  sellerDeposited,
  fullyFunded,
  onDepositDetected
}: DepositStatusProps) {
  const [polling, setPolling] = useState(false)

  // Poll for deposit status updates
  useEffect(() => {
    if (fullyFunded) {
      setPolling(false)
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/escrow/deposit?escrowId=${escrowId}`)
        const data = await response.json()

        if (data.success && data.fully_funded && onDepositDetected) {
          onDepositDetected()
          setPolling(false)
        }
      } catch (error) {
        console.error('Error polling deposit status:', error)
      }
    }, 5000) // Poll every 5 seconds

    setPolling(true)

    return () => {
      clearInterval(pollInterval)
      setPolling(false)
    }
  }, [escrowId, fullyFunded, onDepositDetected])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const getStatusIcon = (deposited: boolean) => {
    if (deposited) {
      return (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return (
      <svg className="w-6 h-6 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${
        fullyFunded 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
      }`}>
        <div className="flex items-center gap-3">
          {fullyFunded ? (
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <div>
            <h3 className={`font-semibold ${fullyFunded ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
              {fullyFunded ? 'Escrow Fully Funded' : 'Waiting for Deposits'}
            </h3>
            <p className={`text-sm ${fullyFunded ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {fullyFunded 
                ? 'Both parties have deposited. Escrow is now active.' 
                : 'Waiting for both parties to deposit their funds.'}
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Buyer Deposit */}
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-2 ${
          buyerDeposited ? 'border-green-500' : 'border-slate-300 dark:border-slate-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">Buyer Deposit</h4>
            {getStatusIcon(buyerDeposited)}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount Required</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {buyerAmount} {token}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Buyer Wallet</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate flex-1">
                  {buyerWallet}
                </p>
                <button
                  onClick={() => copyToClipboard(buyerWallet, 'Buyer wallet')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {buyerDeposited ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✓ Deposit Confirmed
                </p>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Send {buyerAmount} {token} to:
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-slate-900 dark:text-white truncate flex-1">
                      {escrowWallet}
                    </p>
                    <button
                      onClick={() => copyToClipboard(escrowWallet, 'Escrow wallet')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* QR Code for Buyer */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <QRCodeSVG 
                      value={`solana:${escrowWallet}?amount=${buyerAmount}&label=Escrow%20Deposit`} 
                      size={150} 
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Seller Deposit */}
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-2 ${
          sellerDeposited ? 'border-green-500' : 'border-slate-300 dark:border-slate-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">Seller Security Deposit</h4>
            {getStatusIcon(sellerDeposited)}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount Required</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {sellerAmount} {token}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Seller Wallet</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate flex-1">
                  {sellerWallet}
                </p>
                <button
                  onClick={() => copyToClipboard(sellerWallet, 'Seller wallet')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {sellerDeposited ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✓ Deposit Confirmed
                </p>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Send {sellerAmount} {token} to:
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-slate-900 dark:text-white truncate flex-1">
                      {escrowWallet}
                    </p>
                    <button
                      onClick={() => copyToClipboard(escrowWallet, 'Escrow wallet')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                    </button>
                  </div>
                </div>

                {/* QR Code for Seller */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <QRCodeSVG 
                      value={`solana:${escrowWallet}?amount=${sellerAmount}&label=Security%20Deposit`} 
                      size={150} 
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Escrow Wallet Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Escrow Wallet Address
        </h4>
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono text-blue-800 dark:text-blue-200 break-all flex-1">
            {escrowWallet}
          </p>
          <button
            onClick={() => copyToClipboard(escrowWallet, 'Escrow wallet')}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
          >
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
          Both parties should send their deposits to this address. The funds are held securely until both parties confirm completion.
        </p>
      </div>
    </div>
  )
}
