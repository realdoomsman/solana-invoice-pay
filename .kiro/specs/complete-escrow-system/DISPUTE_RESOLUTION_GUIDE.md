# Dispute Resolution Interface Guide

## Overview

The Dispute Resolution Interface provides admins with a comprehensive tool to review disputes and make final decisions on fund distribution. This interface ensures fair, transparent, and auditable dispute resolution.

## Features

### 1. Resolution Actions

The interface supports four types of resolution actions:

#### Release to Seller
- Releases all escrowed funds to the seller
- Use when: Seller has fulfilled obligations and buyer's dispute is unfounded
- On-chain: Single transaction transferring full amount to seller wallet

#### Refund to Buyer
- Refunds all escrowed funds to the buyer
- Use when: Seller failed to deliver or buyer's complaint is valid
- On-chain: Single transaction transferring full amount to buyer wallet

#### Partial Split
- Divides funds between buyer and seller based on admin decision
- Use when: Both parties share responsibility or partial work was completed
- On-chain: Two transactions (one to buyer, one to seller)
- Features:
  - Configurable split amounts
  - Quick presets (50/50, 75/25 buyer, 75/25 seller)
  - Real-time validation of total amounts
  - Visual feedback on split validity

#### Other (Manual Intervention)
- Records decision without automatic on-chain execution
- Use when: Complex situations requiring manual handling
- Admin must handle fund distribution separately

### 2. Required Resolution Notes

All resolutions require detailed notes (minimum 20 characters) explaining:
- Why this resolution was chosen
- What evidence was considered
- Relevant policies or guidelines applied
- Advice for both parties going forward

This ensures:
- Transparent decision-making
- Audit trail for future reference
- Learning opportunities for parties
- Accountability for admin decisions

### 3. Validation & Safety

The interface includes multiple validation layers:

#### Pre-submission Validation
- Notes must be at least 20 characters
- Partial split amounts cannot be negative
- Split total cannot exceed escrow amount
- At least one party must receive funds in splits

#### Confirmation Dialog
- Shows clear summary of action
- Warns that action is final and irreversible
- Requires explicit confirmation

#### Warning Messages
- Highlights that on-chain transactions execute immediately
- Notes that both parties will be notified
- Reminds that decision is recorded in audit log

### 4. User Experience Features

#### Visual Feedback
- Color-coded action descriptions
- Real-time character count for notes
- Split amount validation with visual indicators
- Processing state with loading spinner

#### Quick Actions
- Preset split ratios for common scenarios
- Auto-calculation of complementary amounts
- Clear action descriptions

#### Accessibility
- Disabled states during processing
- Clear error messages
- Keyboard-friendly inputs
- Screen reader compatible

## Component Usage

### Basic Implementation

```typescript
import DisputeResolutionInterface, { ResolutionData } from '@/components/DisputeResolutionInterface'

function AdminPage() {
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handleResolve = async (resolution: ResolutionData) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/escrow/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolution),
      })
      
      const result = await response.json()
      if (result.success) {
        // Handle success
        setShowModal(false)
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      {showModal && (
        <DisputeResolutionInterface
          dispute={disputeData}
          escrow={escrowData}
          adminWallet={adminWalletAddress}
          onResolve={handleResolve}
          onCancel={() => setShowModal(false)}
          processing={processing}
        />
      )}
    </>
  )
}
```

### Props Interface

```typescript
interface DisputeResolutionInterfaceProps {
  dispute: {
    id: string
    reason: string
    description: string
    party_role: string
    created_at: string
  }
  escrow: {
    id: string
    total_amount: number
    buyer_amount: number
    token: string
    buyer_wallet: string
    seller_wallet: string
  }
  adminWallet: string
  onResolve: (resolution: ResolutionData) => Promise<void>
  onCancel: () => void
  processing?: boolean
}

interface ResolutionData {
  disputeId: string
  escrowId: string
  adminWallet: string
  resolutionAction: 'release_to_seller' | 'refund_to_buyer' | 'partial_split' | 'other'
  notes: string
  amountToBuyer?: number
  amountToSeller?: number
}
```

## API Integration

### Endpoint: POST /api/admin/escrow/resolve

#### Request Body
```json
{
  "disputeId": "dispute_abc123",
  "escrowId": "escrow_xyz789",
  "adminWallet": "AdminWalletAddress...",
  "resolutionAction": "partial_split",
  "notes": "Based on evidence review, seller completed 60% of work. Splitting funds accordingly.",
  "amountToBuyer": 2.0,
  "amountToSeller": 3.0
}
```

#### Response
```json
{
  "success": true,
  "resolution": {
    "dispute_id": "dispute_abc123",
    "escrow_id": "escrow_xyz789",
    "resolution_action": "partial_split",
    "amount_to_buyer": 2.0,
    "amount_to_seller": 3.0,
    "tx_signature_buyer": "BuyerTxSignature...",
    "tx_signature_seller": "SellerTxSignature...",
    "notes": "Based on evidence review..."
  }
}
```

