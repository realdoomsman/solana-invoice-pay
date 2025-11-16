# Dual Deposit Detection for Atomic Swaps

## Overview

The dual deposit detection system monitors Party A and Party B deposits independently for atomic swap escrows and automatically triggers swap execution when both parties have deposited their assets.

## Key Functions

### 1. Monitor Individual Party Deposits

#### `monitorPartyADeposit(escrowId: string)`
Monitors Party A (buyer) deposit status.

**Returns:**
```typescript
{
  deposited: boolean          // Has Party A deposited?
  expectedAmount: number      // Amount Party A should deposit
  expectedAsset: string       // Asset Party A should deposit
  deposit?: any              // Deposit record if exists
  escrowWallet: string       // Escrow wallet address
}
```

#### `monitorPartyBDeposit(escrowId: string)`
Monitors Party B (seller) deposit status.

**Returns:**
```typescript
{
  deposited: boolean          // Has Party B deposited?
  expectedAmount: number      // Amount Party B should deposit
  expectedAsset: string       // Asset Party B should deposit
  deposit?: any              // Deposit record if exists
  escrowWallet: string       // Escrow wallet address
}
```

### 2. Comprehensive Dual Detection

#### `detectBothDeposits(escrowId: string)`
Detects when both assets are deposited and provides comprehensive status.

**Returns:**
```typescript
{
  bothDeposited: boolean      // Are both deposits complete?
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
  readyForSwap: boolean       // Ready to execute swap?
  escrowWallet: string        // Escrow wallet address
  swapExecuted: boolean       // Has swap been executed?
}
```

### 3. Monitor with Auto-Trigger

#### `monitorSwapDeposits(escrowId: string, autoTrigger: boolean = false)`
Monitors swap deposits with optional automatic swap triggering.

**Parameters:**
- `escrowId`: The atomic swap escrow ID
- `autoTrigger`: If true, automatically triggers swap when both deposits complete

**Returns:**
```typescript
{
  partyADeposited: boolean
  partyBDeposited: boolean
  bothDeposited: boolean
  readyForSwap: boolean
  swapTriggered?: boolean     // Only present if autoTrigger = true
}
```

## Automatic Execution Flow

When a deposit is recorded via `recordAndVerifyDeposit()`:

1. Deposit is verified on-chain
2. Deposit record created in `escrow_deposits` table
3. Escrow status updated (`buyer_deposited` or `seller_deposited`)
4. System checks if escrow is atomic swap type
5. If yes, `checkAndTriggerAtomicSwap()` is called
6. Function checks if both deposits are complete
7. If both complete, `detectAndTriggerSwap()` is called
8. Swap executes automatically via `executeAtomicSwap()`

## Usage Examples

### Example 1: Check Individual Deposits

```typescript
import { monitorPartyADeposit, monitorPartyBDeposit } from '@/lib/escrow/atomic-swap'

// Check if Party A has deposited
const partyA = await monitorPartyADeposit('swap-abc123')
if (partyA.deposited) {
  console.log(`Party A deposited ${partyA.expectedAmount} ${partyA.expectedAsset}`)
} else {
  console.log(`Waiting for Party A to deposit ${partyA.expectedAmount} ${partyA.expectedAsset}`)
}

// Check if Party B has deposited
const partyB = await monitorPartyBDeposit('swap-abc123')
if (partyB.deposited) {
  console.log(`Party B deposited ${partyB.expectedAmount} ${partyB.expectedAsset}`)
} else {
  console.log(`Waiting for Party B to deposit ${partyB.expectedAmount} ${partyB.expectedAsset}`)
}
```

### Example 2: Comprehensive Status Check

```typescript
import { detectBothDeposits } from '@/lib/escrow/atomic-swap'

const status = await detectBothDeposits('swap-abc123')

console.log('Swap Status:')
console.log(`  Both Deposited: ${status.bothDeposited}`)
console.log(`  Ready for Swap: ${status.readyForSwap}`)
console.log(`  Swap Executed: ${status.swapExecuted}`)

console.log('\nParty A:')
console.log(`  Wallet: ${status.partyAStatus.wallet}`)
console.log(`  Deposited: ${status.partyAStatus.deposited}`)
console.log(`  Amount: ${status.partyAStatus.amount} ${status.partyAStatus.asset}`)

console.log('\nParty B:')
console.log(`  Wallet: ${status.partyBStatus.wallet}`)
console.log(`  Deposited: ${status.partyBStatus.deposited}`)
console.log(`  Amount: ${status.partyBStatus.amount} ${status.partyBStatus.asset}`)

if (status.readyForSwap) {
  console.log('\n✅ Ready to execute swap!')
}
```

### Example 3: Monitor with Auto-Trigger

```typescript
import { monitorSwapDeposits } from '@/lib/escrow/atomic-swap'

// Monitor without triggering
const status1 = await monitorSwapDeposits('swap-abc123', false)
console.log(`Party A: ${status1.partyADeposited}`)
console.log(`Party B: ${status1.partyBDeposited}`)

// Monitor and auto-trigger if ready
if (status1.readyForSwap) {
  const status2 = await monitorSwapDeposits('swap-abc123', true)
  if (status2.swapTriggered) {
    console.log('✅ Swap was automatically triggered!')
  }
}
```

