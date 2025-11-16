/**
 * Deposit Monitoring Service
 * Tracks buyer and seller deposits and updates escrow status
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getSupabase } from '../supabase'
import { nanoid } from 'nanoid'
import { EscrowContract, EscrowDeposit } from './types'

// ============================================
// CONFIGURATION
// ============================================

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const CONFIRMATION_THRESHOLD = 1 // Number of confirmations required

// ============================================
// DEPOSIT MONITORING
// ============================================

/**
 * Monitor deposits for a specific escrow
 * Checks if expected deposits have been made to the escrow wallet
 */
export async function monitorEscrowDeposits(escrowId: string): Promise<{
  buyerDeposited: boolean
  sellerDeposited: boolean
  fullyFunded: boolean
  deposits: EscrowDeposit[]
}> {
  try {
    const supabase = getSupabase()
    
    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()
    
    if (escrowError || !escrow) {
      throw new Error('Escrow not found')
    }
    
    // Get existing deposits
    const { data: deposits, error: depositsError } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('confirmed', true)
    
    if (depositsError) {
      throw new Error(`Failed to fetch deposits: ${depositsError.message}`)
    }
    
    // Check deposit status
    const buyerDeposit = deposits?.find(d => d.party_role === 'buyer')
    const sellerDeposit = deposits?.find(d => d.party_role === 'seller')
    
    const buyerDeposited = !!buyerDeposit
    const sellerDeposited = !!sellerDeposit
    
    // Determine if fully funded based on escrow type
    let fullyFunded = false
    if (escrow.escrow_type === 'simple_buyer') {
      fullyFunded = buyerDeposited
    } else if (escrow.escrow_type === 'traditional' || escrow.escrow_type === 'atomic_swap') {
      fullyFunded = buyerDeposited && sellerDeposited
    }
    
    return {
      buyerDeposited,
      sellerDeposited,
      fullyFunded,
      deposits: deposits || []
    }
  } catch (error: any) {
    console.error('Monitor deposits error:', error)
    throw error
  }
}

/**
 * Check on-chain balance of escrow wallet
 * Verifies that funds have actually been deposited
 */
export async function checkEscrowWalletBalance(
  escrowWallet: string,
  token: string = 'SOL'
): Promise<number> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
    const publicKey = new PublicKey(escrowWallet)
    
    if (token === 'SOL') {
      const balance = await connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } else {
      // For SPL tokens, we would need to check token accounts
      // This is a simplified version
      throw new Error('SPL token balance checking not yet implemented')
    }
  } catch (error: any) {
    console.error('Check wallet balance error:', error)
    throw error
  }
}

/**
 * Verify a deposit transaction on-chain
 * Confirms that a transaction actually transferred funds to the escrow wallet
 */
export async function verifyDepositTransaction(
  txSignature: string,
  expectedRecipient: string,
  expectedAmount: number,
  token: string = 'SOL'
): Promise<boolean> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
    
    // Get transaction details
    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0
    })
    
    if (!tx) {
      throw new Error('Transaction not found')
    }
    
    // Check if transaction was successful
    if (tx.meta?.err) {
      throw new Error('Transaction failed on-chain')
    }
    
    // For SOL transfers, verify the amount and recipient
    if (token === 'SOL') {
      const postBalances = tx.meta?.postBalances || []
      const preBalances = tx.meta?.preBalances || []
      const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys
      
      // Find the recipient account index
      const recipientIndex = accountKeys.findIndex(
        key => key.toBase58() === expectedRecipient
      )
      
      if (recipientIndex === -1) {
        throw new Error('Recipient not found in transaction')
      }
      
      // Calculate the amount transferred
      const balanceChange = postBalances[recipientIndex] - preBalances[recipientIndex]
      const amountTransferred = balanceChange / LAMPORTS_PER_SOL
      
      // Allow for small rounding differences
      const isAmountCorrect = Math.abs(amountTransferred - expectedAmount) < 0.000001
      
      return isAmountCorrect
    }
    
    // For SPL tokens, additional logic would be needed
    return true
  } catch (error: any) {
    console.error('Verify transaction error:', error)
    return false
  }
}

/**
 * Record and verify a deposit
 * This is called when a party claims to have made a deposit
 */
