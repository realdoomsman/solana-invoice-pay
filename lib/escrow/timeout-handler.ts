/**
 * Timeout Handling Logic
 * Type-specific timeout rules for traditional, milestone, and atomic swap escrows
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import type { EscrowContract, EscrowTimeout, TimeoutType } from './types'
import { resolveTimeout } from './timeout-config'

// ============================================
// TIMEOUT HANDLING DISPATCHER
// ============================================

export interface TimeoutHandlingResult {
  success: boolean
  action: string
  txSignature?: string
  error?: string
}

/**
 * Handle timeout based on escrow type
 * Routes to appropriate handler based on escrow type and timeout type
 */
export async function handleTimeout(
  escrowId: string,
  timeoutId: string
): Promise<TimeoutHandlingResult> {
  try {
    const supabase = getSupabase()

    // Get escrow and timeout details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      return {
        success: false,
        action: 'error',
        error: 'Escrow not found',
      }
    }

    const { data: timeout, error: timeoutError } = await supabase
      .from('escrow_timeouts')
      .select('*')
      .eq('id', timeoutId)
      .single()

    if (timeoutError || !timeout) {
      return {
        success: false,
        action: 'error',
        error: 'Timeout not found',
      }
    }

    console.log(`⏰ Handling timeout for ${escrowId}`)
    console.log(`   Escrow type: ${escrow.escrow_type}`)
    console.log(`   Timeout type: ${timeout.timeout_type}`)

    // Route to appropriate handler
    let result: TimeoutHandlingResult

    switch (escrow.escrow_type) {
      case 'traditional':
        result = await handleTraditionalEscrowTimeout(
          escrow as EscrowContract,
          timeout as EscrowTimeout
        )
        break

      case 'simple_buyer':
        result = await handleMilestoneEscrowTimeout(
          escrow as EscrowContract,
          timeout as EscrowTimeout
        )
        break

      case 'atomic_swap':
        result = await handleAtomicSwapTimeout(
          escrow as EscrowContract,
          timeout as EscrowTimeout
        )
        break

      default:
        return {
          success: false,
          action: 'error',
          error: `Unknown escrow type: ${escrow.escrow_type}`,
        }
    }

    // Mark timeout as resolved if successful
    if (result.success) {
      await resolveTimeout(timeoutId, result.action)
    }

    return result
  } catch (error: any) {
    console.error('Handle timeout error:', error)
    return {
      success: false,
      action: 'error',
      error: error.message || 'Failed to handle timeout',
    }
  }
}

// ============================================
// TRADITIONAL ESCROW TIMEOUT HANDLING
// ============================================

/**
 * Handle traditional escrow timeouts
 * Rules:
 * - Deposit timeout: Refund any deposited party
 * - Confirmation timeout: Favor the confirming party
 */
export async function handleTraditionalEscrowTimeout(
  escrow: EscrowContract,
  timeout: EscrowTimeout
): Promise<TimeoutHandlingResult> {
  try {
    console.log(`🔄 Handling traditional escrow timeout`)

    switch (timeout.timeout_type) {
      case 'deposit_timeout':
        return await handleTraditionalDepositTimeout(escrow)

      case 'confirmation_timeout':
        return await handleTraditionalConfirmationTimeout(escrow)

      default:
        return {
          success: false,
          action: 'escalate_to_admin',
          error: `Unhandled timeout type for traditional escrow: ${timeout.timeout_type}`,
        }
    }
  } catch (error: any) {
    console.error('Handle traditional escrow timeout error:', error)
    return {
      success: false,
      action: 'error',
      error: error.message,
    }
  }
}

/**
 * Handle deposit timeout for traditional escrow
 * Refund the party that deposited if counterparty failed
 */
