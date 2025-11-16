# Transaction Monitoring System Guide

## Overview

The Transaction Monitoring System provides comprehensive tracking, monitoring, and retry capabilities for all blockchain transactions in the escrow system. It automatically detects failures, tracks confirmation times, identifies anomalies, and implements intelligent retry logic.

## Features

### 1. **Automatic Transaction Tracking**
- All transactions are automatically registered and monitored
- Real-time status updates (pending, confirmed, failed, timeout)
- Confirmation time tracking
- Transaction metadata storage

### 2. **Failure Detection & Retry Logic**
- Automatic detection of failed transactions
- Exponential backoff retry mechanism
- Configurable retry attempts and delays
- Smart timeout handling

### 3. **Anomaly Detection**
- Slow confirmation detection
- High failure rate alerts
- Repeated failure patterns
- Unusual transaction patterns

### 4. **Metrics & Analytics**
- Success/failure rates
- Average confirmation times
- Transaction volume tracking
- Performance metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Transaction Signer                          │
│  (transferSOL, transferSPLToken, transferToMultiple)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Transaction Monitor                             │
│  - Register transaction                                      │
│  - Monitor status                                            │
│  - Detect anomalies                                          │
│  - Calculate metrics                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Logging    │ │  Alerts  │ │   Database   │
│   System     │ │  System  │ │   Storage    │
└──────────────┘ └──────────┘ └──────────────┘
```

## Usage

### Basic Transaction Monitoring

```typescript
import { transactionMonitor, monitorTransaction } from '@/lib/transaction-monitor'
import { Connection } from '@solana/web3.js'

// Initialize the monitor
const connection = new Connection(RPC_URL, 'confirmed')
transactionMonitor.initialize(connection)

// Start automatic monitoring (checks every 10 seconds)
transactionMonitor.startMonitoring(10000)

// Monitor a specific transaction
const result = await monitorTransaction(
  signature,
  'deposit',
  escrowId,
  60000 // timeout in ms
)

if (result.success) {
  console.log('Transaction confirmed:', result.record)
} else {
  console.error('Transaction failed:', result.error)
}
```

### Transaction with Automatic Retry

```typescript
import { executeWithRetry } from '@/lib/transaction-monitor'

// Execute transaction with automatic retry on failure
const result = await executeWithRetry(
  async () => {
    // Your transaction logic here
    return await sendTransaction(...)
  },
  'release', // transaction type
  escrowId,
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    timeoutMs: 60000,
  }
)

if (result.success) {
  console.log('Transaction successful:', result.signature)
} else {
  console.error('Transaction failed after retries:', result.error)
}
```

### Manual Transaction Registration

```typescript
// Register a transaction for monitoring
const txId = transactionMonitor.registerTransaction(
  signature,
  'swap',
  escrowId,
  {
    from: buyerWallet,
    to: sellerWallet,
    amount: 100,
    token: 'USDC',
  }
)

// Check status later
const record = await transactionMonitor.checkTransactionStatus(txId)
console.log('Status:', record?.status)
```

### Getting Metrics

```typescript
// Get overall metrics
const metrics = transactionMonitor.getMetrics()
console.log('Success rate:', (metrics.successRate * 100).toFixed(1) + '%')
console.log('Average confirmation time:', metrics.averageConfirmationTime + 'ms')
console.log('Failed transactions:', metrics.failedTransactions)

// Get transactions for specific escrow
const escrowTxs = transactionMonitor.getTransactionsByEscrow(escrowId)
console.log('Escrow transactions:', escrowTxs.length)

// Get anomalies
const anomalies = transactionMonitor.getAnomalies('high')
console.log('High severity anomalies:', anomalies.length)
```

## API Endpoints

### GET /api/monitoring/transactions

Get transaction monitoring data.

**Query Parameters:**
- `action`: Type of data to retrieve
  - `metrics`: Get overall metrics
  - `transaction`: Get specific transaction (requires `id`)
  - `escrow`: Get transactions for escrow (requires `escrowId`)
  - `anomalies`: Get detected anomalies (optional `severity`)
  - `export`: Export transaction data (optional `format=json|csv`)

**Examples:**

```bash
# Get metrics
curl http://localhost:3000/api/monitoring/transactions?action=metrics

