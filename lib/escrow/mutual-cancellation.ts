/**
 * Mutual Cancellation Handler
 * Implements mutual cancellation requiring both parties to agree
 * Requirements: 15.2
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import { transferToMultiple } from './transaction-signer'

// ============================================
// TYPES
// ============================================

export interface CancellationRequest {
  id: string
  escrow_id: string
  requested_by: string
  requested_by_role: 'buyer' | 'seller'
  buyer_approved: boolean
  seller_approved: boolean
  buyer_approved_at?: string
  seller_approved_at?: string
  reason: string
  notes?: string
  status: 'pending' | 'approved' | 'executed' | 'rejected'
  executed_at?: string
  refund_tx_signature?: string
  created_at: string
  updated_at: string
}

export interface RequestCancellationParams {
  escrowId: string
  requestorWallet: string
  reason: string
  notes?: string
}

export interface ApproveCancellationParams {
  cancellationId: string
  approverWallet: string
}

// ============================================
// REQUEST CANCELLATION
// ============================================

/**
 * Request mutual cancellation of an escrow
 * Requires both parties to approve before execution
 */
export async function requestMutualCancellation(
  params: RequestCancellationParams
): Promise<{ success: boolean; cancellationRequest?: CancellationRequest; error?: string }> {
  try {
    const supabase = getSupabase()
    const { escrowId, requestorWallet, reason, notes } = params

    // Validate inputs
    if (!escrowId || !requestorWallet || !reason) {
      throw new Error('Missing required fields: escrowId, requestorWallet, and reason')
    }

    if (reason.trim().length < 10) {
      throw new Error('Cancellation reason must be at least 10 characters')
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

    // Verify requestor is buyer or seller
    if (escrow.buyer_wallet !== requestorWallet && escrow.seller_wallet !== requestorWallet) {
      throw new Error('Only buyer or seller can request cancellation')
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

    // Check for existing pending cancellation request
    const { data: existingRequest } = await supabase
      .from('escrow_cancellation_requests')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      throw new Error('A cancellation request is already pending for this escrow')
    }

    // Determine party role
    const requestorRole = escrow.buyer_wallet === requestorWallet ? 'buyer' : 'seller'
    const counterparty = requestorRole === 'buyer' ? escrow.seller_wallet : escrow.buyer_wallet

    // Create cancellation request
    const cancellationId = nanoid(12)
    const { data: cancellationRequest, error: createError } = await supabase
      .from('escrow_cancellation_requests')
      .insert({
        id: cancellationId,
        escrow_id: escrowId,
        requested_by: requestorWallet,
        requested_by_role: requestorRole,
        buyer_approved: requestorRole === 'buyer',
        seller_approved: requestorRole === 'seller',
        buyer_approved_at: requestorRole === 'buyer' ? new Date().toISOString() : null,
        seller_approved_at: requestorRole === 'seller' ? new Date().toISOString() : null,
        reason,
        notes,
        status: 'pending',
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create cancellation request:', createError)
      throw new Error('Failed to create cancellation request')
    }

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      actor_wallet: requestorWallet,
      action_type: 'cancelled',
      notes: `${requestorRole} requested mutual cancellation: ${reason}`,
      metadata: { cancellation_id: cancellationId },
    })

    // Notify counterparty
    await supabase.from('escrow_notifications').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      recipient_wallet: counterparty,
      notification_type: 'action_required',
      title: 'Cancellation Request',
      message: `${requestorRole === 'buyer' ? 'Buyer' : 'Seller'} has requested to cancel the escrow: ${reason}`,
      link: `/escrow/${escrowId}`,
      read: false,
      sent_browser: false,
      sent_email: false,
    })

    console.log(`✅ Cancellation request created for escrow ${escrowId} by ${requestorRole}`)

    return {
      success: true,
      cancellationRequest: cancellationRequest as CancellationRequest,
    }
  } catch (error: any) {
    console.error('Request cancellation error:', error)
    return {
      success: false,
      error: error.message || 'Failed to request cancellation',
    }
  }
}

// ============================================
// APPROVE CANCELLATION
// ============================================

/**
 * Approve a pending cancellation request
 * If both parties approve, execute the cancellation and refund
 */
