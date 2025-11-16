/**
 * Simple Cancellation Handler
 * Allows creator to cancel unfunded escrow and refund any deposits
 * Requirements: 15.1
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import { transferToMultiple } from './transaction-signer'

// ============================================
// TYPES
// ============================================

export interface SimpleCancellationParams {
  escrowId: string
  creatorWallet: string
  reason?: string
}

export interface SimpleCancellationResult {
  success: boolean
  refunded?: boolean
  refundTxSignature?: string
  error?: string
}

// ============================================
// CANCEL UNFUNDED ESCROW
// ============================================

/**
 * Cancel an unfunded escrow and refund any deposits
 * Only the creator can cancel before the escrow is fully funded
 * Requirements: 15.1
 */
export async function cancelUnfundedEscrow(
  params: SimpleCancellationParams
): Promise<SimpleCancellationResult> {
  try {
    const supabase = getSupabase()
    const { escrowId, creatorWallet, reason } = params

    // Validate inputs
    if (!escrowId || !creatorWallet) {
      throw new Error('Missing required fields: escrowId and creatorWallet')
    }

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      throw new Error('Escrow not found')
    }

    // Verify creator is the buyer (creator of the escrow)
    // In traditional escrow, buyer creates the escrow
    // In simple_buyer escrow, buyer creates the escrow
    // In atomic_swap, partyA creates the escrow
    const isCreator = 
      escrow.buyer_wallet === creatorWallet ||
      (escrow.escrow_type === 'atomic_swap' && escrow.buyer_wallet === creatorWallet)

    if (!isCreator) {
      throw new Error('Only the escrow creator can cancel an unfunded escrow')
    }

    // Check if escrow can be cancelled
    if (escrow.status === 'completed') {
      throw new Error('Cannot cancel completed escrow')
    }

    if (escrow.status === 'cancelled') {
      throw new Error('Escrow is already cancelled')
    }

    if (escrow.status === 'refunded') {
      throw new Error('Escrow has already been refunded')
    }

    // Check if escrow is fully funded
    if (escrow.status === 'fully_funded' || escrow.status === 'active') {
      throw new Error(
        'Cannot cancel fully funded escrow. Use mutual cancellation instead.'
      )
    }

    // For traditional escrow, check if both parties have deposited
    if (escrow.escrow_type === 'traditional') {
      if (escrow.buyer_deposited && escrow.seller_deposited) {
        throw new Error(
          'Cannot cancel escrow with both deposits. Use mutual cancellation instead.'
        )
      }
    }

    // For atomic swap, check if both parties have deposited
    if (escrow.escrow_type === 'atomic_swap') {
      if (escrow.buyer_deposited && escrow.seller_deposited) {
        throw new Error(
          'Cannot cancel escrow with both deposits. Use mutual cancellation instead.'
        )
      }
    }

    console.log(`🔄 Cancelling unfunded escrow ${escrowId}`)

    // Get any confirmed deposits
    const { data: deposits, error: depositsError } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('confirmed', true)

    if (depositsError) {
      throw new Error(`Failed to fetch deposits: ${depositsError.message}`)
    }

    let refundTxSignature: string | undefined

    // If there are deposits, refund them
    if (deposits && deposits.length > 0) {
      console.log(`   Found ${deposits.length} deposit(s) to refund`)

      const recipients: Array<{ address: string; amount: number }> = []

      for (const deposit of deposits) {
        recipients.push({
          address: deposit.depositor_wallet,
          amount: deposit.amount,
        })

        console.log(
          `   Refunding ${deposit.amount} ${deposit.token} to ${deposit.depositor_wallet}`
        )
      }

      // Execute refund transaction (full refund, no fees for unfunded cancellation)
      refundTxSignature = await transferToMultiple(
        escrow.encrypted_private_key,
        recipients,
        escrow.token
      )

      console.log(`✅ Refunds executed successfully. TX: ${refundTxSignature}`)

      // Record refund releases
      for (const deposit of deposits) {
        await supabase.from('escrow_releases').insert({
          id: nanoid(12),
          escrow_id: escrowId,
          release_type: 'refund',
          from_wallet: escrow.escrow_wallet,
          to_wallet: deposit.depositor_wallet,
          amount: deposit.amount,
          token: deposit.token,
          tx_signature: refundTxSignature,
          confirmed: true,
          triggered_by: creatorWallet,
        })
      }

      // Notify depositors
      for (const deposit of deposits) {
        await supabase.from('escrow_notifications').insert({
          id: nanoid(12),
          escrow_id: escrowId,
          recipient_wallet: deposit.depositor_wallet,
          notification_type: 'refund_processed',
          title: 'Escrow Cancelled',
          message: `The escrow was cancelled by the creator. Your deposit of ${deposit.amount} ${deposit.token} has been refunded. TX: ${refundTxSignature}`,
          link: `/escrow/${escrowId}`,
          read: false,
          sent_browser: false,
          sent_email: false,
        })
      }
    } else {
      console.log('   No deposits to refund')
    }

    // Update escrow status
    await supabase
      .from('escrow_contracts')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', escrowId)

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      actor_wallet: creatorWallet,
      action_type: 'cancelled',
      notes: reason
        ? `Creator cancelled unfunded escrow: ${reason}`
        : 'Creator cancelled unfunded escrow',
      metadata: {
        refund_tx_signature: refundTxSignature,
        deposits_refunded: deposits?.length || 0,
      },
    })

    // Notify counterparty if there was one
    const counterparty =
      escrow.escrow_type === 'atomic_swap'
        ? escrow.seller_wallet
        : escrow.seller_wallet

    if (counterparty && counterparty !== creatorWallet) {
      await supabase.from('escrow_notifications').insert({
        id: nanoid(12),
        escrow_id: escrowId,
        recipient_wallet: counterparty,
        notification_type: 'escrow_completed',
        title: 'Escrow Cancelled',
        message: reason
          ? `The escrow was cancelled by the creator: ${reason}`
          : 'The escrow was cancelled by the creator',
        link: `/escrow/${escrowId}`,
        read: false,
        sent_browser: false,
        sent_email: false,
      })
    }

    console.log(`✅ Escrow ${escrowId} cancelled successfully`)

    return {
      success: true,
      refunded: deposits && deposits.length > 0,
      refundTxSignature,
    }
  } catch (error: any) {
    console.error('Cancel unfunded escrow error:', error)
    return {
      success: false,
      error: error.message || 'Failed to cancel escrow',
    }
  }
}