async function handleTraditionalDepositTimeout(
  escrow: EscrowContract
): Promise<TimeoutHandlingResult> {
  const supabase = getSupabase()

  // Check deposit status
  const buyerDeposited = escrow.buyer_deposited
  const sellerDeposited = escrow.seller_deposited

  console.log(`   Buyer deposited: ${buyerDeposited}`)
  console.log(`   Seller deposited: ${sellerDeposited}`)

  // If neither deposited, just cancel
  if (!buyerDeposited && !sellerDeposited) {
    await supabase
      .from('escrow_contracts')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', escrow.id)

    await logAction(escrow.id, 'system', 'cancelled', 'Cancelled due to deposit timeout')

    return {
      success: true,
      action: 'cancelled_no_deposits',
    }
  }

  // If both deposited, move to active (shouldn't happen but handle it)
  if (buyerDeposited && sellerDeposited) {
    await supabase
      .from('escrow_contracts')
      .update({ status: 'fully_funded' })
      .eq('id', escrow.id)

    return {
      success: true,
      action: 'marked_fully_funded',
    }
  }

  // Partial deposit - refund the party that deposited
  const { transferSOL, transferSPLToken } = await import('./transaction-signer')
  const { decryptPrivateKey } = await import('./wallet-manager')

  let refundRecipient: string
  let refundAmount: number
  let partyName: string

  if (buyerDeposited) {
    refundRecipient = escrow.buyer_wallet
    refundAmount = escrow.buyer_amount
    partyName = 'buyer'
  } else {
    refundRecipient = escrow.seller_wallet
    refundAmount = escrow.seller_amount || 0
    partyName = 'seller'
  }

  console.log(`   Refunding ${partyName}: ${refundAmount} ${escrow.token}`)

  // Execute refund
  let txSignature: string
  if (escrow.token === 'SOL') {
    txSignature = await transferSOL(
      escrow.encrypted_private_key,
      refundRecipient,
      refundAmount
    )
  } else {
    const tokenMints: Record<string, string> = {
      USDC: process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: process.env.NEXT_PUBLIC_USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    }
    const mint = tokenMints[escrow.token] || escrow.token
    txSignature = await transferSPLToken(
      escrow.encrypted_private_key,
      refundRecipient,
      refundAmount,
      mint
    )
  }

  // Record refund
  await supabase.from('escrow_releases').insert({
    id: nanoid(10),
    escrow_id: escrow.id,
    release_type: 'refund',
    from_wallet: escrow.escrow_wallet,
    to_wallet: refundRecipient,
    amount: refundAmount,
    token: escrow.token,
    tx_signature: txSignature,
    confirmed: true,
    triggered_by: 'system',
  })

  // Update escrow status
  await supabase
    .from('escrow_contracts')
    .update({
      status: 'refunded',
      completed_at: new Date().toISOString(),
    })
    .eq('id', escrow.id)

  await logAction(
    escrow.id,
    'system',
    'refunded',
    `Deposit timeout: Refunded ${partyName} ${refundAmount} ${escrow.token}. TX: ${txSignature}`
  )

  // Notify parties
  await createNotification(
    escrow.id,
    refundRecipient,
    'refund_processed',
    'Deposit Timeout - Refund Processed',
    `The counterparty did not deposit in time. Your ${refundAmount} ${escrow.token} has been refunded. TX: ${txSignature}`
  )

  return {
    success: true,
    action: 'refunded_partial_deposit',
    txSignature,
  }
}

/**
 * Handle confirmation timeout for traditional escrow
 * Favor the party that confirmed
 */
async function handleTraditionalConfirmationTimeout(
  escrow: EscrowContract
): Promise<TimeoutHandlingResult> {
  const supabase = getSupabase()

  const buyerConfirmed = escrow.buyer_confirmed
  const sellerConfirmed = escrow.seller_confirmed

  console.log(`   Buyer confirmed: ${buyerConfirmed}`)
  console.log(`   Seller confirmed: ${sellerConfirmed}`)

  // If both confirmed, release funds (shouldn't happen but handle it)
  if (buyerConfirmed && sellerConfirmed) {
    const { releaseTraditionalEscrowFunds } = await import('./traditional')
    await releaseTraditionalEscrowFunds(escrow.id)

    return {
      success: true,
      action: 'released_both_confirmed',
    }
  }

  // If neither confirmed, escalate to admin
  if (!buyerConfirmed && !sellerConfirmed) {
    return {
      success: true,
      action: 'escalate_to_admin',
    }
  }

  // One party confirmed - favor them
  // This is a policy decision: the confirming party gets their deposit back
  // and the non-confirming party loses their deposit (goes to confirming party)

  const { transferToMultiple } = await import('./transaction-signer')

  let recipients: Array<{ address: string; amount: number }>

  if (buyerConfirmed && !sellerConfirmed) {
    // Buyer confirmed, seller didn't - buyer gets everything
    console.log(`   Favoring buyer (confirmed)`)
    recipients = [
      {
        address: escrow.buyer_wallet,
        amount: escrow.buyer_amount + (escrow.seller_amount || 0),
      },
    ]
  } else {
    // Seller confirmed, buyer didn't - seller gets everything
    console.log(`   Favoring seller (confirmed)`)
    recipients = [
      {
        address: escrow.seller_wallet,
        amount: escrow.buyer_amount + (escrow.seller_amount || 0),
      },
    ]
  }

  const txSignature = await transferToMultiple(
    escrow.encrypted_private_key,
    recipients,
    escrow.token
  )

  // Record release
  await supabase.from('escrow_releases').insert({
    id: nanoid(10),
    escrow_id: escrow.id,
    release_type: 'dispute_resolution',
    from_wallet: escrow.escrow_wallet,
    to_wallet: recipients[0].address,
    amount: recipients[0].amount,
    token: escrow.token,
    tx_signature: txSignature,
    confirmed: true,
    triggered_by: 'system',
  })

  // Update escrow status
  await supabase
    .from('escrow_contracts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', escrow.id)

  await logAction(
    escrow.id,
    'system',
    'released',
    `Confirmation timeout: Favored confirming party. TX: ${txSignature}`
  )

  return {
    success: true,
    action: 'favored_confirming_party',
    txSignature,
  }
}

