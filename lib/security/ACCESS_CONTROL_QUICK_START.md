# Access Control Quick Start

## 5-Minute Setup Guide

### 1. Import Security Module

```typescript
import { 
  checkAccess, 
  RateLimitPresets,
  validateWalletAddress,
  verifyEscrowAction
} from '@/lib/security'
```

### 2. Add Access Control to API Route

```typescript
export async function POST(request: NextRequest) {
  // Add this at the start of your handler
  const accessResult = await checkAccess(request, {
    requireAuth: true,
    rateLimitConfig: RateLimitPresets.STANDARD,
    replayProtection: true,
  })
  
  if (!accessResult.allowed) {
    return NextResponse.json(
      { error: accessResult.error },
      { status: accessResult.statusCode || 403 }
    )
  }
  
  const walletAddress = accessResult.walletAddress!
  
  // Your handler logic here...
}
```

### 3. Client-Side Authentication

```typescript
// Generate auth message
const timestamp = Date.now()
const nonce = Math.random().toString(36).substring(7)
const message = `Sign this message to authenticate with Escrow System\n\nTimestamp: ${timestamp}\nNonce: ${nonce}`

// Sign with wallet
const encodedMessage = new TextEncoder().encode(message)
const signature = await wallet.signMessage(encodedMessage)

// Send request
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Your data
    data: { ... },
    
    // Auth data
    walletAddress: wallet.publicKey.toString(),
    signature: bs58.encode(signature),
    message,
    timestamp,
  }),
})
```

## Common Patterns

### Public Endpoint (No Auth)
```typescript
const accessResult = await checkAccess(request, {
  allowAnonymous: true,
  rateLimitConfig: RateLimitPresets.RELAXED,
})
```

### Authenticated Endpoint
```typescript
const accessResult = await checkAccess(request, {
  requireAuth: true,
  rateLimitConfig: RateLimitPresets.STANDARD,
  replayProtection: true,
})
```

### Escrow Party Endpoint
```typescript
const accessResult = await checkAccess(request, {
  requireAuth: true,
  requireParty: true,
  escrowId: 'escrow_123',
  rateLimitConfig: RateLimitPresets.TRANSACTION,
  replayProtection: true,
})
```

### Admin Endpoint
```typescript
import { verifyAdminAccess } from '@/lib/security'

const accessResult = await verifyAdminAccess(request)
```

## Rate Limit Presets

| Preset | Requests | Window | Use Case |
|--------|----------|--------|----------|
| STRICT | 5 | 15 min | Sensitive operations |
| STANDARD | 100 | 15 min | Authenticated endpoints |
| RELAXED | 300 | 15 min | Read operations |
| ADMIN | 50 | 1 hour | Admin operations |
| TRANSACTION | 10 | 5 min | Transaction operations |

## Input Validation

```typescript
import { validateWalletAddress, validateAmount } from '@/lib/security'

// Validate wallet
const walletResult = validateWalletAddress(address)
if (!walletResult.valid) {
  return NextResponse.json({ error: walletResult.error }, { status: 400 })
}

// Validate amount
const amountResult = validateAmount(amount, { min: 0.001 })
if (!amountResult.valid) {
  return NextResponse.json({ error: amountResult.error }, { status: 400 })
}
```

## Action Authorization

```typescript
import { verifyEscrowAction } from '@/lib/security'

// Check if wallet can perform action
const actionCheck = await verifyEscrowAction(
  walletAddress,
  escrowId,
  'approve' // or 'submit', 'dispute', 'confirm', 'release'
)

if (!actionCheck.allowed) {
  return NextResponse.json({ error: actionCheck.error }, { status: 403 })
}
```

## Environment Setup

Add to `.env.local`:

```bash
# Admin wallets (comma-separated)
ADMIN_WALLETS=wallet1,wallet2,wallet3

# Platform treasury
PLATFORM_TREASURY_WALLET=your_treasury_wallet
```

## Error Handling

```typescript
if (!accessResult.allowed) {
  return NextResponse.json(
    { error: accessResult.error },
    { 
      status: accessResult.statusCode || 403,
      headers: accessResult.headers // Include rate limit headers
    }
  )
}
```

## Complete Example

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { 
  checkAccess, 
  RateLimitPresets,
  validateId,
  verifyEscrowAction
} from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const { escrowId, action } = await request.json()
    
    // Validate input
    const idValidation = validateId(escrowId, 'Escrow ID')
    if (!idValidation.valid) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      )
    }
    
    // Access control
    const accessResult = await checkAccess(request, {
      requireAuth: true,
      requireParty: true,
      escrowId,
      rateLimitConfig: RateLimitPresets.TRANSACTION,
      replayProtection: true,
    })
    
    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.error },
        { 
          status: accessResult.statusCode || 403,
          headers: accessResult.headers 
        }
      )
    }
    
    const walletAddress = accessResult.walletAddress!
    const role = accessResult.role // 'buyer' or 'seller'
    
    // Action authorization
    const actionCheck = await verifyEscrowAction(
      walletAddress,
      escrowId,
      action
    )
    
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { error: actionCheck.error },
        { status: 403 }
      )
    }
    
    // Your business logic here...
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## Next Steps

1. Read full guide: `lib/security/ACCESS_CONTROL_GUIDE.md`
2. Review security checklist: `.kiro/specs/complete-escrow-system/SECURITY_CHECKLIST.md`
3. Run security audit: `npm run security:audit`
4. Test your implementation

## Support

- Full documentation: `lib/security/ACCESS_CONTROL_GUIDE.md`
- Security audit: `.kiro/specs/complete-escrow-system/SECURITY_AUDIT_REPORT.md`
- Implementation guide: `.kiro/specs/complete-escrow-system/SECURITY_IMPLEMENTATION_GUIDE.md`
