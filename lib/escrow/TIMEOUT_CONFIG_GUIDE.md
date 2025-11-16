# Timeout Configuration Guide

## Quick Reference

The timeout configuration system provides flexible timeout management for all escrow types with sensible defaults and custom options.

## Default Timeouts

| Escrow Type | Default Hours | Duration |
|-------------|---------------|----------|
| Traditional | 72 | 3 days |
| Simple Buyer | 168 | 7 days |
| Atomic Swap | 24 | 1 day |

## Timeout Types

| Type | Default | Warning Before | Use Case |
|------|---------|----------------|----------|
| deposit_timeout | 72h | 24h | Waiting for deposits |
| confirmation_timeout | 48h | 12h | Waiting for confirmations |
| milestone_timeout | 168h | 48h | Waiting for milestone work |
| dispute_timeout | 336h | 72h | Waiting for dispute resolution |
| swap_timeout | 24h | 6h | Waiting for swap deposits |

## Usage

### Creating Escrow with Custom Timeout

```typescript
import { createTraditionalEscrow } from './lib/escrow/traditional'

const result = await createTraditionalEscrow({
  buyerWallet: 'buyer_address',
  sellerWallet: 'seller_address',
  buyerAmount: 100,
  sellerSecurityDeposit: 20,
  token: 'USDC',
  timeoutHours: 48, // Custom 48-hour timeout
})
```

### Using Default Timeout

```typescript
// Omit timeoutHours to use default
const result = await createTraditionalEscrow({
  buyerWallet: 'buyer_address',
  sellerWallet: 'seller_address',
  buyerAmount: 100,
  sellerSecurityDeposit: 20,
  token: 'USDC',
  // Uses default 72 hours
})
```

### Getting Default Timeout

```typescript
import { getDefaultTimeout } from './lib/escrow/timeout-config'

const hours = getDefaultTimeout('traditional') // Returns 72
```

### Checking Time Remaining

```typescript
import { getTimeRemaining, formatTimeRemaining } from './lib/escrow/timeout-config'

const remaining = getTimeRemaining(escrow.expires_at)
console.log(`Days: ${remaining.days}`)
console.log(`Hours: ${remaining.hours}`)
console.log(`Expired: ${remaining.expired}`)

// Human-readable format
const formatted = formatTimeRemaining(escrow.expires_at)
console.log(formatted) // "2 days" or "5 hours" or "Expired"
```

### Validating Timeout Hours

```typescript
import { validateTimeoutHours } from './lib/escrow/timeout-config'

const result = validateTimeoutHours(48)
if (!result.valid) {
  console.error(result.error)
}
```

### Creating Timeout Monitor

```typescript
import { createTimeoutMonitor } from './lib/escrow/timeout-config'

const result = await createTimeoutMonitor({
  escrowId: 'escrow_123',
  timeoutType: 'deposit_timeout',
  customHours: 48, // Optional
  expectedAction: 'Both parties must deposit funds',
  expectedFrom: 'buyer_wallet', // Optional
})
```

### Getting Active Timeouts

```typescript
import { getActiveTimeouts } from './lib/escrow/timeout-config'

const timeouts = await getActiveTimeouts('escrow_123')
timeouts.forEach(timeout => {
  console.log(`Type: ${timeout.timeout_type}`)
  console.log(`Expires: ${timeout.expires_at}`)
  console.log(`Expired: ${timeout.expired}`)
})
```

### Extending Timeout (Admin)

```typescript
import { extendTimeout } from './lib/escrow/timeout-config'

const result = await extendTimeout('timeout_id', 24) // Add 24 hours
if (result.success) {
  console.log(`New expiration: ${result.timeout.expires_at}`)
}
```

### Resolving Timeout

```typescript
import { resolveTimeout } from './lib/escrow/timeout-config'

await resolveTimeout('timeout_id', 'Deposits received')
```

## Validation Rules

- Timeout hours must be greater than 0
- Timeout hours cannot exceed 8760 (1 year)
- Custom timeouts override defaults
- Expiration timestamps are stored in ISO 8601 format

## Database Fields

### escrow_contracts Table
```sql
timeout_hours INTEGER DEFAULT 72
expires_at TIMESTAMP WITH TIME ZONE
```

### escrow_timeouts Table
```sql
id TEXT PRIMARY KEY
escrow_id TEXT REFERENCES escrow_contracts(id)
timeout_type TEXT
expected_action TEXT
expected_from TEXT
warning_sent BOOLEAN
expired BOOLEAN
resolved BOOLEAN
expires_at TIMESTAMP WITH TIME ZONE
```

## Best Practices

1. **Use Defaults**: Let the system use defaults unless you have a specific reason for custom timeouts
2. **Validate Input**: Always validate custom timeout hours before creating escrow
3. **Monitor Expiration**: Check time remaining before critical actions
4. **Handle Warnings**: Send notifications when warning threshold is reached
5. **Extend Carefully**: Only extend timeouts when absolutely necessary (admin action)

## Examples by Escrow Type

### Traditional Escrow
```typescript
// Quick trade - 24 hours
timeoutHours: 24

// Standard trade - 72 hours (default)
// timeoutHours not specified

// Large trade - 7 days
timeoutHours: 168
```

### Simple Buyer Escrow
```typescript
// Quick project - 3 days
timeoutHours: 72

// Standard project - 7 days (default)
// timeoutHours not specified

// Long project - 14 days
timeoutHours: 336
```

### Atomic Swap
```typescript
// Quick swap - 6 hours
timeoutHours: 6

// Standard swap - 24 hours (default)
// timeoutHours not specified

// Extended swap - 48 hours
timeoutHours: 48
```

## Error Handling

```typescript
import { validateTimeoutHours } from './lib/escrow/timeout-config'

const validation = validateTimeoutHours(customHours)
if (!validation.valid) {
  throw new Error(validation.error)
}

// Proceed with escrow creation
```

## Integration with Monitoring

The timeout configuration system integrates with the timeout monitoring service (Task 7.2):

1. Timeout monitor checks `escrow_timeouts` table periodically
2. Sends warnings when `warning_sent = false` and current time > warning threshold
3. Marks timeouts as expired when current time > `expires_at`
4. Triggers appropriate actions based on timeout type

## Related Files

- `lib/escrow/timeout-config.ts` - Main configuration system
- `lib/escrow/timeout-monitor.ts` - Monitoring service (Task 7.2)
- `lib/escrow/timeout-handler.ts` - Handling logic (Task 7.3)
- `lib/escrow/types.ts` - Type definitions

## Support

For questions or issues with timeout configuration:
1. Check this guide first
2. Review the implementation summary: `.kiro/specs/complete-escrow-system/TASK_7.1_IMPLEMENTATION_SUMMARY.md`
3. Run verification script: `npx tsx scripts/verify-timeout-config.ts`
