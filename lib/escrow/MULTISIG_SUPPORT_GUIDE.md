# Multi-Signature Wallet Support Guide

## Overview

The escrow system supports multi-signature wallets, allowing organizations and teams to require multiple approvals for escrow transactions. This guide covers detection, transaction handling, and UI integration.

## Supported Multi-Sig Providers

### 1. Squads Protocol
- **Program ID (v3)**: `SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu`
- **Program ID (v4)**: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`
- Most popular multi-sig solution on Solana
- Supports M-of-N signature schemes

### 2. Goki Smart Wallet
- **Program ID**: `GokivDYuQXPZCWRkwMhdH2h91KpDQXBEmpgBgs55bnpH`
- Advanced smart wallet with governance features

### 3. Serum Multisig
- **Program ID**: `MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ`
- Legacy multi-sig solution

## Features

### Multi-Sig Detection
- Automatic detection when wallet addresses are provided
- Identifies multi-sig provider (Squads, Goki, Serum)
- Retrieves signature threshold and signer count
- Caches detection results for performance

### Transaction Management
- Creates multi-sig transaction records
- Tracks signature collection progress
- Validates signature thresholds
- Prevents duplicate signatures
- Notifies when ready to execute

### UI Components
- Real-time signature progress display
- Pending signature count
- Signer list with status
- Sign transaction button
- Ready-to-execute indicator

## Usage

### 1. Detect Multi-Sig Wallet

```typescript
import { detectMultiSigWallet } from '@/lib/escrow/multisig-handler'

const walletInfo = await detectMultiSigWallet('wallet_address')

if (walletInfo.isMultiSig) {
  console.log('Multi-sig detected!')
  console.log('Provider:', walletInfo.provider)
  console.log('Threshold:', walletInfo.threshold)
  console.log('Total signers:', walletInfo.totalSigners)
}
```

### 2. Check Escrow Parties

```typescript
import { checkEscrowMultiSig } from '@/lib/escrow/multisig-handler'

const result = await checkEscrowMultiSig(buyerWallet, sellerWallet)

if (result.buyerIsMultiSig) {
  console.log('Buyer is using multi-sig')
  console.log('Info:', result.buyerInfo)
}

if (result.sellerIsMultiSig) {
  console.log('Seller is using multi-sig')
  console.log('Info:', result.sellerInfo)
}
```

### 3. Create Multi-Sig Transaction

```typescript
import { createMultiSigTransaction } from '@/lib/escrow/multisig-handler'

const transaction = await createMultiSigTransaction(
  escrowId,
  multiSigWallet,
  'squads',
  transactionData,
  2 // Required signatures
)

console.log('Transaction created:', transaction.id)
console.log('Status:', transaction.status) // 'pending'
```

### 4. Record Signature

```typescript
import { recordMultiSigSignature } from '@/lib/escrow/multisig-handler'

const updated = await recordMultiSigSignature(
  transactionId,
  signerWallet
)

console.log('Signatures:', updated.current_signatures, '/', updated.required_signatures)
console.log('Status:', updated.status) // 'partially_signed' or 'ready'
```

### 5. Check if Ready

```typescript
import { checkMultiSigReady } from '@/lib/escrow/multisig-handler'

const isReady = await checkMultiSigReady(transactionId)

if (isReady) {
  console.log('Transaction has enough signatures and can be executed')
}
```

## UI Integration

### Display Multi-Sig Status

```tsx
import MultiSigTransactionStatus from '@/components/MultiSigTransactionStatus'

<MultiSigTransactionStatus
  escrowId={escrowId}
  userWallet={userWallet}
  onSignatureAdded={() => {
    // Refresh escrow data
    loadEscrowDetails()
  }}
/>
```

### Show Multi-Sig Badge

```tsx
{walletInfo.isMultiSig && (
  <Badge variant="info">
    Multi-Sig ({walletInfo.threshold}/{walletInfo.totalSigners})
  </Badge>
)}
```

## API Endpoints

### Get Pending Transactions

```
GET /api/escrow/multisig/[escrowId]
```

Response:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "tx_123",
      "escrow_id": "escrow_456",
      "multisig_wallet": "wallet_address",
      "provider": "squads",
      "required_signatures": 2,
      "current_signatures": 1,
      "signed_by": ["signer1"],
      "status": "partially_signed"
    }
  ]
}
```

### Record Signature

```
POST /api/escrow/multisig/[transactionId]/sign
```

Body:
```json
{
  "signerWallet": "wallet_address",
  "signature": "optional_wallet_signature"
}
```

Response:
```json
{
  "success": true,
  "transaction": {
    "id": "tx_123",
    "current_signatures": 2,
    "status": "ready"
  },
  "message": "Signature recorded successfully"
}
```

## Database Schema

### escrow_multisig_transactions

