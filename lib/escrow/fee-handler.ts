/**
 * Fee Handler
 * Centralized fee calculation and deduction logic for all escrow types
 * Requirements: 9.1-9.6
 */

import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getSupabase } from '../supabase'
import { nanoid } from 'nanoid'

// ============================================
// FEE CONFIGURATION
// ============================================

/**
 * Get platform fee percentage from environment
 * Default: 3% for devnet, 1% for production
 */
export function getPlatformFeePercentage(): number {
  const envFee = process.env.PLATFORM_FEE_PERCENTAGE || process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE
  if (envFee) {
    const fee = parseFloat(envFee)
    if (!isNaN(fee) && fee >= 0 && fee <= 100) {
      return fee
    }
  }
  
  // Default based on network
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
  return network === 'mainnet-beta' ? 1 : 3
}

/**
 * Get treasury wallet address from environment
 */
export function getTreasuryWallet(): string {
  const treasuryWallet = process.env.PLATFORM_FEE_WALLET || 
                        process.env.PLATFORM_TREASURY_WALLET ||
                        process.env.NEXT_PUBLIC_FEE_WALLET
  
  if (!treasuryWallet) {
    throw new Error('Treasury wallet not configured. Set PLATFORM_FEE_WALLET environment variable.')
  }
  
  return treasuryWallet
}

// ============================================
// FEE CALCULATION
// ============================================

export interface FeeCalculation {
  grossAmount: number
  platformFee: number
  netAmount: number
  feePercentage: number
}

/**
 * Calculate platform fee for an amount
 * @param amount - Gross amount before fees
 * @param customFeePercentage - Optional custom fee percentage (defaults to platform fee)
 */
export function calculatePlatformFee(
  amount: number,
  customFeePercentage?: number
): FeeCalculation {
  const feePercentage = customFeePercentage ?? getPlatformFeePercentage()
  const platformFee = (amount * feePercentage) / 100
  const netAmount = amount - platformFee
  
  return {
    grossAmount: amount,
    platformFee,
    netAmount,
    feePercentage
  }
}

/**
 * Calculate fees for traditional escrow
 * Requirement 9.2: Fees deducted from buyer's payment only
 */
export function calculateTraditionalEscrowFees(
  buyerPayment: number,
  sellerSecurityDeposit: number
): {
  buyerPayment: FeeCalculation
  sellerDeposit: { amount: number; fee: number } // No fee on security deposit
  totalFeeToTreasury: number
} {
  const buyerFees = calculatePlatformFee(buyerPayment)
  
  return {
    buyerPayment: buyerFees,
    sellerDeposit: {
      amount: sellerSecurityDeposit,
      fee: 0 // Security deposit returned in full
    },
    totalFeeToTreasury: buyerFees.platformFee
  }
}

/**
 * Calculate fees for atomic swap
 * Requirement 9.3: Fees charged to both parties equally (as percentage of their amounts)
 */
export function calculateAtomicSwapFees(
  partyAAmount: number,
  partyBAmount: number
): {
  partyA: FeeCalculation
  partyB: FeeCalculation
  totalFeeToTreasury: number
} {
  const partyAFees = calculatePlatformFee(partyAAmount)
  const partyBFees = calculatePlatformFee(partyBAmount)
  
  return {
    partyA: partyAFees,
    partyB: partyBFees,
    totalFeeToTreasury: partyAFees.platformFee + partyBFees.platformFee
  }
}

/**
 * Calculate cancellation fee (1%)
 */
export function calculateCancellationFee(depositAmount: number): FeeCalculation {
  return calculatePlatformFee(depositAmount, 1) // 1% cancellation fee
}

// ============================================
// TRANSACTION BUILDING
// ============================================

export interface TransferInstruction {
  recipient: string
  amount: number
  label: string
}

/**
 * Add fee transfer instruction to transaction
 * @param transaction - Solana transaction to add instruction to
 * @param fromPubkey - Source wallet public key
 * @param feeAmount - Fee amount in SOL
 */
export function addFeeTransferToTransaction(
  transaction: Transaction,
  fromPubkey: PublicKey,
  feeAmount: number
): void {
  if (feeAmount <= 0) {
    return // No fee to transfer
  }
  
  const treasuryWallet = getTreasuryWallet()
  const treasuryPubkey = new PublicKey(treasuryWallet)
  const feeLamports = Math.floor(feeAmount * LAMPORTS_PER_SOL)
  
  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: treasuryPubkey,
      lamports: feeLamports
    })
  )
}

/**
 * Build transfer instructions with fee deduction
 * Returns array of transfers: [recipient transfer, fee transfer]
 */
