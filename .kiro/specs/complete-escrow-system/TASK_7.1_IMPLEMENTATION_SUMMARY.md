# Task 7.1 Implementation Summary: Timeout Configuration

## Status: ✅ COMPLETED

## Overview
Implemented a comprehensive timeout configuration system that allows custom timeout periods, provides default timeouts per escrow type, and stores expiration timestamps for all escrow contracts.

## Implementation Details

### 1. Default Timeouts per Escrow Type
**File:** `lib/escrow/timeout-config.ts`

Defined default timeout hours for each escrow type:
- **Traditional Escrow**: 72 hours (3 days) - for both parties to deposit and confirm
- **Simple Buyer Escrow**: 168 hours (7 days) - for milestone work completion
- **Atomic Swap Escrow**: 24 hours (1 day) - for swap deposits

```typescript
export const DEFAULT_TIMEOUTS: Record<EscrowType, number> = {
  traditional: 72,
  simple_buyer: 168,
  atomic_swap: 24,
}
```

### 2. Timeout Type Configurations
Implemented detailed configurations for different timeout scenarios:

- **deposit_timeout**: 72 hours default, 24-hour warning
- **confirmation_timeout**: 48 hours default, 12-hour warning
- **milestone_timeout**: 168 hours default, 48-hour warning
- **dispute_timeout**: 336 hours (14 days) default, 72-hour warning
- **swap_timeout**: 24 hours default, 6-hour warning

Each configuration includes:
- Default hours
- Warning hours before expiration
- Human-readable description

### 3. Custom Timeout Periods
Implemented functions to allow custom timeout periods:

```typescript
export async function createTimeoutMonitor(
  input: TimeoutConfigInput
): Promise<TimeoutConfigResult>
```

Features:
- Accepts custom timeout hours via `customHours` parameter
- Falls back to default if not provided
- Validates timeout hours (must be > 0 and <= 8760 hours/1 year)
- Calculates and stores expiration timestamp

### 4. Expiration Timestamp Storage
Implemented storage of expiration timestamps in two places:

#### A. Escrow Contract Level
**Table:** `escrow_contracts`
- `timeout_hours`: INTEGER - stores the timeout duration
- `expires_at`: TIMESTAMP - stores the calculated expiration timestamp

Both traditional and atomic swap escrow creation functions store these values:
- `lib/escrow/traditional.ts` - lines 76-77
- `lib/escrow/atomic-swap.ts` - lines 89-90

#### B. Timeout Monitor Level
**Table:** `escrow_timeouts`
- `expires_at`: TIMESTAMP - stores when the timeout expires
- `timeout_type`: TEXT - type of timeout being monitored
- `expected_action`: TEXT - what action is expected
- `expected_from`: TEXT - which party should act

### 5. Utility Functions
Implemented comprehensive utility functions:

#### Calculation Functions
- `calculateExpirationTimestamp(hours)` - calculates future expiration date
- `calculateWarningTimestamp(expiresAt, timeoutType)` - calculates when to send warning
- `getTimeRemaining(expiresAt)` - calculates time remaining until expiration
- `formatTimeRemaining(expiresAt)` - formats time as human-readable string

#### Validation Functions
- `validateTimeoutHours(hours)` - validates timeout is within acceptable range
- `hasExpiredTimeouts(escrowId)` - checks if escrow has expired timeouts

#### Retrieval Functions
- `getActiveTimeouts(escrowId)` - gets all active timeouts for an escrow
- `getTimeoutById(timeoutId)` - gets specific timeout by ID
- `getDefaultTimeout(escrowType)` - gets default timeout for escrow type
- `getTimeoutConfig(timeoutType)` - gets configuration for timeout type

#### Management Functions
- `resolveTimeout(timeoutId, resolutionAction)` - marks timeout as resolved
- `markTimeoutExpired(timeoutId)` - marks timeout as expired
- `markWarningSent(timeoutId)` - marks warning notification as sent
- `extendTimeout(timeoutId, additionalHours)` - extends timeout (admin action)

## Integration with Escrow Types

### Traditional Escrow
✅ Stores `timeout_hours` and `expires_at` in contract
✅ Creates timeout monitor with `deposit_timeout` type
✅ Uses custom timeout if provided, defaults to 72 hours

### Atomic Swap Escrow
✅ Stores `timeout_hours` and `expires_at` in contract
✅ Creates timeout monitor with `swap_timeout` type
✅ Uses custom timeout if provided, defaults to 24 hours

