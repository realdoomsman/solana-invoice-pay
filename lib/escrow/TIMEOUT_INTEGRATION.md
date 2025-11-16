# Timeout Configuration Integration

## Overview

This document explains how the timeout configuration system (Task 7.1) integrates with the complete escrow system.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Escrow Creation                         │
│  (traditional.ts, atomic-swap.ts, simple-buyer.ts)      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ 1. Store timeout_hours & expires_at
                      │    in escrow_contracts table
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Timeout Configuration                       │
│              (timeout-config.ts)                         │
│                                                          │
│  • Get default timeout for escrow type                  │
│  • Calculate expiration timestamp                       │
│  • Create timeout monitor record                        │
│  • Store in escrow_timeouts table                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ 2. Monitor timeouts
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Timeout Monitoring                          │
│              (timeout-monitor.ts) - Task 7.2             │
│                                                          │
│  • Periodic checks for expired timeouts                 │
│  • Send pre-expiration warnings                         │
│  • Mark timeouts as expired                             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ 3. Handle expired timeouts
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Timeout Handling                            │
│              (timeout-handler.ts) - Task 7.3             │
│                                                          │
│  • Type-specific timeout rules                          │
│  • Automatic refunds                                    │
│  • Admin escalation                                     │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Escrow Creation

When an escrow is created:

```typescript
// In traditional.ts or atomic-swap.ts
const timeoutHours = params.timeoutHours || getDefaultTimeout('traditional')
const expiresAt = new Date()
expiresAt.setHours(expiresAt.getHours() + timeoutHours)

// Store in escrow_contracts
const escrowData = {
  // ... other fields
  timeout_hours: timeoutHours,
  expires_at: expiresAt.toISOString()
}
```

### 2. Timeout Monitor Creation

After escrow creation:

```typescript
// Create timeout monitor
await createTimeoutMonitor({
  escrowId,
  timeoutType: 'deposit_timeout',
  customHours: timeoutHours,
  expectedAction: 'Both parties must deposit funds',
})
```

This creates a record in `escrow_timeouts` table:

```sql
INSERT INTO escrow_timeouts (
  id,
  escrow_id,
  timeout_type,
  expected_action,
  expires_at,
  warning_sent,
  expired,
  resolved
) VALUES (
  'timeout_123',
  'escrow_456',
  'deposit_timeout',
  'Both parties must deposit funds',
  '2025-11-18T21:00:00Z',
  false,
  false,
  false
)
```

### 3. Timeout Monitoring (Task 7.2)

The monitoring service periodically checks:

```typescript
// Get timeouts that need warnings
const needsWarning = await getTimeoutsNeedingWarning()

// Get expired timeouts
const expired = await getExpiredTimeouts()

// Process each
for (const timeout of needsWarning) {
  await sendWarningNotification(timeout)
  await markWarningSent(timeout.id)
}

for (const timeout of expired) {
  await markTimeoutExpired(timeout.id)
  await handleExpiredTimeout(timeout)
}
```

### 4. Timeout Handling (Task 7.3)

When a timeout expires, type-specific logic is applied:

```typescript
switch (timeout.timeout_type) {
  case 'deposit_timeout':
    // Refund any deposits, cancel escrow
    await handleDepositTimeout(timeout)
    break
    
  case 'confirmation_timeout':
    // Escalate to admin review
    await escalateToAdmin(timeout)
    break
    
  case 'milestone_timeout':
    // Allow buyer to reclaim funds
    await handleMilestoneTimeout(timeout)
    break
    
  // ... other types
}
```

## Database Schema Integration

### escrow_contracts Table

```sql
CREATE TABLE escrow_contracts (
  id TEXT PRIMARY KEY,
  -- ... other fields
  timeout_hours INTEGER DEFAULT 72,
  expires_at TIMESTAMP WITH TIME ZONE,
  -- ... other fields
)
```

**Purpose:**
- `timeout_hours`: Duration of the timeout period
- `expires_at`: When the escrow expires (for quick checks)

### escrow_timeouts Table

```sql
CREATE TABLE escrow_timeouts (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  timeout_type TEXT,
  expected_action TEXT,
  expected_from TEXT,
  warning_sent BOOLEAN DEFAULT FALSE,
  warning_sent_at TIMESTAMP,
  expired BOOLEAN DEFAULT FALSE,
  expired_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolution_action TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
)
```

**Purpose:**
- Tracks individual timeout monitors
- Supports multiple timeouts per escrow
- Records warning and expiration status
- Stores resolution information

## Integration Points

### 1. Escrow Creation Functions

**Files:**
- `lib/escrow/traditional.ts`
- `lib/escrow/atomic-swap.ts`
- `lib/escrow/simple-buyer.ts` (to be implemented)

**Integration:**
```typescript
import { createTimeoutMonitor, getDefaultTimeout } from './timeout-config'

// Get timeout hours (custom or default)
const timeoutHours = params.timeoutHours || getDefaultTimeout(escrowType)

// Calculate expiration
const expiresAt = new Date()
expiresAt.setHours(expiresAt.getHours() + timeoutHours)

// Store in contract
const escrowData = {
  timeout_hours: timeoutHours,
  expires_at: expiresAt.toISOString()
}

// Create timeout monitor
await createTimeoutMonitor({
  escrowId,
  timeoutType: 'deposit_timeout',
  customHours: timeoutHours,
  expectedAction: 'Deposits required',
})
```

### 2. Deposit Tracking

**File:** `lib/escrow/deposit-monitor.ts`

