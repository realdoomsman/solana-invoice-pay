# Access Control System Guide

## Overview

The access control system provides comprehensive security for the escrow platform, implementing:
- Wallet signature verification
- Role-based access control (buyer, seller, admin)
- Rate limiting
- Input validation
- Replay attack protection

**Requirements:** 13.1-13.6

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Request                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Access Control Middleware                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Extract Authentication Data                   │  │
│  │    - Wallet address                              │  │
│  │    - Signature                                   │  │
│  │    - Message with timestamp & nonce              │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 2. Verify Signature                              │  │
│  │    - Check signature validity                    │  │
│  │    - Verify timestamp (< 5 minutes)              │  │
│  │    - Check nonce (replay protection)             │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 3. Rate Limiting                                 │  │
│  │    - Check IP rate limit                         │  │
│  │    - Check wallet rate limit                     │  │
│  │    - Check endpoint-specific limits              │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 4. Role Verification                             │  │
│  │    - Admin check (if required)                   │  │
│  │    - Party check (if escrow-specific)            │  │
│  │    - Action authorization                        │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 5. Input Validation                              │  │
│  │    - Validate wallet addresses                   │  │
│  │    - Validate amounts                            │  │
│  │    - Sanitize text inputs                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Handler Logic                      │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Wallet Authentication (`wallet-auth.ts`)

Handles cryptographic verification of wallet signatures.

**Key Functions:**
- `verifyWalletSignature()` - Verify Ed25519 signature
- `generateAuthChallenge()` - Create challenge message with timestamp & nonce
- `verifyAuthenticatedRequest()` - Complete request verification
- `verifyAdminWallet()` - Check if wallet is admin
- `verifyRequestWithReplayProtection()` - Prevent replay attacks

**Example:**
```typescript
import { verifyWalletSignature } from '@/lib/security'

const result = verifyWalletSignature(
  message,
  signature,
  publicKey
)

if (result.valid) {
  // Signature is valid
}
```

### 2. Rate Limiting (`rate-limiter.ts`)

Protects endpoints from abuse with configurable rate limits.

**Presets:**
- `STRICT` - 5 requests per 15 minutes (sensitive operations)
- `STANDARD` - 100 requests per 15 minutes (authenticated endpoints)
- `RELAXED` - 300 requests per 15 minutes (read operations)
- `ADMIN` - 50 requests per hour (admin operations)
- `TRANSACTION` - 10 requests per 5 minutes (transaction operations)

**Key Functions:**
- `rateLimitByIP()` - Rate limit by IP address
- `rateLimitByWallet()` - Rate limit by wallet address
- `rateLimitCombined()` - Combined IP + wallet rate limiting
- `rateLimitEscrowCreation()` - Specialized for escrow creation
- `rateLimitAdminAction()` - Specialized for admin actions

**Example:**
```typescript
import { rateLimitByWallet, RateLimitPresets } from '@/lib/security'

const result = rateLimitByWallet(
  walletAddress,
  RateLimitPresets.STANDARD
)

if (!result.allowed) {
  return NextResponse.json(
    { error: result.error },
    { status: 429 }
  )
}
```

### 3. Input Validation (`input-validation.ts`)

Validates and sanitizes all user inputs.

**Key Functions:**
- `validateWalletAddress()` - Validate Solana wallet addresses
- `validateAmount()` - Validate monetary amounts
- `validateText()` - Sanitize text (XSS prevention)
- `validateToken()` - Validate token types
- `validateId()` - Validate ID formats
- `validateEscrowCreation()` - Composite validation for escrow creation

**Example:**
```typescript
import { validateWalletAddress, validateAmount } from '@/lib/security'

const walletResult = validateWalletAddress(address)
if (!walletResult.valid) {
  return { error: walletResult.error }
}

const amountResult = validateAmount(amount, { min: 0.001 })
if (!amountResult.valid) {
  return { error: amountResult.error }
}
```

### 4. Access Control (`access-control.ts`)

Comprehensive access control combining all security features.

**Key Functions:**
- `checkAccess()` - Complete access control check
- `withAccessControl()` - Middleware wrapper for API routes
- `verifyAdminAccess()` - Simplified admin verification
- `verifyPartyAccess()` - Simplified party verification
- `verifyEscrowAction()` - Action-specific authorization

