'use client'

import { useEffect, useState } from 'react'
import { Badge } from './ui/Badge'

interface MultiSigWalletInfo {
  address: string
  isMultiSig: boolean
  provider?: 'squads' | 'goki' | 'serum' | 'unknown'
  threshold?: number
  totalSigners?: number
}

interface MultiSigWalletBadgeProps {
  walletAddress: string
  className?: string
  showDetails?: boolean
}

export default function MultiSigWalletBadge({
  walletAddress,
  className = '',
  showDetails = true
}: MultiSigWalletBadgeProps) {
  const [walletInfo, setWalletInfo] = useState<MultiSigWalletInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    detectMultiSig()
  }, [walletAddress])

  const detectMultiSig = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/escrow/multisig/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      })

      if (!response.ok) {
        throw new Error('Failed to detect multi-sig wallet')
      }

      const data = await response.json()
      setWalletInfo(data.walletInfo)
    } catch (err: any) {
      console.error('Multi-sig detection error:', err)
      setError(err.message)
      // Set as non-multisig on error
      setWalletInfo({
        address: walletAddress,
        isMultiSig: false
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="animate-pulse bg-slate-700 h-5 w-20 rounded"></div>
      </div>
    )
  }

  if (error || !walletInfo || !walletInfo.isMultiSig) {
    return null
  }

  const getProviderLabel = (provider?: string) => {
    switch (provider) {
      case 'squads':
        return 'Squads'
      case 'goki':
        return 'Goki'
      case 'serum':
        return 'Serum'
      default:
        return 'Multi-Sig'
    }
  }

  const getProviderColor = (provider?: string) => {
    switch (provider) {
      case 'squads':
        return 'bg-purple-600 text-white'
      case 'goki':
        return 'bg-blue-600 text-white'
      case 'serum':
        return 'bg-green-600 text-white'
      default:
        return 'bg-slate-600 text-white'
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge 
        variant="default" 
        className={`${getProviderColor(walletInfo.provider)} font-semibold text-xs`}
      >
        <svg 
          className="w-3 h-3 mr-1 inline-block" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
            clipRule="evenodd" 
          />
        </svg>
        {getProviderLabel(walletInfo.provider)}
      </Badge>
      
      {showDetails && walletInfo.threshold && walletInfo.totalSigners && (
        <span className="text-xs text-slate-400 font-medium">
          {walletInfo.threshold}/{walletInfo.totalSigners} signatures required
        </span>
      )}
    </div>
  )
}
