# Timeout Refund System - Quick Start Guide

## Overview

The timeout refund system automatically refunds parties when their counterparty fails to deposit within the specified timeout period. This ensures funds are never locked indefinitely.

## How It Works

### Automatic Processing

1. **Cron Job**: Runs every 15 minutes via `/api/escrow/process-timeouts`
2. **Detection**: Identifies expired escrows with partial deposits
3. **Refund**: Executes on-chain refund to the deposited party
4. **Notification**: Notifies both parties of the outcome

### Supported Scenarios

| Escrow Type | Scenario | Action |
|-------------|----------|--------|
| Traditional | No deposits | Cancel escrow |
| Traditional | Buyer only | Refund buyer |
| Traditional | Seller only | Refund seller |
| Traditional | Both deposited | Mark fully funded |
| Milestone | No deposit | Cancel escrow |
| Milestone | Buyer deposited | Refund buyer |
| Atomic Swap | No deposits | Cancel swap |
| Atomic Swap | Party A only | Refund Party A |
| Atomic Swap | Party B only | Refund Party B |
| Atomic Swap | Both deposited | Execute swap |

## Usage

### 1. Automatic (Recommended)

Set up Vercel Cron in `vercel.json`:

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

### 2. Manual Trigger

Call the API endpoint:

```bash
curl -X POST https://your-domain.com/api/escrow/process-timeouts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Programmatic

```typescript
import { processAllExpiredTimeouts } from '@/lib/escrow/timeout-handler'

const result = await processAllExpiredTimeouts()
console.log(`Processed: ${result.successful}/${result.processed}`)
```

## Functions

### handleTimeout(escrowId, timeoutId)

Main dispatcher that routes to appropriate handler based on escrow type.

```typescript
import { handleTimeout } from '@/lib/escrow/timeout-handler'

const result = await handleTimeout('escrow-123', 'timeout-456')
if (result.success) {
  console.log(`Action: ${result.action}`)
  console.log(`TX: ${result.txSignature}`)
}
```

### handleSwapTimeout(escrowId)

Handles atomic swap timeouts specifically.

```typescript
import { handleSwapTimeout } from '@/lib/escrow/atomic-swap'

const handled = await handleSwapTimeout('swap-123')
if (handled) {
  console.log('Swap timeout handled successfully')
}
```

### processAllExpiredTimeouts()

Batch processes all expired timeouts.

```typescript
import { processAllExpiredTimeouts } from '@/lib/escrow/timeout-handler'

const result = await processAllExpiredTimeouts()
console.log(`
  Processed: ${result.processed}
  Successful: ${result.successful}
  Failed: ${result.failed}
`)
```

## Return Values

### TimeoutHandlingResult

```typescript
{
  success: boolean
  action: string  // 'cancelled_no_deposits' | 'refunded_partial_deposit' | etc.
  txSignature?: string  // On-chain transaction signature
  error?: string
}
```

### Common Actions

- `cancelled_no_deposits`: No party deposited, escrow cancelled
- `refunded_partial_deposit`: One party deposited, refunded
- `refunded_buyer`: Buyer refunded in milestone escrow
- `marked_fully_funded`: Both deposited, marked as funded
- `escalate_to_admin`: Complex case requiring admin review

## Database Records

### Refund Record (escrow_releases)

```typescript
{
  id: 'release-123',
  escrow_id: 'escrow-456',
  release_type: 'refund',
  from_wallet: 'EscrowWallet...',
  to_wallet: 'RefundedParty...',
  amount: 10.0,
  token: 'SOL',
  tx_signature: '5x7y9z...',
  confirmed: true,
  triggered_by: 'system'
}
```

### Action Log (escrow_actions)

```typescript
{
  id: 'action-789',
  escrow_id: 'escrow-456',
  actor_wallet: 'system',
  action_type: 'refunded',
  notes: 'Deposit timeout: Refunded buyer 10 SOL. TX: 5x7y9z...'
}
```

## Notifications

### Refunded Party

```
Title: Deposit Timeout - Refund Processed
Message: The counterparty did not deposit in time. 
         Your 10 SOL has been refunded. TX: 5x7y9z...
