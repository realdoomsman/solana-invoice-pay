/**
 * Atomic Swap Escrow Implementation
 * Trustless P2P token swaps with automatic execution
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import { createEncryptedEscrowWallet } from './wallet-manager'
import {
  CreateAtomicSwapParams,
  EscrowContract,
  CreateEscrowResponse
} from './types'

// ============================================
// CREATE ATOMIC SWAP
// ============================================

/**
 * Create an atomic swap escrow contract
 * Both parties deposit their assets, swap executes automatically
 */
export async function createAtomicSwap(
  params: CreateAtomicSwapParams
): Promise<CreateEscrowResponse> {
  try {
    const supabase = getSupabase()
    
    // Validate inputs
    if (!params.partyAWallet || !params.partyBWallet) {
      throw new Error('Both party A and party B wallet addresses are required')
    }
    
    if (params.partyAWallet === params.partyBWallet) {
      throw new Error('Party A and party B cannot be the same wallet')
    }
    
    if (!params.partyAAsset || !params.partyBAsset) {
      throw new Error('Both assets must be specified')
    }
    
    if (params.partyAAsset.amount <= 0 || params.partyBAsset.amount <= 0) {
      throw new Error('Asset amounts must be greater than 0')
    }
    
    // Validate supported tokens
    const supportedTokens = ['SOL', 'USDC', 'USDT']
    if (!supportedTokens.includes(params.partyAAsset.token) && !params.partyAAsset.mint) {
      throw new Error(`Unsupported token: ${params.partyAAsset.token}. Provide mint address for SPL tokens.`)
    }
    if (!supportedTokens.includes(params.partyBAsset.token) && !params.partyBAsset.mint) {
      throw new Error(`Unsupported token: ${params.partyBAsset.token}. Provide mint address for SPL tokens.`)
    }
    
    // Generate unique IDs
    const escrowId = nanoid(12)
    const paymentId = nanoid(10)
    
    // Create escrow wallet
    const { publicKey, encryptedPrivateKey } = createEncryptedEscrowWallet()
    
    // Calculate expiration (shorter timeout for swaps - default 24 hours)
    const timeoutHours = params.timeoutHours || 24
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + timeoutHours)
    
    // Create escrow contract
    // For atomic swap, we use buyer/seller fields to represent party A/B
    const escrowData: Partial<EscrowContract> = {
      id: escrowId,
      escrow_type: 'atomic_swap',
      payment_id: paymentId,
      buyer_wallet: params.partyAWallet, // Party A
      seller_wallet: params.partyBWallet, // Party B
      buyer_amount: params.partyAAsset.amount, // Party A amount
      seller_amount: params.partyBAsset.amount, // Party B amount
      token: params.partyAAsset.token, // Primary token (Party A's)
      escrow_wallet: publicKey,
      encrypted_private_key: encryptedPrivateKey,
      status: 'created',
      buyer_deposited: false,
      seller_deposited: false,
      buyer_confirmed: false,
      seller_confirmed: false,
      swap_asset_buyer: params.partyAAsset.mint || params.partyAAsset.token,
      swap_asset_seller: params.partyBAsset.mint || params.partyBAsset.token,
      swap_executed: false,
      description: `Atomic Swap: ${params.partyAAsset.amount} ${params.partyAAsset.token} ↔ ${params.partyBAsset.amount} ${params.partyBAsset.token}`,
      timeout_hours: timeoutHours,
      expires_at: expiresAt.toISOString()
    }
    
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .insert(escrowData)
      .select()
      .single()
    
    if (escrowError) {
      console.error('Atomic swap creation error:', escrowError)
      throw new Error(`Failed to create atomic swap: ${escrowError.message}`)
    }
    
    // Log creation action
    await logEscrowAction(
      escrowId,
      params.partyAWallet,
      'created',
      `Atomic swap created: ${params.partyAAsset.amount} ${params.partyAAsset.token} from Party A ↔ ${params.partyBAsset.amount} ${params.partyBAsset.token} from Party B`
    )
    
    // Create timeout monitoring using new timeout config system
    const { createTimeoutMonitor: createTimeout } = await import('./timeout-config')
    await createTimeout({
      escrowId,
      timeoutType: 'swap_timeout',
      customHours: timeoutHours,
      expectedAction: 'Both parties must deposit for swap',
    })
    
    // Create notifications
    await createNotification(
      escrowId,
      params.partyAWallet,
      'action_required',
      'Deposit Required for Swap',
      `Please deposit ${params.partyAAsset.amount} ${params.partyAAsset.token} to escrow wallet`
    )
    
    await createNotification(
      escrowId,
      params.partyBWallet,
      'action_required',
      'Deposit Required for Swap',
      `Please deposit ${params.partyBAsset.amount} ${params.partyBAsset.token} to escrow wallet`
    )
    
    console.log(`✅ Atomic swap created: ${escrowId}`)
    console.log(`   Party A: ${params.partyAAsset.amount} ${params.partyAAsset.token}`)
    console.log(`   Party B: ${params.partyBAsset.amount} ${params.partyBAsset.token}`)
    console.log(`   Escrow wallet: ${publicKey}`)
    
    return {
      success: true,
      escrow: escrow as EscrowContract,
      paymentLink: `/pay/${paymentId}`
    }
  } catch (error: any) {
    console.error('Create atomic swap error:', error)
    return {
      success: false,
      escrow: {} as EscrowContract,
      paymentLink: '',
      error: error.message
    }
  }
}

