/**
 * Deposit Tracking Example
 * Demonstrates how to use the deposit monitoring service
 */

import {
  monitorEscrowDeposits,
  recordAndVerifyDeposit,
  getDepositStatus,
  checkAndUpdateFundingStatus
} from '../deposit-monitor'

// ============================================
// EXAMPLE 1: Monitor Deposits
// ============================================

/**
 * Check the current deposit status of an escrow
 */
export async function exampleMonitorDeposits(escrowId: string) {
  console.log('Monitoring deposits for escrow:', escrowId)
  
  const status = await monitorEscrowDeposits(escrowId)
  
  console.log('Buyer deposited:', status.buyerDeposited)
  console.log('Seller deposited:', status.sellerDeposited)
  console.log('Fully funded:', status.fullyFunded)
  console.log('Total deposits:', status.deposits.length)
  
  return status
}

// ============================================
// EXAMPLE 2: Record a Deposit
// ============================================

/**
 * Record a deposit after a party sends funds
 */
export async function exampleRecordDeposit(
  escrowId: string,
  depositorWallet: string,
  amount: number,
  token: string,
  txSignature: string
) {
  console.log('Recording deposit...')
  console.log('Escrow ID:', escrowId)
  console.log('Depositor:', depositorWallet)
  console.log('Amount:', amount, token)
  console.log('Transaction:', txSignature)
  
  const result = await recordAndVerifyDeposit(
    escrowId,
    depositorWallet,
    amount,
    token,
    txSignature
  )
  
  if (result.success) {
    console.log('✓ Deposit recorded successfully')
    console.log('Deposit ID:', result.deposit?.id)
    console.log('Party role:', result.deposit?.party_role)
  } else {
    console.error('✗ Failed to record deposit:', result.error)
  }
  
  return result
}

// ============================================
// EXAMPLE 3: Get Complete Deposit Status
// ============================================

/**
 * Get detailed deposit status including amounts and wallet info
 */
export async function exampleGetDepositStatus(escrowId: string) {
  console.log('Getting deposit status for escrow:', escrowId)
  
  const status = await getDepositStatus(escrowId)
  
  console.log('\n=== Deposit Status ===')
  console.log('Escrow ID:', status.escrow_id)
  console.log('Escrow Wallet:', status.escrow_wallet)
  console.log('Token:', status.token)
  console.log('\nBuyer:')
  console.log('  - Amount required:', status.buyer_amount)
  console.log('  - Deposited:', status.buyer_deposited ? '✓' : '✗')
  
  if (status.seller_amount) {
    console.log('\nSeller:')
    console.log('  - Amount required:', status.seller_amount)
    console.log('  - Deposited:', status.seller_deposited ? '✓' : '✗')
  }
  
  console.log('\nFully Funded:', status.fully_funded ? '✓' : '✗')
  console.log('\nDeposit History:')
  status.deposits.forEach((deposit, index) => {
    console.log(`  ${index + 1}. ${deposit.party_role} - ${deposit.amount} ${deposit.token}`)
    console.log(`     TX: ${deposit.tx_signature}`)
    console.log(`     Time: ${deposit.deposited_at}`)
  })
  
  return status
}

// ============================================
// EXAMPLE 4: Check and Update Funding Status
// ============================================

/**
 * Manually trigger a check to see if escrow is fully funded
 */
export async function exampleCheckFundingStatus(escrowId: string) {
  console.log('Checking funding status for escrow:', escrowId)
  
  await checkAndUpdateFundingStatus(escrowId)
  
  console.log('✓ Funding status updated')
  
  // Get updated status
  const status = await getDepositStatus(escrowId)
  console.log('Fully funded:', status.fully_funded)
  
  return status
}

// ============================================
// EXAMPLE 5: Complete Deposit Flow
// ============================================

/**
 * Complete flow: Create escrow, record deposits, monitor status
 */
