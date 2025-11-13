# 🚀 Escrow System Setup Guide

## Quick Start (5 minutes)

### Step 1: Setup Database
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Open `supabase-escrow-schema.sql` from this repo
4. Copy all contents
5. Paste into SQL Editor
6. Click "Run"
7. ✅ Done! Tables created.

### Step 2: Test It Out
1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/create/escrow`
3. Fill in:
   - Buyer wallet: Your test wallet address
   - Seller wallet: Another test wallet address
   - Amount: 0.1 SOL
   - Add 2-3 milestones (must total 100%)
4. Click "Create Escrow Payment Link"
5. Send 0.1 SOL to the payment address
6. Watch it get locked in escrow!

### Step 3: Test Milestone Flow
1. Connect as **seller** wallet
2. Click "Submit Work for Review" on milestone 1
3. Disconnect and connect as **buyer** wallet
4. Click "Approve & Release"
5. ✅ Funds automatically sent to seller!

---

## How It Works

### For Buyers:
1. Create escrow with seller's wallet
2. Send payment (funds locked)
3. Wait for seller to submit work
4. Review and approve each milestone
5. Funds auto-release to seller

### For Sellers:
1. Receive escrow link from buyer
2. Complete work for milestone
3. Submit for review
4. Get paid when buyer approves
5. Repeat for each milestone

---

## Key Features

✅ **Milestone-based** - Pay in stages
✅ **Automatic release** - No manual transfers
✅ **Dispute protection** - Freeze funds if needed
✅ **Full audit log** - Track every action
✅ **Role-based UI** - Different views for buyer/seller
✅ **Progress tracking** - Visual progress bar
✅ **On-chain verification** - All transactions on Solana Explorer

---

## File Structure

```
lib/escrow.ts                    # Core escrow logic
app/api/escrow/submit/route.ts   # Seller submits work
app/api/escrow/approve/route.ts  # Buyer approves
app/api/escrow/release/route.ts  # Release funds
app/api/escrow/dispute/route.ts  # Raise dispute
app/create/escrow/page.tsx       # Create escrow UI
app/pay/[id]/page.tsx            # Escrow management UI
app/escrow/page.tsx              # Marketing page
supabase-escrow-schema.sql       # Database schema
```

---

## Database Tables

### escrow_contracts
- Stores main escrow details
- Links to payment
- Tracks buyer/seller wallets
- Holds payment wallet keys

### escrow_milestones
- Individual milestones
- Percentage and amount
- Status tracking
- Transaction signatures

### escrow_actions
- Audit log
- Every action recorded
- Actor wallet tracked
- Timestamps

---

## API Endpoints

### POST /api/escrow/submit
Submit milestone for review (seller only)
```json
{
  "milestoneId": "abc123",
  "sellerWallet": "...",
  "notes": "Work completed"
}
```

### POST /api/escrow/approve
Approve milestone (buyer only)
```json
{
  "milestoneId": "abc123",
  "buyerWallet": "...",
  "notes": "Looks good"
}
```

### POST /api/escrow/release
Release funds (automatic after approve)
```json
{
  "milestoneId": "abc123"
}
```

### POST /api/escrow/dispute
Raise dispute (buyer or seller)
```json
{
  "escrowId": "xyz789",
  "milestoneId": "abc123",
  "actorWallet": "...",
  "reason": "Work not as described"
}
```

---

## Testing Checklist

- [ ] Run SQL schema in Supabase
- [ ] Create escrow with 3 milestones
- [ ] Send payment as buyer
- [ ] Verify funds locked (status: "funded")
- [ ] Submit milestone 1 as seller
- [ ] Approve milestone 1 as buyer
- [ ] Verify funds released
- [ ] Check transaction on Solana Explorer
- [ ] Complete remaining milestones
- [ ] Verify escrow marked "completed"
- [ ] Test dispute flow
- [ ] Test with unauthorized wallet
- [ ] Test without wallet connected

---

## Troubleshooting

**Funds not forwarding?**
- Check if payment type is "escrow" - escrow payments don't auto-forward
- Funds stay locked until milestones are approved

**Can't submit milestone?**
- Make sure you're connected as the seller wallet
- Check milestone status is "pending"

**Can't approve milestone?**
- Make sure you're connected as the buyer wallet
- Check milestone status is "work_submitted"

**Transaction failing?**
- Check wallet has enough SOL for transaction fees
- Verify you're on the correct network (devnet/mainnet)

---

## Production Deployment

1. Run SQL schema in production Supabase
2. Update `.env.production` with production RPC URL
3. Test thoroughly on devnet first
4. Deploy to Vercel/production
5. Monitor first few escrows closely

---

## Support

Questions? Check:
- `ESCROW_COMPLETE.md` - Full feature list
- `ESCROW_TODO.md` - Original implementation plan
- `lib/escrow.ts` - Core logic with comments

---

## 🎉 You're Ready!

The escrow system is fully functional. Just run the SQL schema and start testing!
