'use client'

import { useState, useEffect } from 'react'
import { EscrowContract } from '@/lib/escrow/types'

interface AtomicSwapStatusProps {
  escrow: EscrowContract
  onRefresh: () => void
}

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
  formatted: string
}

export default function AtomicSwapStatus({ escrow, onRefresh }: AtomicSwapStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    expired: false,
    formatted: ''
  })

  useEffect(() => {
    if (!escrow.expires_at) return

    const updateTimer = () => {
      const expiresAt = new Date(escrow.expires_at!)
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalMs: 0,
          expired: true,
          formatted: 'Expired'
        })
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        totalMs: diff,
        expired: false,
        formatted: `${hours}h ${minutes}m ${seconds}s`
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [escrow.expires_at])

  const partyADeposited = escrow.buyer_deposited
  const partyBDeposited = escrow.seller_deposited
  const bothDeposited = partyADeposited && partyBDeposited
  const swapExecuted = escrow.swap_executed
  
  // Calculate progress percentage
  const depositProgress = (partyADeposited ? 50 : 0) + (partyBDeposited ? 50 : 0)
  
  // Determine urgency level for timer
  const getTimerUrgency = () => {
    if (timeRemaining.expired) return 'expired'
    if (timeRemaining.totalMs < 3600000) return 'critical' // < 1 hour
    if (timeRemaining.totalMs < 7200000) return 'warning' // < 2 hours
    return 'normal'
  }
  
  const timerUrgency = getTimerUrgency()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Atomic Swap Status
        </h2>
        <button
          onClick={onRefresh}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Progress Bar */}
      {!swapExecuted && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Deposit Progress</span>
            <span className="font-semibold text-slate-900 dark:text-white">{depositProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${depositProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Countdown Timer */}
      {!swapExecuted && escrow.expires_at && (
        <div className={`rounded-lg p-4 border-2 ${
          timerUrgency === 'expired' 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800' 
            : timerUrgency === 'critical'
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800'
            : timerUrgency === 'warning'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
            : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${
                timerUrgency === 'expired' 
                  ? 'text-red-600 dark:text-red-400' 
                  : timerUrgency === 'critical'
                  ? 'text-orange-600 dark:text-orange-400'
                  : timerUrgency === 'warning'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Time Remaining
              </span>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${
              timerUrgency === 'expired' 
                ? 'text-red-600 dark:text-red-400' 
                : timerUrgency === 'critical'
                ? 'text-orange-600 dark:text-orange-400'
                : timerUrgency === 'warning'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {timeRemaining.formatted}
            </div>
          </div>
          
          {/* Time breakdown */}
          {!timeRemaining.expired && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-slate-800 rounded p-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{timeRemaining.hours}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Hours</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded p-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{timeRemaining.minutes}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Minutes</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded p-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{timeRemaining.seconds}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Seconds</div>
              </div>
            </div>
          )}
          
          {timeRemaining.expired && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium">
                Swap has expired. Refunds will be processed automatically.
              </p>
            </div>
          )}
          
          {timerUrgency === 'critical' && !timeRemaining.expired && (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs font-medium">
                Less than 1 hour remaining! Deposit soon to avoid timeout.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Deposit Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Deposit Status
          </h3>
          {bothDeposited && !swapExecuted && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
              Both Deposited ✓
            </span>
          )}
        </div>

        {/* Party A Status */}
        <div className={`border-2 rounded-lg p-4 transition-all ${
          partyADeposited 
            ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10' 
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                partyADeposited 
                  ? 'bg-green-500' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                {partyADeposited && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Party A</span>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              partyADeposited 
                ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' 
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700'
            }`}>
              {partyADeposited ? 'Deposited' : 'Pending'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Wallet</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {escrow.buyer_wallet.slice(0, 4)}...{escrow.buyer_wallet.slice(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Amount</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {escrow.buyer_amount} {escrow.swap_asset_buyer}
              </span>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-2">
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        </div>

        {/* Party B Status */}
        <div className={`border-2 rounded-lg p-4 transition-all ${
          partyBDeposited 
            ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10' 
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                partyBDeposited 
                  ? 'bg-blue-500' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                {partyBDeposited && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Party B</span>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              partyBDeposited 
                ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30' 
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700'
            }`}>
              {partyBDeposited ? 'Deposited' : 'Pending'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Wallet</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {escrow.seller_wallet.slice(0, 4)}...{escrow.seller_wallet.slice(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Amount</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {escrow.seller_amount} {escrow.swap_asset_seller}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Execution Status */}
      {bothDeposited && (
        <div className={`rounded-lg p-5 border-2 ${
          swapExecuted 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800' 
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
        }`}>
          <div className="flex items-start gap-4">
            {swapExecuted ? (
              <>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-green-900 dark:text-green-100 mb-1">
                    Swap Executed Successfully!
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Assets have been exchanged between both parties atomically
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white dark:bg-slate-800 rounded p-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Party A Received</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {escrow.seller_amount} {escrow.swap_asset_seller}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded p-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Party B Received</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {escrow.buyer_amount} {escrow.swap_asset_buyer}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                    Executing Swap...
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Both deposits confirmed. The atomic swap is being executed automatically.
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This usually takes a few seconds. Please wait...</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Transaction Signatures */}
      {swapExecuted && escrow.swap_tx_signature && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Transaction Details
            </h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 pt-1">Signature</span>
              <div className="flex-1 text-right">
                <a
                  href={`https://explorer.solana.com/tx/${escrow.swap_tx_signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono break-all inline-flex items-center gap-1"
                >
                  {escrow.swap_tx_signature.slice(0, 8)}...{escrow.swap_tx_signature.slice(-8)}
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmed
              </span>
            </div>
            
            {escrow.completed_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(escrow.completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <a
            href={`https://explorer.solana.com/tx/${escrow.swap_tx_signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
          >
            View on Solana Explorer
          </a>
        </div>
      )}

      {/* Escrow Wallet for Deposits */}
      {!bothDeposited && !timeRemaining.expired && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Escrow Wallet Address
            </h4>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-3">
            <div className="text-sm font-mono text-slate-900 dark:text-white break-all">
              {escrow.escrow_wallet}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Send your deposit to this address. The swap will execute automatically once both parties deposit.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
