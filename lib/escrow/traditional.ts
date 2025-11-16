/**
 * Traditional Escrow Implementation
 * Both buyer and seller deposit funds, released on mutual confirmation
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import { createEncryptedEscrowWallet } from './wallet-manager'
import {
  CreateTraditionalEscrowParams,
  EscrowContract,
  CreateEscrowResponse
} from './types'

// ============================================
// CREATE TRADITIONAL ESCROW
// ============================================

/**
 * Create a traditional escrow contract
 * Both parties must deposit before escrow becomes active
 */
export async function createTraditionalEscrow(
  params: CreateTraditionalEscrowParams
): Promise<CreateEscrowResponse> {
  try {
    const supabase = getSupabase()
    
    // Validate inputs
    if (!params.buyerWallet || !params.sellerWallet) {
      throw new Error('Both buyer and seller wallet addresses are required')
    }
    
    if (params.buyerAmount <= 0) {
      throw new Error('Buyer amount must be greater than 0')
    }
    
    if (params.sellerSecurityDeposit <= 0) {
      throw new Error('Seller security deposit must be greater than 0')
    }
    
    if (params.buyerWallet === params.sellerWallet) {
      throw new Error('Buyer and seller cannot be the same wallet')
    }
    
    // Generate unique IDs
    const escrowId = nanoid(12)
    const paymentId = nanoid(10)
    
    // Create escrow wallet
    const { publicKey, encryptedPrivateKey } = createEncryptedEscrowWallet()
    
    // Calculate expiration
    const timeoutHours = params.timeoutHours || 72
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + timeoutHours)
    
    // Create escrow contract
    const escrowData: Partial<EscrowContract> = {
      id: escrowId,
      escrow_type: 'traditional',
      payment_id: paymentId,
      buyer_wallet: params.buyerWallet,
      seller_wallet: params.sellerWallet,
      buyer_amount: params.buyerAmount,
      seller_amount: params.sellerSecurityDeposit,
      token: params.token,
      escrow_wallet: publicKey,
      encrypted_private_key: encryptedPrivateKey,
      status: 'created',
      buyer_deposited: false,
      seller_deposited: false,
      buyer_confirmed: false,
      seller_confirmed: false,
      description: params.description,
      timeout_hours: timeoutHours,
      expires_at: expiresAt.toISOString()
    }
    
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .insert(escrowData)
      .select()
      .single()
    
    if (escrowError) {
      console.error('Escrow creation error:', escrowError)
      throw new Error(`Failed to create escrow: ${escrowError.message}`)
    }
    
    // Log creation action
    await logEscrowAction(escrowId, params.buyerWallet, 'created', 
      `Traditional escrow created: ${params.buyerAmount} ${params.token} from buyer, ${params.sellerSecurityDeposit} ${params.token} security deposit from seller`)
    
    // Create timeout monitoring using new timeout config system
    const { createTimeoutMonitor: createTimeout } = await import('./timeout-config')
    await createTimeout({
      escrowId,
      timeoutType: 'deposit_timeout',
      customHours: timeoutHours,
      expectedAction: 'Both parties must deposit funds',
    })
    
    // Create notifications
    await createNotification(escrowId, params.buyerWallet, 'action_required',
      'Deposit Required', `Please deposit ${params.buyerAmount} ${params.token} to escrow wallet`)
    
    await createNotification(escrowId, params.sellerWallet, 'action_required',
      'Security Deposit Required', `Please deposit ${params.sellerSecurityDeposit} ${params.token} security deposit`)
    
    return {
      success: true,
      escrow: escrow as EscrowContract,
      paymentLink: `/pay/${paymentId}`
    }
  } catch (error: any) {
    console.error('Create traditional escrow error:', error)
    return {
      success: false,
      escrow: {} as EscrowContract,
      paymentLink: '',
      error: error.message
    }
  }
}

// ============================================
// DEPOSIT TRACKING
// ============================================

/**
 * Record a deposit into escrow wallet
 * @deprecated Use deposit-monitor.ts recordAndVerifyDeposit instead
 */