**Integration:**
```typescript
// When both parties deposit, resolve deposit timeout
if (bothPartiesDeposited) {
  const timeouts = await getActiveTimeouts(escrowId)
  const depositTimeout = timeouts.find(t => t.timeout_type === 'deposit_timeout')
  
  if (depositTimeout) {
    await resolveTimeout(depositTimeout.id, 'Both parties deposited')
  }
  
  // Create new timeout for confirmations
  await createTimeoutMonitor({
    escrowId,
    timeoutType: 'confirmation_timeout',
    expectedAction: 'Confirmations required',
  })
}
```

### 3. Milestone Submission

**File:** `lib/escrow/simple-buyer.ts`

**Integration:**
```typescript
// When work is submitted, create milestone timeout
await createTimeoutMonitor({
  escrowId,
  timeoutType: 'milestone_timeout',
  expectedAction: 'Buyer must approve milestone',
  expectedFrom: buyerWallet,
})
```

### 4. Dispute Raising

**File:** `app/api/escrow/dispute/route.ts`

**Integration:**
```typescript
// When dispute is raised, create dispute timeout
await createTimeoutMonitor({
  escrowId,
  timeoutType: 'dispute_timeout',
  expectedAction: 'Admin must resolve dispute',
})
```

### 5. UI Display

**Files:**
- `app/escrow/[id]/page.tsx`
- `components/EscrowList.tsx`

**Integration:**
```typescript
import { getTimeRemaining, formatTimeRemaining } from '@/lib/escrow/timeout-config'

// Display time remaining
const remaining = getTimeRemaining(escrow.expires_at)

if (remaining.expired) {
  return <Badge variant="destructive">Expired</Badge>
}

return (
  <div>
    <span>Time remaining: {formatTimeRemaining(escrow.expires_at)}</span>
    {remaining.hours < 24 && (
      <Badge variant="warning">Expiring soon</Badge>
    )}
  </div>
)
```

## State Transitions

### Traditional Escrow

```
Created (deposit_timeout)
  ↓ Both deposit
Fully Funded (confirmation_timeout)
  ↓ Both confirm
Completed (resolved)
```

### Simple Buyer Escrow

```
Created (deposit_timeout)
  ↓ Buyer deposits
Fully Funded
  ↓ Seller submits work
Work Submitted (milestone_timeout)
  ↓ Buyer approves
Milestone Released
  ↓ Repeat for each milestone
Completed (resolved)
```

### Atomic Swap

```
Created (swap_timeout)
  ↓ Both deposit
Swap Executed (resolved)
```

## Timeout Resolution

Timeouts are resolved when:

1. **Expected action completed**: Deposits received, work approved, etc.
2. **Timeout expired**: Monitoring service marks as expired
3. **Admin intervention**: Admin manually resolves or extends
4. **Escrow cancelled**: All timeouts resolved

```typescript
// Resolve timeout when action completed
await resolveTimeout(timeoutId, 'Deposits received')

// Mark as expired (monitoring service)
await markTimeoutExpired(timeoutId)

// Extend timeout (admin)
await extendTimeout(timeoutId, 24) // Add 24 hours
```

## Error Handling

### Invalid Timeout Hours

```typescript
const validation = validateTimeoutHours(customHours)
if (!validation.valid) {
  throw new Error(validation.error)
}
```

### Missing Timeout Configuration

```typescript
try {
  const config = getTimeoutConfig(timeoutType)
} catch (error) {
  // Fall back to default
  const config = getTimeoutConfig('deposit_timeout')
}
```

### Database Errors

```typescript
const result = await createTimeoutMonitor(input)
if (!result.success) {
  console.error('Failed to create timeout:', result.error)
  // Continue with escrow creation, log error
}
```

## Performance Considerations

### Indexes

```sql
-- Efficient timeout queries
CREATE INDEX idx_timeout_expires 
  ON escrow_timeouts(expires_at) 
  WHERE resolved = FALSE;

CREATE INDEX idx_timeout_expired 
  ON escrow_timeouts(expired) 
  WHERE resolved = FALSE;
```

### Query Optimization

```typescript
// Get only unresolved timeouts
const timeouts = await getActiveTimeouts(escrowId)

// Check for expired timeouts efficiently
const hasExpired = await hasExpiredTimeouts(escrowId)
```

## Testing

### Unit Tests

```typescript
// Test default timeouts
expect(getDefaultTimeout('traditional')).toBe(72)

// Test expiration calculation
const expires = calculateExpirationTimestamp(48)
expect(expires.getTime()).toBeGreaterThan(Date.now())

// Test validation
expect(validateTimeoutHours(0).valid).toBe(false)
expect(validateTimeoutHours(24).valid).toBe(true)
```

### Integration Tests

```typescript
// Test escrow creation with timeout
const escrow = await createTraditionalEscrow({
  timeoutHours: 48,
  // ... other params
})

expect(escrow.timeout_hours).toBe(48)
expect(escrow.expires_at).toBeDefined()

// Verify timeout monitor created
const timeouts = await getActiveTimeouts(escrow.id)
expect(timeouts.length).toBeGreaterThan(0)
```

## Future Enhancements

1. **Dynamic Timeouts**: Adjust based on transaction size or history
2. **Timezone Support**: Display timeouts in user's local timezone
3. **Notification Preferences**: Let users choose when to receive warnings
4. **Timeout Extensions**: Allow parties to mutually extend timeouts
5. **Analytics**: Track average timeout durations and expiration rates

## Related Documentation

- [Timeout Configuration Guide](./TIMEOUT_CONFIG_GUIDE.md)
- [Task 7.1 Implementation Summary](../.kiro/specs/complete-escrow-system/TASK_7.1_IMPLEMENTATION_SUMMARY.md)
- [Requirements Document](../.kiro/specs/complete-escrow-system/requirements.md)
- [Design Document](../.kiro/specs/complete-escrow-system/design.md)