// ============================================
// MILESTONE ESCROW TIMEOUT HANDLING
// ============================================

/**
 * Handle milestone escrow timeouts
 * Rules:
 * - Deposit timeout: Refund buyer if deposited
 * - Milestone timeout: Escalate to admin for review
 */
export async function handleMilestoneEscrowTimeout(
  escrow: EscrowContract,
  timeout: EscrowTimeout
): Promise<TimeoutHandlingResult> {
  try {
    console.log(`🔄 Handling milestone escrow timeout`)

    switch (timeout.timeout_type) {
      case 'deposit_timeout':
        return await handleMilestoneDepositTimeout(escrow)

      case 'milestone_timeout':
        return await handleMilestoneWorkTimeout(escrow, timeout)

      default:
        return {
          success: false,
          action: 'escalate_to_admin',
          error: `Unhandled timeout type for milestone escrow: ${timeout.timeout_type}`,
        }
    }
  } catch (error: any) {
    console.error('Handle milestone escrow timeout error:', error)
    return {
      success: false,
      action: 'error',
      error: error.message,
    }
  }
}

/**
 * Handle deposit timeout for milestone escrow
 * Refund buyer if they deposited
 */
async function handleMilestoneDepositTimeout(
  escrow: EscrowContract
): Promise<TimeoutHandlingResult> {
  const supabase = getSupabase()

  if (!escrow.buyer_deposited) {
    // No deposit, just cancel
    await supabase
      .from('escrow_contracts')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', escrow.id)

    await logAction(escrow.id, 'system', 'cancelled', 'Cancelled due to no deposit')

    return {
      success: true,
      action: 'cancelled_no_deposit',
    }
  }

  // Buyer deposited - refund
  const { transferSOL, transferSPLToken } = await import('./transaction-signer')

  console.log(`   Refunding buyer: ${escrow.buyer_amount} ${escrow.token}`)

  let txSignature: string
  if (escrow.token === 'SOL') {
    txSignature = await transferSOL(
      escrow.encrypted_private_key,
      escrow.buyer_wallet,
      escrow.buyer_amount
    )
  } else {
    const tokenMints: Record<string, string> = {
      USDC: process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: process.env.NEXT_PUBLIC_USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    }
    const mint = tokenMints[escrow.token] || escrow.token
    txSignature = await transferSPLToken(
      escrow.encrypted_private_key,
      escrow.buyer_wallet,
      escrow.buyer_amount,
      mint
    )
  }

  // Record refund
  await supabase.from('escrow_releases').insert({
    id: nanoid(10),
    escrow_id: escrow.id,
    release_type: 'refund',
    from_wallet: escrow.escrow_wallet,
    to_wallet: escrow.buyer_wallet,
    amount: escrow.buyer_amount,
    token: escrow.token,
    tx_signature: txSignature,
    confirmed: true,
    triggered_by: 'system',
  })

  // Update escrow status
  await supabase
    .from('escrow_contracts')
    .update({
      status: 'refunded',
      completed_at: new Date().toISOString(),
    })
    .eq('id', escrow.id)

  await logAction(
    escrow.id,
    'system',
    'refunded',
    `Deposit timeout: Refunded buyer ${escrow.buyer_amount} ${escrow.token}. TX: ${txSignature}`
  )

  // Notify buyer
  await createNotification(
    escrow.id,
    escrow.buyer_wallet,
    'refund_processed',
    'Deposit Timeout - Refund Processed',
    `The seller did not begin work in time. Your ${escrow.buyer_amount} ${escrow.token} has been refunded. TX: ${txSignature}`
  )

  return {
    success: true,
    action: 'refunded_buyer',
    txSignature,
  }
}