// ============================================
// DEPOSIT DETECTION
// ============================================

/**
 * Monitor deposits for atomic swap
 * Checks if both parties have deposited their assets
 * This function actively monitors and can trigger automatic swap execution
 */
export async function monitorSwapDeposits(escrowId: string, autoTrigger: boolean = false): Promise<{
  partyADeposited: boolean
  partyBDeposited: boolean
  bothDeposited: boolean
  readyForSwap: boolean
  swapTriggered?: boolean
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
    
    if (escrow.escrow_type !== 'atomic_swap') {
      throw new Error('Not an atomic swap escrow')
    }
    
    // Check deposit status from database
    const partyADeposited = escrow.buyer_deposited // Party A = buyer
    const partyBDeposited = escrow.seller_deposited // Party B = seller
    const bothDeposited = partyADeposited && partyBDeposited
    const readyForSwap = bothDeposited && !escrow.swap_executed
    
    console.log(`📊 Swap deposit status for ${escrowId}:`)
    console.log(`   Party A (${escrow.buyer_wallet}): ${partyADeposited ? '✓' : '✗'} deposited`)
    console.log(`   Party B (${escrow.seller_wallet}): ${partyBDeposited ? '✓' : '✗'} deposited`)
    console.log(`   Both deposited: ${bothDeposited ? 'YES' : 'NO'}`)
    console.log(`   Ready for swap: ${readyForSwap ? 'YES' : 'NO'}`)
    
    // If both deposited and auto-trigger enabled, execute swap
    let swapTriggered = false
    if (autoTrigger && readyForSwap) {
      console.log(`🚀 Auto-triggering swap execution for ${escrowId}`)
      swapTriggered = await detectAndTriggerSwap(escrowId)
    }
    
    return {
      partyADeposited,
      partyBDeposited,
      bothDeposited,
      readyForSwap,
      swapTriggered
    }
  } catch (error: any) {
    console.error('Monitor swap deposits error:', error)
    throw error
  }
}

/**
 * Monitor for Party A deposit specifically
 * Returns detailed information about Party A's deposit status
 */
export async function monitorPartyADeposit(escrowId: string): Promise<{
  deposited: boolean
  expectedAmount: number
  expectedAsset: string
  deposit?: any
  escrowWallet: string
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
    
    if (escrow.escrow_type !== 'atomic_swap') {
      throw new Error('Not an atomic swap escrow')
    }
    
    // Get Party A deposit record
    const { data: deposit } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('party_role', 'buyer') // Party A = buyer
      .eq('confirmed', true)
      .single()
    
    console.log(`📥 Party A deposit status:`)
    console.log(`   Wallet: ${escrow.buyer_wallet}`)
    console.log(`   Expected: ${escrow.buyer_amount} ${escrow.swap_asset_buyer}`)
    console.log(`   Status: ${deposit ? '✓ DEPOSITED' : '✗ PENDING'}`)
    
    return {
      deposited: !!deposit,
      expectedAmount: escrow.buyer_amount,
      expectedAsset: escrow.swap_asset_buyer,
      deposit: deposit || undefined,
      escrowWallet: escrow.escrow_wallet
    }
  } catch (error: any) {
    console.error('Monitor Party A deposit error:', error)
    throw error
  }
}

