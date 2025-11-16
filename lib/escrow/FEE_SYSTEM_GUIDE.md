# Fee System Quick Reference Guide

## Overview
The escrow system automatically deducts platform fees during fund releases and sends them to the configured treasury wallet.

## Fee Configuration

### Environment Variables
```bash
# Fee percentage (default: 3% devnet, 1% production)
PLATFORM_FEE_PERCENTAGE=3
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=3

# Treasury wallet address (required)
PLATFORM_FEE_WALLET=YourTreasuryWalletAddress
PLATFORM_TREASURY_WALLET=YourTreasuryWalletAddress
NEXT_PUBLIC_FEE_WALLET=YourTreasuryWalletAddress
```

### Default Fee Rates
- **Devnet**: 3%
- **Production**: 1%
- **Cancellation**: 1%

## Fee Deduction by Escrow Type

### 1. Traditional Escrow
**Rule**: Fee deducted from buyer's payment only (Requirement 9.2)

```typescript
Buyer Payment: 1000 SOL
Platform Fee (3%): 30 SOL
Net to Seller: 970 SOL

Seller Security Deposit: 500 SOL
Fee: 0 SOL (returned in full)

Total to Seller: 1470 SOL
Fee to Treasury: 30 SOL
```

**Implementation**:
```typescript
import { calculateTraditionalEscrowFees } from './fee-handler'

const fees = calculateTraditionalEscrowFees(buyerPayment, sellerDeposit)
// fees.buyerPayment.netAmount = amount after fee
// fees.sellerDeposit.amount = full deposit (no fee)
// fees.totalFeeToTreasury = total fee
```

### 2. Milestone Escrow (Simple Buyer)
**Rule**: Fee deducted from each milestone release

```typescript
Milestone Amount: 500 SOL
Platform Fee (3%): 15 SOL
Net to Seller: 485 SOL
Fee to Treasury: 15 SOL
```

**Implementation**:
```typescript
import { calculateMilestoneReleaseAmount } from './simple-buyer'

const amounts = calculateMilestoneReleaseAmount(milestoneAmount)
// amounts.netAmount = amount after fee
// amounts.platformFee = fee amount
// amounts.totalAmount = original amount
// amounts.feePercentage = fee percentage used
```

### 3. Atomic Swap
**Rule**: Fees charged to both parties equally (Requirement 9.3)

```typescript
Party A: 1000 SOL
  Fee (3%): 30 SOL
  Net to Party B: 970 SOL

Party B: 1500 USDC
  Fee (3%): 45 USDC
  Net to Party A: 1455 USDC

Total Fees: 30 SOL + 45 USDC
```

**Implementation**:
```typescript
import { calculateAtomicSwapFees } from './fee-handler'

const fees = calculateAtomicSwapFees(partyAAmount, partyBAmount)
// fees.partyA.netAmount = Party A's amount after fee
// fees.partyB.netAmount = Party B's amount after fee
// fees.totalFeeToTreasury = combined fees
```

## Using the Fee Handler

### Basic Fee Calculation
```typescript
import { calculatePlatformFee } from './fee-handler'

const result = calculatePlatformFee(1000) // Uses default percentage
// result.grossAmount = 1000
// result.platformFee = 30 (3%)
// result.netAmount = 970
// result.feePercentage = 3

// Custom percentage
const custom = calculatePlatformFee(1000, 5)
// custom.platformFee = 50 (5%)
```

### Building Transactions with Fees
```typescript
import { buildTransfersWithFee } from './fee-handler'

const transfers = buildTransfersWithFee(recipientAddress, 1000)
// transfers[0] = { recipient: recipientAddress, amount: 970, label: 'Payment to recipient' }
// transfers[1] = { recipient: treasuryWallet, amount: 30, label: 'Platform fee to treasury' }
```

### Recording Fee Transactions
```typescript
import { recordFeeTransaction } from './fee-handler'

await recordFeeTransaction({
  escrowId: 'escrow_123',
  milestoneId: 'milestone_456', // optional
  feeAmount: 30,
  grossAmount: 1000,
  netAmount: 970,
  feePercentage: 3,
  txSignature: 'transaction_signature',
  feeType: 'platform_fee',
  paidBy: 'buyer_wallet_address',
  releaseType: 'milestone_release'
})
```

### Recording Multiple Fees (Atomic Swaps)
```typescript
import { recordMultipleFeeTransactions } from './fee-handler'

await recordMultipleFeeTransactions([
  {
    escrowId: 'escrow_123',
    feeAmount: 30,
    grossAmount: 1000,
    netAmount: 970,
    feePercentage: 3,
    txSignature: 'tx_sig_1',
    feeType: 'platform_fee',
    paidBy: 'party_a_wallet',
    releaseType: 'swap_execution'
  },
  {
    escrowId: 'escrow_123',
    feeAmount: 45,
    grossAmount: 1500,
    netAmount: 1455,
    feePercentage: 3,
    txSignature: 'tx_sig_2',
    feeType: 'platform_fee',
    paidBy: 'party_b_wallet',
    releaseType: 'swap_execution'
  }
])
```

## Validation and Configuration

### Validate Fee Configuration
```typescript
import { validateFeeConfiguration } from './fee-handler'

const validation = validateFeeConfiguration()
if (!validation.valid) {
  console.error('Fee configuration errors:', validation.errors)
}
if (validation.warnings.length > 0) {
  console.warn('Fee configuration warnings:', validation.warnings)
}
```

### Get Configuration Summary
```typescript
import { getFeeConfigurationSummary } from './fee-handler'

const config = getFeeConfigurationSummary()
console.log(`Fee: ${config.feePercentage}%`)
console.log(`Treasury: ${config.treasuryWallet}`)
console.log(`Network: ${config.network}`)
console.log(`Configured: ${config.configured}`)
```

