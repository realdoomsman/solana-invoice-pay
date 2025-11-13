# 🔐 Admin-Controlled Escrow System

## Overview

NOVIQ now acts as a **trusted middleman** for all escrow transactions. Funds are held by NOVIQ and only released after admin review and approval.

---

## How It Works

### 1. Buyer Creates Escrow
- Buyer creates escrow with seller's wallet
- Sets milestones (must total 100%)
- Sends payment to NOVIQ-controlled wallet

### 2. Funds Locked
- Payment goes to wallet controlled by NOVIQ
- Funds are locked until admin releases them
- Neither buyer nor seller can access funds

### 3. Seller Completes Work
- Seller submits milestone as "complete"
- Adds notes about what was delivered
- Status: `work_submitted`

### 4. Buyer Reviews
- Buyer reviews the work
- Can either:
  - **Approve** → Goes to admin review
  - **Dispute** → Goes to admin review with evidence

### 5. Admin Review (YOU)
- You review the milestone
- Check evidence from both parties
- Make final decision:
  - **Release to Seller** → Funds sent to seller
  - **Refund to Buyer** → Funds returned to buyer

---

## Admin Dashboard

### Access
1. Go to `/admin/escrow`
2. Connect your admin wallet
3. See all escrows needing attention

### What You'll See
- **Open Disputes** - Escrows with active disputes
- **Pending Releases** - Buyer approved, waiting for your release
- **Total Value** - Amount of SOL in escrow
- **Priority Queue** - Disputes shown first

### Admin Wallet Setup
Add your wallet address to `.env.local`:
```
NEXT_PUBLIC_ADMIN_WALLET=YourWalletAddressHere
```

---

## Reviewing an Escrow

### Click "Review" on any escrow to see:

1. **Escrow Details**
   - Amount, buyer, seller
   - Creation date, funding status
   - Current status

2. **Milestones**
   - Each milestone with status
   - Seller notes (what they delivered)
   - Buyer notes (their approval/concerns)
   - Action buttons for admin

3. **Evidence** (if dispute)
   - Screenshots, documents, messages
   - Submitted by buyer or seller
   - Timestamps and descriptions

4. **Activity Log**
   - Every action taken
   - Full audit trail
   - Admin actions highlighted

---

## Making Decisions

### Release Funds to Seller
1. Review milestone completion
2. Check buyer approval notes
3. Click "Release X SOL to Seller"
4. Add notes explaining your decision
5. Funds automatically sent to seller
6. Transaction recorded on-chain

### Refund to Buyer
1. Review dispute evidence
2. Determine work not completed
3. Click "Refund to Buyer"
4. Add notes explaining your decision
5. Funds automatically sent back to buyer
6. Escrow marked as cancelled

---

## Dispute Resolution Process

### When Dispute is Raised:
1. **Notification** - Escrow appears in admin queue
2. **Evidence Collection** - Both parties submit proof
3. **Your Review** - Examine all evidence
4. **Decision** - Release or refund
5. **Communication** - Your notes explain the decision

### Evidence Types:
- Screenshots of work/communication
- Documents or files
- Messages between parties
- Any other proof

### Best Practices:
- Review all evidence carefully
- Be fair and impartial
- Document your reasoning
- Communicate clearly
- Act promptly (within 24-48 hours)

---

## Database Tables

### New Tables (run `supabase-escrow-admin-schema.sql`):

1. **escrow_evidence** - Evidence uploads
2. **escrow_admin_actions** - Your actions/decisions
3. **escrow_disputes** - Dispute records
4. **escrow_admin_notes** - Internal notes

### View:
- **admin_escrow_queue** - Dashboard query

---

## API Endpoints

### Admin Routes:
- `GET /api/admin/escrow/queue` - Get all escrows needing review
- `GET /api/admin/escrow/[id]` - Get escrow details
- `POST /api/admin/escrow/release` - Release funds to seller
- `POST /api/admin/escrow/refund` - Refund to buyer

---

## Setup Instructions

### 1. Run SQL Schema
```sql
-- First run the base schema (if not already done)
-- Then run:
supabase-escrow-admin-schema.sql
```

### 2. Set Admin Wallet
Add to `.env.local`:
```
NEXT_PUBLIC_ADMIN_WALLET=your_wallet_address_here
```

### 3. Access Dashboard
- Go to `https://yoursite.com/admin/escrow`
- Connect your admin wallet
- Start reviewing!

---

## Status Flow

```
Buyer pays
  ↓
Funds locked (status: funded)
  ↓
Seller submits work (status: work_submitted)
  ↓
Buyer approves (status: approved) ← ADMIN REVIEW NEEDED
  ↓
Admin releases (status: released) ← FUNDS SENT
```

### With Dispute:
```
Any status
  ↓
Dispute raised (status: disputed)
  ↓
Evidence submitted
  ↓
Admin reviews
  ↓
Admin decides: Release OR Refund
```

---

## Key Differences from Auto-Release

### Before (Automatic):
- Buyer approves → Funds auto-release
- No admin control
- No dispute review

### Now (Manual):
- Buyer approves → **Awaits admin**
- **You control all releases**
- **You review all disputes**
- Full audit trail

---

## Security Features

✅ **Non-custodial** - Funds in escrow wallet, not personal wallets
✅ **Admin-only release** - Only you can release funds
✅ **Full audit log** - Every action recorded
✅ **Evidence system** - Proof from both parties
✅ **On-chain verification** - All transactions on Solana Explorer

---

## Testing Checklist

- [ ] Run both SQL schemas in Supabase
- [ ] Set admin wallet in env
- [ ] Create test escrow
- [ ] Buyer pays
- [ ] Seller submits milestone
- [ ] Buyer approves
- [ ] Check admin dashboard shows it
- [ ] Review escrow details
- [ ] Release funds as admin
- [ ] Verify transaction on explorer
- [ ] Test dispute flow
- [ ] Test refund flow

---

## Support Scenarios

### Scenario 1: Work Completed, Buyer Approved
**Action:** Release funds to seller
**Reasoning:** Both parties agree, work done

### Scenario 2: Work Not Done, Buyer Disputes
**Action:** Refund to buyer
**Reasoning:** Seller didn't deliver, buyer has proof

### Scenario 3: Partial Completion
**Action:** Contact both parties, negotiate
**Options:** 
- Partial release + partial refund
- Request seller complete remaining work
- Full refund if seller agrees

### Scenario 4: Communication Breakdown
**Action:** Review evidence, make fair decision
**Note:** Document reasoning clearly

---

## Admin Responsibilities

1. **Timely Review** - Respond within 24-48 hours
2. **Fair Judgment** - Be impartial, review all evidence
3. **Clear Communication** - Explain decisions in notes
4. **Security** - Keep admin wallet secure
5. **Documentation** - Record reasoning for decisions

---

## 🎉 You're Now the Middleman!

NOVIQ controls all escrow funds and makes final release decisions. This builds trust with users who don't trust each other.

**Questions?** Check the code in:
- `lib/escrow.ts` - Core logic
- `app/admin/escrow/` - Admin UI
- `app/api/admin/escrow/` - Admin API routes
