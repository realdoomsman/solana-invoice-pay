'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import MultiSigWalletBadge from '@/components/MultiSigWalletBadge'
import FeeInfo from '@/components/FeeInfo'

export default function CreateAtomicSwap() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const escrowType = searchParams.get('type') || 'atomic_swap'
  const [user, setUser] = useState<{ walletAddress: string } | null>(null)
  const [partyAWallet, setPartyAWallet] = useState('')
  const [partyBWallet, setPartyBWallet] = useState('')
  const [partyAToken, setPartyAToken] = useState('SOL')
  const [partyAAmount, setPartyAAmount] = useState('')
  const [partyAMint, setPartyAMint] = useState('')
  const [partyBToken, setPartyBToken] = useState('USDC')
  const [partyBAmount, setPartyBAmount] = useState('')
  const [partyBMint, setPartyBMint] = useState('')
  const [timeoutHours, setTimeoutHours] = useState('24')
  const [loading, setLoading] = useState(false)
  const [showPartyAMultiSig, setShowPartyAMultiSig] = useState(false)
  const [showPartyBMultiSig, setShowPartyBMultiSig] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setPartyAWallet(currentUser.walletAddress)
    }
    
    // Validate that we're on the correct page for the escrow type
    if (escrowType !== 'atomic_swap') {
      toast.error('Invalid escrow type for this page')
      router.push('/create/escrow/select')
    }
  }, [escrowType, router])

  const createSwap = async () => {
    if (!partyAWallet || !partyBWallet) {
      toast.error('Please enter both party wallet addresses')
      return
    }

    if (partyAWallet === partyBWallet) {
      toast.error('Party A and Party B cannot be the same wallet')
      return
    }

    if (!partyAAmount || parseFloat(partyAAmount) <= 0) {
      toast.error('Please enter a valid amount for Party A')
      return
    }

    if (!partyBAmount || parseFloat(partyBAmount) <= 0) {
      toast.error('Please enter a valid amount for Party B')
      return
    }

    if (partyAToken === 'SPL' && !partyAMint) {
      toast.error('Please enter token mint address for Party A')
      return
    }

    if (partyBToken === 'SPL' && !partyBMint) {
      toast.error('Please enter token mint address for Party B')
      return
    }

    const loadingToast = toast.loading('Creating atomic swap...')
    setLoading(true)

    try {
      const swapData = {
        escrowType: 'atomic_swap',
        partyAWallet,
        partyBWallet,
        partyAAsset: {
          token: partyAToken,
          amount: parseFloat(partyAAmount),
          mint: partyAToken === 'SPL' ? partyAMint : undefined
        },
        partyBAsset: {
          token: partyBToken,
          amount: parseFloat(partyBAmount),
          mint: partyBToken === 'SPL' ? partyBMint : undefined
        },
        timeoutHours: parseInt(timeoutHours)
      }
      
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create atomic swap')
      }

      toast.success('Atomic swap created! Redirecting...', { id: loadingToast })
      
      // Redirect to the escrow page
      setTimeout(() => {
        router.push(`/escrow/${data.escrow.payment_id}`)
      }, 1000)
    } catch (error: any) {
      console.error('Error creating swap:', error)
      toast.error(`Failed to create swap: ${error.message}`, { id: loadingToast })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/create/escrow/select')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Escrow Types
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Atomic Swap
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Trustless token exchange with automatic execution
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Party A Section */}
            <div className="border-2 border-green-200 dark:border-green-900/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Party A (You)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Wallet Address
                  </label>
                  <input
                    type="text"
                    value={partyAWallet}
                    onChange={(e) => {
                      setPartyAWallet(e.target.value)
                      setShowPartyAMultiSig(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(e.target.value))
                    }}
                    placeholder="Your Solana wallet address"
                    disabled={!!user}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm disabled:opacity-60"
                  />
                  {showPartyAMultiSig && partyAWallet && (
                    <div className="mt-2">
                      <MultiSigWalletBadge 
                        walletAddress={partyAWallet} 
                        showDetails={true}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Asset to Send
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={partyAAmount}
                        onChange={(e) => setPartyAAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={partyAToken}
                        onChange={(e) => setPartyAToken(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="SOL">SOL</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                        <option value="SPL">SPL Token</option>
                      </select>
                    </div>
                  </div>
                </div>

                {partyAToken === 'SPL' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Token Mint Address
                    </label>
                    <input
                      type="text"
                      value={partyAMint}
                      onChange={(e) => setPartyAMint(e.target.value)}
                      placeholder="Token mint address"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>

            {/* Party B Section */}
            <div className="border-2 border-blue-200 dark:border-blue-900/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Party B (Counterparty)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Counterparty Wallet Address
                  </label>
                  <input
                    type="text"
                    value={partyBWallet}
                    onChange={(e) => {
                      setPartyBWallet(e.target.value)
                      setShowPartyBMultiSig(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(e.target.value))
                    }}
                    placeholder="Counterparty's Solana wallet address"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                  />
                  {showPartyBMultiSig && partyBWallet && (
                    <div className="mt-2">
                      <MultiSigWalletBadge 
                        walletAddress={partyBWallet} 
                        showDetails={true}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Asset to Receive
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={partyBAmount}
                        onChange={(e) => setPartyBAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={partyBToken}
                        onChange={(e) => setPartyBToken(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="SOL">SOL</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                        <option value="SPL">SPL Token</option>
                      </select>
                    </div>
                  </div>
                </div>

                {partyBToken === 'SPL' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Token Mint Address
                    </label>
                    <input
                      type="text"
                      value={partyBMint}
                      onChange={(e) => setPartyBMint(e.target.value)}
                      placeholder="Token mint address"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Timeout Period (hours)
              </label>
              <input
                type="number"
                value={timeoutHours}
                onChange={(e) => setTimeoutHours(e.target.value)}
                placeholder="24"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Time before swap expires if both parties don't deposit
              </p>
            </div>

            {/* Swap Preview */}
            {partyAAmount && partyBAmount && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-green-300 dark:border-green-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Swap Preview
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Party A Sends</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {partyAAmount} {partyAToken === 'SPL' ? 'SPL Token' : partyAToken}
                      </div>
                      {partyAToken === 'SPL' && partyAMint && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {partyAMint.slice(0, 8)}...{partyAMint.slice(-8)}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-400">→</div>
                    <div className="flex-1 text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Party B Receives</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {partyAAmount} {partyAToken === 'SPL' ? 'SPL Token' : partyAToken}
                      </div>
                      {partyAToken === 'SPL' && partyAMint && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {partyAMint.slice(0, 8)}...{partyAMint.slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-600"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Party B Sends</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {partyBAmount} {partyBToken === 'SPL' ? 'SPL Token' : partyBToken}
                      </div>
                      {partyBToken === 'SPL' && partyBMint && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {partyBMint.slice(0, 8)}...{partyBMint.slice(-8)}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-400">→</div>
                    <div className="flex-1 text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Party A Receives</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {partyBAmount} {partyBToken === 'SPL' ? 'SPL Token' : partyBToken}
                      </div>
                      {partyBToken === 'SPL' && partyBMint && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {partyBMint.slice(0, 8)}...{partyBMint.slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                    <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
                      Swap will execute automatically when both parties deposit
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Information */}
            {partyAAmount && parseFloat(partyAAmount) > 0 && partyBAmount && parseFloat(partyBAmount) > 0 && (
              <FeeInfo
                amount={parseFloat(partyAAmount)}
                token={partyAToken === 'SPL' ? 'SPL Token' : partyAToken}
                escrowType="atomic_swap"
                sellerAmount={parseFloat(partyBAmount)}
                showBreakdown={true}
              />
            )}

            {/* Info Box */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                How Atomic Swap Works:
              </h4>
              <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
                <li>Both parties deposit their assets into escrow</li>
                <li>Once both deposits confirmed, swap executes automatically</li>
                <li>Assets transfer to respective parties instantly</li>
                <li>No admin intervention needed</li>
              </ol>
            </div>

            {/* Create Button */}
            <button
              onClick={createSwap}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Atomic Swap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