### Example 4: API Route Integration

```typescript
// app/api/escrow/deposit/route.ts
import { recordAndVerifyDeposit } from '@/lib/escrow/deposit-monitor'

export async function POST(request: Request) {
  const { escrowId, depositorWallet, amount, token, txSignature } = await request.json()
  
  // Record and verify deposit
  const result = await recordAndVerifyDeposit(
    escrowId,
    depositorWallet,
    amount,
    token,
    txSignature
  )
  
  if (result.success) {
    // For atomic swaps, the system automatically checks if both deposits
    // are complete and triggers the swap if ready
    return Response.json({
      success: true,
      message: 'Deposit recorded. Checking for dual deposits...'
    })
  }
  
  return Response.json({ success: false, error: result.error })
}
```

### Example 5: Background Monitoring Service

```typescript
// Monitor all pending atomic swaps
import { getSupabase } from '@/lib/supabase'
import { detectBothDeposits } from '@/lib/escrow/atomic-swap'

async function monitorPendingSwaps() {
  const supabase = getSupabase()
  
  // Get all atomic swaps waiting for deposits
  const { data: swaps } = await supabase
    .from('escrow_contracts')
    .select('id')
    .eq('escrow_type', 'atomic_swap')
    .in('status', ['created', 'buyer_deposited', 'seller_deposited', 'fully_funded'])
    .eq('swap_executed', false)
  
  if (!swaps) return
  
  for (const swap of swaps) {
    const status = await detectBothDeposits(swap.id)
    
    if (status.readyForSwap) {
      console.log(`🎯 Swap ${swap.id} is ready for execution!`)
      // Trigger swap execution
      const { detectAndTriggerSwap } = await import('@/lib/escrow/atomic-swap')
      await detectAndTriggerSwap(swap.id)
    }
  }
}

// Run every minute
setInterval(monitorPendingSwaps, 60000)
```

## Console Output Examples

### Individual Party Monitoring

```
📥 Party A deposit status:
   Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
   Expected: 10 SOL
   Status: ✓ DEPOSITED

📥 Party B deposit status:
   Wallet: 9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
   Expected: 1000 USDC
   Status: ✗ PENDING
```

### Dual Deposit Detection

```
🔍 Dual Deposit Detection for swap-abc123:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Party A: ✓ | 10 SOL
   Party B: ✓ | 1000 USDC
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Both Deposited: ✓ YES
   Ready for Swap: ✓ YES
   Swap Executed: NO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Automatic Triggering

```
⏳ Atomic swap swap-abc123 waiting for deposits:
   Party A: ✓
   Party B: ✗

[After Party B deposits...]

🎯 Both deposits detected for atomic swap swap-abc123!
   Triggering automatic swap execution...
🚀 Auto-triggering swap execution for swap-abc123
🔄 Executing atomic swap for swap-abc123
   Party A (7xKXtg...): 10 SOL
   Party B (9xKXtg...): 1000 USDC
   Using two transactions (different asset types)
   ✓ Party A → Party B: tx-sig-1
   ✓ Party B → Party A: tx-sig-2
✅ Atomic swap executed in two transactions
```

## Database Schema

The detection system relies on these tables:

### escrow_contracts
- `buyer_deposited`: Boolean flag for Party A deposit
- `seller_deposited`: Boolean flag for Party B deposit
- `swap_executed`: Boolean flag for swap execution status

### escrow_deposits
- Records individual deposit transactions
- Links to escrow via `escrow_id`
- Identifies party via `party_role` ('buyer' or 'seller')
- Stores transaction signature for verification

## Error Handling

All functions handle errors gracefully:

```typescript
try {
  const status = await detectBothDeposits('swap-123')
  // Use status
} catch (error) {
  console.error('Detection error:', error.message)
  // Handle error appropriately
}
```

## Testing

Comprehensive test coverage includes:
- Individual party deposit monitoring (4 tests)
- Dual deposit detection (6 tests)
- Integration with swap execution
- Edge cases (already executed, disputed, etc.)

See `lib/escrow/__tests__/atomic-swap.test.ts` for full test suite.

## Demo Script

Run the demo to see all functions in action:

```typescript
import { runDualDepositDetectionDemo } from '@/lib/escrow/examples/dual-deposit-detection-demo'

await runDualDepositDetectionDemo('your-swap-id')
```

## Related Functions

- `createAtomicSwap()`: Creates atomic swap escrow
- `executeAtomicSwap()`: Executes the swap
- `detectAndTriggerSwap()`: Checks readiness and triggers execution
- `recordAndVerifyDeposit()`: Records deposits and triggers detection

## Requirements Satisfied

✅ **Requirement 5.3**: "WHEN both parties deposit their respective assets, THE Escrow System SHALL automatically execute the swap"

The dual deposit detection system ensures this requirement is met by:
1. Monitoring Party A deposit independently
2. Monitoring Party B deposit independently  
3. Detecting when both assets are deposited
4. Automatically triggering swap execution