/**
 * Monitor for Party B deposit specifically
 * Returns detailed information about Party B's deposit status
 */
export async function monitorPartyBDeposit(escrowId: string): Promise<{
  deposited: boolean
  expectedAmount: number
  expectedAsset: string
  deposit?: any
  escrowWallet: string
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
    
    if (escrow.escrow_type !== 'atomic_swap') {
      throw new Error('Not an atomic swap escrow')
    }
    
    // Get Party B deposit record
    const { data: deposit } = await supabase
      .from('escrow_deposits')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('party_role', 'seller') // Party B = seller
      .eq('confirmed', true)
      .single()
    
    console.log(`📥 Party B deposit status:`)
    console.log(`   Wallet: ${escrow.seller_wallet}`)
    console.log(`   Expected: ${escrow.seller_amount} ${escrow.swap_asset_seller}`)
    console.log(`   Status: ${deposit ? '✓ DEPOSITED' : '✗ PENDING'}`)
    
    return {
      deposited: !!deposit,
      expectedAmount: escrow.seller_amount || 0,
      expectedAsset: escrow.swap_asset_seller || '',
      deposit: deposit || undefined,
      escrowWallet: escrow.escrow_wallet
    }
  } catch (error: any) {
    console.error('Monitor Party B deposit error:', error)
    throw error
  }
}

/**
 * Detect when both assets are deposited
 * This is the main detection function that checks both parties
 * and returns comprehensive status
 */
export async function detectBothDeposits(escrowId: string): Promise<{
  bothDeposited: boolean
  partyAStatus: {
    deposited: boolean
    amount: number
    asset: string
    wallet: string
  }
  partyBStatus: {
    deposited: boolean
    amount: number
    asset: string
    wallet: string
  }
  readyForSwap: boolean
  escrowWallet: string
  swapExecuted: boolean
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
    
    if (escrow.escrow_type !== 'atomic_swap') {
      throw new Error('Not an atomic swap escrow')
    }
    
    // Get both deposit statuses
    const partyAResult = await monitorPartyADeposit(escrowId)
    const partyBResult = await monitorPartyBDeposit(escrowId)
    
    const bothDeposited = partyAResult.deposited && partyBResult.deposited
    const readyForSwap = bothDeposited && !escrow.swap_executed
    
    console.log(`\n🔍 Dual Deposit Detection for ${escrowId}:`)
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`   Party A: ${partyAResult.deposited ? '✓' : '✗'} | ${partyAResult.expectedAmount} ${partyAResult.expectedAsset}`)
    console.log(`   Party B: ${partyBResult.deposited ? '✓' : '✗'} | ${partyBResult.expectedAmount} ${partyBResult.expectedAsset}`)
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`   Both Deposited: ${bothDeposited ? '✓ YES' : '✗ NO'}`)
    console.log(`   Ready for Swap: ${readyForSwap ? '✓ YES' : '✗ NO'}`)
    console.log(`   Swap Executed: ${escrow.swap_executed ? 'YES' : 'NO'}`)
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    return {
      bothDeposited,
      partyAStatus: {
        deposited: partyAResult.deposited,
        amount: partyAResult.expectedAmount,
        asset: partyAResult.expectedAsset,
        wallet: escrow.buyer_wallet
      },
      partyBStatus: {
        deposited: partyBResult.deposited,
        amount: partyBResult.expectedAmount,
        asset: partyBResult.expectedAsset,
        wallet: escrow.seller_wallet
      },
      readyForSwap,
      escrowWallet: escrow.escrow_wallet,
      swapExecuted: escrow.swap_executed || false
    }
  } catch (error: any) {
    console.error('Detect both deposits error:', error)
    throw error
  }
}

