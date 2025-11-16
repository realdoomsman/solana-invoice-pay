# Deposit Tracking System

## Overview

The deposit tracking system monitors and verifies deposits for traditional escrow contracts. It tracks both buyer and seller deposits, verifies transactions on-chain, and automatically updates escrow status when fully funded.

## Features

### 1. Deposit Monitoring
- Track buyer deposit status
- Track seller security deposit status
- Monitor multiple escrows simultaneously
- Real-time deposit verification

### 2. Transaction Verification
- Verify deposits on-chain using Solana RPC
- Confirm transaction signatures
- Validate deposit amounts
- Check recipient addresses

### 3. Status Management
- Update escrow status based on deposits
- Automatic status transitions:
  - `created` → `buyer_deposited` (when buyer deposits)
  - `created` → `seller_deposited` (when seller deposits)
  - `buyer_deposited` or `seller_deposited` → `fully_funded` (when both deposit)
- Support for different escrow types:
  - **Traditional**: Requires both buyer and seller deposits
  - **Simple Buyer**: Requires only buyer deposit
  - **Atomic Swap**: Requires both party deposits

### 4. Notifications
- Notify parties when deposits are received
- Alert when escrow becomes fully funded
- Notify counterparty of deposit activity

## Core Functions

### `monitorEscrowDeposits(escrowId: string)`
Checks the current deposit status of an escrow.

**Returns:**
```typescript
{
  buyerDeposited: boolean
  sellerDeposited: boolean
  fullyFunded: boolean
  deposits: EscrowDeposit[]
}
```

### `recordAndVerifyDeposit(escrowId, depositorWallet, amount, token, txSignature)`
Records a deposit and verifies it on-chain.

**Parameters:**
- `escrowId`: The escrow contract ID
- `depositorWallet`: Wallet address of the depositor
- `amount`: Amount deposited
- `token`: Token type (SOL, USDC, etc.)
- `txSignature`: Transaction signature to verify

**Returns:**
```typescript
{
  success: boolean
  deposit?: EscrowDeposit
  error?: string
}
```

### `getDepositStatus(escrowId: string)`
Gets complete deposit status including amounts and wallet information.

**Returns:**
```typescript
{
  escrow_id: string
  buyer_deposited: boolean
  seller_deposited: boolean
  fully_funded: boolean
  deposits: EscrowDeposit[]
  buyer_amount: number
  seller_amount?: number
  token: string
  escrow_wallet: string
}
```

### `checkAndUpdateFundingStatus(escrowId: string)`
Checks if escrow is fully funded and updates status accordingly.

### `checkEscrowWalletBalance(escrowWallet: string, token: string)`
Checks the on-chain balance of an escrow wallet.

### `verifyDepositTransaction(txSignature, expectedRecipient, expectedAmount, token)`
Verifies a transaction on-chain to confirm it transferred the correct amount to the escrow wallet.

## API Endpoints

### POST `/api/escrow/deposit`
Record a deposit for an escrow.

**Request Body:**
```json
{
  "escrowId": "escrow-123",
  "depositorWallet": "BuyerWallet...",
  "amount": 100,
  "token": "SOL",
  "txSignature": "5x7y9z..."
}
```

**Response:**
```json
{
  "success": true,
  "deposit": {
    "id": "deposit-123",
    "party_role": "buyer",
    "amount": 100,
    "confirmed": true
  },
  "status": {
    "buyer_deposited": true,
    "seller_deposited": false,
    "fully_funded": false
  }
}
```

### GET `/api/escrow/deposit?escrowId=xxx`
Get deposit status for an escrow.

**Response:**
```json
{
  "success": true,
  "escrow_id": "escrow-123",
  "buyer_deposited": true,
  "seller_deposited": false,
  "fully_funded": false,
  "deposits": [...],
  "buyer_amount": 100,
  "seller_amount": 50,
  "token": "SOL",
  "escrow_wallet": "EscrowWallet..."
}
```

## Database Schema

