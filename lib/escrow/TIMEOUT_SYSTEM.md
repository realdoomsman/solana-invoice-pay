# Timeout and Expiration System

Complete implementation of timeout monitoring and handling for all escrow types.

## Overview

The timeout system ensures that escrows don't remain locked indefinitely if parties become unresponsive. It provides:

- **Configurable timeout periods** per escrow type
- **Automatic monitoring** via cron jobs
- **Pre-expiration warnings** to notify parties
- **Type-specific handling** rules for different escrow types
- **Admin escalation** for complex cases

## Architecture

### Components

1. **timeout-config.ts** - Configuration and timeout creation
2. **timeout-monitor.ts** - Monitoring service for checking expired escrows
3. **timeout-handler.ts** - Type-specific timeout handling logic
4. **API endpoint** - `/api/escrow/process-timeouts` for cron jobs

### Database Schema

The `escrow_timeouts` table tracks all timeout monitors:

```sql
CREATE TABLE escrow_timeouts (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  timeout_type TEXT, -- 'deposit_timeout', 'confirmation_timeout', etc.
  expected_action TEXT,
  expected_from TEXT, -- Wallet address
  warning_sent BOOLEAN DEFAULT FALSE,
  warning_sent_at TIMESTAMP,
  expired BOOLEAN DEFAULT FALSE,
  expired_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolution_action TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

## Timeout Types

### 1. Deposit Timeout
- **Default**: 72 hours (traditional), 24 hours (atomic swap)
- **Trigger**: When parties fail to deposit funds
- **Action**: Refund any deposited party, cancel if no deposits

### 2. Confirmation Timeout
- **Default**: 48 hours
- **Trigger**: When parties fail to confirm transaction completion
- **Action**: Favor the confirming party (traditional escrow)

### 3. Milestone Timeout
- **Default**: 168 hours (7 days)
- **Trigger**: When seller fails to submit work or buyer fails to approve
- **Action**: Escalate to admin review

### 4. Swap Timeout
- **Default**: 24 hours
- **Trigger**: When parties fail to deposit for atomic swap
- **Action**: Refund deposited party, execute swap if both deposited

### 5. Dispute Timeout
- **Default**: 336 hours (14 days)
- **Trigger**: When dispute remains unresolved
- **Action**: Escalate to admin for final decision

## Default Configurations

```typescript
const DEFAULT_TIMEOUTS = {
  traditional: 72,    // 3 days
  simple_buyer: 168,  // 7 days
  atomic_swap: 24,    // 1 day
}

const TIMEOUT_CONFIGS = {
  deposit_timeout: {
    defaultHours: 72,
    warningHoursBefore: 24,
  },
  confirmation_timeout: {
    defaultHours: 48,
    warningHoursBefore: 12,
  },
  milestone_timeout: {
    defaultHours: 168,
    warningHoursBefore: 48,
  },
  swap_timeout: {
    defaultHours: 24,
    warningHoursBefore: 6,
  },
  dispute_timeout: {
    defaultHours: 336,
    warningHoursBefore: 72,
  },
}
```

## Usage

### Creating a Timeout Monitor

```typescript
import { createTimeoutMonitor } from './timeout-config'

await createTimeoutMonitor({
  escrowId: 'escrow_123',
  timeoutType: 'deposit_timeout',
  customHours: 48, // Optional, uses default if not provided
  expectedAction: 'Both parties must deposit funds',
  expectedFrom: 'wallet_address', // Optional
})
```

### Checking Active Timeouts

```typescript
import { getActiveTimeouts } from './timeout-config'

const timeouts = await getActiveTimeouts('escrow_123')
```

### Manual Timeout Handling

```typescript
import { handleTimeout } from './timeout-handler'

const result = await handleTimeout('escrow_123', 'timeout_456')
// result: { success: boolean, action: string, txSignature?: string }
```

## Timeout Handling Rules

### Traditional Escrow

#### Deposit Timeout
- **No deposits**: Cancel escrow
- **Buyer deposited only**: Refund buyer
- **Seller deposited only**: Refund seller
- **Both deposited**: Mark as fully funded (shouldn't happen)

#### Confirmation Timeout
- **Both confirmed**: Release funds (shouldn't happen)
- **Neither confirmed**: Escalate to admin
- **Buyer confirmed only**: Buyer gets all funds
- **Seller confirmed only**: Seller gets all funds

### Simple Buyer Escrow (Milestone-based)

#### Deposit Timeout
- **No deposit**: Cancel escrow
- **Buyer deposited**: Refund buyer

#### Milestone Timeout
- **Always**: Escalate to admin review
- Admin decides based on completed work

### Atomic Swap Escrow

#### Swap Timeout
- **No deposits**: Cancel escrow
- **Party A deposited only**: Refund Party A
- **Party B deposited only**: Refund Party B
- **Both deposited**: Execute swap (shouldn't happen)

## Monitoring Service

### Cron Job Setup

The system uses Vercel Cron to run every 15 minutes:

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

### Manual Trigger

You can manually trigger timeout processing:

```bash
curl -X POST https://your-domain.com/api/escrow/process-timeouts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Monitoring Flow