/**
 * Check if atomic swap is ready to execute
 * Verifies both deposits and returns swap details
 */
export async function checkSwapReadiness(escrowId: string): Promise<{
  ready: boolean
  escrow?: EscrowContract
  reason?: string
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
      return { ready: false, reason: 'Escrow not found' }
    }
    
    if (escrow.escrow_type !== 'atomic_swap') {
      return { ready: false, reason: 'Not an atomic swap escrow' }
    }
    
    if (escrow.swap_executed) {
      return { ready: false, reason: 'Swap already executed' }
    }
    
    if (escrow.status === 'disputed') {
      return { ready: false, reason: 'Escrow is disputed' }
    }
    
    if (escrow.status === 'cancelled') {
      return { ready: false, reason: 'Escrow is cancelled' }
    }
    
    if (!escrow.buyer_deposited || !escrow.seller_deposited) {
      return { ready: false, reason: 'Waiting for both deposits' }
    }
    
    // Check if expired
    if (escrow.expires_at) {
      const expiresAt = new Date(escrow.expires_at)
      if (expiresAt < new Date()) {
        return { ready: false, reason: 'Swap has expired' }
      }
    }
    
    return {
      ready: true,
      escrow: escrow as EscrowContract
    }
  } catch (error: any) {
    console.error('Check swap readiness error:', error)
    return { ready: false, reason: error.message }
  }
}

/**
 * Detect when both assets are deposited and trigger swap
 * This should be called after each deposit is recorded
 */
export async function detectAndTriggerSwap(escrowId: string): Promise<boolean> {
  try {
    const { ready, escrow, reason } = await checkSwapReadiness(escrowId)
    
    if (!ready) {
      console.log(`⏳ Swap not ready: ${reason}`)
      return false
    }
    
    if (!escrow) {
      throw new Error('Escrow data missing')
    }
    
    console.log(`🚀 Both deposits detected! Triggering automatic swap for ${escrowId}`)
    
    // Execute the swap
    const swapResult = await executeAtomicSwap(escrowId)
    
    return swapResult
  } catch (error: any) {
    console.error('Detect and trigger swap error:', error)
    return false
  }
}

// ============================================
// SWAP EXECUTION
// ============================================

/**
 * Execute atomic swap
 * Transfers Party A's asset to Party B and Party B's asset to Party A
 * Executes in single transaction when possible for true atomicity
 * Requirement 9.3: Charges fees to both parties equally (as percentage of their amounts)
 * Requirement 9.5: Automatically deducts fees during fund release
 * Requirement 9.6: Sends platform fees to designated treasury wallet
 */