## Best Practices

### Decision Making

1. **Review All Evidence**
   - Check evidence from both parties
   - Review activity timeline
   - Consider milestone completion status

2. **Be Fair and Impartial**
   - Base decisions on evidence, not assumptions
   - Consider both perspectives
   - Apply consistent standards

3. **Document Thoroughly**
   - Provide detailed reasoning in notes
   - Reference specific evidence
   - Explain policy application

4. **Communicate Clearly**
   - Use clear, professional language
   - Avoid ambiguous statements
   - Provide actionable advice

### Common Scenarios

#### Scenario 1: Seller No-Show
- **Action**: Refund to Buyer
- **Notes**: "Seller failed to deliver any work or communicate. Full refund to buyer."

#### Scenario 2: Partial Completion
- **Action**: Partial Split
- **Notes**: "Seller completed 3 of 5 milestones (60%). Splitting funds: 40% to buyer (2 SOL), 60% to seller (3 SOL)."

#### Scenario 3: Buyer Unreasonable
- **Action**: Release to Seller
- **Notes**: "Seller provided all deliverables as specified. Buyer's complaints are not substantiated by evidence. Releasing full payment to seller."

#### Scenario 4: Mutual Misunderstanding
- **Action**: Partial Split (50/50)
- **Notes**: "Both parties had different expectations due to unclear requirements. Splitting funds equally as neither party is fully at fault."

## Security Considerations

### Access Control
- Only verified admin wallets can access interface
- Wallet signature verification required
- Rate limiting on resolution actions

### Audit Trail
- All resolutions recorded in admin_actions table
- Includes admin wallet, timestamp, and full details
- Immutable record for compliance

### Transaction Safety
- Validates escrow wallet balance before execution
- Uses confirmed commitment level
- Retries failed transactions
- Records all transaction signatures

## Troubleshooting

### Common Issues

#### "Split amounts exceed total escrow amount"
- Check that buyer_amount + seller_amount ≤ escrow.buyer_amount
- Use preset buttons to ensure valid splits

#### "Resolution notes must be at least 20 characters"
- Provide detailed explanation of decision
- Include reasoning and evidence references

#### "Transaction failed"
- Check escrow wallet has sufficient balance
- Verify network connectivity
- Check RPC endpoint health
- Review transaction logs

#### "Unauthorized"
- Verify admin wallet is in ADMIN_WALLETS env variable
- Check wallet signature is valid
- Ensure wallet is connected

## Testing

### Manual Testing Checklist

- [ ] Release to seller executes correctly
- [ ] Refund to buyer executes correctly
- [ ] Partial split with valid amounts works
- [ ] Partial split validation catches invalid amounts
- [ ] Notes validation enforces minimum length
- [ ] Confirmation dialog appears before execution
- [ ] Processing state disables inputs
- [ ] Cancel button works correctly
- [ ] Success updates UI and closes modal
- [ ] Error messages display clearly
- [ ] Audit log records resolution
- [ ] Both parties receive notifications

### Test Cases

```typescript
// Test 1: Valid release to seller
{
  resolutionAction: 'release_to_seller',
  notes: 'Seller fulfilled all obligations. Releasing payment.',
  // Should execute single transaction to seller
}

// Test 2: Valid partial split
{
  resolutionAction: 'partial_split',
  notes: 'Partial work completed. Splitting 60/40 in favor of seller.',
  amountToBuyer: 2.0,
  amountToSeller: 3.0,
  // Should execute two transactions
}

// Test 3: Invalid split (exceeds total)
{
  resolutionAction: 'partial_split',
  notes: 'Test invalid split',
  amountToBuyer: 3.0,
  amountToSeller: 3.0,
  // Should show validation error
}

// Test 4: Invalid notes (too short)
{
  resolutionAction: 'refund_to_buyer',
  notes: 'Refund',
  // Should show validation error
}
```

## Future Enhancements

### Planned Features
- [ ] Evidence preview within modal
- [ ] Suggested resolutions based on evidence
- [ ] Resolution templates for common scenarios
- [ ] Multi-admin approval for large amounts
- [ ] Dispute mediation chat
- [ ] Automated resolution for clear-cut cases

### Integration Opportunities
- Email notifications with resolution details
- SMS alerts for high-value resolutions
- Webhook for external systems
- Analytics dashboard for resolution patterns
- Machine learning for resolution suggestions

## Related Documentation

- [Admin Audit Log Guide](./ADMIN_AUDIT_LOG_GUIDE.md)
- [Dispute System Summary](./TASK_6_DISPUTE_SYSTEM_SUMMARY.md)
- [Evidence Submission Guide](../lib/escrow/EVIDENCE_SUBMISSION.md)
- [Security Implementation Guide](./SECURITY_IMPLEMENTATION_GUIDE.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review audit logs for error details
3. Check Solana explorer for transaction status
4. Contact development team with escrow ID and error details
