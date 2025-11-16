# Timeout Handling Guide

## Overview

The timeout handling system automatically processes expired escrows based on type-specific rules. This guide explains how timeouts are handled for each escrow type.

## Quick Reference

| Escrow Type | Timeout Scenario | Action Taken |
|-------------|------------------|--------------|
| **Traditional** | No deposits | Cancel escrow |
| **Traditional** | Buyer deposited only | Refund buyer |
| **Traditional** | Seller deposited only | Refund seller |
| **Traditional** | Both deposited, neither confirmed | Escalate to admin |
| **Traditional** | Buyer confirmed, seller didn't | Buyer gets all funds |
| **Traditional** | Seller confirmed, buyer didn't | Seller gets all funds |
| **Simple Buyer** | No deposit | Cancel escrow |
| **Simple Buyer** | Buyer deposited | Refund buyer |
| **Simple Buyer** | Milestone pending | Escalate to admin |
| **Atomic Swap** | No deposits | Cancel swap |
| **Atomic Swap** | Party A deposited only | Refund Party A |
| **Atomic Swap** | Party B deposited only | Refund Party B |
| **Atomic Swap** | Both deposited | Execute swap |

## Traditional Escrow Timeouts

### Deposit Timeout (72 hours default)

**Scenario 1: No deposits**
```
Action: Cancel escrow
Status: cancelled
Notification: None (no funds at risk)
```

**Scenario 2: Buyer deposited, seller didn't**
```
Action: Refund buyer
Status: refunded
Notification: Buyer receives refund notification with TX signature
```

**Scenario 3: Seller deposited, buyer didn't**
```
Action: Refund seller
Status: refunded
Notification: Seller receives refund notification with TX signature
```

### Confirmation Timeout (48 hours default)

**Scenario 1: Neither party confirmed**
```
Action: Escalate to admin review
Status: disputed (implicit)
Notification: Both parties notified of admin review
```

**Scenario 2: Buyer confirmed, seller didn't**
```
Action: Release all funds to buyer (buyer amount + seller security deposit)
Status: completed
Notification: Both parties notified of resolution
Rationale: Buyer acted in good faith, seller didn't confirm
```

**Scenario 3: Seller confirmed, buyer didn't**
```
Action: Release all funds to seller (buyer amount + seller security deposit)
Status: completed
Notification: Both parties notified of resolution
Rationale: Seller acted in good faith, buyer didn't confirm
```

## Simple Buyer Escrow Timeouts

### Deposit Timeout (72 hours default)

**Scenario 1: Buyer didn't deposit**
```
Action: Cancel escrow
Status: cancelled
Notification: None
```

**Scenario 2: Buyer deposited**
```
Action: Refund buyer
Status: refunded
Notification: Buyer receives refund notification
Rationale: Seller never started work
```

### Milestone Timeout (168 hours / 7 days default)

**Scenario: Milestone work pending**
```
Action: Escalate to admin review
Status: disputed (implicit)
Notification: Both parties notified
Admin Options:
  - Release remaining funds to buyer (work not completed)
  - Give seller more time (extend timeout)
  - Partial release based on completed work
```

## Atomic Swap Timeouts

### Swap Timeout (24 hours default)

**Scenario 1: No deposits**
```
Action: Cancel swap
Status: cancelled
Notification: None
```

**Scenario 2: Party A deposited, Party B didn't**
```
Action: Refund Party A
Status: refunded
Notification: Party A receives refund notification
```

**Scenario 3: Party B deposited, Party A didn't**
```
Action: Refund Party B
Status: refunded
Notification: Party B receives refund notification
```

**Scenario 4: Both deposited (edge case)**
```
Action: Execute swap immediately
Status: completed
Notification: Both parties notified of swap completion
Rationale: Both parties fulfilled their obligation
```

## Automatic Processing

### Cron Job Setup

The timeout handling system requires a cron job to periodically check and process expired timeouts.

**Recommended Schedule**: Every 15 minutes

**Endpoint**: `POST /api/escrow/process-timeouts`

**Authentication**: Bearer token with CRON_SECRET

### Vercel Cron Configuration

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

### Environment Variables

```bash
CRON_SECRET=your-secret-key-here
```

### Manual Trigger