### escrow_deposits Table
```sql
CREATE TABLE escrow_deposits (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  depositor_wallet TEXT NOT NULL,
  party_role TEXT NOT NULL, -- 'buyer' | 'seller'
  amount DECIMAL(20, 9) NOT NULL,
  token TEXT NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_count INTEGER DEFAULT 0,
  deposited_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);
```

### Automatic Triggers
The database includes a trigger that automatically updates escrow status when deposits are confirmed:

```sql
CREATE TRIGGER trigger_check_escrow_funded
AFTER INSERT OR UPDATE ON escrow_deposits
FOR EACH ROW
EXECUTE FUNCTION check_escrow_fully_funded();
```

## Usage Examples

### Frontend: Check Deposit Status
```typescript
const response = await fetch(`/api/escrow/deposit?escrowId=${escrowId}`)
const { status } = await response.json()

if (status.fully_funded) {
  console.log('Escrow is fully funded!')
} else {
  console.log('Waiting for deposits...')
  console.log('Buyer deposited:', status.buyer_deposited)
  console.log('Seller deposited:', status.seller_deposited)
}
```

### Frontend: Record a Deposit
```typescript
// After user sends transaction
const response = await fetch('/api/escrow/deposit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId,
    depositorWallet: wallet.publicKey.toString(),
    amount: 100,
    token: 'SOL',
    txSignature: signature
  })
})

const { success, status } = await response.json()

if (success) {
  console.log('Deposit recorded!')
  if (status.fully_funded) {
    console.log('Escrow is now fully funded!')
  }
}
```

### Backend: Monitor Deposits
```typescript
import { monitorEscrowDeposits } from '@/lib/escrow/deposit-monitor'

// Check deposit status
const status = await monitorEscrowDeposits(escrowId)

if (status.fullyFunded) {
  // Trigger next step in escrow flow
  await activateEscrow(escrowId)
}
```

### Backend: Periodic Monitoring
```typescript
import { checkAndUpdateFundingStatus } from '@/lib/escrow/deposit-monitor'

// Run periodically to check for new deposits
async function monitorPendingEscrows() {
  const pendingEscrows = await getPendingEscrows()
  
  for (const escrow of pendingEscrows) {
    await checkAndUpdateFundingStatus(escrow.id)
  }
}

// Run every minute
setInterval(monitorPendingEscrows, 60000)
```

## Security Considerations

1. **Transaction Verification**: All deposits are verified on-chain before being recorded
2. **Amount Validation**: Deposit amounts are checked against expected amounts
3. **Duplicate Prevention**: Each transaction signature can only be used once
4. **Party Validation**: Only buyer or seller can deposit for their respective roles
5. **Status Integrity**: Status updates are atomic and consistent

## Error Handling

The system handles various error scenarios:

- **Escrow not found**: Returns clear error message
- **Invalid depositor**: Rejects deposits from non-parties
- **Duplicate deposit**: Prevents same party from depositing twice
- **Transaction verification failure**: Rejects invalid or failed transactions
- **Network errors**: Gracefully handles RPC connection issues

## Testing

See `lib/escrow/__tests__/deposit-monitor.test.ts` for comprehensive unit tests covering:
- Deposit monitoring for different escrow types
- Status updates and transitions
- Error handling
- Edge cases

## Integration with Traditional Escrow

The deposit tracking system integrates seamlessly with the traditional escrow flow:

1. **Escrow Creation**: Creates escrow with `status: 'created'`
2. **Buyer Deposits**: Updates to `status: 'buyer_deposited'`
3. **Seller Deposits**: Updates to `status: 'fully_funded'`
4. **Confirmation**: Both parties can confirm once fully funded
5. **Release**: Funds released when both parties confirm

## Future Enhancements

- [ ] Support for SPL token deposit verification
- [ ] Webhook notifications for deposit events
- [ ] Deposit timeout monitoring
- [ ] Partial deposit handling
- [ ] Multi-signature wallet support
- [ ] Gas fee estimation for deposits
- [ ] Deposit receipt generation

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.5**: Track deposit status for both parties
- **Requirement 2.6**: Update escrow status when fully funded
- Automatic status transitions based on deposits
- Real-time monitoring and verification
- Comprehensive error handling
- Database triggers for automatic updates