export async function executeAtomicSwap(escrowId: string): Promise<boolean> {
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
    
    // Verify readiness
    const { ready, reason } = await checkSwapReadiness(escrowId)
    if (!ready) {
      throw new Error(`Swap not ready: ${reason}`)
    }
    
    // Import fee handler and transaction signer
    const { calculateAtomicSwapFees, recordMultipleFeeTransactions, getTreasuryWallet } = await import('./fee-handler')
    const { transferToMultiple } = await import('./transaction-signer')
    
    // Calculate fees for both parties
    const fees = calculateAtomicSwapFees(escrow.buyer_amount, escrow.seller_amount)
    
    console.log(`🔄 Executing atomic swap for ${escrowId}`)
    console.log(`   Party A (${escrow.buyer_wallet}):`)
    console.log(`     Gross: ${escrow.buyer_amount} ${escrow.swap_asset_buyer}`)
    console.log(`     Fee (${fees.partyA.feePercentage}%): ${fees.partyA.platformFee} ${escrow.swap_asset_buyer}`)
    console.log(`     Net to Party B: ${fees.partyA.netAmount} ${escrow.swap_asset_buyer}`)
    console.log(`   Party B (${escrow.seller_wallet}):`)
    console.log(`     Gross: ${escrow.seller_amount} ${escrow.swap_asset_seller}`)
    console.log(`     Fee (${fees.partyB.feePercentage}%): ${fees.partyB.platformFee} ${escrow.swap_asset_seller}`)
    console.log(`     Net to Party A: ${fees.partyB.netAmount} ${escrow.swap_asset_seller}`)
    
    // Determine if we can do this in a single transaction
    // Single transaction is possible if both assets are the same type (both SOL or both same SPL token)
    const sameAssetType = escrow.swap_asset_buyer === escrow.swap_asset_seller
    
    let txSignature: string
    let tx2Signature: string | undefined
    
    if (sameAssetType) {
      // Single transaction - swap amounts with fee deduction
      // This is truly atomic: both transfers succeed or both fail
      console.log(`   Using single atomic transaction (same asset type)`)
      
      const recipients = [
        {
          address: escrow.seller_wallet, // Party B receives Party A's net amount
          amount: fees.partyA.netAmount
        },
        {
          address: escrow.buyer_wallet, // Party A receives Party B's net amount
          amount: fees.partyB.netAmount
        }
      ]
      
      // Add treasury fee transfers
      const treasuryWallet = getTreasuryWallet()
      if (fees.partyA.platformFee > 0) {
        recipients.push({
          address: treasuryWallet,
          amount: fees.partyA.platformFee
        })
      }
      if (fees.partyB.platformFee > 0) {
        recipients.push({
          address: treasuryWallet,
          amount: fees.partyB.platformFee
        })
      }
      
      txSignature = await transferToMultiple(
        escrow.encrypted_private_key,
        recipients,
        escrow.swap_asset_buyer,
        escrowId
      )
      
      console.log(`✅ Atomic swap executed in single transaction: ${txSignature}`)
    } else {
      // Two separate transactions needed for different asset types
      // Note: This is not truly atomic at the blockchain level, but we handle failures
      console.log(`   Using two separate transactions (different asset types)`)
      console.log(`   ⚠️  Note: Cross-token swaps require two transactions`)
      
      let tx1: string | undefined
      
      try {
        // Transfer Party A's asset to Party B (with fee deduction)
        tx1 = await transferAssetWithFee(
          escrow.encrypted_private_key,
          escrow.seller_wallet,
          fees.partyA.netAmount,
          fees.partyA.platformFee,
          escrow.swap_asset_buyer,
          escrowId
        )
        
        console.log(`   ✓ Party A → Party B: ${tx1}`)
        txSignature = tx1
        
        // Transfer Party B's asset to Party A (with fee deduction)
        const tx2 = await transferAssetWithFee(
          escrow.encrypted_private_key,
          escrow.buyer_wallet,
          fees.partyB.netAmount,
          fees.partyB.platformFee,
          escrow.swap_asset_seller,
          escrowId
        )
        
        console.log(`   ✓ Party B → Party A: ${tx2}`)
        tx2Signature = tx2
        
        console.log(`✅ Atomic swap executed in two transactions`)
      } catch (error: any) {
        // If second transaction fails after first succeeds, we have a problem
        // Log this critical error for manual intervention
        console.error(`❌ CRITICAL: Partial swap execution failure`)
        
        if (tx1) {
          console.error(`   First transfer succeeded: ${tx1}`)
          console.error(`   Second transfer failed: ${error.message}`)
          
          // Mark escrow as disputed for admin review
          await supabase
            .from('escrow_contracts')
            .update({ status: 'disputed' })
            .eq('id', escrowId)
          
          // Create dispute record
          await supabase.from('escrow_disputes').insert({
            id: nanoid(10),
            escrow_id: escrowId,
            raised_by: 'system',
            party_role: 'system',
            reason: 'Partial swap execution failure',
            description: `First transfer succeeded (${tx1}) but second transfer failed: ${error.message}. Manual intervention required.`,
            status: 'open',
            priority: 'urgent'
          })
          
          throw new Error(`Partial swap failure - admin intervention required. First TX: ${tx1}`)
        } else {
          // First transaction failed, no partial state
          console.error(`   First transfer failed: ${error.message}`)
          throw new Error(`Swap execution failed: ${error.message}`)
        }
      }
    }
    
    // Record swap execution in database (net amounts after fees)
    const releaseId1 = nanoid(10)
    const releaseId2 = nanoid(10)
    
    const { error: releaseError } = await supabase.from('escrow_releases').insert([
      {
        id: releaseId1,
        escrow_id: escrowId,
        release_type: 'swap_execution',
        from_wallet: escrow.escrow_wallet,
        to_wallet: escrow.seller_wallet,
        amount: fees.partyA.netAmount,
        token: escrow.swap_asset_buyer,
        tx_signature: txSignature,
        confirmed: true,
        triggered_by: 'system'
      },
      {
        id: releaseId2,
        escrow_id: escrowId,
        release_type: 'swap_execution',
        from_wallet: escrow.escrow_wallet,
        to_wallet: escrow.buyer_wallet,
        amount: fees.partyB.netAmount,
        token: escrow.swap_asset_seller,
        tx_signature: tx2Signature || txSignature, // Use separate signature if available
        confirmed: true,
        triggered_by: 'system'
      }
    ])
    
    if (releaseError) {
      console.error('Failed to record swap releases:', releaseError)
      throw new Error(`Failed to record swap releases: ${releaseError.message}`)
    }
    
    // Record fee transactions for both parties
    await recordMultipleFeeTransactions([
      {
        escrowId,
        feeAmount: fees.partyA.platformFee,
        grossAmount: fees.partyA.grossAmount,
        netAmount: fees.partyA.netAmount,
        feePercentage: fees.partyA.feePercentage,
        txSignature,
        feeType: 'platform_fee',
        paidBy: escrow.buyer_wallet,
        releaseType: 'swap_execution'
      },
      {
        escrowId,
        feeAmount: fees.partyB.platformFee,
        grossAmount: fees.partyB.grossAmount,
        netAmount: fees.partyB.netAmount,
        feePercentage: fees.partyB.feePercentage,
        txSignature: tx2Signature || txSignature,
        feeType: 'platform_fee',
        paidBy: escrow.seller_wallet,
        releaseType: 'swap_execution'
      }
    ])
    
    // Update escrow status
    const { error: updateError } = await supabase
      .from('escrow_contracts')
      .update({
        status: 'completed',
        swap_executed: true,
        swap_tx_signature: txSignature,
        completed_at: new Date().toISOString()
      })
      .eq('id', escrowId)
    
    if (updateError) {
      console.error('Failed to update escrow status:', updateError)
      throw new Error(`Failed to update escrow status: ${updateError.message}`)
    }
    
    // Log action with fee details
    await logEscrowAction(
      escrowId,
      'system',
      'swapped',
      `Atomic swap executed successfully. Party A fee: ${fees.partyA.platformFee} ${escrow.swap_asset_buyer}, Party B fee: ${fees.partyB.platformFee} ${escrow.swap_asset_seller}. TX: ${txSignature}`
    )
    
    // Notify both parties with fee information
    const txInfo = tx2Signature 
      ? `Transactions: ${txSignature} and ${tx2Signature}`
      : `Transaction: ${txSignature}`
    
    await createNotification(
      escrowId,
      escrow.buyer_wallet,
      'swap_executed',
      'Swap Completed',
      `Your atomic swap has been executed. You received ${fees.partyB.netAmount} ${escrow.swap_asset_seller} (after ${fees.partyA.platformFee} ${escrow.swap_asset_buyer} fee). ${txInfo}`
    )
    
    await createNotification(
      escrowId,
      escrow.seller_wallet,
      'swap_executed',
      'Swap Completed',
      `Your atomic swap has been executed. You received ${fees.partyA.netAmount} ${escrow.swap_asset_buyer} (after ${fees.partyB.platformFee} ${escrow.swap_asset_seller} fee). ${txInfo}`
    )
    
    return true
  } catch (error: any) {
    console.error('Execute atomic swap error:', error)
    
    // Log failed swap attempt
    await logEscrowAction(
      escrowId,
      'system',
      'swapped',
      `Failed to execute swap: ${error.message}`
    )
    
    throw error
  }
}

