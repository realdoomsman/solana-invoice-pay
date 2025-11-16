# Simple Cancellation Guide

## Overview

Simple cancellation allows the escrow creator to cancel an unfunded or partially funded escrow and refund any deposits. This is different from mutual cancellation which requires both parties to agree.

Requirements: 15.1

## When Can You Cancel?

The creator can cancel an escrow if:

1. ✅ They are the creator (buyer in traditional/simple_buyer, partyA in atomic_swap)
2. ✅ The escrow is NOT fully funded
3. ✅ The escrow status is NOT completed, cancelled, or refunded
4. ✅ For traditional/atomic_swap: Both parties have NOT deposited

## What Happens During Cancellation?

1. **Check Eligibility**: Verify the wallet is the creator and escrow can be cancelled
2. **Refund Deposits**: If any deposits exist, refund them in full (no fees)
3. **Update Status**: Mark escrow as 'cancelled'
4. **Log Action**: Record the cancellation in the activity log
5. **Notify Parties**: Send notifications to depositors and counterparty

## API Usage

### Cancel Escrow

```typescript
POST /api/escrow/cancel

Body:
{
  "escrowId": "escrow_abc123",
  "creatorWallet": "Creator1Wallet...",
  "reason": "Optional reason for cancellation"
}

Response:
{
  "success": true,
  "refunded": true,
  "refundTxSignature": "5x...",
  "message": "Escrow cancelled and deposits refunded successfully"
}
```

### Check Eligibility

```typescript
GET /api/escrow/cancel?escrowId=xxx&wallet=yyy

Response:
{
  "canCancel": true,
  "reason": null
}

// Or if not eligible:
{
  "canCancel": false,
  "reason": "Escrow is fully funded. Use mutual cancellation instead."
}
```

## Library Usage

```typescript
import { cancelUnfundedEscrow, canCancelEscrow } from '@/lib/escrow/simple-cancellation'

// Check if escrow can be cancelled
const eligibility = await canCancelEscrow(escrowId, walletAddress)
if (!eligibility.canCancel) {
  console.log('Cannot cancel:', eligibility.reason)
  return
}

// Cancel the escrow
const result = await cancelUnfundedEscrow({
  escrowId: 'escrow_abc123',
  creatorWallet: 'Creator1Wallet...',
  reason: 'Changed my mind',
})

if (result.success) {
  console.log('Cancelled successfully')
  if (result.refunded) {
    console.log('Refund TX:', result.refundTxSignature)
  }
}
```

## UI Component

```tsx
import SimpleCancellationButton from '@/components/SimpleCancellationButton'

<SimpleCancellationButton
  escrowId={escrow.id}
  onCancelled={() => {
    // Refresh escrow data
    router.refresh()
  }}
/>
```

## Key Differences from Mutual Cancellation

| Feature | Simple Cancellation | Mutual Cancellation |
|---------|-------------------|-------------------|
| **Who can initiate** | Creator only | Either party |
| **Approval required** | No | Yes, both parties |
| **When available** | Before fully funded | Anytime before completion |
| **Fees** | No fees | 1% cancellation fee |
| **Use case** | Cancel before counterparty deposits | Cancel after both deposited |

## Error Handling

Common errors:

- `"Only the escrow creator can cancel an unfunded escrow"` - Wallet is not the creator
- `"Cannot cancel fully funded escrow. Use mutual cancellation instead."` - Both parties have deposited
- `"Escrow is already completed"` - Cannot cancel completed escrows
- `"Escrow not found"` - Invalid escrow ID

## Database Changes

When an escrow is cancelled:

```sql
-- Escrow status updated
UPDATE escrow_contracts 
SET status = 'cancelled', cancelled_at = NOW()
WHERE id = 'escrow_abc123';

-- Refund releases recorded
INSERT INTO escrow_releases (
  escrow_id, release_type, from_wallet, to_wallet, 
  amount, token, tx_signature, triggered_by
) VALUES (...);

-- Action logged
INSERT INTO escrow_actions (
  escrow_id, actor_wallet, action_type, notes
) VALUES (
  'escrow_abc123', 
  'Creator1Wallet...', 
  'cancelled',
  'Creator cancelled unfunded escrow: Changed my mind'
);

-- Notifications sent
INSERT INTO escrow_notifications (...);
```

## Testing

```typescript
// Test cancellation of unfunded escrow
const escrow = await createTraditionalEscrow({...})
const result = await cancelUnfundedEscrow({
  escrowId: escrow.id,
  creatorWallet: buyer.publicKey.toBase58(),
})
expect(result.success).toBe(true)

// Test cancellation with deposit
await depositToEscrow(escrow.id, buyer, amount)
const result2 = await cancelUnfundedEscrow({
  escrowId: escrow.id,
  creatorWallet: buyer.publicKey.toBase58(),
})
expect(result2.success).toBe(true)
expect(result2.refunded).toBe(true)

// Test cannot cancel fully funded
await depositToEscrow(escrow.id, buyer, buyerAmount)
await depositToEscrow(escrow.id, seller, sellerAmount)
const result3 = await cancelUnfundedEscrow({
  escrowId: escrow.id,
  creatorWallet: buyer.publicKey.toBase58(),
})
expect(result3.success).toBe(false)
expect(result3.error).toContain('mutual cancellation')
```

## Security Considerations

1. **Creator Verification**: Only the creator can cancel
2. **Status Checks**: Prevents cancellation of completed/active escrows
3. **Full Refunds**: No fees deducted for unfunded cancellations
4. **Audit Trail**: All cancellations are logged
5. **Notifications**: All affected parties are notified

## Best Practices

1. **Check Eligibility First**: Use `canCancelEscrow()` before attempting cancellation
2. **Provide Reason**: Include a reason for transparency
3. **Handle Errors**: Gracefully handle cases where cancellation is not allowed
4. **Refresh UI**: Update the UI after successful cancellation
5. **Show Confirmation**: Always confirm with user before cancelling

## Example Flow

```
1. User clicks "Cancel Escrow" button
2. UI checks eligibility via GET /api/escrow/cancel
3. If eligible, show confirmation dialog
4. User confirms and optionally provides reason
5. POST /api/escrow/cancel
6. Backend checks eligibility again
7. Refunds any deposits (if present)
8. Updates escrow status to 'cancelled'
9. Logs action and sends notifications
10. Returns success response
11. UI refreshes and shows success message
```

## Related Documentation

- [Mutual Cancellation Guide](./MUTUAL_CANCELLATION_GUIDE.md) - For fully funded escrows
- [Timeout Refunds](./TIMEOUT_REFUND.md) - Automatic refunds on timeout
- [Escrow Types](./types.ts) - Type definitions
