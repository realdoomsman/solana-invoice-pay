# Escrow Dashboard User Guide

## Accessing the Dashboard

Navigate to `/escrow/dashboard` to view all your escrow contracts.

**Requirements:**
- Wallet must be connected
- User must be a party (buyer or seller) in at least one escrow

## Dashboard Overview

### Stats Section
Four key metrics displayed at the top:
- **Total Escrows:** All escrows you're involved in
- **Active:** Escrows currently in progress (fully_funded or active status)
- **Action Required:** Escrows waiting for your action
- **Completed:** Successfully completed escrows

### Filters and Sorting

#### Status Filter
- **All Statuses:** Show everything
- **Created:** Newly created, awaiting deposits
- **Active:** Fully funded and in progress
- **Completed:** Successfully finished
- **Disputed:** Under admin review

#### Type Filter
- **All Types:** Show all escrow types
- **Traditional:** Both parties deposit funds
- **Simple Buyer:** Milestone-based payments
- **Atomic Swap:** Trustless token exchanges

#### Sorting
- **By Date:** Most recent first (default) or oldest first
- **By Amount:** Highest to lowest or vice versa
- **By Status:** Alphabetical order

Toggle sort order with the ↑/↓ button.

## Understanding Escrow Cards

### Card Layout
Each escrow card displays:
1. **Title:** Description or "Escrow Contract"
2. **Type Badge:** Visual indicator of escrow type
3. **Amount:** Total escrow amount and token
4. **Role:** Your role (💰 Buyer or 🛠️ Seller)
5. **Created Date:** How long ago it was created
6. **Status Badge:** Current escrow status
7. **Counterparty:** Other party's wallet address (truncated)

### Visual Indicators

#### Badges
- **Blue Badge (Number):** Unread notifications
- **Orange Badge (Clock):** Timeout warning
  - "Expires in Xh" - Less than 24 hours remaining
  - "Expired" - Past the timeout period
- **Green Checkmark:** Completed successfully

#### Action Required Badge (Yellow)
Shows when you need to take action:
- "Deposit Required" - You need to deposit funds
- "Confirmation Required" - You need to confirm completion
- "X Milestone(s) to Review" - Work submitted for your approval

#### Dispute Alert (Red)
Red banner appears for disputed escrows:
- "Dispute in Progress - Under Admin Review"

#### Border Colors
- **Yellow Border:** Action required from you
- **Red Border:** Escrow is disputed
- **Slate Border:** No immediate action needed

### Milestone Information
For Simple Buyer escrows, you'll see:
- "X milestone(s) pending" - Milestones not yet completed

## Taking Action

Click any escrow card to:
1. View full details
2. See activity timeline
3. Take required actions (deposit, confirm, approve, etc.)
4. Submit evidence for disputes
5. View transaction signatures

## Common Scenarios

### As a Buyer

#### Traditional Escrow
1. **Created:** Deposit your payment amount
2. **Fully Funded:** Wait for seller to deliver
3. **Active:** Confirm receipt to release funds

#### Simple Buyer Escrow
1. **Created:** Deposit full amount
2. **Active:** Review and approve submitted work
3. **Milestone Released:** Funds released incrementally

#### Atomic Swap
1. **Created:** Deposit your asset
2. **Fully Funded:** Swap executes automatically

### As a Seller

#### Traditional Escrow
1. **Created:** Deposit security deposit
2. **Fully Funded:** Deliver goods/services
3. **Active:** Confirm completion to receive payment

#### Simple Buyer Escrow
1. **Active:** Complete work and submit for approval
2. **Work Submitted:** Wait for buyer approval
3. **Approved:** Receive milestone payment

#### Atomic Swap
1. **Created:** Deposit your asset
2. **Fully Funded:** Swap executes automatically

## Timeout Warnings

Escrows have timeout periods to prevent indefinite locks:

### Warning Stages
- **24+ hours:** No warning shown
- **< 24 hours:** Orange badge with countdown
- **Expired:** Orange badge showing "Expired"

### What Happens on Timeout
- Escrow escalates to admin review
- Admin decides on fund distribution
- You may lose funds if you failed to act

### Avoiding Timeouts
- Check dashboard regularly
- Act on yellow "Action Required" badges
- Enable browser notifications (if available)

## Dispute Handling

### When Disputes Occur
1. Red border appears on escrow card
2. Red alert banner shows "Under Admin Review"
3. Automatic releases are frozen
4. Both parties can submit evidence

### Your Actions
1. Click escrow to view details
2. Submit evidence supporting your case
3. Wait for admin resolution
4. Funds distributed per admin decision

## Empty States

### No Escrows
- Shows empty state with icon
- "Create Escrow" button to get started

### No Filtered Results
- Shows "No escrows match your filters"
- "Clear Filters" button to reset

## Tips for Best Experience

1. **Check Regularly:** Visit dashboard daily for active escrows
2. **Use Filters:** Focus on action-required items
3. **Sort by Date:** See newest escrows first
4. **Watch Timeouts:** Act before orange badges appear
5. **Read Notifications:** Blue badges indicate updates
6. **Document Everything:** For disputes, evidence matters

## Mobile Usage

Dashboard is fully responsive:
- Stats stack vertically
- Filters collapse on small screens
- Cards remain readable
- All actions accessible

## Keyboard Navigation

- **Tab:** Move between elements
- **Enter:** Click focused escrow card
- **Arrow Keys:** Navigate dropdowns

## Troubleshooting

### Dashboard Won't Load
- Ensure wallet is connected
- Check network connection
- Refresh the page
- Check browser console for errors

### Escrows Not Showing
- Verify you're using correct wallet
- Check if escrows exist in database
- Try clearing filters
- Refresh the page

### Action Badge Not Appearing
- Verify escrow status is correct
- Check if you've already taken action
- Refresh to get latest data

### Timeout Warning Not Showing
- Check if expires_at is set
- Verify current time vs expiry
- Refresh to update countdown

## Support

For issues or questions:
1. Check escrow detail page for more info
2. Review activity timeline
3. Contact admin if disputed
4. Check transaction signatures on Solana Explorer
