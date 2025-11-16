# Timeout System - Quick Reference

## Quick Start

### Creating a Timeout Monitor

```typescript
import { createTimeoutMonitor } from '@/lib/escrow/timeout-config'

// Create with default timeout
await createTimeoutMonitor({
  escrowId: 'escrow_123',
  timeoutType: 'deposit_timeout',
  expectedAction: 'Both parties must deposit funds',
})

// Create with custom timeout
await createTimeoutMonitor({
  escrowId: 'escrow_123',
  timeoutType: 'milestone_timeout',
  customHours: 120, // 5 days instead of default 7
  expectedAction: 'Seller must submit milestone work',
  expectedFrom: 'seller_wallet_address',
})
```

### Checking Timeouts

```typescript
import { getActiveTimeouts, hasExpiredTimeouts } from '@/lib/escrow/timeout-config'

// Get all active timeouts for an escrow
const timeouts = await getActiveTimeouts('escrow_123')

// Check if escrow has any expired timeouts
const hasExpired = await hasExpiredTimeouts('escrow_123')
```

### Handling Timeouts

```typescript
import { handleTimeout } from '@/lib/escrow/timeout-handler'

// Handle a specific timeout
const result = await handleTimeout('escrow_123', 'timeout_456')

if (result.success) {
  console.log(`Action taken: ${result.action}`)
  if (result.txSignature) {
    console.log(`Transaction: ${result.txSignature}`)
  }
}
```

## Default Timeouts

| Escrow Type | Default Hours | Days |
|-------------|---------------|------|
| Traditional | 72 | 3 |
| Simple Buyer | 168 | 7 |
| Atomic Swap | 24 | 1 |

## Timeout Types

| Type | Default | Warning Before | Description |
|------|---------|----------------|-------------|
| deposit_timeout | 72h | 24h | Waiting for deposits |
| confirmation_timeout | 48h | 12h | Waiting for confirmations |
| milestone_timeout | 168h | 48h | Waiting for milestone work |
| swap_timeout | 24h | 6h | Waiting for swap deposits |
| dispute_timeout | 336h | 72h | Waiting for dispute resolution |

## Handling Rules

### Traditional Escrow

**Deposit Timeout:**
- No deposits → Cancel
- Buyer only → Refund buyer
- Seller only → Refund seller
- Both → Mark fully funded

**Confirmation Timeout:**
- Both confirmed → Release funds
- Neither → Escalate to admin
- Buyer only → Buyer gets all
- Seller only → Seller gets all

### Simple Buyer Escrow

**Deposit Timeout:**
- No deposit → Cancel
- Buyer deposited → Refund buyer

**Milestone Timeout:**
- Always → Escalate to admin

### Atomic Swap

**Swap Timeout:**
- No deposits → Cancel
- Party A only → Refund Party A
- Party B only → Refund Party B
- Both → Execute swap

## Common Functions

### Configuration

```typescript
import {
  getDefaultTimeout,
  getTimeoutConfig,
  validateTimeoutHours,
  getTimeRemaining,
  formatTimeRemaining,
} from '@/lib/escrow/timeout-config'

// Get default timeout for escrow type
const hours = getDefaultTimeout('traditional') // 72

// Get timeout configuration
const config = getTimeoutConfig('deposit_timeout')
// { defaultHours: 72, warningHoursBefore: 24, description: '...' }

// Validate timeout hours
const validation = validateTimeoutHours(48)
// { valid: true }

// Get time remaining
const remaining = getTimeRemaining('2024-01-20T10:00:00Z')
// { hours: 24, minutes: 1440, expired: false, ... }

// Format time remaining
const formatted = formatTimeRemaining('2024-01-20T10:00:00Z')
// "1 day" or "24 hours" or "Less than 1 minute"
```

### Monitoring

```typescript
import {
  checkExpiredEscrows,
  checkEscrowTimeouts,
  getTimeoutStatistics,
} from '@/lib/escrow/timeout-monitor'

// Check all expired escrows (cron job)
const result = await checkExpiredEscrows()
// { totalChecked: 45, expiredCount: 3, warningsSent: 8, ... }

// Check specific escrow timeouts
const status = await checkEscrowTimeouts('escrow_123')
// { hasExpired: true, expiredTimeouts: [...], activeTimeouts: [...] }

// Get statistics
const stats = await getTimeoutStatistics()
// { total: 150, active: 45, expired: 3, resolved: 102, ... }
```

### Handling

```typescript
import {
  handleTimeout,
  processAllExpiredTimeouts,
} from '@/lib/escrow/timeout-handler'

// Handle single timeout
const result = await handleTimeout('escrow_123', 'timeout_456')
// { success: true, action: 'refunded_buyer', txSignature: '...' }

// Process all expired timeouts (cron job)
const batchResult = await processAllExpiredTimeouts()
// { processed: 10, successful: 9, failed: 1, errors: [...] }
```

## API Endpoints

### Process Timeouts (Cron)

```bash
POST /api/escrow/process-timeouts
Authorization: Bearer YOUR_CRON_SECRET

Response:
{
  "success": true,
  "monitoring": { ... },
  "handling": { ... }
}
```

### Get Statistics

```bash
GET /api/escrow/process-timeouts

Response:
{
  "success": true,
  "statistics": { ... }
}
```

## Admin Functions

```typescript
import {
  resolveTimeout,
  extendTimeout,
  markTimeoutExpired,
} from '@/lib/escrow/timeout-config'

// Manually resolve timeout
await resolveTimeout('timeout_123', 'admin_manual_resolution')

// Extend timeout (give more time)
const result = await extendTimeout('timeout_123', 24) // Add 24 hours
// { success: true, timeout: { ... } }

// Mark as expired
await markTimeoutExpired('timeout_123')
```

## Environment Variables

```env
# Required for cron job
CRON_SECRET=your_secret_key_here

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption
ESCROW_ENCRYPTION_KEY=your_encryption_key
```

## Cron Configuration

In `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/escrow/process-timeouts",
    "schedule": "*/15 * * * *"
  }]
}
```

Runs every 15 minutes.

## Error Handling

All functions return structured results:

```typescript
// Success
{
  success: true,
  timeout: { ... },
  action: 'refunded_buyer',
  txSignature: 'abc123...'
}

// Error
{
  success: false,
  error: 'Escrow not found'
}
```

## Best Practices

1. **Always create timeout monitors** when creating escrows
2. **Use default timeouts** unless you have a specific reason
3. **Monitor cron job logs** regularly
4. **Handle errors gracefully** in your application
5. **Notify users** about upcoming timeouts
6. **Escalate to admin** when automatic handling fails

## Troubleshooting

### Timeout not triggering
- Check cron job is running
- Verify timeout is not already resolved
- Check expires_at timestamp

### Refund failing
- Verify escrow wallet has sufficient balance
- Check network connectivity
- Review transaction logs

### Warning not sent
- Check notification table
- Verify warning_sent flag
- Check recipient wallet address

## Related Documentation

- Full documentation: `lib/escrow/TIMEOUT_SYSTEM.md`
- Implementation summary: `.kiro/specs/complete-escrow-system/TASK_7_TIMEOUT_SYSTEM_SUMMARY.md`
- Requirements: `.kiro/specs/complete-escrow-system/requirements.md` (Requirement 7)
- Design: `.kiro/specs/complete-escrow-system/design.md`