```

### Non-Depositing Party

```
Title: Escrow Cancelled - Timeout
Message: You did not deposit in time. The escrow has been 
         cancelled and the counterparty has been refunded.
```

## Error Handling

### Failed Refund Transaction

```typescript
try {
  const result = await handleTimeout(escrowId, timeoutId)
  if (!result.success) {
    console.error(`Refund failed: ${result.error}`)
    // Admin can manually retry via dashboard
  }
} catch (error) {
  console.error('Timeout handling error:', error)
  // Logged for manual intervention
}
```

### Partial Swap Failure

For atomic swaps with different tokens (requiring 2 transactions):

```typescript
// If first transfer succeeds but second fails:
// 1. Escrow marked as 'disputed'
// 2. Dispute record created with details
// 3. Admin notified for manual resolution
```

## Monitoring

### Check Timeout Statistics

```typescript
import { getTimeoutStatistics } from '@/lib/escrow/timeout-monitor'

const stats = await getTimeoutStatistics()
console.log(`
  Total: ${stats.total}
  Active: ${stats.active}
  Expired: ${stats.expired}
  Resolved: ${stats.resolved}
  Avg Resolution Time: ${stats.avgResolutionTime} hours
`)
```

### View Processing Status

```bash
curl https://your-domain.com/api/escrow/process-timeouts
```

Response:
```json
{
  "success": true,
  "statistics": {
    "total": 150,
    "active": 45,
    "expired": 5,
    "resolved": 100
  },
  "cronEndpoint": "/api/escrow/process-timeouts",
  "recommendedSchedule": "Every 15 minutes"
}
```

## Testing

### Run Verification Script

```bash
npx tsx scripts/verify-timeout-refunds.ts
```

### Manual Test

```typescript
// 1. Create escrow with short timeout
const escrow = await createTraditionalEscrow({
  buyerWallet: 'buyer...',
  sellerWallet: 'seller...',
  buyerAmount: 10,
  sellerSecurityDeposit: 5,
  token: 'SOL',
  timeoutHours: 0.1  // 6 minutes for testing
})

// 2. Simulate buyer deposit (seller doesn't deposit)
await recordDeposit(escrow.id, 'buyer', 10, 'SOL', 'tx-sig')

// 3. Wait for timeout
await new Promise(resolve => setTimeout(resolve, 7 * 60 * 1000))

// 4. Process timeout
const result = await handleTimeout(escrow.id, timeout.id)

// 5. Verify refund
console.log(`Action: ${result.action}`)  // 'refunded_partial_deposit'
console.log(`TX: ${result.txSignature}`)
```

## Environment Variables

```bash
# Required for cron job authentication
CRON_SECRET=your-secure-random-token

# Solana network
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Token mints
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDT_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
```

## Best Practices

1. **Set Appropriate Timeouts**
   - Traditional: 72 hours (3 days)
   - Milestone: 168 hours (7 days)
   - Atomic Swap: 24 hours (1 day)

2. **Monitor Regularly**
   - Run cron job every 15-30 minutes
   - Check logs for failed refunds
   - Alert on high failure rates

3. **Test Thoroughly**
   - Test on devnet first
   - Verify refund transactions
   - Check notification delivery

4. **Handle Errors Gracefully**
   - Log all failures
   - Provide admin retry mechanism
   - Notify users of issues

## Troubleshooting

### Refund Not Processing

1. Check if timeout has actually expired
2. Verify escrow status (not already completed/refunded)
3. Check cron job is running
4. Review error logs

### Transaction Failed

1. Check RPC endpoint health
2. Verify escrow wallet has sufficient balance for fees
3. Check token mint addresses are correct
4. Review transaction logs

### Notification Not Sent

1. Verify notification table records created
2. Check recipient wallet addresses
3. Review notification service logs

## Support

For issues or questions:
- Check logs in `escrow_actions` table
- Review `escrow_releases` for refund records
- Contact admin for manual intervention if needed

## Related Documentation

- [Timeout System Overview](./TIMEOUT_SYSTEM.md)
- [Timeout Configuration](./TIMEOUT_CONFIG_GUIDE.md)
- [Timeout Handling](./TIMEOUT_HANDLING_GUIDE.md)
- [Timeout Monitoring](./TIMEOUT_INTEGRATION.md)