# Get specific transaction
curl http://localhost:3000/api/monitoring/transactions?action=transaction&id=abc123

# Get escrow transactions
curl http://localhost:3000/api/monitoring/transactions?action=escrow&escrowId=escrow_123

# Get anomalies
curl http://localhost:3000/api/monitoring/transactions?action=anomalies&severity=high

# Export as CSV
curl http://localhost:3000/api/monitoring/transactions?action=export&format=csv
```

### POST /api/monitoring/transactions

Perform transaction monitoring operations.

**Actions:**
- `check`: Check transaction status
- `register`: Register new transaction
- `cleanup`: Clear old records

**Examples:**

```bash
# Check transaction status
curl -X POST http://localhost:3000/api/monitoring/transactions \
  -H "Content-Type: application/json" \
  -d '{"action": "check", "id": "tx_123"}'

# Register transaction
curl -X POST http://localhost:3000/api/monitoring/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register",
    "signature": "5x...",
    "type": "deposit",
    "escrowId": "escrow_123",
    "metadata": {"amount": 100, "token": "SOL"}
  }'

# Cleanup old records
curl -X POST http://localhost:3000/api/monitoring/transactions \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup", "hours": 24}'
```

## Configuration

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: number        // Maximum retry attempts (default: 3)
  initialDelayMs: number     // Initial delay before first retry (default: 1000ms)
  maxDelayMs: number         // Maximum delay between retries (default: 30000ms)
  backoffMultiplier: number  // Exponential backoff multiplier (default: 2)
  timeoutMs: number          // Timeout for each attempt (default: 60000ms)
}
```

### Anomaly Thresholds

```typescript
const ANOMALY_THRESHOLDS = {
  slowConfirmationMs: 30000,      // 30 seconds
  highFailureRate: 0.2,           // 20%
  repeatedFailureCount: 3,        // 3 consecutive failures
  timeoutThresholdMs: 90000,      // 90 seconds
}
```

## Transaction Types

The system tracks different transaction types:

- `deposit`: User deposits into escrow
- `release`: Funds released from escrow
- `refund`: Funds refunded to user
- `swap`: Atomic swap execution
- `admin_action`: Admin-initiated transaction

## Transaction Status

Transactions can have the following statuses:

- `pending`: Transaction submitted, waiting for confirmation
- `confirmed`: Transaction confirmed on-chain
- `failed`: Transaction failed (error occurred)
- `timeout`: Transaction timed out (not found on-chain)

## Anomaly Types

The system detects various anomaly types:

### 1. Slow Confirmation
- **Trigger**: Transaction takes longer than 30 seconds to confirm
- **Severity**: Low
- **Action**: Log warning, continue monitoring

### 2. High Failure Rate
- **Trigger**: More than 20% of transactions failing
- **Severity**: Critical
- **Action**: Alert administrators, investigate RPC issues

### 3. Repeated Failures
- **Trigger**: Same transaction type failing 3+ times
- **Severity**: High
- **Action**: Alert, check transaction logic

### 4. Unusual Pattern
- **Trigger**: All recent transactions failing
- **Severity**: Critical
- **Action**: Alert, possible system-wide issue

## Integration with Existing Systems

### Transaction Signer Integration

The transaction monitor is automatically integrated with the transaction signer:

```typescript
// In transaction-signer.ts
import { transactionMonitor } from '@/lib/transaction-monitor'

export async function transferSOL(...) {
  // ... transaction logic ...
  
  // Automatically register for monitoring
  transactionMonitor.registerTransaction(signature, 'release', escrowId, {
    from: fromWallet,
    to: toWallet,
    amount: amountSOL,
    token: 'SOL',
  })
  
  return signature
}
```

### Logging Integration

All transaction events are logged through the centralized logging system:

