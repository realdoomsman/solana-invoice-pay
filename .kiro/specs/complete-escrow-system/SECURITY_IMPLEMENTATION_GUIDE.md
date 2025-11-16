# Security Implementation Guide

**Task:** 20.4 Security audit - Implementation fixes  
**Date:** 2024  
**Status:** ✅ Security modules created, ready for integration

## Overview

This guide provides step-by-step instructions for integrating the security fixes into the escrow system.

---

## 1. Security Modules Created

### ✅ Completed Implementations

1. **`lib/security/wallet-auth.ts`** - Wallet signature verification and authentication
2. **`lib/security/input-validation.ts`** - Comprehensive input validation
3. **`lib/security/rate-limiter.ts`** - Rate limiting for API endpoints
4. **`scripts/security-audit.ts`** - Automated security audit script

---

## 2. Integration Steps

### Step 1: Configure Environment Variables

Add to `.env.local` and `.env.production`:

```bash
# Encryption (CRITICAL)
ESCROW_ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>

# Admin Configuration
ADMIN_WALLETS=<wallet1>,<wallet2>,<wallet3>

# Treasury
PLATFORM_TREASURY_WALLET=<treasury-wallet-address>

# Already configured (verify):
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SOLANA_NETWORK=...
NEXT_PUBLIC_SOLANA_RPC_URL=...
```

**Generate encryption key:**
```bash
openssl rand -base64 32
```

### Step 2: Add Signature Verification to API Endpoints

#### Example: Update `/api/escrow/dispute/route.ts`

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const { escrowId, actorWallet, reason, description } = await request.json()
  
  // Verify actor is buyer or seller
  if (escrow.buyer_wallet !== actorWallet && escrow.seller_wallet !== actorWallet) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  // ... rest of code
}
```

**After:**
```typescript
import { verifyPartyRequest } from '@/lib/security/wallet-auth'
import { validateText, validateId } from '@/lib/security/input-validation'
import { rateLimitDisputeRaising } from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  const { 
    escrowId, 
    actorWallet, 
    reason, 
    description,
    signature,
    message,
    timestamp 
  } = await request.json()
  
  // 1. Validate input
  const escrowIdResult = validateId(escrowId, 'Escrow ID')
  if (!escrowIdResult.valid) {
    return NextResponse.json({ error: escrowIdResult.error }, { status: 400 })
  }
  
  const reasonResult = validateText(reason, { minLength: 5, maxLength: 200 })
  if (!reasonResult.valid) {
    return NextResponse.json({ error: reasonResult.error }, { status: 400 })
  }
  
  const descResult = validateText(description, { minLength: 20, maxLength: 2000 })
  if (!descResult.valid) {
    return NextResponse.json({ error: descResult.error }, { status: 400 })
  }
  
  // 2. Check rate limit
  const rateLimit = rateLimitDisputeRaising(actorWallet)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }
  
  // 3. Get escrow details
  const { data: escrow, error: escrowError } = await supabase
    .from('escrow_contracts')
    .select('*')
    .eq('id', escrowId)
    .single()
  
  if (escrowError || !escrow) {
    return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
  }
  
  // 4. Verify signature and party role
  const authResult = verifyPartyRequest(
    { walletAddress: actorWallet, signature, message, timestamp },
    escrow.buyer_wallet,
    escrow.seller_wallet
  )
  
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }
  
  // 5. Continue with dispute creation
  const partyRole = authResult.role
  // ... rest of code
}
```

### Step 3: Add Rate Limiting to All Endpoints

#### Pattern for Read Endpoints:
```typescript
import { rateLimitByWallet, RateLimitPresets } from '@/lib/security/rate-limiter'

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get('wallet')
  
  const rateLimit = rateLimitByWallet(walletAddress, RateLimitPresets.RELAXED)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }
  
  // ... rest of code
}
```

#### Pattern for Write Endpoints:
```typescript
import { rateLimitByWallet, RateLimitPresets } from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  const { walletAddress } = await request.json()
  
  const rateLimit = rateLimitByWallet(walletAddress, RateLimitPresets.STANDARD)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }
  
  // ... rest of code
}
```

#### Pattern for Transaction Endpoints:
```typescript
import { rateLimitFundRelease } from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  const { escrowId } = await request.json()
  
  const rateLimit = rateLimitFundRelease(escrowId)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }
  
  // ... rest of code
}
```

### Step 4: Add Input Validation to All Endpoints

#### Pattern for Escrow Creation:
```typescript
import { validateEscrowCreation } from '@/lib/security/input-validation'

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  const validation = validateEscrowCreation(data)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  
  // ... rest of code
}
```

#### Pattern for Individual Fields:
```typescript
import { 
  validateWalletAddress, 
  validateAmount, 
  validateText 
} from '@/lib/security/input-validation'

