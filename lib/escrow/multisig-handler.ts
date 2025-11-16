/**
 * Multi-Signature Wallet Handler
 * Handles detection and transaction management for multi-sig wallets
 * Supports Squads Protocol and other Solana multi-sig standards
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { getSupabase } from '../supabase'
import { nanoid } from 'nanoid'

// ============================================
// TYPES
// ============================================

export type MultiSigProvider = 'squads' | 'goki' | 'serum' | 'unknown'

export interface MultiSigWalletInfo {
  address: string
  isMultiSig: boolean
  provider?: MultiSigProvider
  threshold?: number
  totalSigners?: number
  pendingSignatures?: number
  signers?: string[]
  metadata?: Record<string, any>
}

export interface MultiSigTransaction {
  id: string
  escrow_id: string
  multisig_wallet: string
  provider: MultiSigProvider
  transaction_data: string
  required_signatures: number
  current_signatures: number
  signers: string[]
  signed_by: string[]
  status: 'pending' | 'partially_signed' | 'ready' | 'executed' | 'cancelled'
  created_at: string
  executed_at?: string
  tx_signature?: string
}

// ============================================
// CONFIGURATION
// ============================================

// Known multi-sig program IDs on Solana
const MULTISIG_PROGRAM_IDS = {
  squads: 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu', // Squads v3
  squadsV4: 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf', // Squads v4
  goki: 'GokivDYuQXPZCWRkwMhdH2h91KpDQXBEmpgBgs55bnpH', // Goki Smart Wallet
  serum: 'MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ', // Serum Multisig
}

function getSolanaConnection(): Connection {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  
  const endpoint = rpcUrl || (
    network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : `https://api.${network}.solana.com`
  )
  
  return new Connection(endpoint, 'confirmed')
}

// ============================================
// MULTI-SIG DETECTION
// ============================================

/**
 * Detect if a wallet address is a multi-sig wallet
 * Checks against known multi-sig program IDs
 */
export async function detectMultiSigWallet(
  walletAddress: string
): Promise<MultiSigWalletInfo> {
  try {
    const connection = getSolanaConnection()
    const publicKey = new PublicKey(walletAddress)
    
    // Get account info
    const accountInfo = await connection.getAccountInfo(publicKey)
    
    if (!accountInfo) {
      return {
        address: walletAddress,
        isMultiSig: false
      }
    }
    
    // Check if account is owned by a known multi-sig program
    const owner = accountInfo.owner.toBase58()
    
    // Check Squads v3
    if (owner === MULTISIG_PROGRAM_IDS.squads) {
      const info = await detectSquadsWallet(walletAddress, connection)
      return {
        address: walletAddress,
        isMultiSig: true,
        provider: 'squads',
        ...info
      }
    }
    
    // Check Squads v4
    if (owner === MULTISIG_PROGRAM_IDS.squadsV4) {
      const info = await detectSquadsWallet(walletAddress, connection)
      return {
        address: walletAddress,
        isMultiSig: true,
        provider: 'squads',
        ...info
      }
    }
    
    // Check Goki
    if (owner === MULTISIG_PROGRAM_IDS.goki) {
      return {
        address: walletAddress,
        isMultiSig: true,
        provider: 'goki',
        metadata: { programId: owner }
      }
    }
    
    // Check Serum
    if (owner === MULTISIG_PROGRAM_IDS.serum) {
      return {
        address: walletAddress,
        isMultiSig: true,
        provider: 'serum',
        metadata: { programId: owner }
      }
    }
    
    // Not a recognized multi-sig wallet
    return {
      address: walletAddress,
      isMultiSig: false
    }
  } catch (error) {
    console.error('Multi-sig detection error:', error)
    // On error, assume it's not a multi-sig wallet
    return {
      address: walletAddress,
      isMultiSig: false
    }
  }
}

/**
 * Detect Squads Protocol wallet details
 */
