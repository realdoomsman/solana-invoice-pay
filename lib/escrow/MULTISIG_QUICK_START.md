# Multi-Signature Support - Quick Start

## What is Multi-Sig Support?

Multi-signature (multi-sig) wallets require multiple approvals before executing transactions. This is essential for organizations, DAOs, and teams that need shared control over funds.

## Supported Providers

- **Squads Protocol** (v3 & v4) - Most popular
- **Goki Smart Wallet** - Advanced governance
- **Serum Multisig** - Legacy support

## Quick Usage

### 1. Check if Wallet is Multi-Sig

```typescript
import { detectMultiSigWallet } from '@/lib/escrow/multisig-handler'

const info = await detectMultiSigWallet('wallet_address')

if (info.isMultiSig) {
  console.log(`Multi-sig: ${info.threshold}/${info.totalSigners}`)
}
```

### 2. Display Multi-Sig Status in UI

```tsx
import MultiSigTransactionStatus from '@/components/MultiSigTransactionStatus'

<MultiSigTransactionStatus
  escrowId={escrowId}
  userWallet={userWallet}
  onSignatureAdded={refresh}
/>
```

### 3. Create Multi-Sig Transaction

```typescript
import { createMultiSigTransaction } from '@/lib/escrow/multisig-handler'

const tx = await createMultiSigTransaction(
  escrowId,
  multiSigWallet,
  'squads',
  'transaction_data',
  2 // required signatures
)
```

### 4. Record Signature

```typescript
import { recordMultiSigSignature } from '@/lib/escrow/multisig-handler'

const updated = await recordMultiSigSignature(txId, signerWallet)

if (updated.status === 'ready') {
  // Execute transaction
}
```

## API Endpoints

### Get Pending Transactions
```
GET /api/escrow/multisig/[escrowId]
```

### Sign Transaction
```
POST /api/escrow/multisig/[transactionId]/sign
Body: { signerWallet: "address" }
```

## Transaction Status Flow

```
pending → partially_signed → ready → executed
```

- **pending**: No signatures yet
- **partially_signed**: Some signatures collected
- **ready**: Threshold reached, can execute
- **executed**: Transaction completed

## UI Features

The `MultiSigTransactionStatus` component shows:
- ✅ Signature progress bar
- ✅ Current vs required signatures
- ✅ List of signers
- ✅ Sign button (if authorized)
- ✅ Status badges

## Common Patterns

### Check Both Parties
```typescript
import { checkEscrowMultiSig } from '@/lib/escrow/multisig-handler'

const { buyerIsMultiSig, sellerIsMultiSig } = 
  await checkEscrowMultiSig(buyer, seller)
```

### Validate Threshold
```typescript
import { validateSignatureThreshold } from '@/lib/escrow/multisig-handler'

const { valid, error } = validateSignatureThreshold(2, 3)
```

### Check if Ready
```typescript
import { checkMultiSigReady } from '@/lib/escrow/multisig-handler'

const isReady = await checkMultiSigReady(txId)
```

## Database Setup

Run the schema:
```bash
psql -f supabase-multisig-schema.sql
```

Tables created:
- `escrow_multisig_transactions`
- `escrow_multisig_wallets`
- `escrow_multisig_signatures`

## Security

- ✅ Validates signature threshold (1-20 signers)
- ✅ Prevents duplicate signatures
- ✅ Checks signer authorization
- ✅ Rate limits signature endpoints
- ✅ Logs all signature attempts

## Testing

Run tests:
```bash
npm test lib/escrow/__tests__/multisig-handler.test.ts
```

## Troubleshooting

### Multi-Sig Not Detected
- Verify wallet is actually multi-sig
- Check if provider is supported
- Ensure RPC endpoint is accessible

### Signature Not Recording
- Verify wallet is authorized signer
- Check transaction hasn't been executed
- Ensure wallet hasn't already signed

### Transaction Stuck
- Check if all signers have been notified
- Verify threshold is achievable
- Consider cancelling and recreating

## Example: Complete Flow

```typescript
// 1. Create escrow with multi-sig buyer
const escrow = await createTraditionalEscrow({
  buyerWallet: 'multisig_wallet',
  sellerWallet: 'seller_wallet',
  buyerAmount: 100,
  sellerSecurityDeposit: 10,
  token: 'USDC'
})

// 2. Detect multi-sig
const info = await detectMultiSigWallet(escrow.buyer_wallet)
console.log(`Requires ${info.threshold} signatures`)

// 3. Create multi-sig transaction for confirmation
const tx = await createMultiSigTransaction(
  escrow.id,
  escrow.buyer_wallet,
  'squads',
  'confirmation',
  info.threshold
)

// 4. Signers sign
await recordMultiSigSignature(tx.id, 'signer1')
await recordMultiSigSignature(tx.id, 'signer2')

// 5. Check if ready and execute
if (await checkMultiSigReady(tx.id)) {
  await confirmEscrow(escrow.id, escrow.buyer_wallet)
}
```

## Resources

- Full Guide: `lib/escrow/MULTISIG_SUPPORT_GUIDE.md`
- Code: `lib/escrow/multisig-handler.ts`
- Tests: `lib/escrow/__tests__/multisig-handler.test.ts`
- UI: `components/MultiSigTransactionStatus.tsx`

## Support

For issues:
1. Check this guide
2. Review full documentation
3. Test with devnet wallets
4. Contact development team
