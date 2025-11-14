# 🔒 How NOVIQ Escrow Works

## Complete Escrow Flow

### 1. **Create Escrow** 
**Who:** Buyer or Seller  
**Where:** `/create/escrow`

- Set total amount and token (SOL/USDC/USDT)
- Add buyer and seller wallet addresses
- Define milestones with descriptions and percentages
- Milestones must total 100%

**Example:**
```
Project: Website Development - 5 SOL
Milestone 1: Design mockups (20%) - 1 SOL
Milestone 2: Frontend development (40%) - 2 SOL
Milestone 3: Backend & deployment (40%) - 2 SOL
```

---

### 2. **Fund Escrow**
**Who:** Buyer  
**Where:** `/pay/{id}`

- Buyer sends funds to escrow wallet
- Funds are held in a secure middleman wallet
- Once funded, escrow status changes to "funded"
- Automatically redirects to escrow management page

---

### 3. **Work on Milestone**
**Who:** Seller  
**Where:** `/escrow/{id}`

- Seller completes the work for current milestone
- When ready, clicks "Submit Work"
- Adds notes describing what was completed
- Milestone status changes to "work_submitted"

---

### 4. **Review & Approve**
**Who:** Buyer  
**Where:** `/escrow/{id}`

Buyer has 2 options:

#### Option A: ✅ **Approve & Release**
- Reviews the submitted work
- Clicks "Approve & Release Funds"
- Funds automatically transfer from escrow to seller
- Transaction happens on-chain (Solana)
- Milestone status changes to "released"
- Move to next milestone

#### Option B: ⚠️ **Raise Dispute**
- If work is unsatisfactory
- Clicks "Raise Dispute"
- Explains the issue
- Escrow is frozen (no auto-release)
- Admin is notified for review

---

### 5. **Dispute Resolution** (if needed)
**Who:** Admin  
**Where:** `/admin/escrow/{id}`

Admin reviews evidence from both parties:
- Seller's submitted work and notes
- Buyer's dispute reason
- Any additional evidence

Admin can:
- **Release to Seller** - If work is acceptable
- **Refund to Buyer** - If work is inadequate
- **Partial Release** - Split the funds

---

### 6. **Complete Escrow**
**When:** All milestones are released  
**Result:** 
- Escrow status changes to "completed"
- Both parties can see full activity log
- Transaction history is on-chain

---

## Key Features

### 🔐 **Security**
- Funds held in escrow wallet (not by platform)
- Private keys encrypted
- All releases are on-chain transactions
- Transparent activity log

### ⚡ **Automatic Release**
- Buyer approves → Funds release immediately
- No manual intervention needed
- Fast Solana transactions (seconds)

### 🛡️ **Dispute Protection**
- Either party can raise disputes
- Disputes block automatic release
- Admin reviews and makes fair decision
- Evidence can be submitted

### 📊 **Transparency**
- Full activity timeline
- All actions logged
- On-chain transaction proofs
- Status updates in real-time

### 💰 **Milestone-Based**
- Break large projects into phases
- Release funds incrementally
- Reduces risk for both parties
- Flexible percentage splits

---

## User Roles

### 👤 **Buyer** (Payer)
Can:
- Create escrow
- Fund escrow
- Approve milestones
- Raise disputes
- View activity log

### 🛠️ **Seller** (Receiver)
Can:
- Submit work for milestones
- Add notes about completed work
- Raise disputes
- View activity log
- Receive released funds

### 👨‍⚖️ **Admin**
Can:
- View all disputed escrows
- Review evidence
- Release funds to seller
- Refund to buyer
- Resolve disputes

### 👀 **Observer**
Anyone with the link can:
- View escrow status
- See milestone progress
- Read activity log
- Cannot take actions

---

## Status Flow

```
created → funded → active → completed
                      ↓
                  disputed → resolved → completed
```

### Milestone Statuses:
- **pending** - Waiting for seller to submit work
- **work_submitted** - Seller submitted, waiting for buyer approval
- **approved** - Buyer approved, ready for release
- **released** - Funds sent to seller (on-chain)
- **disputed** - Issue raised, admin review needed

---

## Example Scenarios

### ✅ **Happy Path**
1. Buyer creates escrow for 10 SOL website project
2. Buyer funds the escrow
3. Seller completes design (Milestone 1 - 30%)
4. Seller submits work with screenshots
5. Buyer reviews and approves
6. 3 SOL automatically released to seller
7. Repeat for remaining milestones
8. Project completed, all funds released

### ⚠️ **Dispute Path**
1. Buyer creates escrow for 5 SOL logo design
2. Buyer funds the escrow
3. Seller submits logo design
4. Buyer is unhappy with quality
5. Buyer raises dispute with explanation
6. Admin reviews both sides
7. Admin decides: partial release (2.5 SOL to seller, 2.5 SOL refund to buyer)
8. Both parties receive funds per admin decision

### 🔄 **Multi-Milestone Path**
1. Buyer creates escrow for 20 SOL app development
2. Milestones: Planning (10%), Development (60%), Testing (20%), Deployment (10%)
3. Buyer funds 20 SOL
4. Seller completes each milestone sequentially
5. Buyer approves each one after review
6. Funds release incrementally: 2 SOL, 12 SOL, 4 SOL, 2 SOL
7. Project completed over 2 months

---

## Technical Details

### On-Chain Transactions
- All fund releases are Solana transactions
- Viewable on Solana Explorer
- Immutable proof of payment
- Fast confirmation (seconds)

### Escrow Wallet
- Unique wallet generated per escrow
- Private key encrypted and stored
- Only accessible for approved releases
- Non-custodial (platform doesn't control)

### Database Tracking
- Supabase stores escrow metadata
- Milestone statuses and notes
- Activity log for audit trail
- Dispute records and evidence

---

## Fees

- **Platform Fee:** 3% of total amount
- **Network Fee:** ~$0.0003 per transaction (Solana)
- **No Hidden Fees:** What you see is what you pay

---

## Best Practices

### For Buyers:
✅ Define clear milestone descriptions  
✅ Review work promptly  
✅ Communicate issues before disputing  
✅ Keep evidence of requirements  

### For Sellers:
✅ Submit detailed work notes  
✅ Include proof of completion  
✅ Meet milestone requirements  
✅ Communicate progress regularly  

### For Both:
✅ Use escrow for any transaction with strangers  
✅ Break large projects into milestones  
✅ Document everything  
✅ Communicate clearly  

---

## FAQ

**Q: What if the seller never submits work?**  
A: Buyer can raise a dispute. Admin will review and likely refund the buyer.

**Q: What if the buyer never approves?**  
A: Seller can raise a dispute. Admin will review the work and make a decision.

**Q: Can I cancel an escrow?**  
A: Before funding, yes. After funding, only through dispute resolution.

**Q: How long does dispute resolution take?**  
A: Typically 24-48 hours. Admin reviews evidence from both parties.

**Q: Are funds safe in escrow?**  
A: Yes. Funds are on-chain in a dedicated wallet. Platform cannot access without proper authorization.

**Q: Can I add more milestones later?**  
A: Not currently. Define all milestones upfront.

**Q: What tokens are supported?**  
A: SOL, USDC, and USDT on Solana.

---

## Support

Need help? 
- Check the activity log for status updates
- Review milestone descriptions carefully
- Contact admin if you need to dispute
- All transactions are on-chain and verifiable

**NOVIQ Escrow: Trust through transparency** 🔒✨