export async function recordDeposit(
  escrowId: string,
  depositorWallet: string,
  amount: number,
  token: string,
  txSignature: string
): Promise<boolean> {
  try {
    // Import the new deposit monitor
    const { recordAndVerifyDeposit } = await import('./deposit-monitor')
    
    const result = await recordAndVerifyDeposit(
      escrowId,
      depositorWallet,
      amount,
      token,
      txSignature
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to record deposit')
    }
    
    return true
  } catch (error: any) {
    console.error('Record deposit error:', error)
    throw error
  }
}

// ============================================
// CONFIRMATION
// ============================================

/**
 * Party confirms successful transaction
 */
export async function confirmEscrow(
  escrowId: string,
  confirmerWallet: string,
  notes?: string
): Promise<boolean> {
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
    
    // Check if fully funded
    if (escrow.status !== 'fully_funded') {
      throw new Error('Escrow must be fully funded before confirmation')
    }
    
    // Determine party role
    let updateData: any = {}
    let partyRole: string
    
    if (confirmerWallet === escrow.buyer_wallet) {
      updateData.buyer_confirmed = true
      partyRole = 'buyer'
    } else if (confirmerWallet === escrow.seller_wallet) {
      updateData.seller_confirmed = true
      partyRole = 'seller'
    } else {
      throw new Error('Only buyer or seller can confirm')
    }
    
    // Update confirmation
    const { error: updateError } = await supabase
      .from('escrow_contracts')
      .update(updateData)
      .eq('id', escrowId)
    
    if (updateError) {
      throw new Error(`Failed to update confirmation: ${updateError.message}`)
    }
    
    // Log action
    await logEscrowAction(escrowId, confirmerWallet, 'confirmed',
      notes || `${partyRole} confirmed successful transaction`)
    
    // Check if both confirmed
    const { data: updated } = await supabase
      .from('escrow_contracts')
      .select('buyer_confirmed, seller_confirmed')
      .eq('id', escrowId)
      .single()
    
    if (updated?.buyer_confirmed && updated?.seller_confirmed) {
      // Both confirmed - trigger release
      await releaseTraditionalEscrowFunds(escrowId)
    } else {
      // Notify counterparty
      const counterparty = partyRole === 'buyer' ? escrow.seller_wallet : escrow.buyer_wallet
      await createNotification(escrowId, counterparty, 'action_required',
        'Confirmation Needed', `${partyRole} has confirmed. Please confirm to release funds.`)
    }
    
    return true
  } catch (error: any) {
    console.error('Confirm escrow error:', error)
    throw error
  }
}

// ============================================
// FUND RELEASE
// ============================================

/**
 * Release funds when both parties confirm
 * Releases buyer payment to seller and returns seller's security deposit
 * Requirement 9.2: Deducts 3% platform fee from buyer's payment only
 * Requirement 9.5: Automatically deducts fees during fund release
 * Requirement 9.6: Sends platform fees to designated treasury wallet
 */
