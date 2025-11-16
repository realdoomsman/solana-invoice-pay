# Mutual Cancellation Guide

## Overview

The mutual cancellation system allows both parties in an escrow to agree to cancel the transaction and receive refunds of their deposits minus a small cancellation fee.

## Requirements

**Requirement 15.2**: When both parties agree to cancel, the system shall refund all deposits minus network fees.

## How It Works

### 1. Request Cancellation

Either party (buyer or seller) can request to cancel the escrow:

```typescript
import { requestMutualCancellation } from '@/lib/escrow/mutual-cancellation'

const result = await requestMutualCancellation({
  escrowId: 'escrow_123',
  requestorWallet: 'buyer_wallet_address',
  reason: 'Project requirements changed',
  notes: 'Optional additional context'
})
```

### 2. Approve Cancellation

The counterparty must approve the cancellation request:

```typescript
import { approveMutualCancellation } from '@/lib/escrow/mutual-cancellation'

const result = await approveMutualCancellation({
  cancellationId: 'cancel_123',
  approverWallet: 'seller_wallet_address'
})

// If both parties approved, result.executed will be true
```

### 3. Automatic Execution

When both parties approve:
- All confirmed deposits are identified
- 1% cancellation fee is deducted from each deposit
- Remaining amounts are refunded to depositors
- Escrow status is updated to 'cancelled'
- Both parties are notified

## Cancellation Fee

A **1% cancellation fee** is applied to cover:
- Transaction costs
- Operational overhead
- Network fees

Example:
- Buyer deposited: 100 SOL → Refund: 99 SOL (1 SOL fee)
- Seller deposited: 50 SOL → Refund: 49.5 SOL (0.5 SOL fee)

## API Endpoints

### Request Cancellation

```bash
POST /api/escrow/cancel/request
Content-Type: application/json

{
  "escrowId": "escrow_123",
  "requestorWallet": "wallet_address",
  "reason": "Detailed reason for cancellation",
  "notes": "Optional additional notes"
}
```

### Approve Cancellation

```bash
POST /api/escrow/cancel/approve
Content-Type: application/json

{
  "cancellationId": "cancel_123",
  "approverWallet": "wallet_address",
  "escrowId": "escrow_123"
}
```

### Get Cancellation Status

```bash
GET /api/escrow/cancel/status?escrowId=escrow_123
```

## UI Component

Use the `MutualCancellationInterface` component in your escrow detail page:

```tsx
import { MutualCancellationInterface } from '@/components/MutualCancellationInterface'

<MutualCancellationInterface
  escrowId={escrow.id}
  userWallet={userWallet}
  userRole={userRole}
  escrowStatus={escrow.status}
  onCancellationExecuted={() => {
    // Refresh escrow data
    loadEscrowDetails()
  }}
/>
```

## Database Schema

### escrow_cancellation_requests

```sql
CREATE TABLE escrow_cancellation_requests (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_by_role TEXT NOT NULL,
  buyer_approved BOOLEAN DEFAULT FALSE,
  seller_approved BOOLEAN DEFAULT FALSE,
  buyer_approved_at TIMESTAMP,
  seller_approved_at TIMESTAMP,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP,
  refund_tx_signature TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│                  Mutual Cancellation Flow                │
└─────────────────────────────────────────────────────────┘

1. Party A Requests Cancellation
   ├─ Validates escrow status
   ├─ Creates cancellation request
   ├─ Marks Party A as approved
   └─ Notifies Party B

2. Party B Reviews Request
   ├─ Views reason and details
   └─ Decides to approve or ignore

3. Party B Approves
   ├─ Marks Party B as approved
   ├─ Both parties now approved
   └─ Triggers automatic execution

4. System Executes Cancellation
   ├─ Fetches all confirmed deposits
   ├─ Calculates refunds (deposit - 1% fee)
   ├─ Executes refund transaction
   ├─ Updates escrow status to 'cancelled'
   ├─ Records transaction in releases table
   └─ Notifies both parties

5. Completion
   ├─ Escrow marked as cancelled
   ├─ Funds returned to depositors
   └─ Activity log updated
```

## Validation Rules

### Request Cancellation
- ✅ Escrow must exist
- ✅ Requestor must be buyer or seller
- ✅ Escrow cannot be completed, cancelled, or refunded
- ✅ Reason must be at least 10 characters
- ✅ No pending cancellation request exists

### Approve Cancellation
- ✅ Cancellation request must exist
- ✅ Request must be in 'pending' status
- ✅ Approver must be the counterparty
- ✅ Approver hasn't already approved

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Escrow not found" | Invalid escrow ID | Verify escrow ID |
| "Only buyer or seller can request" | Unauthorized wallet | Use correct wallet |
| "Cannot cancel completed escrow" | Escrow already done | Cannot cancel |
| "Cancellation request already pending" | Duplicate request | Wait for approval |
| "You have already approved" | Double approval | Already processed |

## Testing

Run the verification script:

```bash
npm run verify:mutual-cancellation
# or
ts-node scripts/verify-mutual-cancellation.ts
```

## Security Considerations

1. **Authorization**: Only buyer and seller can request/approve
2. **Status Validation**: Cannot cancel completed escrows
3. **Fee Deduction**: Automatic 1% fee prevents abuse
4. **Transaction Safety**: Uses encrypted wallet keys
5. **Audit Trail**: All actions logged in escrow_actions

## Best Practices

1. **Clear Reasons**: Require detailed cancellation reasons
2. **Timely Response**: Notify counterparty immediately
3. **Fee Transparency**: Display fee amount before approval
4. **Status Updates**: Keep UI in sync with cancellation state
5. **Error Handling**: Provide clear error messages

## Integration Example

```typescript
// In your escrow detail page
import { MutualCancellationInterface } from '@/components/MutualCancellationInterface'

export default function EscrowDetailPage({ escrow, userWallet }) {
  const userRole = escrow.buyer_wallet === userWallet ? 'buyer' : 
                   escrow.seller_wallet === userWallet ? 'seller' : 'observer'

  return (
    <div>
      {/* Other escrow details */}
      
      {/* Mutual cancellation interface */}
      <MutualCancellationInterface
        escrowId={escrow.id}
        userWallet={userWallet}
        userRole={userRole}
        escrowStatus={escrow.status}
        onCancellationExecuted={() => {
          // Refresh escrow data
          router.refresh()
        }}
      />
    </div>
  )
}
```

## Notifications

The system sends notifications at key points:

1. **Request Created**: Counterparty notified of cancellation request
2. **Approval Received**: Requestor notified when counterparty approves
3. **Execution Complete**: Both parties notified of refund completion

## Activity Log

All cancellation actions are logged:

```typescript
{
  action_type: 'cancelled',
  notes: 'buyer requested mutual cancellation: Project requirements changed',
  metadata: { cancellation_id: 'cancel_123' }
}
```

## Support

For issues or questions:
1. Check the verification script output
2. Review the activity log in the database
3. Check transaction signatures on Solana explorer
4. Review error logs in the console
