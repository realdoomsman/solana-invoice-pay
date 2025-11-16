# Atomic Swap Timeout and Refund System

## Overview

The atomic swap timeout and refund system ensures that funds are not locked indefinitely if one party fails to deposit. This document describes how the timeout monitoring and automatic refund mechanism works.

## Key Features

1. **Automatic Timeout Detection** - Swaps have configurable timeout periods (default 24 hours)
2. **Partial Deposit Refunds** - If only one party deposits, they get refunded automatically
3. **No Admin Intervention** - Refunds are processed automatically by the system
4. **Batch Processing** - Multiple expired swaps can be processed in a single operation

## Functions

### `checkSwapTimeout(escrowId: string)`

Checks if an atomic swap has timed out.

**Returns:**
```typescript
{
  timedOut: boolean
  expiresAt?: Date
  timeRemaining?: number  // milliseconds
}
```

**Example:**
```typescript
const { timedOut, timeRemaining } = await checkSwapTimeout('swap-123')
if (timedOut) {
  console.log('Swap has expired')
} else {
  console.log(`Time remaining: ${timeRemaining / 1000 / 60} minutes`)
}
```

### `handleSwapTimeout(escrowId: string)`

Handles timeout for a specific swap. Determines the appropriate action based on deposit status:

- **No deposits**: Cancels the swap
- **Only Party A deposited**: Refunds Party A
- **Only Party B deposited**: Refunds Party B
- **Both deposited**: Executes the swap (even if past timeout)

**Returns:** `boolean` - true if successfully handled

**Example:**
```typescript
const handled = await handleSwapTimeout('swap-123')
if (handled) {
  console.log('Timeout handled successfully')
}
```

### `processExpiredSwaps()`

Batch processes all expired swaps. This should be called periodically via a cron job.

**Returns:** `number` - count of processed swaps

**Example:**
```typescript
const count = await processExpiredSwaps()
console.log(`Processed ${count} expired swaps`)
```

## Timeout Scenarios

### Scenario 1: No Deposits

```
Timeline:
  0h: Swap created (24h timeout)
 24h: Timeout expires
 24h: System cancels swap

Status: created → cancelled
Action: None (no funds to refund)
```

### Scenario 2: Only Party A Deposited

```
Timeline:
  0h: Swap created
  2h: Party A deposits 10 SOL
 24h: Timeout expires (Party B never deposited)
 24h: System refunds 10 SOL to Party A

Status: buyer_deposited → refunded
Action: Transfer 10 SOL from escrow wallet to Party A
```

### Scenario 3: Only Party B Deposited

```
Timeline:
  0h: Swap created
  5h: Party B deposits 1000 USDC
 24h: Timeout expires (Party A never deposited)
 24h: System refunds 1000 USDC to Party B

Status: seller_deposited → refunded
Action: Transfer 1000 USDC from escrow wallet to Party B
```

### Scenario 4: Both Deposited (Late)

```
Timeline:
  0h: Swap created
 20h: Party A deposits
 23h: Party B deposits
 25h: Timeout check runs
 25h: System executes swap anyway (both parties fulfilled)

Status: fully_funded → completed
Action: Execute atomic swap
```

## API Integration

### Cron Job Endpoint

A dedicated API endpoint is available for processing expired swaps:

```
POST /api/escrow/process-timeouts
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "success": true,
  "processedCount": 5,
  "message": "Processed 5 expired swaps"
}
```

### Setting Up Cron Job

#### Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/escrow/process-timeouts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs every 15 minutes.

#### External Cron Service

Use services like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

Example GitHub Actions workflow:

```yaml
name: Process Expired Swaps
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST https://your-domain.com/api/escrow/process-timeouts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Environment Variables

Add to `.env.local` or `.env.production`:

```bash
# Secret token for cron job authentication
CRON_SECRET=your-secure-random-token-here
```

## Database Records

When a timeout is handled, the following records are created:

### Escrow Contract Update
```sql
UPDATE escrow_contracts
SET status = 'refunded' | 'cancelled' | 'completed',
    completed_at = NOW()
WHERE id = 'swap-123'
```

### Escrow Release (for refunds)
```sql
INSERT INTO escrow_releases (
  id, escrow_id, release_type, from_wallet, to_wallet,
  amount, token, tx_signature, confirmed, triggered_by
) VALUES (
  'release-id', 'swap-123', 'refund', 'escrow-wallet', 'party-wallet',
  10.0, 'SOL', 'tx-signature', true, 'system'
)
```

### Escrow Action Log
```sql
INSERT INTO escrow_actions (
  id, escrow_id, actor_wallet, action_type, notes
) VALUES (
  'action-id', 'swap-123', 'system', 'refunded',
  'Swap timed out. Refunded Party A: 10 SOL. TX: signature'
)
```

### Notifications
Both parties receive notifications:
- **Refunded party**: "The counterparty did not deposit in time. Your funds have been refunded."
- **Non-depositing party**: "You did not deposit in time. The swap has been cancelled."

## Monitoring

### Logs

The system logs all timeout operations:

```
⏰ Handling timeout for swap swap-123
   Refunding Party A: 10 SOL
✅ Refund executed: tx-signature
```

### Metrics to Track

1. **Timeout Rate**: Percentage of swaps that timeout
2. **Partial Deposits**: How many swaps have only one party deposit
3. **Refund Success Rate**: Percentage of successful refunds
4. **Average Time to Deposit**: How long parties take to deposit

## Error Handling

### Failed Refund Transaction

If a refund transaction fails:

1. Error is logged with details
2. Escrow action records the failure
3. Admin can manually retry via admin dashboard
4. System will retry on next cron run

### Database Update Failures

If database updates fail after successful refund:

1. Transaction signature is logged
2. Manual reconciliation may be needed
3. Funds are safe (already transferred on-chain)

## Testing

### Manual Testing

```typescript
// Create a swap with short timeout
const swap = await createAtomicSwap({
  partyAWallet: 'wallet-a',
  partyBWallet: 'wallet-b',
  partyAAsset: { token: 'SOL', amount: 1 },
  partyBAsset: { token: 'SOL', amount: 1 },
  timeoutHours: 0.1  // 6 minutes for testing
})

// Wait for timeout
await new Promise(resolve => setTimeout(resolve, 7 * 60 * 1000))

// Process timeout
const handled = await handleSwapTimeout(swap.escrow.id)
console.log('Handled:', handled)
```

### Automated Tests

See `lib/escrow/__tests__/atomic-swap.test.ts` for comprehensive test coverage:

- ✅ Timeout detection
- ✅ No deposits cancellation
- ✅ Party A refund
- ✅ Party B refund
- ✅ Both deposited execution
- ✅ Already handled swaps

## Security Considerations

1. **Cron Authentication**: Always use `CRON_SECRET` to prevent unauthorized access
2. **Idempotency**: Functions check if swap is already handled
3. **Transaction Verification**: On-chain transactions are verified before marking complete
4. **Audit Trail**: All actions are logged for transparency

## Best Practices

1. **Set Appropriate Timeouts**: 24 hours for most swaps, shorter for urgent trades
2. **Monitor Regularly**: Run cron job every 15-30 minutes
3. **Alert on Failures**: Set up monitoring for failed refunds
4. **Test Thoroughly**: Test timeout scenarios on devnet before mainnet
5. **Communicate Clearly**: Show countdown timers in UI

## Future Enhancements

- [ ] Pre-timeout warnings (e.g., 1 hour before expiry)
- [ ] Configurable timeout extensions
- [ ] Automatic retry for failed refunds
- [ ] Timeout analytics dashboard
- [ ] Email notifications for timeouts
