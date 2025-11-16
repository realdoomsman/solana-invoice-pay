# Mutual Cancellation Quick Start

## 🚀 Quick Setup

### 1. Apply Database Schema

```bash
# Run the cancellation schema in your Supabase SQL editor
cat supabase-cancellation-schema.sql
```

### 2. Use in Your Code

```typescript
import { 
  requestMutualCancellation, 
  approveMutualCancellation 
} from '@/lib/escrow/mutual-cancellation'

// Request cancellation
const result = await requestMutualCancellation({
  escrowId: 'escrow_123',
  requestorWallet: 'wallet_address',
  reason: 'Project requirements changed',
  notes: 'Optional context'
})

// Approve cancellation
const approval = await approveMutualCancellation({
  cancellationId: 'cancel_123',
  approverWallet: 'wallet_address'
})
```

### 3. Add UI Component

```tsx
import { MutualCancellationInterface } from '@/components/MutualCancellationInterface'

<MutualCancellationInterface
  escrowId={escrow.id}
  userWallet={userWallet}
  userRole={userRole}
  escrowStatus={escrow.status}
  onCancellationExecuted={() => router.refresh()}
/>
```

## 📋 API Endpoints

### Request Cancellation
```bash
POST /api/escrow/cancel/request
{
  "escrowId": "escrow_123",
  "requestorWallet": "wallet_address",
  "reason": "Detailed reason",
  "notes": "Optional notes"
}
```

### Approve Cancellation
```bash
POST /api/escrow/cancel/approve
{
  "cancellationId": "cancel_123",
  "approverWallet": "wallet_address",
  "escrowId": "escrow_123"
}
```

### Get Status
```bash
GET /api/escrow/cancel/status?escrowId=escrow_123
```

## 💰 Fee Structure

- **1% cancellation fee** applied to each deposit
- Example: 100 SOL → 99 SOL refund (1 SOL fee)
- Fee covers operational costs and network fees

## ✅ Workflow

1. **Party A requests** → Automatically approved for Party A
2. **Party B notified** → Reviews reason and details
3. **Party B approves** → Both parties now approved
4. **System executes** → Refunds processed automatically
5. **Both notified** → Escrow marked as cancelled

## 🔒 Validation

- ✅ Both parties must approve
- ✅ Reason must be 10+ characters
- ✅ Cannot cancel completed escrows
- ✅ Only one pending request per escrow

## 🧪 Testing

```bash
npx ts-node scripts/verify-mutual-cancellation.ts
```

## 📚 Full Documentation

See `lib/escrow/MUTUAL_CANCELLATION_GUIDE.md` for complete details.
