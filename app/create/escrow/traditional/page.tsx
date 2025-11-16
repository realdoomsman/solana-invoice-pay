'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEnhancedToast } from '@/hooks/useToast'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { FormField, Input, Textarea, Select } from '@/components/ui/FormField'
import { SuccessAnimation } from '@/components/ui/SuccessAnimation'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import MultiSigWalletBadge from '@/components/MultiSigWalletBadge'
import FeeInfo from '@/components/FeeInfo'

export default function CreateTraditionalEscrow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { publicKey } = useWallet()
  const toast = useEnhancedToast()
  const escrowType = searchParams.get('type') || 'traditional'
  
  const [buyerWallet, setBuyerWallet] = useState('')
  const [sellerWallet, setSellerWallet] = useState('')
  const [buyerAmount, setBuyerAmount] = useState('')
  const [sellerSecurityDeposit, setSellerSecurityDeposit] = useState('')
  const [token, setToken] = useState('SOL')
  const [description, setDescription] = useState('')
  const [timeoutHours, setTimeoutHours] = useState('72')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdEscrowId, setCreatedEscrowId] = useState<string | null>(null)
  const [showBuyerMultiSig, setShowBuyerMultiSig] = useState(false)
  const [showSellerMultiSig, setShowSellerMultiSig] = useState(false)

  useEffect(() => {
    // Auto-fill connected wallet
    if (publicKey) {
      setBuyerWallet(publicKey.toBase58())
    }
    
    // Validate that we're on the correct page for the escrow type
    if (escrowType !== 'traditional') {
      toast.error('Invalid escrow type for this page')
      router.push('/create/escrow/select')
    }
  }, [escrowType, router, publicKey])

  const validateWalletAddress = (address: string): boolean => {
    // Basic Solana address validation (base58, 32-44 chars)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!buyerWallet) {
      newErrors.buyerWallet = 'Buyer wallet address is required'
    } else if (!validateWalletAddress(buyerWallet)) {
      newErrors.buyerWallet = 'Invalid Solana wallet address'
    }

    if (!sellerWallet) {
      newErrors.sellerWallet = 'Seller wallet address is required'
    } else if (!validateWalletAddress(sellerWallet)) {
      newErrors.sellerWallet = 'Invalid Solana wallet address'
    }

    if (buyerWallet && sellerWallet && buyerWallet === sellerWallet) {
      newErrors.sellerWallet = 'Buyer and seller cannot be the same wallet'
    }

    if (!buyerAmount) {
      newErrors.buyerAmount = 'Buyer amount is required'
    } else if (parseFloat(buyerAmount) <= 0) {
      newErrors.buyerAmount = 'Amount must be greater than 0'
    }

    if (!sellerSecurityDeposit) {
      newErrors.sellerSecurityDeposit = 'Security deposit is required'
    } else if (parseFloat(sellerSecurityDeposit) <= 0) {
      newErrors.sellerSecurityDeposit = 'Amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createEscrow = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowType: 'traditional',
          buyerWallet,
          sellerWallet,
          buyerAmount: parseFloat(buyerAmount),
          sellerSecurityDeposit: parseFloat(sellerSecurityDeposit),
          token,
          description,
          timeoutHours: parseInt(timeoutHours)
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create escrow')
      }

      // Show success animation
      setCreatedEscrowId(data.escrow.id)
      setShowSuccess(true)
      
      // Navigate after animation
      setTimeout(() => {
        router.push(`/escrow/${data.escrow.id}`)
      }, 2000)
    } catch (error: any) {
      console.error('Error creating escrow:', error)
      toast.handleError(error, 'Failed to create escrow')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/create/escrow/select')}
              className="text-blue-600 dark:text-blue-400 hover:underline mb-4 transition-colors"
            >
              ← Back to Escrow Types
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Traditional Escrow
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Both parties deposit funds. Released when both confirm or admin resolves dispute.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              {/* Buyer Wallet */}
              <FormField
                label="Buyer Wallet Address"
                error={errors.buyerWallet}
                hint="The wallet that will pay for the goods/services"
                required
              >
                <Input
                  type="text"
                  value={buyerWallet}
                  onChange={(e) => {
                    setBuyerWallet(e.target.value)
                    setErrors(prev => ({ ...prev, buyerWallet: '' }))
                    setShowBuyerMultiSig(validateWalletAddress(e.target.value))
                  }}
                  placeholder="Buyer's Solana wallet address"
                  error={!!errors.buyerWallet}
                  className="font-mono text-sm"
                />
                {showBuyerMultiSig && buyerWallet && (
                  <div className="mt-2">
                    <MultiSigWalletBadge 
                      walletAddress={buyerWallet} 
                      showDetails={true}
                    />
                  </div>
                )}
              </FormField>

              {/* Seller Wallet */}
              <FormField
                label="Seller Wallet Address"
                error={errors.sellerWallet}
                hint="The wallet that will receive payment"
                required
              >
                <Input
                  type="text"
                  value={sellerWallet}
                  onChange={(e) => {
                    setSellerWallet(e.target.value)
                    setErrors(prev => ({ ...prev, sellerWallet: '' }))
                    setShowSellerMultiSig(validateWalletAddress(e.target.value))
                  }}
                  placeholder="Seller's Solana wallet address"
                  error={!!errors.sellerWallet}
                  className="font-mono text-sm"
                />
                {showSellerMultiSig && sellerWallet && (
                  <div className="mt-2">
                    <MultiSigWalletBadge 
                      walletAddress={sellerWallet} 
                      showDetails={true}
                    />
                  </div>
                )}
              </FormField>

              {/* Buyer Amount */}
              <FormField
                label="Buyer Payment Amount"
                error={errors.buyerAmount}
                hint="Amount buyer will pay to seller"
                required
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={buyerAmount}
                      onChange={(e) => {
                        setBuyerAmount(e.target.value)
                        setErrors(prev => ({ ...prev, buyerAmount: '' }))
                      }}
                      placeholder="0.00"
                      error={!!errors.buyerAmount}
                    />
                  </div>
                  <div>
                    <Select
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      options={[
                        { value: 'SOL', label: 'SOL' },
                        { value: 'USDC', label: 'USDC' },
                        { value: 'USDT', label: 'USDT' },
                      ]}
                    />
                  </div>
                </div>
              </FormField>

              {/* Seller Security Deposit */}
              <FormField
                label="Seller Security Deposit"
                error={errors.sellerSecurityDeposit}
                hint="Security deposit from seller (returned after successful completion)"
                required
              >
                <Input
                  type="number"
                  step="0.01"
                  value={sellerSecurityDeposit}
                  onChange={(e) => {
                    setSellerSecurityDeposit(e.target.value)
                    setErrors(prev => ({ ...prev, sellerSecurityDeposit: '' }))
                  }}
                  placeholder="0.00"
                  error={!!errors.sellerSecurityDeposit}
                />
              </FormField>

              {/* Description */}
              <FormField
                label="Transaction Description"
                hint="Describe what is being traded or exchanged"
              >
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what is being traded or exchanged"
                  rows={3}
                />
              </FormField>

              {/* Timeout */}
              <FormField
                label="Timeout Period (hours)"
                hint="Time before escrow escalates to admin review if not completed"
              >
                <Input
                  type="number"
                  value={timeoutHours}
                  onChange={(e) => setTimeoutHours(e.target.value)}
                  placeholder="72"
                />
              </FormField>

              {/* Fee Information */}
              {buyerAmount && parseFloat(buyerAmount) > 0 && sellerSecurityDeposit && parseFloat(sellerSecurityDeposit) > 0 && (
                <FeeInfo
                  amount={parseFloat(buyerAmount)}
                  token={token}
                  escrowType="traditional"
                  sellerAmount={parseFloat(sellerSecurityDeposit)}
                  showBreakdown={true}
                />
              )}

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <span>ℹ️</span>
                  How Traditional Escrow Works:
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Both buyer and seller deposit their amounts</li>
                  <li>Complete the trade off-platform</li>
                  <li>Both parties confirm successful completion</li>
                  <li>Funds automatically release to respective parties</li>
                </ol>
              </div>

              {/* Create Button */}
              <EnhancedButton
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                loadingText="Creating escrow..."
                onClick={createEscrow}
                disabled={loading}
              >
                Create Traditional Escrow
              </EnhancedButton>
            </div>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        title="Escrow Created!"
        message="Redirecting to escrow details..."
        icon="check"
        amount={`${buyerAmount} ${token}`}
      />
    </>
  )
}