/**
 * Handle milestone work timeout
 * Escalate to admin for review
 */
async function handleMilestoneWorkTimeout(
  escrow: EscrowContract,
  timeout: EscrowTimeout
): Promise<TimeoutHandlingResult> {
  // Milestone timeouts are complex and require admin review
  // The admin will decide whether to:
  // - Release remaining funds to buyer
  // - Give seller more time
  // - Partial release based on completed work

  console.log(`   Escalating milestone timeout to admin review`)

  return {
    success: true,
    action: 'escalate_to_admin',
  }
}

// ============================================
// ATOMIC SWAP TIMEOUT HANDLING
// ============================================

/**
 * Handle atomic swap timeouts
 * Rules:
 * - Refund the party that deposited if counterparty failed
 * - If both deposited, execute the swap
 */
export async function handleAtomicSwapTimeout(
  escrow: EscrowContract,
  timeout: EscrowTimeout
): Promise<TimeoutHandlingResult> {
  try {
    console.log(`🔄 Handling atomic swap timeout`)

    // Use existing atomic swap timeout handler
    const { handleSwapTimeout } = await import('./atomic-swap')

    const handled = await handleSwapTimeout(escrow.id)

    if (handled) {
      return {
        success: true,
        action: 'swap_timeout_handled',
      }
    } else {
      return {
        success: false,
        action: 'error',
        error: 'Failed to handle swap timeout',
      }
    }
  } catch (error: any) {
    console.error('Handle atomic swap timeout error:', error)
    return {
      success: false,
      action: 'error',
      error: error.message,
    }
  }
}

// ============================================
// BATCH TIMEOUT PROCESSING
// ============================================

/**
 * Process all expired timeouts
 * This should be called periodically by a cron job
 */
export async function processAllExpiredTimeouts(): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> {
  const result = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  }

  try {
    const supabase = getSupabase()

    console.log('🔄 Processing all expired timeouts...')

    // Get all expired, unresolved timeouts
    const { data: timeouts, error } = await supabase
      .from('escrow_timeouts')
      .select('*')
      .eq('resolved', false)
      .eq('expired', true)
      .order('expires_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch expired timeouts: ${error.message}`)
    }

    if (!timeouts || timeouts.length === 0) {
      console.log('✅ No expired timeouts to process')
      return result
    }

    console.log(`📋 Processing ${timeouts.length} expired timeouts`)

    for (const timeout of timeouts) {
      result.processed++

      try {
        const handlingResult = await handleTimeout(timeout.escrow_id, timeout.id)

        if (handlingResult.success) {
          result.successful++
          console.log(`   ✅ ${timeout.id}: ${handlingResult.action}`)
        } else {
          result.failed++
          result.errors.push(`${timeout.id}: ${handlingResult.error}`)
          console.log(`   ❌ ${timeout.id}: ${handlingResult.error}`)
        }
      } catch (error: any) {
        result.failed++
        result.errors.push(`${timeout.id}: ${error.message}`)
        console.error(`   ❌ ${timeout.id}:`, error)
      }
    }

    console.log('\n📊 Timeout Processing Summary:')
    console.log(`   Processed: ${result.processed}`)
    console.log(`   Successful: ${result.successful}`)
    console.log(`   Failed: ${result.failed}`)

    return result
  } catch (error: any) {
    console.error('Process all expired timeouts error:', error)
    result.errors.push(error.message)
    return result
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logAction(
  escrowId: string,
  actorWallet: string,
  actionType: string,
  notes: string
) {
  const supabase = getSupabase()
  await supabase.from('escrow_actions').insert({
    id: nanoid(10),
    escrow_id: escrowId,
    actor_wallet: actorWallet,
    action_type: actionType,
    notes,
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
    link: `/escrow/${escrowId}`,
  })
}

// ============================================
// EXPORTS
// ============================================

export default {
  handleTimeout,
  handleTraditionalEscrowTimeout,
  handleMilestoneEscrowTimeout,
  handleAtomicSwapTimeout,
  processAllExpiredTimeouts,
}