export async function releaseTraditionalEscrowFunds(escrowId: string): Promise<boolean> {
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
    
    // Verify both confirmed
    if (!escrow.buyer_confirmed || !escrow.seller_confirmed) {
      throw new Error('Both parties must confirm before release')
    }
    
    // Verify escrow is fully funded
    if (escrow.status !== 'fully_funded') {
      throw new Error('Escrow must be fully funded before release')
    }
    
    // Import fee handler and transaction signer
    const { calculateTraditionalEscrowFees, recordFeeTransaction } = await import('./fee-handler')
    const { transferToMultiple } = await import('./transaction-signer')
    
    // Calculate fees - deduct from buyer payment only, security deposit returned in full
    const fees = calculateTraditionalEscrowFees(escrow.buyer_amount, escrow.seller_amount)
    
    console.log(`🔄 Releasing traditional escrow funds for ${escrowId}`)
    console.log(`   Buyer payment (gross): ${escrow.buyer_amount} ${escrow.token}`)
    console.log(`   Platform fee (${fees.buyerPayment.feePercentage}%): ${fees.buyerPayment.platformFee} ${escrow.token}`)
    console.log(`   Net to seller: ${fees.buyerPayment.netAmount} ${escrow.token}`)
    console.log(`   Security deposit (returned in full): ${escrow.seller_amount} ${escrow.token}`)
    console.log(`   Total to seller: ${fees.buyerPayment.netAmount + escrow.seller_amount} ${escrow.token}`)
    
    // Prepare recipients with fee deduction
    const recipients = [
      {
        address: escrow.seller_wallet,
        amount: fees.buyerPayment.netAmount // Net buyer payment after fee
      },
      {
        address: escrow.seller_wallet,
        amount: escrow.seller_amount // Security deposit returned in full
      }
    ]
    
    // Add treasury fee transfer if fee > 0
    if (fees.buyerPayment.platformFee > 0) {
      const { getTreasuryWallet } = await import('./fee-handler')
      recipients.push({
        address: getTreasuryWallet(),
        amount: fees.buyerPayment.platformFee
      })
    }
    
    // Execute transfer as on-chain transaction
    const txSignature = await transferToMultiple(
      escrow.encrypted_private_key,
      recipients,
      escrow.token,
      escrowId
    )
    
    console.log(`✅ Funds released successfully. TX: ${txSignature}`)
    
    // Record releases in database
    const releaseId1 = nanoid(10)
    const releaseId2 = nanoid(10)
    
    const { error: releaseError } = await supabase.from('escrow_releases').insert([
      {
        id: releaseId1,
        escrow_id: escrowId,
        release_type: 'full_release',
        from_wallet: escrow.escrow_wallet,
        to_wallet: escrow.seller_wallet,
        amount: fees.buyerPayment.netAmount,
        token: escrow.token,
        tx_signature: txSignature,
        confirmed: true,
        triggered_by: 'system'
      },
      {
        id: releaseId2,
        escrow_id: escrowId,
        release_type: 'security_deposit_return',
        from_wallet: escrow.escrow_wallet,
        to_wallet: escrow.seller_wallet,
        amount: escrow.seller_amount,
        token: escrow.token,
        tx_signature: txSignature,
        confirmed: true,
        triggered_by: 'system'
      }
    ])
    
    if (releaseError) {
      console.error('Failed to record releases:', releaseError)
      throw new Error(`Failed to record releases: ${releaseError.message}`)
    }
    
    // Record fee transaction
    if (fees.buyerPayment.platformFee > 0) {
      await recordFeeTransaction({
        escrowId,
        feeAmount: fees.buyerPayment.platformFee,
        grossAmount: fees.buyerPayment.grossAmount,
        netAmount: fees.buyerPayment.netAmount,
        feePercentage: fees.buyerPayment.feePercentage,
        txSignature,
        feeType: 'platform_fee',
        paidBy: escrow.buyer_wallet,
        releaseType: 'full_release'
      })
    }
    
    // Update escrow status to completed
    const { error: updateError } = await supabase
      .from('escrow_contracts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', escrowId)
    
    if (updateError) {
      console.error('Failed to update escrow status:', updateError)
      throw new Error(`Failed to update escrow status: ${updateError.message}`)
    }
    
    // Log action with fee details
    await logEscrowAction(escrowId, 'system', 'released',
      `Funds released: ${fees.buyerPayment.netAmount} ${escrow.token} payment to seller (after ${fees.buyerPayment.platformFee} ${escrow.token} fee) + ${escrow.seller_amount} ${escrow.token} security deposit returned. TX: ${txSignature}`)
    
    // Notify both parties
    await createNotification(escrowId, escrow.buyer_wallet, 'escrow_completed',
      'Escrow Completed', `Funds have been released to seller. Platform fee: ${fees.buyerPayment.platformFee} ${escrow.token}. Transaction: ${txSignature}`)
    
    await createNotification(escrowId, escrow.seller_wallet, 'escrow_completed',
      'Escrow Completed', `You received ${fees.buyerPayment.netAmount + escrow.seller_amount} ${escrow.token} (${fees.buyerPayment.netAmount} payment + ${escrow.seller_amount} security deposit). Transaction: ${txSignature}`)
    
    return true
  } catch (error: any) {
    console.error('Release funds error:', error)
    
    // Log failed release attempt
    await logEscrowAction(escrowId, 'system', 'released',
      `Failed to release funds: ${error.message}`)
    
    throw error
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logEscrowAction(
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
    notes
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
  createTraditionalEscrow,
  recordDeposit,
  confirmEscrow,
  releaseTraditionalEscrowFunds
}