// ============================================
// CHECK IF ESCROW CAN BE CANCELLED
// ============================================

/**
 * Check if an escrow can be cancelled by the creator
 * Returns validation result with reason if not allowed
 */
export async function canCancelEscrow(
  escrowId: string,
  walletAddress: string
): Promise<{ canCancel: boolean; reason?: string }> {
  try {
    const supabase = getSupabase()

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      return { canCancel: false, reason: 'Escrow not found' }
    }

    // Check if wallet is the creator
    const isCreator =
      escrow.buyer_wallet === walletAddress ||
      (escrow.escrow_type === 'atomic_swap' && escrow.buyer_wallet === walletAddress)

    if (!isCreator) {
      return { canCancel: false, reason: 'Only the creator can cancel' }
    }

    // Check status
    if (escrow.status === 'completed') {
      return { canCancel: false, reason: 'Escrow is already completed' }
    }

    if (escrow.status === 'cancelled') {
      return { canCancel: false, reason: 'Escrow is already cancelled' }
    }

    if (escrow.status === 'refunded') {
      return { canCancel: false, reason: 'Escrow has already been refunded' }
    }

    // Check if fully funded
    if (escrow.status === 'fully_funded' || escrow.status === 'active') {
      return {
        canCancel: false,
        reason: 'Escrow is fully funded. Use mutual cancellation instead.',
      }
    }

    // For traditional escrow, check deposits
    if (escrow.escrow_type === 'traditional') {
      if (escrow.buyer_deposited && escrow.seller_deposited) {
        return {
          canCancel: false,
          reason: 'Both parties have deposited. Use mutual cancellation instead.',
        }
      }
    }

    // For atomic swap, check deposits
    if (escrow.escrow_type === 'atomic_swap') {
      if (escrow.buyer_deposited && escrow.seller_deposited) {
        return {
          canCancel: false,
          reason: 'Both parties have deposited. Use mutual cancellation instead.',
        }
      }
    }

    return { canCancel: true }
  } catch (error: any) {
    console.error('Check cancel escrow error:', error)
    return { canCancel: false, reason: 'Failed to check cancellation eligibility' }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  cancelUnfundedEscrow,
  canCancelEscrow,
}