1. **Check expired escrows** - Find timeouts past expiration
2. **Send warnings** - Notify parties before expiration
3. **Mark as expired** - Update timeout records
4. **Handle timeouts** - Execute type-specific logic
5. **Escalate to admin** - For complex cases

## Pre-Expiration Warnings

Warnings are sent before timeout expiration:

- **Deposit timeout**: 24 hours before
- **Confirmation timeout**: 12 hours before
- **Milestone timeout**: 48 hours before
- **Swap timeout**: 6 hours before
- **Dispute timeout**: 72 hours before

### Warning Recipients

The system determines who receives warnings based on:
- Timeout type
- Current escrow status
- Expected action
- Party roles

## Admin Escalation

Timeouts are escalated to admin when:

1. **Milestone timeouts** - Requires review of completed work
2. **Confirmation timeout with no confirmations** - Unclear situation
3. **Complex dispute scenarios** - Needs human judgment
4. **System errors** - Failed automatic handling

### Admin Actions

Admins can:
- Review escalated escrows in admin dashboard
- Extend timeout periods
- Manually resolve timeouts
- Execute custom fund distributions

## API Endpoints

### POST /api/escrow/process-timeouts

Process all expired timeouts (cron job endpoint)

**Request:**
```bash
POST /api/escrow/process-timeouts
Authorization: Bearer CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "monitoring": {
    "totalChecked": 45,
    "expiredCount": 3,
    "warningsSent": 8,
    "escalatedToAdmin": 1,
    "errors": []
  },
  "handling": {
    "processed": 3,
    "successful": 2,
    "failed": 1,
    "errors": ["timeout_123: Insufficient balance"]
  }
}
```

### GET /api/escrow/process-timeouts

Get timeout statistics

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total": 150,
    "active": 45,
    "expired": 3,
    "resolved": 102,
    "byType": {
      "deposit_timeout": 80,
      "confirmation_timeout": 30,
      "milestone_timeout": 25,
      "swap_timeout": 10,
      "dispute_timeout": 5
    },
    "avgResolutionTime": 36.5
  }
}
```

## Environment Variables

```env
# Cron job authentication
CRON_SECRET=your_secret_key_here

# Solana network
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption
ESCROW_ENCRYPTION_KEY=your_encryption_key
```

## Testing

### Unit Tests

Test timeout configuration:
```typescript
import { validateTimeoutHours, getTimeRemaining } from './timeout-config'

test('validates timeout hours', () => {
  expect(validateTimeoutHours(24).valid).toBe(true)
  expect(validateTimeoutHours(0).valid).toBe(false)
  expect(validateTimeoutHours(10000).valid).toBe(false)
})
```

### Integration Tests

Test timeout handling:
```typescript
import { handleTimeout } from './timeout-handler'

test('handles traditional deposit timeout', async () => {
  const result = await handleTimeout(escrowId, timeoutId)
  expect(result.success).toBe(true)
  expect(result.action).toBe('refunded_partial_deposit')
})
```

## Monitoring and Alerts

### Metrics to Track

1. **Timeout rate** - Percentage of escrows that timeout
2. **Resolution time** - Average time to resolve timeouts
3. **Admin escalations** - Number requiring manual intervention
4. **Warning effectiveness** - Actions taken after warnings

### Logging

All timeout operations are logged:
- Timeout creation
- Warning sent
- Timeout expired
- Handling action taken
- Resolution completed

### Error Handling

Errors are captured and reported:
- Failed refunds
- Network issues
- Insufficient balances
- Database errors

## Best Practices

1. **Set appropriate timeouts** - Balance user experience with security
2. **Monitor regularly** - Run cron job every 15 minutes
3. **Send clear warnings** - Give users time to act
4. **Log everything** - Track all timeout events
5. **Handle errors gracefully** - Don't leave escrows in bad state
6. **Escalate when needed** - Don't force automatic resolution

## Future Enhancements

- [ ] Email notifications for warnings
- [ ] SMS notifications for critical timeouts
- [ ] User-configurable timeout periods
- [ ] Automatic timeout extension requests
- [ ] Machine learning for optimal timeout periods
- [ ] Real-time timeout monitoring dashboard

## Related Files

- `lib/escrow/timeout-config.ts` - Configuration
- `lib/escrow/timeout-monitor.ts` - Monitoring service
- `lib/escrow/timeout-handler.ts` - Handling logic
- `app/api/escrow/process-timeouts/route.ts` - API endpoint
- `vercel.json` - Cron configuration

## Support

For issues or questions about the timeout system:
1. Check logs in Vercel dashboard
2. Review timeout statistics endpoint
3. Check admin escalation queue
4. Contact development team
