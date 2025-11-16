'use client'

import { useEffect, useState } from 'react'

interface FeeInfoProps {
  amount: number
  token?: string
  escrowType?: 'traditional' | 'simple_buyer' | 'atomic_swap'
  sellerAmount?: number // For traditional escrow
  showBreakdown?: boolean
  className?: string
}

interface FeeCalculation {
  grossAmount: number
  platformFee: number
  netAmount: number
  feePercentage: number
}

interface TraditionalFees {
  buyerPayment: FeeCalculation
  sellerDeposit: { amount: number; fee: number }
  totalFeeToTreasury: number
}

interface AtomicSwapFees {
  partyA: FeeCalculation
  partyB: FeeCalculation
  totalFeeToTreasury: number
}

export default function FeeInfo({
  amount,
  token = 'SOL',
  escrowType = 'simple_buyer',
  sellerAmount,
  showBreakdown = true,
  className = ''
}: FeeInfoProps) {
  const [feePercentage, setFeePercentage] = useState<number>(3)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current fee percentage from API
    const fetchFeeConfig = async () => {
      try {
        const response = await fetch('/api/escrow/fee-config')
        if (response.ok) {
          const data = await response.json()
          setFeePercentage(data.feePercentage || 3)
        }
      } catch (error) {
        console.error('Failed to fetch fee config:', error)
        // Use default 3%
      } finally {
        setLoading(false)
      }
    }

    fetchFeeConfig()
  }, [])

  if (loading || !amount || amount <= 0) {
    return null
  }

  // Calculate fees based on escrow type
  const calculateFees = () => {
    const platformFee = (amount * feePercentage) / 100
    const netAmount = amount - platformFee

    if (escrowType === 'traditional' && sellerAmount) {
      // Traditional: Fee only on buyer payment
      const buyerFee = (amount * feePercentage) / 100
      const buyerNet = amount - buyerFee
      
      return {
        type: 'traditional' as const,
        buyerPayment: {
          grossAmount: amount,
          platformFee: buyerFee,
          netAmount: buyerNet,
          feePercentage
        },
        sellerDeposit: {
          amount: sellerAmount,
          fee: 0
        },
        totalFeeToTreasury: buyerFee
      }
    } else if (escrowType === 'atomic_swap' && sellerAmount) {
      // Atomic swap: Fee on both parties
      const partyAFee = (amount * feePercentage) / 100
      const partyANet = amount - partyAFee
      const partyBFee = (sellerAmount * feePercentage) / 100
      const partyBNet = sellerAmount - partyBFee
      
      return {
        type: 'atomic_swap' as const,
        partyA: {
          grossAmount: amount,
          platformFee: partyAFee,
          netAmount: partyANet,
          feePercentage
        },
        partyB: {
          grossAmount: sellerAmount,
          platformFee: partyBFee,
          netAmount: partyBNet,
          feePercentage
        },
        totalFeeToTreasury: partyAFee + partyBFee
      }
    } else {
      // Simple buyer: Fee on total amount
      return {
        type: 'simple' as const,
        grossAmount: amount,
        platformFee,
        netAmount,
        feePercentage
      }
    }
  }

  const fees = calculateFees()

  const formatAmount = (value: number) => {
    return value.toFixed(4)
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Platform Fees ({feePercentage}%)
          </h4>
          
          {fees.type === 'traditional' && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Buyer Payment:
                </div>
                <div className="space-y-1 text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-mono">{formatAmount(fees.buyerPayment.grossAmount)} {token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({feePercentage}%):</span>
                    <span className="font-mono text-red-600 dark:text-red-400">
                      -{formatAmount(fees.buyerPayment.platformFee)} {token}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-blue-300 dark:border-blue-700">
                    <span>Seller Receives:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatAmount(fees.buyerPayment.netAmount)} {token}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Seller Security Deposit:
                </div>
                <div className="space-y-1 text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-mono">{formatAmount(fees.sellerDeposit.amount)} {token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatAmount(fees.sellerDeposit.fee)} {token} (No fee)
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-blue-300 dark:border-blue-700">
                    <span>Returned to Seller:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatAmount(fees.sellerDeposit.amount)} {token}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t-2 border-blue-300 dark:border-blue-700">
                <div className="flex justify-between font-bold text-blue-900 dark:text-blue-100">
                  <span>Total Platform Fee:</span>
                  <span className="font-mono">{formatAmount(fees.totalFeeToTreasury)} {token}</span>
                </div>
              </div>
            </div>
          )}
          
          {fees.type === 'atomic_swap' && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Party A:
                </div>
                <div className="space-y-1 text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Sends:</span>
                    <span className="font-mono">{formatAmount(fees.partyA.grossAmount)} {token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({feePercentage}%):</span>
                    <span className="font-mono text-red-600 dark:text-red-400">
                      -{formatAmount(fees.partyA.platformFee)} {token}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-blue-300 dark:border-blue-700">
                    <span>Party B Receives:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatAmount(fees.partyA.netAmount)} {token}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Party B:
                </div>
                <div className="space-y-1 text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Sends:</span>
                    <span className="font-mono">{formatAmount(fees.partyB.grossAmount)} {token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({feePercentage}%):</span>
                    <span className="font-mono text-red-600 dark:text-red-400">
                      -{formatAmount(fees.partyB.platformFee)} {token}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-blue-300 dark:border-blue-700">
                    <span>Party A Receives:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatAmount(fees.partyB.netAmount)} {token}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t-2 border-blue-300 dark:border-blue-700">
                <div className="flex justify-between font-bold text-blue-900 dark:text-blue-100">
                  <span>Total Platform Fee:</span>
                  <span className="font-mono">{formatAmount(fees.totalFeeToTreasury)} {token}</span>
                </div>
              </div>
            </div>
          )}
          
          {fees.type === 'simple' && (
            <div className="space-y-2 text-sm">
              {showBreakdown && (
                <>
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Total Amount:</span>
                    <span className="font-mono">{formatAmount(fees.grossAmount)} {token}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Platform Fee ({feePercentage}%):</span>
                    <span className="font-mono text-red-600 dark:text-red-400">
                      -{formatAmount(fees.platformFee)} {token}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900 dark:text-blue-100 pt-2 border-t border-blue-300 dark:border-blue-700">
                    <span>Seller Receives:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatAmount(fees.netAmount)} {token}
                    </span>
                  </div>
                </>
              )}
              {!showBreakdown && (
                <div className="flex justify-between font-semibold text-blue-900 dark:text-blue-100">
                  <span>Platform Fee ({feePercentage}%):</span>
                  <span className="font-mono">{formatAmount(fees.platformFee)} {token}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {escrowType === 'traditional' && 
                'Fees are deducted from buyer payment only. Seller security deposit is returned in full.'}
              {escrowType === 'atomic_swap' && 
                'Fees are charged to both parties equally as a percentage of their respective amounts.'}
              {escrowType === 'simple_buyer' && 
                'Fees are deducted when funds are released to the seller.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