/**
 * Transfer a single asset (SOL or SPL token)
 */
async function transferAsset(
  encryptedPrivateKey: string,
  toAddress: string,
  amount: number,
  asset: string,
  escrowId?: string
): Promise<string> {
  const { transferSOL, transferSPLToken } = await import('./transaction-signer')
  
  if (asset === 'SOL') {
    return await transferSOL(encryptedPrivateKey, toAddress, amount, escrowId)
  } else if (asset === 'USDC' || asset === 'USDT') {
    // Get token mint addresses
    const tokenMints: Record<string, string> = {
      'USDC': process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'USDT': process.env.NEXT_PUBLIC_USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
    }
    
    const mint = tokenMints[asset]
    if (!mint) {
      throw new Error(`Unknown token: ${asset}`)
    }
    
    return await transferSPLToken(encryptedPrivateKey, toAddress, amount, mint, escrowId)
  } else {
    // Assume it's a custom SPL token mint address
    return await transferSPLToken(encryptedPrivateKey, toAddress, amount, asset, escrowId)
  }
}

/**
 * Transfer asset with fee deduction
 * Transfers net amount to recipient and fee to treasury
 */
async function transferAssetWithFee(
  encryptedPrivateKey: string,
  toAddress: string,
  netAmount: number,
  feeAmount: number,
  asset: string,
  escrowId?: string
): Promise<string> {
  const { transferToMultiple } = await import('./transaction-signer')
  const { getTreasuryWallet } = await import('./fee-handler')
  
  const recipients = [
    {
      address: toAddress,
      amount: netAmount
    }
  ]
  
  // Add treasury fee if > 0
  if (feeAmount > 0) {
    recipients.push({
      address: getTreasuryWallet(),
      amount: feeAmount
    })
  }
  
  return await transferToMultiple(encryptedPrivateKey, recipients, asset, escrowId)
}

