# Transaction Monitoring Quick Start

## 🚀 Quick Setup

```typescript
import { transactionMonitor, executeWithRetry } from '@/lib/transaction-monitor'
import { Connection } from '@solana/web3.js'

// 1. Initialize (do this once at app startup)
const connection = new Connection(RPC_URL, 'confirmed')
transactionMonitor.initialize(connection)
transactionMonitor.startMonitoring(10000) // Check every 10 seconds
```

## 📊 Common Use Cases

### 1. Execute Transaction with Auto-Retry

```typescript
const result = await executeWithRetry(
  async () => {
    // Your transaction logic
    return await transferSOL(...)
  },
  'release',  // transaction type
  escrowId    // optional escrow ID
)

if (result.success) {
  console.log('Transaction confirmed:', result.signature)
} else {
  console.error('Transaction failed:', result.error)
}
```

### 2. Monitor Specific Transaction

```typescript
import { monitorTransaction } from '@/lib/transaction-monitor'

const result = await monitorTransaction(
  signature,
  'deposit',
  escrowId,
  60000  // timeout in ms
)
```

### 3. Get Transaction Metrics

```typescript
const metrics = transactionMonitor.getMetrics()
console.log(`Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`)
console.log(`Avg Confirmation: ${metrics.averageConfirmationTime}ms`)
console.log(`Failed: ${metrics.failedTransactions}`)
```

### 4. Check for Anomalies

```typescript
const anomalies = transactionMonitor.getAnomalies('high')
if (anomalies.length > 0) {
  console.warn('High severity anomalies detected:', anomalies)
}
```

### 5. Get Escrow Transactions

```typescript
const transactions = transactionMonitor.getTransactionsByEscrow(escrowId)
console.log(`Found ${transactions.length} transactions for escrow`)
```

## 🔌 API Endpoints

### Get Metrics
```bash
GET /api/monitoring/transactions?action=metrics
```

### Get Anomalies
```bash
GET /api/monitoring/transactions?action=anomalies&severity=high
```

### Get Escrow Transactions
```bash
GET /api/monitoring/transactions?action=escrow&escrowId=abc123
```

### Export Data
```bash
GET /api/monitoring/transactions?action=export&format=csv
```

## ⚙️ Configuration

### Retry Settings

```typescript
const config = {
  maxAttempts: 3,           // Max retry attempts
  initialDelayMs: 1000,     // Initial delay (1 second)
  maxDelayMs: 30000,        // Max delay (30 seconds)
  backoffMultiplier: 2,     // Exponential multiplier
  timeoutMs: 60000,         // Timeout per attempt
}

await executeWithRetry(transactionFn, 'release', escrowId, config)
```

### Anomaly Thresholds

Edit `lib/transaction-monitor.ts`:

```typescript
const ANOMALY_THRESHOLDS = {
  slowConfirmationMs: 30000,      // 30 seconds
  highFailureRate: 0.2,           // 20%
  repeatedFailureCount: 3,        // 3 failures
  timeoutThresholdMs: 90000,      // 90 seconds
}
```

## 🎯 Transaction Types

- `deposit` - User deposits into escrow
- `release` - Funds released from escrow
- `refund` - Funds refunded to user
- `swap` - Atomic swap execution
- `admin_action` - Admin-initiated transaction

## 📈 Transaction Statuses

- `pending` - Waiting for confirmation
- `confirmed` - Confirmed on-chain
- `failed` - Transaction failed
- `timeout` - Transaction timed out

## 🚨 Anomaly Types

| Type | Severity | Trigger |
|------|----------|---------|
| Slow Confirmation | Low | > 30 seconds |
| High Failure Rate | Critical | > 20% failures |
| Repeated Failures | High | 3+ same type |
| Unusual Pattern | Critical | All recent failing |

## 🧪 Testing

```bash
# Run simple test
node scripts/test-transaction-monitor-simple.js

# Run full test suite
npx ts-node scripts/verify-transaction-monitoring.ts
```

## 🔍 Debugging

### Check Transaction Status

```typescript
const record = transactionMonitor.getTransaction(txId)
console.log('Status:', record?.status)
console.log('Attempts:', record?.attempts)
console.log('Error:', record?.error)
```

### View All Pending

```typescript
const metrics = transactionMonitor.getMetrics()
console.log('Pending transactions:', metrics.pendingTransactions)
```

### Export for Analysis

```typescript
const data = transactionMonitor.exportTransactions('json')
// Save to file or send to analytics
```

## 💡 Best Practices

1. **Initialize Early**: Set up monitoring at app startup
2. **Use Retry for Critical Ops**: Always retry fund releases/refunds
3. **Monitor Metrics**: Check failure rates regularly
4. **Handle Anomalies**: Set up alerts for critical anomalies
5. **Clean Up**: Periodically clear old records

## 📚 Full Documentation

See [TRANSACTION_MONITORING_GUIDE.md](./TRANSACTION_MONITORING_GUIDE.md) for complete documentation.

## 🆘 Troubleshooting

### High Failure Rate
- Check RPC endpoint health
- Verify wallet balances
- Review transaction parameters

### Slow Confirmations
- Increase priority fees
- Use faster RPC endpoint
- Check network congestion

### Repeated Failures
- Review transaction construction
- Validate wallet addresses
- Check error messages in logs

## 📞 Support

For issues or questions:
1. Check logs: `transactionMonitor.getLogs()`
2. Review anomalies: `transactionMonitor.getAnomalies()`
3. Export data for analysis
4. Check [full documentation](./TRANSACTION_MONITORING_GUIDE.md)