async function detectSquadsWallet(
  walletAddress: string,
  connection: Connection
): Promise<Partial<MultiSigWalletInfo>> {
  try {
    // Try to fetch Squads multisig account data
    // This is a simplified version - in production, you'd use the Squads SDK
    const accountInfo = await connection.getAccountInfo(new PublicKey(walletAddress))
    
    if (!accountInfo || !accountInfo.data) {
      return {}
    }
    
    // Parse basic info from account data
    // Note: This is simplified. Real implementation would use Squads SDK
    // to properly deserialize the account data
    
    return {
      threshold: 2, // Default assumption
      totalSigners: 3, // Default assumption
      metadata: {
        programId: accountInfo.owner.toBase58(),
        dataLength: accountInfo.data.length
      }
    }
  } catch (error) {
    console.error('Squads detection error:', error)
    return {}
  }
}

/**
 * Check if either party in an escrow is using a multi-sig wallet
 */
export async function checkEscrowMultiSig(
  buyerWallet: string,
  sellerWallet: string
): Promise<{
  buyerIsMultiSig: boolean
  sellerIsMultiSig: boolean
  buyerInfo?: MultiSigWalletInfo
  sellerInfo?: MultiSigWalletInfo
}> {
  const [buyerInfo, sellerInfo] = await Promise.all([
    detectMultiSigWallet(buyerWallet),
    detectMultiSigWallet(sellerWallet)
  ])
  
  return {
    buyerIsMultiSig: buyerInfo.isMultiSig,
    sellerIsMultiSig: sellerInfo.isMultiSig,
    buyerInfo: buyerInfo.isMultiSig ? buyerInfo : undefined,
    sellerInfo: sellerInfo.isMultiSig ? sellerInfo : undefined
  }
}

// ============================================
// MULTI-SIG TRANSACTION HANDLING
// ============================================

/**
 * Create a multi-sig transaction record
 * Used when a transaction requires multiple signatures
 */
export async function createMultiSigTransaction(
  escrowId: string,
  multiSigWallet: string,
  provider: MultiSigProvider,
  transactionData: string,
  requiredSignatures: number
): Promise<MultiSigTransaction> {
  try {
    const supabase = getSupabase()
    
    const txId = nanoid(12)
    const txData: Partial<MultiSigTransaction> = {
      id: txId,
      escrow_id: escrowId,
      multisig_wallet: multiSigWallet,
      provider,
      transaction_data: transactionData,
      required_signatures: requiredSignatures,
      current_signatures: 0,
      signers: [],
      signed_by: [],
      status: 'pending'
    }
    
    const { data, error } = await supabase
      .from('escrow_multisig_transactions')
      .insert(txData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create multi-sig transaction: ${error.message}`)
    }
    
    return data as MultiSigTransaction
  } catch (error: any) {
    console.error('Create multi-sig transaction error:', error)
    throw error
  }
}

/**
 * Record a signature for a multi-sig transaction
 */
export async function recordMultiSigSignature(
  transactionId: string,
  signerWallet: string
): Promise<MultiSigTransaction> {
  try {
    const supabase = getSupabase()
    
    // Get current transaction
    const { data: tx, error: fetchError } = await supabase
      .from('escrow_multisig_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    
    if (fetchError || !tx) {
      throw new Error('Multi-sig transaction not found')
    }
    
    // Check if already signed by this wallet
    if (tx.signed_by.includes(signerWallet)) {
      throw new Error('Wallet has already signed this transaction')
    }
    
    // Add signature
    const signedBy = [...tx.signed_by, signerWallet]
    const currentSignatures = signedBy.length
    
    // Determine new status
    let status: MultiSigTransaction['status'] = 'partially_signed'
    if (currentSignatures >= tx.required_signatures) {
      status = 'ready'
    }
    
    // Update transaction
    const { data: updated, error: updateError } = await supabase
      .from('escrow_multisig_transactions')
      .update({
        signed_by: signedBy,
        current_signatures: currentSignatures,
        status
      })
      .eq('id', transactionId)
      .select()
      .single()
    
    if (updateError) {
      throw new Error(`Failed to record signature: ${updateError.message}`)
    }
    
    return updated as MultiSigTransaction
  } catch (error: any) {
    console.error('Record multi-sig signature error:', error)
    throw error
  }
}

/**
 * Check if a multi-sig transaction has enough signatures
 */
export async function checkMultiSigReady(transactionId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    
    const { data: tx, error } = await supabase
      .from('escrow_multisig_transactions')
      .select('current_signatures, required_signatures, status')
      .eq('id', transactionId)
      .single()
    
    if (error || !tx) {
      return false
    }
    
    return tx.current_signatures >= tx.required_signatures && tx.status === 'ready'
  } catch (error) {
    console.error('Check multi-sig ready error:', error)
    return false
  }
}

/**
 * Get pending multi-sig transactions for an escrow
 */
export async function getPendingMultiSigTransactions(
  escrowId: string
): Promise<MultiSigTransaction[]> {
  try {
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('escrow_multisig_transactions')
      .select('*')
      .eq('escrow_id', escrowId)
      .in('status', ['pending', 'partially_signed', 'ready'])
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch multi-sig transactions: ${error.message}`)
    }
    
    return (data || []) as MultiSigTransaction[]
  } catch (error: any) {
    console.error('Get pending multi-sig transactions error:', error)
    return []
  }
}

