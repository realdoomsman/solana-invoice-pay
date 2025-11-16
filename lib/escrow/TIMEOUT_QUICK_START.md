# Atomic Swap Timeout - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Add Environment Variable

Add to `.env.local` or `.env.production`:

```bash
CRON_SECRET=your-secure-random-token-here
```

Generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Set Up Cron Job

#### Option A: Vercel Cron (Easiest)

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

Deploy: `vercel --prod`

#### Option B: External Cron Service

Use [cron-job.org](https://cron-job.org):

1. Create account
2. Add new cron job
3. URL: `https://your-domain.com/api/escrow/process-timeouts`
4. Schedule: Every 15 minutes
5. Add header: `Authorization: Bearer your-cron-secret`

### 3. Test It

```bash
# Test the endpoint
curl -X POST http://localhost:3000/api/escrow/process-timeouts \
  -H "Authorization: Bearer your-cron-secret"

# Expected response:
# {"success":true,"processedCount":0,"message":"Processed 0 expired swaps"}
```

## 📋 How It Works

### Automatic Flow

```
1. User creates swap with 24h timeout
   ↓
2. Party A deposits (or doesn't)
   ↓
3. Party B deposits (or doesn't)
   ↓
4. Cron job runs every 15 minutes
   ↓
5. System checks for expired swaps
   ↓
6. Automatic action based on deposits:
   - No deposits → Cancel
   - Only A → Refund A
   - Only B → Refund B
   - Both → Execute swap
```

### Timeout Scenarios

| Party A | Party B | Result |
|---------|---------|--------|
| ❌ No | ❌ No | Swap cancelled |
| ✅ Yes | ❌ No | A gets refund |
| ❌ No | ✅ Yes | B gets refund |
| ✅ Yes | ✅ Yes | Swap executes |

## 🔧 Manual Usage

### Check Timeout Status

```typescript
import { checkSwapTimeout } from '@/lib/escrow/atomic-swap'

const { timedOut, timeRemaining } = await checkSwapTimeout('swap-123')

if (timedOut) {
  console.log('⏰ Swap has expired')
} else {
  const minutes = Math.floor(timeRemaining / 1000 / 60)
  console.log(`⏳ ${minutes} minutes remaining`)
}
```

### Process Single Swap

```typescript
import { handleSwapTimeout } from '@/lib/escrow/atomic-swap'

const handled = await handleSwapTimeout('swap-123')
if (handled) {
  console.log('✅ Timeout handled')
}
```

### Process All Expired Swaps

```typescript
import { processExpiredSwaps } from '@/lib/escrow/atomic-swap'

const count = await processExpiredSwaps()
console.log(`✅ Processed ${count} swaps`)
```

## 🎯 Custom Timeout Periods

When creating a swap:

```typescript
const swap = await createAtomicSwap({
  partyAWallet: 'wallet-a',
  partyBWallet: 'wallet-b',
  partyAAsset: { token: 'SOL', amount: 10 },
  partyBAsset: { token: 'USDC', amount: 1000 },
  timeoutHours: 48  // Custom: 48 hours instead of default 24
})
```

Recommended timeouts:
- **Small trades (<$100)**: 12-24 hours
- **Medium trades ($100-$1000)**: 24-48 hours
- **Large trades (>$1000)**: 48-72 hours
- **Testing**: 0.1 hours (6 minutes)

## 📊 Monitoring

### Check Logs

```bash
# Vercel logs
vercel logs --follow

# Look for:
# 🔄 Processing expired atomic swaps...
# ⏰ Handling timeout for swap swap-123
# ✅ Refund executed: tx-signature
```

### Database Queries

```sql
-- Count expired swaps
SELECT COUNT(*) FROM escrow_contracts
WHERE escrow_type = 'atomic_swap'
  AND status IN ('created', 'buyer_deposited', 'seller_deposited')
  AND expires_at < NOW();

-- Recent refunds
SELECT * FROM escrow_releases
WHERE release_type = 'refund'
ORDER BY created_at DESC
LIMIT 10;

-- Timeout rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'refunded') * 100.0 / COUNT(*) as timeout_rate
FROM escrow_contracts
WHERE escrow_type = 'atomic_swap';
```

## 🐛 Troubleshooting

### Cron Job Not Running

1. Check Vercel dashboard → Cron Jobs
2. Verify `CRON_SECRET` is set in environment
3. Check logs for errors
4. Test endpoint manually

### Refund Failed

1. Check escrow wallet balance
2. Verify RPC endpoint is working
3. Check transaction logs
4. Retry manually: `handleSwapTimeout('swap-id')`

### Wrong Party Refunded

This shouldn't happen, but if it does:
1. Check deposit records in database
2. Verify `buyer_deposited` and `seller_deposited` flags
3. Review escrow action logs
4. Contact admin for manual resolution

## 🔒 Security

### Protect Cron Endpoint

Always use authentication:

```typescript
// In route.ts
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Rate Limiting

Consider adding rate limiting:

```typescript
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10
})

await limiter.check(request)
```

## 📚 Additional Resources

- **Full Documentation**: `lib/escrow/TIMEOUT_REFUND.md`
- **Tests**: `lib/escrow/__tests__/atomic-swap.test.ts`
- **Implementation**: `lib/escrow/atomic-swap.ts`
- **API Route**: `app/api/escrow/process-timeouts/route.ts`

## ✅ Checklist

Before going to production:

- [ ] `CRON_SECRET` set in production environment
- [ ] Cron job configured (Vercel or external)
- [ ] Tested on devnet with short timeout
- [ ] Monitoring/alerts set up
- [ ] Logs reviewed for errors
- [ ] Database indexes verified
- [ ] RPC endpoint reliable
- [ ] Backup RPC configured

## 🎉 You're Done!

The timeout and refund system is now active. Swaps will automatically:
- ✅ Detect timeouts
- ✅ Refund deposited parties
- ✅ Execute late swaps
- ✅ Send notifications
- ✅ Log all actions

No manual intervention needed! 🚀