export async function recordAndVerifyDeposit(
  escrowId: string,
  depositorWallet: string,
  amount: number,
  token: string,
  txSignature: string
): Promise<{ success: boolean; deposit?: EscrowDeposit; error?: string }> {
  try {
    const supabase = getSupabase()
    
    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()
    
    if (escrowError || !escrow) {
      return { success: false, error: 'Escrow not found' }
    }
    
    // Determine party role
    let partyRole: 'buyer' | 'seller'
    let expectedAmount: number
    
    if (depositorWallet === escrow.buyer_wallet) {
      partyRole = 'buyer'
      expectedAmount = escrow.buyer_amount
    } else if (depositorWallet === escrow.seller_wallet) {
      partyRole = 'seller'
      expectedAmount = escrow.seller_amount
    } else {
      return { success: false, error: 'Depositor is not a party in this escrow' }
    }
    
    // Check if already deposited
    const { data: existingDeposit } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('party_role', partyRole)
      .single()
    
    if (existingDeposit) {
      return { success: false, error: `${partyRole} has already deposited` }
    }
    
    // Verify the transaction on-chain
    const isValid = await verifyDepositTransaction(
      txSignature,
      escrow.escrow_wallet,
      expectedAmount,
      token
    )
    
    if (!isValid) {
      return { success: false, error: 'Transaction verification failed' }
    }
    
    // Record the deposit
    const depositId = nanoid(10)
    const { data: deposit, error: depositError } = await supabase
      .from('escrow_deposits')
      .insert({
        id: depositId,
        escrow_id: escrowId,
        depositor_wallet: depositorWallet,
        party_role: partyRole,
        amount,
        token,
        tx_signature: txSignature,
        confirmed: true,
        confirmation_count: CONFIRMATION_THRESHOLD,
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (depositError) {
      return { success: false, error: `Failed to record deposit: ${depositError.message}` }
    }
    
    // Update escrow deposit status
    await updateEscrowDepositStatus(escrowId, partyRole)
    
    // Log action
    await logEscrowAction(
      escrowId,
      depositorWallet,
      'deposited',
      `${partyRole} deposited ${amount} ${token}`,
      { tx_signature: txSignature }
    )
    
    // Check if fully funded and update status
    await checkAndUpdateFundingStatus(escrowId)
    
    // For atomic swaps, check if both deposits are complete and trigger swap
    if (escrow.escrow_type === 'atomic_swap') {
      await checkAndTriggerAtomicSwap(escrowId)
    }
    
    return { success: true, deposit: deposit as EscrowDeposit }
  } catch (error: any) {
    console.error('Record and verify deposit error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update escrow deposit status flags
 */
async function updateEscrowDepositStatus(
  escrowId: string,
  partyRole: 'buyer' | 'seller'
): Promise<void> {
  const supabase = getSupabase()
  
  const updateData: any = {}
  if (partyRole === 'buyer') {
    updateData.buyer_deposited = true
  } else {
    updateData.seller_deposited = true
  }
  
  // Also update status to reflect partial funding
  const { data: escrow } = await supabase
    .from('escrow_contracts')
    .select('buyer_deposited, seller_deposited, escrow_type, status')
    .eq('id', escrowId)
    .single()
  
  if (escrow) {
    if (partyRole === 'buyer' && !escrow.seller_deposited) {
      updateData.status = 'buyer_deposited'
    } else if (partyRole === 'seller' && !escrow.buyer_deposited) {
      updateData.status = 'seller_deposited'
    }
  }
  
  await supabase
    .from('escrow_contracts')
    .update(updateData)
    .eq('id', escrowId)
}

/**
 * Check if escrow is fully funded and update status
 */
export async function checkAndUpdateFundingStatus(escrowId: string): Promise<void> {
  try {
    const supabase = getSupabase()
    
    // Get escrow and deposits
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()
    
    if (escrowError || !escrow) {
      throw new Error('Escrow not found')
    }
    
    // Check if fully funded based on escrow type
    let fullyFunded = false
    
    if (escrow.escrow_type === 'simple_buyer') {
      fullyFunded = escrow.buyer_deposited
    } else if (escrow.escrow_type === 'traditional' || escrow.escrow_type === 'atomic_swap') {
      fullyFunded = escrow.buyer_deposited && escrow.seller_deposited
    }
    
    // Update status if fully funded
    if (fullyFunded && escrow.status !== 'fully_funded') {
      await supabase
        .from('escrow_contracts')
        .update({
          status: 'fully_funded',
          funded_at: new Date().toISOString()
        })
        .eq('id', escrowId)
      
      // Log action
      await logEscrowAction(
        escrowId,
        'system',
        'deposited',
        'Escrow is now fully funded'
      )
      
      // Notify both parties
      await createNotification(
        escrowId,
        escrow.buyer_wallet,
        'deposit_received',
        'Escrow Fully Funded',
        'All required deposits have been received. The escrow is now active.'
      )
      
      await createNotification(
        escrowId,
        escrow.seller_wallet,
        'deposit_received',
        'Escrow Fully Funded',
        'All required deposits have been received. The escrow is now active.'
      )
    }
  } catch (error: any) {
    console.error('Check funding status error:', error)
    throw error
  }
}

/**
 * Get deposit status for an escrow
 */
export async function getDepositStatus(escrowId: string): Promise<{
  escrow_id: string
  buyer_deposited: boolean
  seller_deposited: boolean
  fully_funded: boolean
  deposits: EscrowDeposit[]
  buyer_amount: number
  seller_amount?: number
  token: string
  escrow_wallet: string
}> {
  try {
    const supabase = getSupabase()
    
    // Get escrow
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()
    
    if (escrowError || !escrow) {
      throw new Error('Escrow not found')
    }
    
    // Get deposits
    const { data: deposits, error: depositsError } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrowId)
      .order('deposited_at', { ascending: true })
    
    if (depositsError) {
      throw new Error(`Failed to fetch deposits: ${depositsError.message}`)
    }
    
    // Determine if fully funded
    let fullyFunded = false
    if (escrow.escrow_type === 'simple_buyer') {
      fullyFunded = escrow.buyer_deposited
    } else {
      fullyFunded = escrow.buyer_deposited && escrow.seller_deposited
    }
    
    return {
      escrow_id: escrowId,
      buyer_deposited: escrow.buyer_deposited,
      seller_deposited: escrow.seller_deposited,
      fully_funded: fullyFunded,
      deposits: deposits || [],
      buyer_amount: escrow.buyer_amount,
      seller_amount: escrow.seller_amount,
      token: escrow.token,
      escrow_wallet: escrow.escrow_wallet
    }
  } catch (error: any) {
    console.error('Get deposit status error:', error)
    throw error
  }
}

/**
 * Check if atomic swap has both deposits and trigger execution
 * This is called after each deposit to detect when both parties have deposited
 */
async function checkAndTriggerAtomicSwap(escrowId: string): Promise<void> {
  try {
    const supabase = getSupabase()
    
    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()
    
    if (escrowError || !escrow) {
      console.error('Escrow not found for atomic swap check')
      return
    }
    
    // Check if both parties have deposited
    if (escrow.buyer_deposited && escrow.seller_deposited && !escrow.swap_executed) {
      console.log(`🎯 Both deposits detected for atomic swap ${escrowId}!`)
      console.log(`   Triggering automatic swap execution...`)
      
      // Import and trigger swap execution
      const { detectAndTriggerSwap } = await import('./atomic-swap')
      await detectAndTriggerSwap(escrowId)
    } else {
      console.log(`⏳ Atomic swap ${escrowId} waiting for deposits:`)
      console.log(`   Party A: ${escrow.buyer_deposited ? '✓' : '✗'}`)
      console.log(`   Party B: ${escrow.seller_deposited ? '✓' : '✗'}`)
    }
  } catch (error: any) {
    console.error('Check and trigger atomic swap error:', error)
    // Don't throw - this is a background check
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logEscrowAction(
  escrowId: string,
  actorWallet: string,
  actionType: string,
  notes: string,
  metadata?: Record<string, any>
) {
  const supabase = getSupabase()
  await supabase.from('escrow_actions').insert({
    id: nanoid(10),
    escrow_id: escrowId,
    actor_wallet: actorWallet,
    action_type: actionType,
    notes,
    metadata
  })
}

async function createNotification(
  escrowId: string,
  recipientWallet: string,
  notificationType: string,
  title: string,
  message: string
) {
  const supabase = getSupabase()
  await supabase.from('escrow_notifications').insert({
    id: nanoid(10),
    escrow_id: escrowId,
    recipient_wallet: recipientWallet,
    notification_type: notificationType,
    title,
    message,
    link: `/escrow/${escrowId}`
  })
}

// ============================================
// EXPORTS
// ============================================

export default {
  monitorEscrowDeposits,
  checkEscrowWalletBalance,
  verifyDepositTransaction,
  recordAndVerifyDeposit,
  checkAndUpdateFundingStatus,
  getDepositStatus
}
