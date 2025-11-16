# Admin Audit Log - Quick Reference Guide

## Overview
The Admin Audit Log provides a complete, immutable record of all administrative actions taken on the escrow platform. This ensures transparency, accountability, and compliance.

## Accessing the Audit Log

### Full Audit Log
Navigate to: **`/admin/escrow/audit-log`**

This shows all admin actions across all escrows with:
- Statistics dashboard
- Filtering options
- Pagination
- Full action details

### Escrow-Specific Audit Log
Navigate to: **`/admin/escrow/[escrowId]`**

Scroll to the "Admin Audit Log" section to see actions specific to that escrow.

## What Gets Logged

Every admin action records:
- ✅ **Admin Wallet**: Who took the action
- ✅ **Action Type**: What was done (resolved_dispute, approved_release, etc.)
- ✅ **Decision**: The resolution decision (release_to_seller, refund_to_buyer, partial_split)
- ✅ **Timestamp**: When the action occurred
- ✅ **Notes**: Admin's reasoning and explanation
- ✅ **Amounts**: How funds were distributed
- ✅ **Transaction Signatures**: On-chain proof of fund movements
- ✅ **Related Data**: Links to escrow, dispute, milestone

## Action Types

| Action | Description |
|--------|-------------|
| `resolved_dispute` | Admin resolved a dispute between parties |
| `approved_release` | Admin manually approved fund release |
| `approved_refund` | Admin manually approved refund |
| `reviewed` | Admin reviewed but took no action |
| `requested_more_info` | Admin requested additional information |

## Decision Types

| Decision | Description |
|----------|-------------|
| `release_to_seller` | All funds released to seller |
| `refund_to_buyer` | All funds refunded to buyer |
| `partial_split` | Funds split between buyer and seller |
| `other` | Custom resolution requiring manual intervention |

## Using Filters

### Filter by Action Type
1. Click the "Filter by Action" dropdown
2. Select action type (or "All Actions")
3. Results update automatically

### Filter by Admin
1. Click the "Filter by Admin" dropdown
2. Select admin wallet (shows action count)
3. Results update automatically

### Clear Filters
Select "All Actions" and "All Admins" to clear filters.

## Statistics Dashboard

When viewing the full audit log (not filtered by escrow), you'll see:

- **Total Actions**: Total number of admin actions recorded
- **Disputes Resolved**: Number of disputes resolved by admins
- **Active Admins**: Number of unique admins who have taken actions
- **Releases to Seller**: Number of times funds were released to seller

## Reading an Audit Entry

Each audit entry shows:

```
┌─────────────────────────────────────────────────────────┐
│ [ACTION BADGE] [DECISION BADGE]        [TIMESTAMP]      │
│                                                          │
│ Admin: 1234...5678                                       │
│ Escrow: Project Name (5.0 SOL)                          │
│ Dispute: Payment not received (raised by buyer)         │
│ Distribution: 2.5 to buyer • 2.5 to seller              │
│                                                          │
│ Buyer TX: abcd...efgh [View on Explorer]                │
│ Seller TX: ijkl...mnop [View on Explorer]               │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Admin Notes:                                        │ │
│ │ After reviewing evidence from both parties, I       │ │
│ │ determined that both parties share responsibility.  │ │
│ │ Splitting funds 50/50 is the fairest resolution.    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Verifying Actions On-Chain

Every fund movement has a transaction signature that can be verified:

1. Find the action in the audit log
2. Click the transaction signature link (e.g., "abcd...efgh")
3. View the transaction on Solana Explorer
4. Verify:
   - From address (escrow wallet)
   - To address (buyer or seller)
   - Amount transferred
   - Transaction status (confirmed)

This provides cryptographic proof that the admin action was executed as recorded.

## Pagination

- Shows "X to Y of Z actions"
- Use **Previous** and **Next** buttons to navigate
- Default: 50 actions per page (100 on dedicated page)

## API Endpoint

For programmatic access:

```
GET /api/admin/escrow/audit-log
```

Query Parameters:
- `escrow_id`: Filter by escrow
- `dispute_id`: Filter by dispute
- `admin_wallet`: Filter by admin
- `action`: Filter by action type
- `limit`: Records per page (default 50)
- `offset`: Pagination offset (default 0)

Response:
```json
{
  "success": true,
  "audit_log": [...],
  "total": 100,
  "stats": {
    "total_actions": 100,
    "by_action": {...},
    "by_admin": {...},
    "by_decision": {...}
  }
}
```

## Security & Compliance

### Immutability
- Audit log entries cannot be modified or deleted
- Complete history is preserved
- On-chain transactions provide additional verification

### Access Control
- Only authorized admin wallets can view audit log
- Admin authentication required for all endpoints
- Rate limiting prevents abuse

### Transparency
- All actions are visible to authorized admins
- Transaction signatures provide on-chain proof
- Notes explain reasoning for every decision

## Best Practices

### When Taking Admin Actions

1. **Be Thorough**: Provide detailed notes explaining your reasoning
2. **Review Evidence**: Examine all evidence from both parties
3. **Be Fair**: Consider both perspectives before deciding
4. **Document**: Include specific details about why you made the decision
5. **Verify**: Check transaction signatures after resolution

### Minimum Note Length
- Notes must be at least 20 characters
- Provide sufficient explanation for your decision
- Include specific reasons and evidence considered

### Example Good Notes
✅ "After reviewing screenshots from both parties and chat logs, the buyer provided proof of payment but seller failed to deliver. Refunding buyer in full."

❌ "Refunding buyer" (too short, no explanation)

## Troubleshooting

### Can't See Audit Log
- Ensure you're connected with an admin wallet
- Check that your wallet is in the admin whitelist
- Verify you're on the correct page (`/admin/escrow/audit-log`)

### No Actions Showing
- This is normal for new systems
- Actions only appear after admins resolve disputes or take manual actions
- Try removing filters if applied

### Transaction Link Not Working
- Ensure you're on the correct Solana network (devnet/mainnet)
- Transaction may still be confirming (wait a few seconds)
- Check Solana Explorer is accessible

## Related Documentation

- **Admin Dashboard**: `/admin/escrow`
- **Dispute Resolution**: See dispute resolution guide
- **Security**: See security implementation guide
- **Database Schema**: `supabase-escrow-admin-schema.sql`

## Support

For issues or questions about the audit log:
1. Check this guide first
2. Review the implementation summary
3. Run verification script: `npx ts-node scripts/verify-admin-audit-log.ts`
4. Check database for admin action records