export async function POST(request: NextRequest) {
  const { wallet, amount, description } = await request.json()
  
  const walletResult = validateWalletAddress(wallet)
  if (!walletResult.valid) {
    return NextResponse.json({ error: walletResult.error }, { status: 400 })
  }
  
  const amountResult = validateAmount(amount, { min: 0.001 })
  if (!amountResult.valid) {
    return NextResponse.json({ error: amountResult.error }, { status: 400 })
  }
  
  const descResult = validateText(description, { maxLength: 1000 })
  if (!descResult.valid) {
    return NextResponse.json({ error: descResult.error }, { status: 400 })
  }
  
  // ... rest of code
}
```

### Step 5: Update Admin Endpoints

#### Example: `/api/admin/escrow/resolve/route.ts`

```typescript
import { verifyAdminRequest } from '@/lib/security/wallet-auth'
import { rateLimitAdminAction } from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  const { 
    adminWallet, 
    signature, 
    message, 
    timestamp,
    ...data 
  } = await request.json()
  
  // 1. Check rate limit
  const rateLimit = rateLimitAdminAction(adminWallet, 'resolve_dispute')
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }
  
  // 2. Verify admin signature
  const authResult = verifyAdminRequest({
    walletAddress: adminWallet,
    signature,
    message,
    timestamp
  })
  
  if (!authResult.valid || !authResult.isAdmin) {
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
  }
  
  // 3. Continue with admin action
  // ... rest of code
}
```

---

## 3. Frontend Integration

### Step 1: Create Wallet Signing Utility

**File:** `lib/wallet-signing.ts`

```typescript
import { useWallet } from '@solana/wallet-adapter-react'
import { generateAuthChallenge } from '@/lib/security/wallet-auth'

export async function signAuthMessage(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<{ signature: string; message: string; timestamp: number }> {
  const message = generateAuthChallenge()
  const messageBytes = new TextEncoder().encode(message)
  const signatureBytes = await signMessage(messageBytes)
  const signature = bs58.encode(signatureBytes)
  
  return {
    signature,
    message,
    timestamp: Date.now()
  }
}
```

### Step 2: Update API Calls

**Before:**
```typescript
const response = await fetch('/api/escrow/dispute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId,
    actorWallet: wallet.publicKey.toBase58(),
    reason,
    description
  })
})
```

**After:**
```typescript
import { signAuthMessage } from '@/lib/wallet-signing'

// Sign authentication message
const auth = await signAuthMessage(
  wallet.signMessage,
  wallet.publicKey.toBase58()
)

const response = await fetch('/api/escrow/dispute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId,
    actorWallet: wallet.publicKey.toBase58(),
    reason,
    description,
    ...auth // Add signature, message, timestamp
  })
})
```

---

## 4. Testing Security Features

### Test 1: Signature Verification

```typescript
// Test valid signature
const validAuth = {
  walletAddress: 'valid-wallet',
  signature: 'valid-signature',
  message: 'Sign this message...',
  timestamp: Date.now()
}

const result = verifyAuthenticatedRequest(validAuth)
expect(result.valid).toBe(true)

// Test expired signature
const expiredAuth = {
  ...validAuth,
  timestamp: Date.now() - (10 * 60 * 1000) // 10 minutes ago
}

const expiredResult = verifyAuthenticatedRequest(expiredAuth)
expect(expiredResult.valid).toBe(false)
```

### Test 2: Rate Limiting

```typescript
// Test rate limit enforcement
for (let i = 0; i < 6; i++) {
  const result = rateLimitByWallet('test-wallet', RateLimitPresets.STRICT)
  
  if (i < 5) {
    expect(result.allowed).toBe(true)
  } else {
    expect(result.allowed).toBe(false)
  }
}
```

### Test 3: Input Validation

```typescript
// Test wallet validation
const validWallet = validateWalletAddress('valid-solana-address')
expect(validWallet.valid).toBe(true)