```typescript
import { logger } from '@/lib/logging'

// Transaction confirmed
logger.info('transaction', 'Transaction confirmed', {
  id: record.id,
  signature: record.signature,
  confirmationTime,
  escrowId: record.escrowId,
})

// Transaction failed
logger.error('transaction', 'Transaction failed', {
  id: record.id,
  signature: record.signature,
  error: record.error,
  escrowId: record.escrowId,
})
```

## Best Practices

### 1. Initialize Early
Initialize the transaction monitor when your application starts:

```typescript
// In app initialization
import { transactionMonitor } from '@/lib/transaction-monitor'
import { Connection } from '@solana/web3.js'

const connection = new Connection(RPC_URL, 'confirmed')
transactionMonitor.initialize(connection)
transactionMonitor.startMonitoring()
```

### 2. Use Retry for Critical Transactions
For important transactions (fund releases, refunds), always use retry logic:

```typescript
const result = await executeWithRetry(
  () => transferSOL(...),
  'release',
  escrowId
)
```

### 3. Monitor Metrics Regularly
Set up periodic checks of transaction metrics:

```typescript
setInterval(() => {
  const metrics = transactionMonitor.getMetrics()
  if (metrics.failureRate > 0.1) {
    // Alert if failure rate exceeds 10%
    alertAdmins('High transaction failure rate')
  }
}, 60000) // Check every minute
```

### 4. Handle Anomalies
Implement handlers for detected anomalies:

```typescript
const anomalies = transactionMonitor.getAnomalies('critical')
for (const anomaly of anomalies) {
  // Send alert to monitoring service
  sendAlert({
    type: anomaly.type,
    severity: anomaly.severity,
    description: anomaly.description,
  })
}
```

### 5. Clean Up Regularly
Periodically clean up old transaction records:

```typescript
// Clean up daily
setInterval(() => {
  transactionMonitor.clearOldRecords(24) // Keep last 24 hours
}, 24 * 60 * 60 * 1000)
```

## Troubleshooting

### High Failure Rate

**Symptoms**: Many transactions failing

**Possible Causes**:
- RPC endpoint issues
- Network congestion
- Insufficient funds in escrow wallets
- Invalid transaction parameters

**Solutions**:
1. Check RPC health: `GET /api/monitoring/health`
2. Review failed transaction errors
3. Verify wallet balances
4. Check Solana network status

### Slow Confirmations

**Symptoms**: Transactions taking long to confirm

**Possible Causes**:
- Network congestion
- Low priority fees
- RPC endpoint latency

**Solutions**:
1. Increase transaction priority fees
2. Use faster RPC endpoint
3. Implement transaction acceleration

### Repeated Failures

**Symptoms**: Same transaction failing multiple times

**Possible Causes**:
- Logic error in transaction construction
- Invalid wallet addresses
- Token account issues

**Solutions**:
1. Review transaction construction code
2. Validate wallet addresses
3. Check token account existence
4. Review error messages in logs

## Testing

Run the verification script to test the monitoring system:

```bash
npx ts-node scripts/verify-transaction-monitoring.ts
```

This will test:
- Transaction registration
- Status monitoring
- Retry logic
- Anomaly detection
- Metrics calculation
- Data export
- Cleanup functionality

## Monitoring Dashboard

Consider building a dashboard to visualize:
- Real-time transaction metrics
- Success/failure rates over time
- Average confirmation times
- Active anomalies
- Transaction volume by type

## Future Enhancements

Potential improvements:
1. **Predictive Analytics**: ML-based failure prediction
2. **Auto-scaling**: Adjust retry parameters based on network conditions
3. **Advanced Alerting**: Integration with PagerDuty, Slack, etc.
4. **Transaction Acceleration**: Automatic fee bumping for stuck transactions
5. **Historical Analysis**: Long-term trend analysis and reporting

## Related Documentation

- [Logging System Guide](./LOGGING_GUIDE.md)
- [RPC Monitoring](./rpc-monitor.ts)
- [Transaction Signer](./escrow/transaction-signer.ts)
- [Security Implementation](../.kiro/specs/complete-escrow-system/SECURITY_IMPLEMENTATION_GUIDE.md)