**Example:**
```typescript
import { checkAccess } from '@/lib/security'

const accessResult = await checkAccess(request, {
  requireAuth: true,
  requireParty: true,
  escrowId: 'escrow_123',
  rateLimitConfig: RateLimitPresets.TRANSACTION,
  replayProtection: true,
})

if (!accessResult.allowed) {
  return NextResponse.json(
    { error: accessResult.error },
    { status: accessResult.statusCode || 403 }
  )
}
```

## Usage Patterns

### Pattern 1: Public Endpoint (Read-Only)

```typescript
import { checkAccess } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Rate limit by IP only
  const accessResult = await checkAccess(request, {
    allowAnonymous: true,
    rateLimitConfig: RateLimitPresets.RELAXED,
  })
  
  if (!accessResult.allowed) {
    return NextResponse.json(
      { error: accessResult.error },
      { status: 429, headers: accessResult.headers }
    )
  }
  
  // Handle request...
}
```

### Pattern 2: Authenticated Endpoint

```typescript
import { checkAccess, RateLimitPresets } from '@/lib/security'

export async function POST(request: NextRequest) {
  // Require authentication
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
  
  // Handle request with authenticated wallet...
}
```

### Pattern 3: Escrow-Specific Endpoint

```typescript
import { checkAccess, verifyEscrowAction, RateLimitPresets } from '@/lib/security'

export async function POST(request: NextRequest) {
  const { escrowId, action } = await request.json()
  
  // Require party access to escrow
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
      { status: accessResult.statusCode || 403 }
    )
  }
  
  const walletAddress = accessResult.walletAddress!
  const role = accessResult.role // 'buyer' or 'seller'
  
  // Verify specific action authorization
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
  
  // Handle request...
}
```

### Pattern 4: Admin Endpoint

```typescript
import { verifyAdminAccess, rateLimitAdminAction } from '@/lib/security'

export async function POST(request: NextRequest) {
  // Verify admin access
  const accessResult = await verifyAdminAccess(request)
  
  if (!accessResult.allowed) {
    return NextResponse.json(
      { error: accessResult.error },
      { status: accessResult.statusCode || 403 }
    )
  }
  
  const adminWallet = accessResult.walletAddress!
  
  // Additional rate limit for specific admin action
  const actionRateLimit = rateLimitAdminAction(adminWallet, 'resolve_dispute')
  if (!actionRateLimit.allowed) {
    return NextResponse.json(
      { error: actionRateLimit.error },
      { status: 429 }
    )
  }
  
  // Handle admin request...
}
```

### Pattern 5: Using Middleware Wrapper

```typescript
import { withAccessControl, RateLimitPresets } from '@/lib/security'

const handler = async (
  request: NextRequest,
  context: { walletAddress: string; role?: string }
) => {
  const { walletAddress, role } = context
  
  // Handle request with authenticated wallet...
  
  return NextResponse.json({ success: true })
}

export const POST = withAccessControl(handler, {
  requireAuth: true,
  requireParty: true,
  escrowId: 'from-request', // Will be extracted from request
  rateLimitConfig: RateLimitPresets.TRANSACTION,
})
```

## Client-Side Integration

### Generating Authentication Data

```typescript
// Client-side code
import { sign } from '@solana/web3.js'

async function authenticateRequest(wallet: any, endpoint: string, data: any) {
  // Generate challenge message
  const timestamp = Date.now()
  const nonce = Math.random().toString(36).substring(7)
  const message = `Sign this message to authenticate with Escrow System\n\nTimestamp: ${timestamp}\nNonce: ${nonce}`
  
  // Sign message with wallet
  const encodedMessage = new TextEncoder().encode(message)
  const signature = await wallet.signMessage(encodedMessage)
  
  // Send authenticated request
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      walletAddress: wallet.publicKey.toString(),
      signature: bs58.encode(signature),
      message,
      timestamp,
    }),
  })
  
  return response.json()
}
```

## Security Best Practices

### 1. Always Use Replay Protection