/**
 * Mark a multi-sig transaction as executed
 */
export async function markMultiSigExecuted(
  transactionId: string,
  txSignature: string
): Promise<void> {
  try {
    const supabase = getSupabase()
    
    const { error } = await supabase
      .from('escrow_multisig_transactions')
      .update({
        status: 'executed',
        tx_signature: txSignature,
        executed_at: new Date().toISOString()
      })
      .eq('id', transactionId)
    
    if (error) {
      throw new Error(`Failed to mark transaction as executed: ${error.message}`)
    }
  } catch (error: any) {
    console.error('Mark multi-sig executed error:', error)
    throw error
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that a signature threshold is reasonable
 */
export function validateSignatureThreshold(
  threshold: number,
  totalSigners: number
): { valid: boolean; error?: string } {
  if (threshold < 1) {
    return { valid: false, error: 'Threshold must be at least 1' }
  }
  
  if (threshold > totalSigners) {
    return { valid: false, error: 'Threshold cannot exceed total signers' }
  }
  
  if (totalSigners > 20) {
    return { valid: false, error: 'Maximum 20 signers supported' }
  }
  
  return { valid: true }
}

/**
 * Check if a wallet can sign a multi-sig transaction
 */
export async function canWalletSign(
  transactionId: string,
  walletAddress: string
): Promise<{ canSign: boolean; reason?: string }> {
  try {
    const supabase = getSupabase()
    
    const { data: tx, error } = await supabase
      .from('escrow_multisig_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    
    if (error || !tx) {
      return { canSign: false, reason: 'Transaction not found' }
    }
    
    if (tx.status === 'executed') {
      return { canSign: false, reason: 'Transaction already executed' }
    }
    
    if (tx.status === 'cancelled') {
      return { canSign: false, reason: 'Transaction cancelled' }
    }
    
    if (tx.signed_by.includes(walletAddress)) {
      return { canSign: false, reason: 'Already signed by this wallet' }
    }
    
    // Check if wallet is authorized signer
    if (tx.signers.length > 0 && !tx.signers.includes(walletAddress)) {
      return { canSign: false, reason: 'Wallet not authorized to sign' }
    }
    
    return { canSign: true }
  } catch (error) {
    console.error('Can wallet sign error:', error)
    return { canSign: false, reason: 'Error checking authorization' }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  detectMultiSigWallet,
  checkEscrowMultiSig,
  createMultiSigTransaction,
  recordMultiSigSignature,
  checkMultiSigReady,
  getPendingMultiSigTransactions,
  markMultiSigExecuted,
  validateSignatureThreshold,
  canWalletSign
}