Stores multi-sig transaction records:
- `id`: Unique transaction ID
- `escrow_id`: Associated escrow
- `multisig_wallet`: Multi-sig wallet address
- `provider`: Multi-sig provider (squads, goki, serum)
- `required_signatures`: Number of signatures needed
- `current_signatures`: Number collected so far
- `signed_by`: Array of signer wallets
- `status`: pending, partially_signed, ready, executed, cancelled

### escrow_multisig_wallets

Caches wallet detection results:
- `wallet_address`: Wallet address
- `is_multisig`: Boolean flag
- `provider`: Multi-sig provider
- `threshold`: Signature threshold
- `total_signers`: Total number of signers
- `last_checked_at`: Cache timestamp

## Workflow

### Traditional Escrow with Multi-Sig

1. **Creation**: Escrow created with multi-sig wallet as buyer or seller
2. **Detection**: System detects multi-sig wallet automatically
3. **Deposit**: Multi-sig wallet deposits funds (requires signatures)
4. **Confirmation**: When confirming, creates multi-sig transaction record
5. **Signing**: Each authorized signer signs the transaction
6. **Execution**: When threshold reached, transaction executes
7. **Release**: Funds released according to escrow terms

### Milestone Escrow with Multi-Sig

1. **Approval**: Buyer (multi-sig) approves milestone
2. **Transaction Created**: System creates multi-sig transaction
3. **Signatures Collected**: Signers approve the release
4. **Release**: When ready, funds released to seller

## Security Considerations

### Signature Validation
- Verify wallet signatures when recording approvals
- Prevent duplicate signatures from same wallet
- Validate signature threshold is reasonable (1 ≤ threshold ≤ signers)

### Authorization
- Only authorized signers can sign transactions
- Check wallet is part of multi-sig before allowing signature
- Validate transaction hasn't been executed or cancelled

### Rate Limiting
- Apply rate limits to signature endpoints
- Prevent spam signature attempts
- Monitor for suspicious activity

## Best Practices

### For Users
1. **Verify Signers**: Ensure all signers are trusted parties
2. **Set Appropriate Threshold**: Balance security and convenience
3. **Monitor Progress**: Check signature status regularly
4. **Coordinate**: Communicate with other signers about timing

### For Developers
1. **Cache Detection**: Cache multi-sig detection results
2. **Real-time Updates**: Use WebSocket or polling for status updates
3. **Clear UI**: Show signature progress clearly
4. **Error Handling**: Handle signature failures gracefully
5. **Notifications**: Notify signers when action required

## Limitations

### Current Limitations
- Detection is basic and may not work for all multi-sig implementations
- Signature collection is tracked off-chain
- Actual transaction execution still requires on-chain multi-sig approval
- Limited to known multi-sig providers

### Future Enhancements
- Integration with Squads SDK for better detection
- Support for custom multi-sig programs
- On-chain signature verification
- Automated execution when threshold reached
- Email/SMS notifications for signers

## Troubleshooting

### Multi-Sig Not Detected
- Verify wallet is actually a multi-sig wallet
- Check if provider is supported
- Ensure RPC endpoint is accessible
- Try refreshing detection cache

### Signature Not Recording
- Verify wallet is authorized signer
- Check transaction hasn't been executed
- Ensure wallet hasn't already signed
- Validate signature if provided

### Transaction Stuck
- Check if all signers have been notified
- Verify threshold is achievable
- Consider cancelling and recreating if needed
- Contact support if issue persists

## Examples

### Complete Flow Example

```typescript
// 1. Create escrow with multi-sig buyer
const escrow = await createTraditionalEscrow({
  buyerWallet: 'multisig_wallet_address',
  sellerWallet: 'seller_wallet',
  buyerAmount: 100,
  sellerSecurityDeposit: 10,
  token: 'USDC'
})

// 2. Check if multi-sig
const multiSigInfo = await checkEscrowMultiSig(
  escrow.buyer_wallet,
  escrow.seller_wallet
)

if (multiSigInfo.buyerIsMultiSig) {
  console.log('Buyer is multi-sig, will require', 
    multiSigInfo.buyerInfo?.threshold, 'signatures')
}

// 3. When buyer confirms, create multi-sig transaction
const multiSigTx = await createMultiSigTransaction(
  escrow.id,
  escrow.buyer_wallet,
  'squads',
  'confirmation_data',
  multiSigInfo.buyerInfo?.threshold || 2
)

// 4. Signers sign the transaction
await recordMultiSigSignature(multiSigTx.id, 'signer1_wallet')
await recordMultiSigSignature(multiSigTx.id, 'signer2_wallet')

// 5. Check if ready
const isReady = await checkMultiSigReady(multiSigTx.id)

if (isReady) {
  // Execute the confirmation
  await confirmEscrow(escrow.id, escrow.buyer_wallet)
}
```

## Support

For issues or questions about multi-sig support:
1. Check this guide first
2. Review the code in `lib/escrow/multisig-handler.ts`
3. Test with devnet multi-sig wallets
4. Contact development team if needed