## Database Schema

### Fee Transactions in escrow_releases
```sql
{
  id: 'release_id',
  escrow_id: 'escrow_123',
  milestone_id: 'milestone_456', -- optional
  release_type: 'milestone_release',
  from_wallet: 'escrow_wallet',
  to_wallet: 'treasury_wallet',
  amount: 30, -- fee amount
  token: 'SOL',
  tx_signature: 'transaction_signature',
  confirmed: true,
  triggered_by: 'system'
}
```

### Fee Details in escrow_actions
```sql
{
  id: 'action_id',
  escrow_id: 'escrow_123',
  milestone_id: 'milestone_456', -- optional
  actor_wallet: 'system',
  action_type: 'released',
  notes: 'Platform fee collected: 30 SOL (3% of 1000 SOL)...',
  metadata: {
    fee_type: 'platform_fee',
    fee_amount: 30,
    fee_percentage: 3,
    gross_amount: 1000,
    net_amount: 970,
    treasury_wallet: 'treasury_address',
    paid_by: 'buyer_wallet'
  }
}
```

## Transaction Flow

### Single Transaction (Recommended)
```typescript
// Build transaction with multiple transfers
const transaction = new Transaction()

// Transfer net amount to recipient
transaction.add(
  SystemProgram.transfer({
    fromPubkey: escrowWallet,
    toPubkey: recipientWallet,
    lamports: netAmountLamports
  })
)

// Transfer fee to treasury
transaction.add(
  SystemProgram.transfer({
    fromPubkey: escrowWallet,
    toPubkey: treasuryWallet,
    lamports: feeLamports
  })
)

// Send as single atomic transaction
const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair])
```

### Using Helper Function
```typescript
import { transferToMultiple } from './transaction-signer'

const recipients = [
  { address: recipientWallet, amount: netAmount },
  { address: treasuryWallet, amount: feeAmount }
]

const signature = await transferToMultiple(
  encryptedPrivateKey,
  recipients,
  'SOL',
  escrowId
)
```

## Error Handling

### Treasury Wallet Not Configured
```typescript
try {
  const treasuryWallet = getTreasuryWallet()
} catch (error) {
  // Error: Treasury wallet not configured. Set PLATFORM_FEE_WALLET environment variable.
}
```

### Invalid Fee Percentage
```typescript
const validation = validateFeeConfiguration()
if (!validation.valid) {
  // validation.errors contains specific issues
  // e.g., "Invalid fee percentage: 150%"
}
```

## Testing

### Run Fee Deduction Tests
```bash
# Simple test
node scripts/test-fee-deduction.js

# TypeScript verification (requires compilation)
npx ts-node scripts/verify-fee-deduction.ts
```

### Manual Testing
```typescript
// Test fee calculation
import { calculatePlatformFee } from './lib/escrow/fee-handler'

const result = calculatePlatformFee(100)
console.log('Fee:', result.platformFee) // 3
console.log('Net:', result.netAmount)   // 97
```

## Best Practices

1. **Always use fee handler functions** - Don't calculate fees manually
2. **Record all fee transactions** - Use `recordFeeTransaction()` after every release
3. **Validate configuration on startup** - Check treasury wallet is configured
4. **Include fees in notifications** - Users should know about fees
5. **Log fee details** - Include fee amounts in action logs
6. **Test fee calculations** - Verify math is correct
7. **Handle zero fees gracefully** - Check if fee > 0 before adding transfer

## Common Patterns

### Pattern 1: Release with Fee Deduction
```typescript
// 1. Calculate fees
const fees = calculatePlatformFee(amount)

// 2. Build transaction
const recipients = [
  { address: recipient, amount: fees.netAmount },
  { address: getTreasuryWallet(), amount: fees.platformFee }
]

// 3. Execute transaction
const signature = await transferToMultiple(encryptedKey, recipients, token, escrowId)

// 4. Record fee
await recordFeeTransaction({
  escrowId,
  feeAmount: fees.platformFee,
  grossAmount: fees.grossAmount,
  netAmount: fees.netAmount,
  feePercentage: fees.feePercentage,
  txSignature: signature,
  feeType: 'platform_fee',
  paidBy: payerWallet,
  releaseType: 'full_release'
})
```

### Pattern 2: Check Configuration
```typescript
// At application startup
const validation = validateFeeConfiguration()
if (!validation.valid) {
  console.error('Fee system not configured properly:', validation.errors)
  process.exit(1)
}

if (validation.warnings.length > 0) {
  console.warn('Fee configuration warnings:', validation.warnings)
}
```

## Troubleshooting

### Issue: Treasury wallet not receiving fees
**Check**:
1. Verify `PLATFORM_FEE_WALLET` is set in environment
2. Check transaction signature on Solana explorer
3. Verify fee amount > 0
4. Check if fee transfer was added to transaction

### Issue: Incorrect fee amounts
**Check**:
1. Verify fee percentage configuration
2. Check if using correct calculation function
3. Verify no rounding errors in lamports conversion
4. Check database records for actual amounts

### Issue: Fee transactions not recorded
**Check**:
1. Verify `recordFeeTransaction()` is called after release
2. Check database connection
3. Look for errors in logs
4. Verify escrow_releases table exists

## Support

For issues or questions about the fee system:
1. Check this guide first
2. Review implementation summary: `.kiro/specs/complete-escrow-system/TASK_16.2_IMPLEMENTATION_SUMMARY.md`
3. Run verification script: `node scripts/test-fee-deduction.js`
4. Check fee handler source: `lib/escrow/fee-handler.ts`