```typescript
// ✅ Good
const accessResult = await checkAccess(request, {
  requireAuth: true,
  replayProtection: true, // Prevents replay attacks
})

// ❌ Bad
const accessResult = await checkAccess(request, {
  requireAuth: true,
  replayProtection: false, // Vulnerable to replay attacks
})
```

### 2. Use Appropriate Rate Limits

```typescript
// ✅ Good - Strict limits for sensitive operations
const accessResult = await checkAccess(request, {
  requireAuth: true,
  rateLimitConfig: RateLimitPresets.TRANSACTION,
})

// ❌ Bad - Too relaxed for sensitive operations
const accessResult = await checkAccess(request, {
  requireAuth: true,
  rateLimitConfig: RateLimitPresets.RELAXED,
})
```

### 3. Validate All Inputs

```typescript
// ✅ Good
const walletResult = validateWalletAddress(address)
if (!walletResult.valid) {
  return NextResponse.json({ error: walletResult.error }, { status: 400 })
}

// ❌ Bad - No validation
const wallet = new PublicKey(address) // May throw
```

### 4. Verify Action Authorization

```typescript
// ✅ Good
const actionCheck = await verifyEscrowAction(wallet, escrowId, 'approve')
if (!actionCheck.allowed) {
  return NextResponse.json({ error: actionCheck.error }, { status: 403 })
}

// ❌ Bad - No action verification
// Directly execute action without checking authorization
```

### 5. Log Security Events

```typescript
import { logSecurityEvent } from '@/lib/logging'

// Log failed authentication attempts
if (!accessResult.allowed) {
  logSecurityEvent('auth_failed', {
    ip: getClientIP(request),
    error: accessResult.error,
  })
}

// Log admin actions
logSecurityEvent('admin_action', {
  admin: adminWallet,
  action: 'resolve_dispute',
  escrowId,
})
```

## Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T12:00:00.000Z
Retry-After: 300 (only when rate limited)
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required. Please provide walletAddress, signature, and message."
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to access this escrow"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests. Please try again in 15 minutes."
}
```

## Environment Variables

Required environment variables:

```bash
# Admin wallets (comma-separated)
ADMIN_WALLETS=wallet1,wallet2,wallet3

# Platform treasury wallet
PLATFORM_TREASURY_WALLET=your_treasury_wallet
```

## Testing

### Unit Tests

```typescript
import { verifyWalletSignature, validateWalletAddress } from '@/lib/security'

describe('Access Control', () => {
  it('should verify valid signature', () => {
    const result = verifyWalletSignature(message, signature, publicKey)
    expect(result.valid).toBe(true)
  })
  
  it('should reject invalid wallet address', () => {
    const result = validateWalletAddress('invalid')
    expect(result.valid).toBe(false)
  })
})
```

### Integration Tests

```typescript
describe('API Access Control', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/escrow/approve', {
      method: 'POST',
      body: JSON.stringify({ milestoneId: 'test' }),
    })
    
    expect(response.status).toBe(401)
  })
  
  it('should accept authenticated requests', async () => {
    const authData = await generateAuthData(wallet)
    
    const response = await fetch('/api/escrow/approve', {
      method: 'POST',
      body: JSON.stringify({
        ...authData,
        milestoneId: 'test',
      }),
    })
    
    expect(response.status).not.toBe(401)
  })
})
```

## Monitoring

Monitor these metrics:
- Failed authentication attempts per IP/wallet
- Rate limit violations
- Admin action frequency
- Replay attack attempts (duplicate nonces)
- Invalid signature attempts

## Future Enhancements

1. **Redis Integration** - Replace in-memory stores with Redis for distributed rate limiting
2. **IP Reputation** - Block known malicious IPs
3. **Adaptive Rate Limiting** - Adjust limits based on user behavior
4. **Multi-Factor Authentication** - Add optional 2FA for admin actions
5. **Audit Trail** - Comprehensive logging of all security events

## Support

For issues or questions:
- Check the security audit report: `.kiro/specs/complete-escrow-system/SECURITY_AUDIT_REPORT.md`
- Review implementation guide: `.kiro/specs/complete-escrow-system/SECURITY_IMPLEMENTATION_GUIDE.md`
- Contact security team