export function buildTransfersWithFee(
  recipientAddress: string,
  grossAmount: number,
  customFeePercentage?: number
): TransferInstruction[] {
  const fees = calculatePlatformFee(grossAmount, customFeePercentage)
  const treasuryWallet = getTreasuryWallet()
  
  const transfers: TransferInstruction[] = [
    {
      recipient: recipientAddress,
      amount: fees.netAmount,
      label: 'Payment to recipient'
    }
  ]
  
  if (fees.platformFee > 0) {
    transfers.push({
      recipient: treasuryWallet,
      amount: fees.platformFee,
      label: 'Platform fee to treasury'
    })
  }
  
  return transfers
}

// ============================================
// FEE RECORDING
// ============================================

export interface RecordFeeParams {
  escrowId: string
  milestoneId?: string
  feeAmount: number
  grossAmount: number
  netAmount: number
  feePercentage: number
  txSignature: string
  feeType: 'platform_fee' | 'cancellation_fee'
  paidBy: string
  releaseType: 'milestone_release' | 'full_release' | 'swap_execution' | 'dispute_resolution' | 'refund'
}

/**
 * Record fee transaction in database
 * Requirement 9.6: Record fee transactions
 */
export async function recordFeeTransaction(params: RecordFeeParams): Promise<void> {
  const supabase = getSupabase()
  const treasuryWallet = getTreasuryWallet()
  
  try {
    // Record fee as a release to treasury
    const { error: releaseError } = await supabase
      .from('escrow_releases')
      .insert({
        id: nanoid(12),
        escrow_id: params.escrowId,
        milestone_id: params.milestoneId || null,
        release_type: params.releaseType,
        from_wallet: params.paidBy,
        to_wallet: treasuryWallet,
        amount: params.feeAmount,
        token: 'SOL', // TODO: Support other tokens
        tx_signature: params.txSignature,
        confirmed: true,
        triggered_by: 'system',
        created_at: new Date().toISOString()
      })
    
    if (releaseError) {
      console.error('Failed to record fee transaction:', releaseError)
      throw new Error(`Failed to record fee: ${releaseError.message}`)
    }
    
    // Log fee collection action
    await supabase
      .from('escrow_actions')
      .insert({
        id: nanoid(12),
        escrow_id: params.escrowId,
        milestone_id: params.milestoneId || null,
        actor_wallet: 'system',
        action_type: 'released',
        notes: `Platform fee collected: ${params.feeAmount} SOL (${params.feePercentage}% of ${params.grossAmount} SOL). Net to recipient: ${params.netAmount} SOL`,
        metadata: {
          fee_type: params.feeType,
          fee_amount: params.feeAmount,
          fee_percentage: params.feePercentage,
          gross_amount: params.grossAmount,
          net_amount: params.netAmount,
          treasury_wallet: treasuryWallet,
          paid_by: params.paidBy
        },
        created_at: new Date().toISOString()
      })
    
    console.log(`✅ Fee recorded: ${params.feeAmount} SOL to treasury`)
    console.log(`   Type: ${params.feeType}`)
    console.log(`   Escrow: ${params.escrowId}`)
    console.log(`   TX: ${params.txSignature}`)
  } catch (error: any) {
    console.error('Error recording fee transaction:', error)
    // Don't throw - fee was collected, just logging failed
  }
}

/**
 * Record multiple fee transactions (for atomic swaps with both parties)
 */
export async function recordMultipleFeeTransactions(
  fees: RecordFeeParams[]
): Promise<void> {
  for (const fee of fees) {
    await recordFeeTransaction(fee)
  }
}

// ============================================
// FEE VALIDATION
// ============================================

/**
 * Validate fee configuration
 */
export function validateFeeConfiguration(): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check treasury wallet
  try {
    const treasuryWallet = getTreasuryWallet()
    try {
      new PublicKey(treasuryWallet)
    } catch {
      errors.push('Invalid treasury wallet address')
    }
  } catch (error: any) {
    errors.push(error.message)
  }
  
  // Check fee percentage
  const feePercentage = getPlatformFeePercentage()
  if (feePercentage < 0 || feePercentage > 100) {
    errors.push(`Invalid fee percentage: ${feePercentage}%`)
  }
  
  if (feePercentage === 0) {
    warnings.push('Platform fee is set to 0% - no fees will be collected')
  }
  
  if (feePercentage > 10) {
    warnings.push(`Platform fee is high: ${feePercentage}%`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get fee configuration summary
 */
export function getFeeConfigurationSummary(): {
  feePercentage: number
  treasuryWallet: string
  network: string
  configured: boolean
} {
  try {
    return {
      feePercentage: getPlatformFeePercentage(),
      treasuryWallet: getTreasuryWallet(),
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
      configured: true
    }
  } catch {
    return {
      feePercentage: 0,
      treasuryWallet: '',
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
      configured: false
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  getPlatformFeePercentage,
  getTreasuryWallet,
  calculatePlatformFee,
  calculateTraditionalEscrowFees,
  calculateAtomicSwapFees,
  calculateCancellationFee,
  addFeeTransferToTransaction,
  buildTransfersWithFee,
  recordFeeTransaction,
  recordMultipleFeeTransactions,
  validateFeeConfiguration,
  getFeeConfigurationSummary
}
