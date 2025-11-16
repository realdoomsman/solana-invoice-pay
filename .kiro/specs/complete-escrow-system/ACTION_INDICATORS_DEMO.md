# Action Indicators Demo

## Visual Examples

### 1. Action Required - Deposit
```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 Yellow Border + Shadow                                    │
│                                                               │
│ Freelance Project Payment                                    │
│ [Traditional] [Created]                                       │
│                                                               │
│ 100 USDC • 💰 Buyer • Created 2 hours ago                    │
│                                                               │
│ Counterparty: AbC1...XyZ9                                    │
│                                                               │
│                              [💰 Deposit Required] ←Yellow   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Action Required - Milestone Review
```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 Yellow Border + Shadow                                    │
│                                                               │
│ Website Development                                          │
│ [Simple Buyer] [Active]                                      │
│                                                               │
│ 5000 USDC • 💰 Buyer • Created 5 days ago                    │
│                                                               │
│ 2 milestones pending                                         │
│                                                               │
│                    [📋 2 Milestones to Review] ←Yellow       │
└─────────────────────────────────────────────────────────────┘
```

### 3. Disputed Escrow
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 Red Border + Shadow                                       │
│                                                               │
│ NFT Purchase                                                 │
│ [Traditional] [Disputed]                                     │
│                                                               │
│ 50 SOL • 🛠️ Seller • Created 10 days ago                    │
│                                                               │
│ Counterparty: DeF2...WxY8                                    │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ⚠️ Dispute in Progress - Under Admin Review          │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│                        [⚠️ Under Admin Review] ←Red          │
└─────────────────────────────────────────────────────────────┘
```

### 4. Timeout Warning
```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 Yellow Border + Shadow                                    │
│                                                               │
│ Token Swap                                                   │
│ [Atomic Swap] [Buyer Deposited]                              │
│                                                               │
│ 1000 USDC • 💰 Buyer • Created 2 days ago                    │
│                                                               │
│ [🔔 1] [⏰ 18h] [Active]                                     │
│                                                               │
│ Counterparty: GhI3...VwX7                                    │
│                                                               │
│                              [⏰ Expires in 18h] ←Orange     │
└─────────────────────────────────────────────────────────────┘
```

### 5. Completed Escrow
```
┌─────────────────────────────────────────────────────────────┐
│ 🟢 Green Border                                              │
│                                                               │
│ Consulting Services                                          │
│ [Simple Buyer] [Completed]                                   │
│                                                               │
│ 2500 USDC • 🛠️ Seller • Created 30 days ago                 │
│                                                               │
│ [✅ Completed]                                               │
│                                                               │
│ Counterparty: JkL4...UvW6                                    │
└─────────────────────────────────────────────────────────────┘
```

### 6. Multiple Badges
```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 Yellow Border + Shadow                                    │
│                                                               │
│ Design Work                                                  │
│ [Simple Buyer] [Active]                                      │
│                                                               │
│ 3000 USDC • 💰 Buyer • Created 7 days ago                    │
│                                                               │
│ [🔔 3] [⏰ 2d] [📋 Review(2)] [Active]                       │
│                                                               │
│ 2 milestones pending                                         │
│                                                               │
│                    [📋 2 Milestones to Review] ←Yellow       │
└─────────────────────────────────────────────────────────────┘
```

## Badge Types Reference

### Notification Badge
- **Icon**: 🔔
- **Color**: Solid Blue
- **Shows**: Unread notification count
- **Example**: `[🔔 3]`

### Timeout Badges
- **Icon**: ⏰
- **Colors**: 
  - Red: Expired
  - Orange: < 24 hours
  - Blue: < 72 hours
- **Shows**: Time remaining
- **Examples**: 
  - `[⏰ Expired]` (Red)
  - `[⏰ 18h]` (Orange)
  - `[⏰ 2d]` (Blue)

### Action Badges
- **Deposit**: 💰 Yellow
- **Confirm**: ✓ Yellow
- **Review**: 📋 Yellow (with count)

### Status Badges
- **Disputed**: ⚠️ Red
- **Completed**: ✅ Green
- **Pending**: ⏳ Blue (with count)

## Priority System

### High Priority (Shown First)
1. Expired escrows (Red)
2. Disputes (Red)
3. Deposit required (Yellow)
4. Confirmation required (Yellow)
5. Milestone review required (Yellow)
6. Timeout < 24h (Orange)

### Medium Priority
1. Timeout < 72h (Orange)
2. Waiting for counterparty (Blue)

### Low Priority
1. Work in progress (Blue)
2. Completed (Green)
3. Pending milestones (Blue, informational)

## Component Usage

### EscrowActionIndicator
Shows the single most important action:
```tsx
<EscrowActionIndicator
  escrowType="traditional"
  status="fully_funded"
  userRole="buyer"
  buyerDeposited={true}
  sellerDeposited={true}
  buyerConfirmed={false}
  sellerConfirmed={true}
  expiresAt="2024-01-15T12:00:00Z"
/>
// Displays: [✓ Confirmation Required]
```

### EscrowActionBadges
Shows all relevant badges:
```tsx
<EscrowActionBadges
  escrowType="simple_buyer"
  status="active"
  userRole="buyer"
  buyerDeposited={true}
  sellerDeposited={false}
  buyerConfirmed={false}
  sellerConfirmed={false}
  submittedMilestones={2}
  unreadNotifications={3}
  expiresAt="2024-01-15T12:00:00Z"
  showAll={true}
/>
// Displays: [🔔 3] [⏰ 2d] [📋 Review(2)] [Active]
```

## User Experience Flow

1. **User opens dashboard**
   - Sees all escrows with visual indicators
   - Action-required escrows have yellow glow
   - Disputed escrows have red glow

2. **User scans for urgent items**
   - Yellow borders = action needed
   - Red borders = disputes
   - Orange badges = time-sensitive

3. **User clicks on escrow**
   - Navigates to detail page
   - Can take appropriate action

4. **User completes action**
   - Badge updates automatically
   - Border color changes
   - Moves down in priority

## Accessibility

- **Color + Icon**: Not relying on color alone
- **Clear Text**: Action messages are explicit
- **Semantic HTML**: Proper use of spans and divs
- **Keyboard Navigation**: All clickable elements are accessible
- **Screen Readers**: Icons have text equivalents

## Responsive Design

- Badges wrap on smaller screens
- Icons remain visible
- Text truncates appropriately
- Touch targets are adequate (44x44px minimum)