export async function approveMutualCancellation(
  params: ApproveCancellationParams
): Promise<{ success: boolean; executed?: boolean; error?: string }> {
  try {
    const supabase = getSupabase()
    const { cancellationId, approverWallet } = params

    // Validate inputs
    if (!cancellationId || !approverWallet) {
      throw new Error('Missing required fields: cancellationId and approverWallet')
    }

    // Get cancellation request
    const { data: cancellationRequest, error: requestError } = await supabase
      .from('escrow_cancellation_requests')
      .select('*')
      .eq('id', cancellationId)
      .single()

    if (requestError || !cancellationRequest) {
      throw new Error('Cancellation request not found')
    }

    if (cancellationRequest.status !== 'pending') {
      throw new Error(`Cancellation request is ${cancellationRequest.status}`)
    }

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', cancellationRequest.escrow_id)
      .single()

    if (escrowError || !escrow) {
      throw new Error('Escrow not found')
    }

    // Verify approver is the counterparty
    if (escrow.buyer_wallet !== approverWallet && escrow.seller_wallet !== approverWallet) {
      throw new Error('Only buyer or seller can approve cancellation')
    }

    // Determine approver role
    const approverRole = escrow.buyer_wallet === approverWallet ? 'buyer' : 'seller'

    // Check if already approved by this party
    if (
      (approverRole === 'buyer' && cancellationRequest.buyer_approved) ||
      (approverRole === 'seller' && cancellationRequest.seller_approved)
    ) {
      throw new Error('You have already approved this cancellation')
    }

    // Update approval
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (approverRole === 'buyer') {
      updateData.buyer_approved = true
      updateData.buyer_approved_at = new Date().toISOString()
    } else {
      updateData.seller_approved = true
      updateData.seller_approved_at = new Date().toISOString()
    }

    // Check if both parties have now approved
    const bothApproved =
      (approverRole === 'buyer' && cancellationRequest.seller_approved) ||
      (approverRole === 'seller' && cancellationRequest.buyer_approved)

    if (bothApproved) {
      updateData.status = 'approved'
    }

    const { error: updateError } = await supabase
      .from('escrow_cancellation_requests')
      .update(updateData)
      .eq('id', cancellationId)

    if (updateError) {
      console.error('Failed to update cancellation request:', updateError)
      throw new Error('Failed to approve cancellation')
    }

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrow.id,
      actor_wallet: approverWallet,
      action_type: 'cancelled',
      notes: `${approverRole} approved cancellation request`,
      metadata: { cancellation_id: cancellationId },
    })

    console.log(`✅ Cancellation approved by ${approverRole} for escrow ${escrow.id}`)

    // If both approved, execute cancellation
    if (bothApproved) {
      console.log(`🔄 Both parties approved - executing cancellation for escrow ${escrow.id}`)
      await executeMutualCancellation(cancellationId, escrow)
      return { success: true, executed: true }
    } else {
      // Notify requestor that counterparty approved
      const requestor = cancellationRequest.requested_by
      await supabase.from('escrow_notifications').insert({
        id: nanoid(12),
        escrow_id: escrow.id,
        recipient_wallet: requestor,
        notification_type: 'action_required',
        title: 'Cancellation Approved',
        message: `${approverRole === 'buyer' ? 'Buyer' : 'Seller'} has approved the cancellation. Refund will be processed.`,
        link: `/escrow/${escrow.id}`,
        read: false,
        sent_browser: false,
        sent_email: false,
      })

      return { success: true, executed: false }
    }
  } catch (error: any) {
    console.error('Approve cancellation error:', error)
    return {
      success: false,
      error: error.message || 'Failed to approve cancellation',
    }
  }
}

// ============================================
// EXECUTE CANCELLATION
// ============================================

/**
 * Execute mutual cancellation and refund deposits minus fees
 * Called automatically when both parties approve
 */
