# Access Control Cheatsheet

## Quick Import

```typescript
import { 
  checkAccess, 
  RateLimitPresets,
  validateWalletAddress,
  verifyEscrowAction
} from '@/lib/security'
```

## Common Patterns

### 1. Public Endpoint (Read-Only)
```typescript
const access = await checkAccess(request, {
  allowAnonymous: true,
  rateLimitConfig: RateLimitPresets.RELAXED,
})
```

### 2. Authenticated Endpoint
```typescript
const access = await checkAccess(request, {
  requireAuth: true,
  rateLimitConfig: RateLimitPresets.STANDARD,
  replayProtection: true,
})
```

### 3. Escrow Party Endpoint
```typescript
const access = await checkAccess(request, {
  requireAuth: true,
  requireParty: true,
  escrowId: 'escrow_123',
  rateLimitConfig: RateLimitPresets.TRANSACTION,
  replayProtection: true,
})
```

### 4. Admin Endpoint
```typescript
import { verifyAdminAccess } from '@/lib/security'
const access = await verifyAdminAccess(request)
```

## Rate Limit Presets

| Preset | Limit | Window | Use For |
|--------|-------|--------|---------|
| STRICT | 5 | 15 min | Sensitive ops |
| STANDARD | 100 | 15 min | Auth endpoints |
| RELAXED | 300 | 15 min | Read ops |
| ADMIN | 50 | 1 hour | Admin ops |
| TRANSACTION | 10 | 5 min | Transactions |

## Input Validation

```typescript
// Wallet
const wallet = validateWalletAddress(address)
if (!wallet.valid) return error(wallet.error)

// Amount
const amount = validateAmount(value, { min: 0.001 })
if (!amount.valid) return error(amount.error)

// Text
const text = validateText(input, { maxLength: 1000 })
if (!text.valid) return error(text.error)

// Token
const token = validateToken(tokenType)
if (!token.valid) return error(token.error)
```

## Action Authorization

```typescript
const action = await verifyEscrowAction(
  walletAddress,
  escrowId,
  'approve' // or 'submit', 'dispute', 'confirm', 'release'
)
if (!action.allowed) return error(action.error)
```

## Error Handling

```typescript
if (!access.allowed) {
  return NextResponse.json(
    { error: access.error },
    { 
      status: access.statusCode || 403,
      headers: access.headers // Include rate limit headers
    }
  )
}
```

## Client-Side Auth

```typescript
// 1. Generate message
const timestamp = Date.now()
const nonce = Math.random().toString(36).substring(7)
const message = `Sign this message to authenticate with Escrow System\n\nTimestamp: ${timestamp}\nNonce: ${nonce}`

// 2. Sign with wallet
const signature = await wallet.signMessage(new TextEncoder().encode(message))

// 3. Send request
fetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({
    // Your data
    ...data,
    // Auth data
    walletAddress: wallet.publicKey.toString(),
    signature: bs58.encode(signature),
    message,
    timestamp,
  }),
})
```

## Environment Setup

```bash
ADMIN_WALLETS=wallet1,wallet2,wallet3
PLATFORM_TREASURY_WALLET=your_treasury_wallet
```

## Testing

```bash
npx tsx scripts/verify-access-control.ts
```

## Full Docs

- Guide: `lib/security/ACCESS_CONTROL_GUIDE.md`
- Quick Start: `lib/security/ACCESS_CONTROL_QUICK_START.md`
- Implementation: `.kiro/specs/complete-escrow-system/TASK_19.1_IMPLEMENTATION_SUMMARY.md`