// ============================================
// TIMEOUT AND REFUND
// ============================================

/**
 * Check if atomic swap has timed out
 */
export async function checkSwapTimeout(escrowId: string): Promise<{
  timedOut: boolean
  expiresAt?: Date
  timeRemaining?: number
}> {
  try {
    const supabase = getSupabase()
    
    const { data: escrow, error } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()
    
    if (error || !escrow) {
      throw new Error('Escrow not found')
    }
    
    if (!escrow.expires_at) {
      return { timedOut: false }
    }
    
    const expiresAt = new Date(escrow.expires_at)
    const now = new Date()
    const timeRemaining = expiresAt.getTime() - now.getTime()
    
    return {
      timedOut: timeRemaining <= 0,
      expiresAt,
      timeRemaining: Math.max(0, timeRemaining)
    }
  } catch (error: any) {
    console.error('Check swap timeout error:', error)
    throw error
  }
}

/**
 * Handle timeout refund for atomic swap
 * Refunds the party that deposited if counterparty failed to deposit
 */
export async function handleSwapTimeout(escrowId: string): Promise<boolean> {
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
    
    // Check if already handled
    if (escrow.status === 'completed' || escrow.status === 'refunded' || escrow.status === 'cancelled') {
      console.log(`⏭️  Swap ${escrowId} already handled (${escrow.status})`)
      return false
    }
    
    // Check if timed out
    const { timedOut } = await checkSwapTimeout(escrowId)
    if (!timedOut) {
      console.log(`⏳ Swap ${escrowId} has not timed out yet`)
      return false
    }
    
    console.log(`⏰ Handling timeout for swap ${escrowId}`)
    
    // Determine refund scenario
    const partyADeposited = escrow.buyer_deposited
    const partyBDeposited = escrow.seller_deposited
    
    if (!partyADeposited && !partyBDeposited) {
      // No deposits - just cancel
      await supabase
        .from('escrow_contracts')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', escrowId)
      
      await logEscrowAction(escrowId, 'system', 'timeout', 'Swap timed out with no deposits')
      
      console.log(`   No deposits - cancelled`)
      return true
    }
    
    if (partyADeposited && partyBDeposited) {
      // Both deposited but swap not executed - this shouldn't happen
      // Execute the swap anyway
      console.log(`   Both deposited - executing swap despite timeout`)
      return await executeAtomicSwap(escrowId)
    }
    
    // Partial deposit - refund the party that deposited
    let refundRecipient: string
    let refundAmount: number
    let refundAsset: string
    let partyName: string
    
    if (partyADeposited && !partyBDeposited) {
      refundRecipient = escrow.buyer_wallet
      refundAmount = escrow.buyer_amount
      refundAsset = escrow.swap_asset_buyer
      partyName = 'Party A'
    } else {
      refundRecipient = escrow.seller_wallet
      refundAmount = escrow.seller_amount
      refundAsset = escrow.swap_asset_seller
      partyName = 'Party B'
    }
    
    console.log(`   Refunding ${partyName}: ${refundAmount} ${refundAsset}`)
    
    // Execute refund
    const txSignature = await transferAsset(
      escrow.encrypted_private_key,
      refundRecipient,
      refundAmount,
      refundAsset
    )
    
    console.log(`✅ Refund executed: ${txSignature}`)
    
    // Record refund
    const releaseId = nanoid(10)
    await supabase.from('escrow_releases').insert({
      id: releaseId,
      escrow_id: escrowId,
      release_type: 'refund',
      from_wallet: escrow.escrow_wallet,
      to_wallet: refundRecipient,
      amount: refundAmount,
      token: refundAsset,
      tx_signature: txSignature,
      confirmed: true,
      triggered_by: 'system'
    })
    
    // Update escrow status
    await supabase
      .from('escrow_contracts')
      .update({
        status: 'refunded',
        completed_at: new Date().toISOString()
      })
      .eq('id', escrowId)
    
    // Log action
    await logEscrowAction(
      escrowId,
      'system',
      'refunded',
      `Swap timed out. Refunded ${partyName}: ${refundAmount} ${refundAsset}. TX: ${txSignature}`
    )
    
    // Notify parties
    await createNotification(
      escrowId,
      refundRecipient,
      'refund_processed',
      'Swap Timed Out - Refund Processed',
      `The counterparty did not deposit in time. Your ${refundAmount} ${refundAsset} has been refunded. TX: ${txSignature}`
    )
    
    const counterparty = refundRecipient === escrow.buyer_wallet ? escrow.seller_wallet : escrow.buyer_wallet
    await createNotification(
      escrowId,
      counterparty,
      'escrow_completed',
      'Swap Cancelled - Timeout',
      `You did not deposit in time. The swap has been cancelled and the counterparty has been refunded.`
    )
    
    return true
  } catch (error: any) {
    console.error('Handle swap timeout error:', error)
    
    await logEscrowAction(
      escrowId,
      'system',
      'timeout',
      `Failed to handle timeout: ${error.message}`
    )
    
    throw error
  }
}