export async function exampleCompleteDepositFlow() {
  console.log('=== Complete Deposit Flow Example ===\n')
  
  // Assume escrow was created with ID 'example-escrow-123'
  const escrowId = 'example-escrow-123'
  const buyerWallet = 'BuyerWallet123...'
  const sellerWallet = 'SellerWallet456...'
  
  // Step 1: Check initial status
  console.log('Step 1: Check initial status')
  let status = await getDepositStatus(escrowId)
  console.log('Initial status - Fully funded:', status.fully_funded)
  console.log()
  
  // Step 2: Buyer deposits
  console.log('Step 2: Buyer deposits funds')
  const buyerDeposit = await recordAndVerifyDeposit(
    escrowId,
    buyerWallet,
    100, // amount
    'SOL',
    'buyer-tx-signature-abc123'
  )
  
  if (buyerDeposit.success) {
    console.log('✓ Buyer deposit recorded')
  }
  console.log()
  
  // Step 3: Check status after buyer deposit
  console.log('Step 3: Check status after buyer deposit')
  status = await getDepositStatus(escrowId)
  console.log('Buyer deposited:', status.buyer_deposited)
  console.log('Seller deposited:', status.seller_deposited)
  console.log('Fully funded:', status.fully_funded)
  console.log()
  
  // Step 4: Seller deposits (for traditional escrow)
  console.log('Step 4: Seller deposits security deposit')
  const sellerDeposit = await recordAndVerifyDeposit(
    escrowId,
    sellerWallet,
    50, // security deposit amount
    'SOL',
    'seller-tx-signature-def456'
  )
  
  if (sellerDeposit.success) {
    console.log('✓ Seller deposit recorded')
  }
  console.log()
  
  // Step 5: Check final status
  console.log('Step 5: Check final status')
  status = await getDepositStatus(escrowId)
  console.log('Buyer deposited:', status.buyer_deposited)
  console.log('Seller deposited:', status.seller_deposited)
  console.log('Fully funded:', status.fully_funded)
  
  if (status.fully_funded) {
    console.log('\n✓ Escrow is fully funded and ready!')
  }
  
  return status
}

// ============================================
// EXAMPLE 6: Monitor Multiple Escrows
// ============================================

/**
 * Monitor deposit status for multiple escrows
 */
export async function exampleMonitorMultipleEscrows(escrowIds: string[]) {
  console.log('Monitoring', escrowIds.length, 'escrows...\n')
  
  const results = await Promise.all(
    escrowIds.map(async (escrowId) => {
      try {
        const status = await monitorEscrowDeposits(escrowId)
        return {
          escrowId,
          status,
          error: null
        }
      } catch (error: any) {
        return {
          escrowId,
          status: null,
          error: error.message
        }
      }
    })
  )
  
  // Summary
  const fullyFunded = results.filter(r => r.status?.fullyFunded).length
  const partiallyFunded = results.filter(r => 
    r.status && !r.status.fullyFunded && 
    (r.status.buyerDeposited || r.status.sellerDeposited)
  ).length
  const notFunded = results.filter(r => 
    r.status && !r.status.buyerDeposited && !r.status.sellerDeposited
  ).length
  
  console.log('=== Summary ===')
  console.log('Fully funded:', fullyFunded)
  console.log('Partially funded:', partiallyFunded)
  console.log('Not funded:', notFunded)
  console.log('Errors:', results.filter(r => r.error).length)
  
  return results
}

// ============================================
// USAGE NOTES
// ============================================

/*
USAGE IN API ROUTES:

// In your deposit API route:
import { recordAndVerifyDeposit, getDepositStatus } from '@/lib/escrow/deposit-monitor'

export async function POST(request: NextRequest) {
  const { escrowId, depositorWallet, amount, token, txSignature } = await request.json()
  
  const result = await recordAndVerifyDeposit(
    escrowId,
    depositorWallet,
    amount,
    token,
    txSignature
  )
  
  if (result.success) {
    const status = await getDepositStatus(escrowId)
    return NextResponse.json({ success: true, status })
  } else {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
}

USAGE IN FRONTEND:

// Check deposit status
const response = await fetch(`/api/escrow/deposit?escrowId=${escrowId}`)
const { status } = await response.json()

console.log('Buyer deposited:', status.buyer_deposited)
console.log('Fully funded:', status.fully_funded)

// Record a deposit
const response = await fetch('/api/escrow/deposit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId,
    depositorWallet,
    amount,
    token,
    txSignature
  })
})

const { success, status } = await response.json()

AUTOMATED MONITORING:

// Set up a periodic check for pending deposits
setInterval(async () => {
  const escrows = await getPendingEscrows()
  
  for (const escrow of escrows) {
    await checkAndUpdateFundingStatus(escrow.id)
  }
}, 60000) // Check every minute

*/