### Simple Buyer Escrow
⏳ Type definition includes `timeoutHours` parameter
⏳ Creation function to be implemented in future task
⏳ Will use `milestone_timeout` type with 168-hour default

## Database Schema

### escrow_contracts Table
```sql
timeout_hours INTEGER DEFAULT 72,
expires_at TIMESTAMP WITH TIME ZONE,
```

### escrow_timeouts Table
```sql
CREATE TABLE IF NOT EXISTS escrow_timeouts (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id),
  timeout_type TEXT NOT NULL,
  expected_action TEXT NOT NULL,
  expected_from TEXT,
  warning_sent BOOLEAN DEFAULT FALSE,
  warning_sent_at TIMESTAMP WITH TIME ZONE,
  expired BOOLEAN DEFAULT FALSE,
  expired_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Testing

Created comprehensive verification script: `scripts/verify-timeout-config.ts`

### Test Results
✅ Default timeouts per escrow type
✅ Timeout type configurations
✅ Custom timeout periods
✅ Warning timestamp calculation
✅ Timeout validation (positive, negative, and edge cases)
✅ Time remaining calculation
✅ Expiration timestamp storage

All tests passed successfully.

## Requirements Satisfied

### Requirement 7.1 ✅
> WHEN THE User creates an escrow, THE Escrow System SHALL allow specification of a timeout period

**Implementation:**
- All escrow creation functions accept optional `timeoutHours` parameter
- Custom timeout can be specified during escrow creation
- Falls back to sensible defaults if not provided

### Requirement 7.2 ✅
> THE Escrow System SHALL provide default timeout values based on escrow type

**Implementation:**
- `DEFAULT_TIMEOUTS` constant defines defaults for each type
- Traditional: 72 hours
- Simple Buyer: 168 hours
- Atomic Swap: 24 hours
- `getDefaultTimeout(escrowType)` function retrieves defaults

### Additional Features (Beyond Requirements)
- Timeout validation (prevents invalid values)
- Warning timestamp calculation (for pre-expiration notifications)
- Time remaining formatting (human-readable display)
- Timeout extension capability (admin action)
- Multiple timeout types per escrow (deposit, confirmation, milestone, etc.)

## Files Modified/Created

### Created
- ✅ `lib/escrow/timeout-config.ts` - Complete timeout configuration system
- ✅ `scripts/verify-timeout-config.ts` - Verification script

### Modified
- ✅ `lib/escrow/types.ts` - Added timeout-related types
- ✅ `lib/escrow/traditional.ts` - Integrated timeout configuration
- ✅ `lib/escrow/atomic-swap.ts` - Integrated timeout configuration
- ✅ `supabase-escrow-complete-schema.sql` - Already includes timeout tables

## Usage Examples

### Creating Escrow with Custom Timeout
```typescript
// Traditional escrow with 48-hour timeout
const result = await createTraditionalEscrow({
  buyerWallet: 'buyer123...',
  sellerWallet: 'seller456...',
  buyerAmount: 100,
  sellerSecurityDeposit: 20,
  token: 'USDC',
  timeoutHours: 48, // Custom timeout
})
```

### Creating Escrow with Default Timeout
```typescript
// Atomic swap with default 24-hour timeout
const result = await createAtomicSwap({
  partyAWallet: 'party_a...',
  partyBWallet: 'party_b...',
  partyAAsset: { token: 'SOL', amount: 1 },
  partyBAsset: { token: 'USDC', amount: 100 },
  // timeoutHours not specified, uses default 24 hours
})
```

### Checking Time Remaining
```typescript
const remaining = getTimeRemaining(escrow.expires_at)
console.log(`Time left: ${formatTimeRemaining(escrow.expires_at)}`)
// Output: "Time left: 2 days"
```

### Extending Timeout (Admin)
```typescript
const result = await extendTimeout(timeoutId, 24) // Add 24 hours
```

## Next Steps

This task is complete. The timeout configuration system is fully implemented and tested. Future tasks will:

1. **Task 7.2**: Implement timeout monitoring service (periodic checks)
2. **Task 7.3**: Build timeout handling logic (type-specific rules)
3. Integrate timeout configuration with simple-buyer escrow creation
4. Add UI components to display time remaining
5. Implement pre-expiration warning notifications

## Notes

- The timeout configuration system is designed to be extensible
- New timeout types can be easily added to `TIMEOUT_CONFIGS`
- All timestamps are stored in ISO 8601 format with timezone
- Database indexes are in place for efficient timeout queries
- The system supports multiple concurrent timeouts per escrow
