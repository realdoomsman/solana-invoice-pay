# Simple Cancellation Quick Start

Quick reference for implementing simple cancellation in your escrow system.

## When to Use

Use simple cancellation when:
- ✅ Escrow is NOT fully funded
- ✅ You are the creator (buyer/partyA)
- ✅ You want to cancel without counterparty approval

Use mutual cancellation when:
- ❌ Escrow IS fully funded
- ❌ Both parties have deposited
- ❌ You need counterparty agreement

## Quick Implementation

### 1. Check Eligibility

```typescript
import { canCancelEscrow } from '@/lib/escrow/simple-cancellation'

const result = await canCancelEscrow(escrowId, walletAddress)
if (result.canCancel) {
  // Show cancel button
} else {
  // Show reason: result.reason
}
```

### 2. Cancel Escrow

```typescript
import { cancelUnfundedEscrow } from '@/lib/escrow/simple-cancellation'

const result = await cancelUnfundedEscrow({
  escrowId: 'escrow_123',
  creatorWallet: 'Creator1Wallet...',
  reason: 'Optional reason',
})

if (result.success) {
  console.log('Cancelled!')
  if (result.refunded) {
    console.log('TX:', result.refundTxSignature)
  }
}
```

### 3. Use UI Component

```tsx
import SimpleCancellationButton from '@/components/SimpleCancellationButton'

<SimpleCancellationButton
  escrowId={escrow.id}
  onCancelled={() => router.refresh()}
/>
```

## API Endpoints

```bash
# Check eligibility
GET /api/escrow/cancel?escrowId=xxx&wallet=yyy

# Cancel escrow
POST /api/escrow/cancel
{
  "escrowId": "escrow_123",
  "creatorWallet": "Creator1Wallet...",
  "reason": "Optional"
}
```

## Key Features

- ✅ No fees for unfunded cancellation
- ✅ Full refund of any deposits
- ✅ Automatic notifications
- ✅ Complete audit trail
- ✅ Creator-only permission

## Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| "Only the escrow creator can cancel" | Wrong wallet | Use creator wallet |
| "Cannot cancel fully funded escrow" | Both deposited | Use mutual cancellation |
| "Escrow is already completed" | Too late | Cannot cancel |

## Full Documentation

See [SIMPLE_CANCELLATION_GUIDE.md](./SIMPLE_CANCELLATION_GUIDE.md) for complete details.