const invalidWallet = validateWalletAddress('invalid')
expect(invalidWallet.valid).toBe(false)

// Test amount validation
const validAmount = validateAmount(1.5, { min: 0.001, max: 1000 })
expect(validAmount.valid).toBe(true)

const invalidAmount = validateAmount(-1, { min: 0.001 })
expect(invalidAmount.valid).toBe(false)
```

---

## 5. Deployment Checklist

### Pre-Deployment

- [ ] Generate strong encryption key: `openssl rand -base64 32`
- [ ] Configure all environment variables
- [ ] Set up admin wallets
- [ ] Configure treasury wallet
- [ ] Run security audit: `npx tsx scripts/security-audit.ts`
- [ ] Verify audit score > 75

### Deployment

- [ ] Deploy with environment variables
- [ ] Verify HTTPS is enabled
- [ ] Test signature verification in production
- [ ] Test rate limiting in production
- [ ] Monitor for security events

### Post-Deployment

- [ ] Set up monitoring and alerting
- [ ] Review security logs daily
- [ ] Run weekly security audits
- [ ] Update dependencies monthly
- [ ] Rotate encryption keys annually

---

## 6. Monitoring and Alerting

### Key Metrics to Monitor

1. **Failed Authentication Attempts**
   - Alert if > 10 failures per minute from same IP
   - Alert if > 50 failures per hour globally

2. **Rate Limit Violations**
   - Log all rate limit hits
   - Alert if same wallet hits limit repeatedly

3. **Key Access**
   - Log all private key decryption
   - Alert on unusual patterns

4. **Transaction Failures**
   - Monitor failed transactions
   - Alert on repeated failures

5. **Admin Actions**
   - Log all admin actions
   - Alert on high-value resolutions

### Logging Best Practices

```typescript
// Good: Log security events
console.log('[SECURITY]', {
  event: 'auth_failure',
  wallet: hashForLogging(wallet),
  timestamp: Date.now(),
  reason: 'invalid_signature'
})

// Bad: Log sensitive data
console.log('Private key:', privateKey) // NEVER DO THIS
```

---

## 7. Incident Response

### If Encryption Key Compromised

1. **Immediate Actions:**
   - Generate new encryption key
   - Re-encrypt all private keys
   - Rotate admin wallets
   - Review all recent transactions

2. **Investigation:**
   - Review access logs
   - Identify compromised escrows
   - Notify affected parties

3. **Recovery:**
   - Deploy new encryption key
   - Update all environments
   - Monitor for suspicious activity

### If Admin Wallet Compromised

1. **Immediate Actions:**
   - Remove compromised wallet from ADMIN_WALLETS
   - Review recent admin actions
   - Freeze suspicious escrows

2. **Investigation:**
   - Audit all actions by compromised wallet
   - Identify unauthorized resolutions
   - Contact affected parties

3. **Recovery:**
   - Add new admin wallet
   - Reverse unauthorized actions if possible
   - Implement additional admin controls

---

## 8. Future Enhancements

### Short Term (Next Sprint)

- [ ] Add CSRF protection
- [ ] Implement comprehensive transaction monitoring
- [ ] Add security event dashboard
- [ ] Set up automated alerts

### Medium Term (Next Quarter)

- [ ] Implement key rotation
- [ ] Add multi-sig support for admin actions
- [ ] Conduct penetration testing
- [ ] Add security training for team

### Long Term (Next Year)

- [ ] Bug bounty program
- [ ] Third-party security audit
- [ ] SOC 2 compliance
- [ ] Advanced threat detection

---

## 9. Resources

### Documentation

- [Wallet Authentication](../../../lib/security/wallet-auth.ts)
- [Input Validation](../../../lib/security/input-validation.ts)
- [Rate Limiting](../../../lib/security/rate-limiter.ts)
- [Security Audit Script](../../../scripts/security-audit.ts)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Solana Security](https://docs.solana.com/developing/programming-model/security)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

---

## 10. Support

For security concerns or questions:

1. Review this implementation guide
2. Check the security audit report
3. Run the security audit script
4. Consult the security module documentation

**Remember:** Security is an ongoing process, not a one-time implementation. Regular audits, updates, and monitoring are essential.