async function executeMutualCancellation(
  cancellationId: string,
  escrow: any
): Promise<void> {
  const supabase = getSupabase()

  try {
    console.log(`🔄 Executing mutual cancellation for escrow ${escrow.id}`)

    // Get all confirmed deposits
    const { data: deposits, error: depositsError } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrow.id)
      .eq('confirmed', true)

    if (depositsError) {
      throw new Error(`Failed to fetch deposits: ${depositsError.message}`)
    }

    if (!deposits || deposits.length === 0) {
      console.log('⚠️ No deposits to refund')
      // Still mark as cancelled
      await supabase
        .from('escrow_contracts')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', escrow.id)

      await supabase
        .from('escrow_cancellation_requests')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
        })
        .eq('id', cancellationId)

      return
    }

    // Calculate refunds minus network fees (small fee for transaction costs)
    // Platform takes 1% cancellation fee to cover operational costs
    const CANCELLATION_FEE_PERCENTAGE = 0.01
    const recipients: Array<{ address: string; amount: number }> = []

    for (const deposit of deposits) {
      const feeAmount = deposit.amount * CANCELLATION_FEE_PERCENTAGE
      const refundAmount = deposit.amount - feeAmount

      recipients.push({
        address: deposit.depositor_wallet,
        amount: refundAmount,
      })

      console.log(
        `   Refunding ${refundAmount} ${deposit.token} to ${deposit.depositor_wallet} (fee: ${feeAmount})`
      )
    }

    // Execute refund transaction
    const txSignature = await transferToMultiple(
      escrow.encrypted_private_key,
      recipients,
      escrow.token
    )

    console.log(`✅ Refunds executed successfully. TX: ${txSignature}`)

    // Record refund releases
    for (const deposit of deposits) {
      const feeAmount = deposit.amount * CANCELLATION_FEE_PERCENTAGE
      const refundAmount = deposit.amount - feeAmount

      await supabase.from('escrow_releases').insert({
        id: nanoid(12),
        escrow_id: escrow.id,
        release_type: 'refund',
        from_wallet: escrow.escrow_wallet,
        to_wallet: deposit.depositor_wallet,
        amount: refundAmount,
        token: deposit.token,
        tx_signature: txSignature,
        confirmed: true,
        triggered_by: 'system',
      })
    }

    // Update escrow status
    await supabase
      .from('escrow_contracts')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', escrow.id)

    // Update cancellation request
    await supabase
      .from('escrow_cancellation_requests')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
        refund_tx_signature: txSignature,
      })
      .eq('id', cancellationId)

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrow.id,
      actor_wallet: 'system',
      action_type: 'refunded',
      notes: `Mutual cancellation executed. Refunds processed minus 1% cancellation fee. TX: ${txSignature}`,
      metadata: { cancellation_id: cancellationId, tx_signature: txSignature },
    })

    // Notify both parties
    await supabase.from('escrow_notifications').insert([
      {
        id: nanoid(12),
        escrow_id: escrow.id,
        recipient_wallet: escrow.buyer_wallet,
        notification_type: 'refund_processed',
        title: 'Escrow Cancelled',
        message: `Escrow cancelled by mutual agreement. Your deposit has been refunded minus 1% cancellation fee. TX: ${txSignature}`,
        link: `/escrow/${escrow.id}`,
        read: false,
        sent_browser: false,
        sent_email: false,
      },
      {
        id: nanoid(12),
        escrow_id: escrow.id,
        recipient_wallet: escrow.seller_wallet,
        notification_type: 'refund_processed',
        title: 'Escrow Cancelled',
        message: `Escrow cancelled by mutual agreement. Your deposit has been refunded minus 1% cancellation fee. TX: ${txSignature}`,
        link: `/escrow/${escrow.id}`,
        read: false,
        sent_browser: false,
        sent_email: false,
      },
    ])

    console.log(`✅ Mutual cancellation completed for escrow ${escrow.id}`)
  } catch (error: any) {
    console.error('Execute cancellation error:', error)

    // Mark cancellation as failed
    await supabase
      .from('escrow_cancellation_requests')
      .update({
        status: 'rejected',
        notes: `Failed to execute: ${error.message}`,
      })
      .eq('id', cancellationId)

    // Log failed attempt
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrow.id,
      actor_wallet: 'system',
      action_type: 'cancelled',
      notes: `Failed to execute mutual cancellation: ${error.message}`,
      metadata: { cancellation_id: cancellationId, error: error.message },
    })

    throw error
  }
}

// ============================================
// GET CANCELLATION REQUEST
// ============================================

/**
 * Get cancellation request for an escrow
 */
export async function getCancellationRequest(
  escrowId: string
): Promise<{ success: boolean; cancellationRequest?: CancellationRequest; error?: string }> {
  try {
    const supabase = getSupabase()

    const { data: cancellationRequest, error } = await supabase
      .from('escrow_cancellation_requests')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('status', 'pending')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is ok
      throw error
    }

    return {
      success: true,
      cancellationRequest: cancellationRequest as CancellationRequest | undefined,
    }
  } catch (error: any) {
    console.error('Get cancellation request error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get cancellation request',
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  requestMutualCancellation,
  approveMutualCancellation,
  getCancellationRequest,
}