For testing or manual processing:
```bash
curl -X POST https://your-domain.com/api/escrow/process-timeouts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

### Get Timeout Statistics

```bash
curl https://your-domain.com/api/escrow/process-timeouts
```

Response:
```json
{
  "success": true,
  "statistics": {
    "total": 150,
    "active": 45,
    "expired": 10,
    "resolved": 95,
    "byType": {
      "deposit_timeout": 60,
      "confirmation_timeout": 30,
      "milestone_timeout": 40,
      "swap_timeout": 20
    },
    "avgResolutionTime": 2.5
  },
  "cronEndpoint": "/api/escrow/process-timeouts",
  "recommendedSchedule": "Every 15 minutes"
}
```

## Admin Escalation

When timeouts escalate to admin review, they appear in the admin dashboard:

**Admin Actions Available:**
1. Release funds to buyer
2. Release funds to seller
3. Split funds between parties
4. Extend timeout (give more time)
5. Request additional evidence

**Admin Dashboard**: `/admin/escrow`

**Escalation Criteria:**
- Traditional: Neither party confirmed
- Milestone: Work pending beyond timeout
- Complex disputes requiring human judgment

## Notifications

All timeout actions trigger notifications:

### Refund Notifications
```
Title: "Deposit Timeout - Refund Processed"
Message: "The counterparty did not deposit in time. 
         Your X TOKEN has been refunded. TX: [signature]"
Link: /escrow/[id]
```

### Confirmation Timeout Notifications
```
Title: "Confirmation Timeout - Funds Released"
Message: "The counterparty did not confirm in time. 
         Funds have been released to you. TX: [signature]"
Link: /escrow/[id]
```

### Admin Escalation Notifications
```
Title: "Escrow Requires Admin Review"
Message: "Your escrow has been escalated to admin review 
         due to timeout. You will be notified of the decision."
Link: /escrow/[id]
```

## Action Logging

All timeout actions are logged to `escrow_actions` table:

```typescript
{
  escrow_id: string
  actor_wallet: 'system'
  action_type: 'timeout' | 'refunded' | 'released' | 'admin_action'
  notes: string  // Detailed description of action taken
  metadata: {
    timeout_id: string
    timeout_type: string
    resolution: string
  }
}
```

## Best Practices

### For Users

1. **Act promptly**: Confirm transactions before timeout
2. **Monitor notifications**: Check for timeout warnings
3. **Communicate**: Contact counterparty if delays expected
4. **Request extensions**: Ask admin for more time if needed

### For Admins

1. **Review context**: Check all evidence before deciding
2. **Be fair**: Consider both parties' perspectives
3. **Document decisions**: Provide clear resolution notes
4. **Act quickly**: Don't let escalations sit too long

### For Developers

1. **Test timeouts**: Use short timeouts in development
2. **Monitor logs**: Check timeout processing results
3. **Handle errors**: Implement retry logic for failed refunds
4. **Update configs**: Adjust timeout periods based on usage

## Troubleshooting

### Timeout Not Processing

**Check:**
1. Is cron job running? (Check Vercel logs)
2. Is CRON_SECRET configured correctly?
3. Are there errors in timeout processing logs?
4. Is the timeout actually expired? (Check `expires_at`)

### Refund Failed

**Check:**
1. Does escrow wallet have sufficient balance?
2. Is the token mint address correct?
3. Is the recipient wallet valid?
4. Check transaction logs for error details

### Admin Escalation Not Showing

**Check:**
1. Is `escrow_admin_actions` table populated?
2. Is admin dashboard querying correctly?
3. Check for database connection issues

## Code Examples

### Check Escrow Timeouts

```typescript
import { checkEscrowTimeouts } from '@/lib/escrow/timeout-monitor'

const result = await checkEscrowTimeouts('escrow_id')
console.log('Has expired:', result.hasExpired)
console.log('Expired timeouts:', result.expiredTimeouts)
console.log('Active timeouts:', result.activeTimeouts)
```

### Process Single Timeout

```typescript
import { handleTimeout } from '@/lib/escrow/timeout-handler'

const result = await handleTimeout('escrow_id', 'timeout_id')
console.log('Success:', result.success)
console.log('Action:', result.action)
console.log('TX Signature:', result.txSignature)
```

### Process All Expired Timeouts

```typescript
import { processAllExpiredTimeouts } from '@/lib/escrow/timeout-handler'

const result = await processAllExpiredTimeouts()
console.log('Processed:', result.processed)
console.log('Successful:', result.successful)
console.log('Failed:', result.failed)
```

## Related Documentation

- [Timeout System Overview](./TIMEOUT_SYSTEM.md)
- [Timeout Configuration](./TIMEOUT_CONFIG_GUIDE.md)
- [Timeout Integration](./TIMEOUT_INTEGRATION.md)
- [Timeout Quick Reference](./TIMEOUT_QUICK_REFERENCE.md)

---

**Last Updated**: 2025-11-15  
**Version**: 1.0.0