/**
 * Monitor and process expired swaps
 * This should be called periodically (e.g., via cron job)
 */
export async function processExpiredSwaps(): Promise<number> {
  try {
    const supabase = getSupabase()
    
    // Find expired swaps that haven't been completed or refunded
    const { data: expiredSwaps, error } = await supabase
      .from('escrow_contracts')
      .select('id, expires_at')
      .eq('escrow_type', 'atomic_swap')
      .in('status', ['created', 'buyer_deposited', 'seller_deposited', 'fully_funded'])
      .lt('expires_at', new Date().toISOString())
    
    if (error) {
      throw new Error(`Failed to fetch expired swaps: ${error.message}`)
    }
    
    if (!expiredSwaps || expiredSwaps.length === 0) {
      console.log('No expired swaps to process')
      return 0
    }
    
    console.log(`📋 Processing ${expiredSwaps.length} expired swaps`)
    
    let processed = 0
    for (const swap of expiredSwaps) {
      try {
        await handleSwapTimeout(swap.id)
        processed++
      } catch (error: any) {
        console.error(`Failed to process swap ${swap.id}:`, error.message)
      }
    }
    
    console.log(`✅ Processed ${processed}/${expiredSwaps.length} expired swaps`)
    return processed
  } catch (error: any) {
    console.error('Process expired swaps error:', error)
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
  createAtomicSwap,
  monitorSwapDeposits,
  monitorPartyADeposit,
  monitorPartyBDeposit,
  detectBothDeposits,
  checkSwapReadiness,
  detectAndTriggerSwap,
  executeAtomicSwap,
  checkSwapTimeout,
  handleSwapTimeout,
  processExpiredSwaps
}
