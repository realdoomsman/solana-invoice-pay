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
    
    // Create timeout monitoring
    await createTimeoutMonitor(escrowId, 'deposit_timeout', timeoutHours)
    
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
 */
export async function recordDeposit(
  escrowId: string,
  depositorWallet: string,
  amount: number,
  token: string,
  txSignature: string
): Promise<boolean> {
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
    
    // Determine party role
    let partyRole: 'buyer' | 'seller'
    if (depositorWallet === escrow.buyer_wallet) {
      partyRole = 'buyer'
    } else if (depositorWallet === escrow.seller_wallet) {
      partyRole = 'seller'
    } else {
      throw new Error('Depositor is not a party in this escrow')
    }
    
    // Record deposit
    const depositId = nanoid(10)
    const { error: depositError } = await supabase
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
        confirmation_count: 1
      })
    
    if (depositError) {
      throw new Error(`Failed to record deposit: ${depositError.message}`)
    }
    
    // Log action
    await logEscrowAction(escrowId, depositorWallet, 'deposited',
      `${partyRole} deposited ${amount} ${token}`)
    
    // Notify counterparty
    const counterparty = partyRole === 'buyer' ? escrow.seller_wallet : escrow.buyer_wallet
    await createNotification(escrowId, counterparty, 'deposit_received',
      'Deposit Received', `${partyRole} has deposited their funds`)
    
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
    
    // Import transaction signer
    const { transferToMultiple } = await import('./transaction-signer')
    
    // Prepare recipients
    const recipients = [
      {
        address: escrow.seller_wallet,
        amount: escrow.buyer_amount // Buyer's payment goes to seller
      },
      {
        address: escrow.seller_wallet,
        amount: escrow.seller_amount // Seller's security deposit returns to seller
      }
    ]
    
    // Execute transfer
    const txSignature = await transferToMultiple(
      escrow.encrypted_private_key,
      recipients,
      escrow.token
    )
    
    // Record releases
    const releaseId1 = nanoid(10)
    const releaseId2 = nanoid(10)
    
    await supabase.from('escrow_releases').insert([
      {
        id: releaseId1,
        escrow_id: escrowId,
        release_type: 'full_release',
        from_wallet: escrow.escrow_wallet,
        to_wallet: escrow.seller_wallet,
        amount: escrow.buyer_amount,
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
    
    // Update escrow status
    await supabase
      .from('escrow_contracts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', escrowId)
    
    // Log action
    await logEscrowAction(escrowId, 'system', 'released',
      `Funds released: ${escrow.buyer_amount + escrow.seller_amount} ${escrow.token} to seller`)
    
    // Notify both parties
    await createNotification(escrowId, escrow.buyer_wallet, 'escrow_completed',
      'Escrow Completed', 'Funds have been released to seller')
    
    await createNotification(escrowId, escrow.seller_wallet, 'escrow_completed',
      'Escrow Completed', `You received ${escrow.buyer_amount + escrow.seller_amount} ${escrow.token}`)
    
    return true
  } catch (error: any) {
    console.error('Release funds error:', error)
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

async function createTimeoutMonitor(
  escrowId: string,
  timeoutType: string,
  hours: number
) {
  const supabase = getSupabase()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + hours)
  
  await supabase.from('escrow_timeouts').insert({
    id: nanoid(10),
    escrow_id: escrowId,
    timeout_type: timeoutType,
    expected_action: 'Both parties must deposit',
    expires_at: expiresAt.toISOString()
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
