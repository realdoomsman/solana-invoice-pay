# Logging and Alerting System Guide

## Overview

The escrow system includes a comprehensive logging and alerting infrastructure that tracks all sensitive operations, monitors system health, and provides real-time alerts for critical events.

## Features

### 1. Structured Logging

All logs include:
- **Timestamp**: ISO 8601 format
- **Level**: debug, info, warn, error, critical
- **Category**: security, transaction, escrow, rpc, database, auth, admin, system
- **Message**: Human-readable description
- **Data**: Structured metadata
- **Context**: User ID, wallet address, escrow ID, transaction ID, IP address

### 2. Security Event Tracking

Tracks security-related events:
- Unauthorized access attempts
- Invalid signatures
- Rate limit violations
- Suspicious activity
- Private key access
- Admin actions

### 3. RPC Health Monitoring

Monitors Solana RPC endpoints:
- Availability checks
- Latency measurement
- Error rate tracking
- Automatic failover
- Success rate calculation

### 4. Error Rate Tracking

Tracks and alerts on:
- Error frequency by category
- Error rate per minute
- Consecutive failures
- Error patterns

### 5. Audit Trail

Logs all sensitive operations:
- Private key access
- Admin dispute resolutions
- Fund releases
- Escrow modifications

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logging'

// Different log levels
logger.debug('system', 'Debug information', { details: 'value' })
logger.info('escrow', 'Escrow created', { escrowId: '123' })
logger.warn('transaction', 'Transaction delayed', { txId: 'abc' })
logger.error('database', 'Query failed', { error: 'timeout' })
logger.critical('security', 'Security breach detected', { severity: 'high' })
```

### Security Event Logging

```typescript
import { logSecurityEvent } from '@/lib/logging'

logSecurityEvent({
  type: 'unauthorized_access',
  severity: 'high',
  description: 'Invalid wallet signature',
  walletAddress: 'wallet123',
  ipAddress: '192.168.1.1',
  metadata: {
    endpoint: '/api/escrow/release',
    attemptedAction: 'release_funds',
  },
})
```

### Sensitive Operation Logging

```typescript
import { logAdminAction, logKeyAccess } from '@/lib/logging'

// Log admin actions
logAdminAction(
  'resolve_dispute',
  'AdminWallet123',
  'escrow_456',
  {
    decision: 'release_to_seller',
    reason: 'Evidence supports seller',
  }
)

// Log private key access
logKeyAccess('escrow_789', 'system', 'sign_release_transaction')
```

### Escrow-Specific Logging

```typescript
import {
  logEscrowCreated,
  logEscrowDeposit,
  logEscrowRelease,
  logDisputeRaised,
} from '@/lib/logging'

// Log escrow creation
logEscrowCreated('escrow_123', 'traditional', 'BuyerWallet', 1.5)

// Log deposits
logEscrowDeposit('escrow_123', 'BuyerWallet', 1.5, 'SOL')

// Log fund release
logEscrowRelease('escrow_123', 'SellerWallet', 1.5, 'txSignature123')

// Log disputes
logDisputeRaised('escrow_123', 'BuyerWallet', 'Product not as described')
```

### RPC Health Monitoring

```typescript
import { rpcMonitor } from '@/lib/rpc-monitor'

// Get system health
const health = rpcMonitor.getSystemHealth()
console.log(`Status: ${health.status}`)
console.log(`Healthy Endpoints: ${health.healthyEndpoints}/${health.totalEndpoints}`)

// Get active connection
const connection = rpcMonitor.getConnection()

// Force health check
await rpcMonitor.forceHealthCheck()

// Get detailed endpoint health
const endpoints = rpcMonitor.getHealthStatus()
endpoints.forEach(endpoint => {
  console.log(`${endpoint.name}: ${endpoint.isHealthy ? 'Healthy' : 'Unhealthy'}`)
  console.log(`Latency: ${endpoint.latency}ms`)
  console.log(`Success Rate: ${endpoint.successRate * 100}%`)
})
```

### Querying Logs

```typescript
import { logger } from '@/lib/logging'

// Get all logs
const allLogs = logger.getLogs()

// Filter by level
const errorLogs = logger.getLogs({ level: 'error' })

// Filter by category
const securityLogs = logger.getLogs({ category: 'security' })

// Filter by time range
const recentLogs = logger.getLogs({
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-02T00:00:00Z',
})

// Filter by wallet or escrow
const walletLogs = logger.getLogs({ walletAddress: 'wallet123' })
const escrowLogs = logger.getLogs({ escrowId: 'escrow_456' })
```

### Error Metrics

```typescript
import { logger } from '@/lib/logging'

// Get all error metrics
const metrics = logger.getErrorMetrics()

// Get metrics for specific category
const txMetrics = logger.getErrorMetrics('transaction')

metrics.forEach(metric => {
  console.log(`${metric.category}:${metric.errorType}`)
  console.log(`Count: ${metric.count}`)
  console.log(`Rate: ${metric.rate} errors/min`)
  console.log(`Last: ${metric.lastOccurrence}`)
})
```

### Exporting Logs

```typescript
import { logger } from '@/lib/logging'

// Export as JSON
const jsonLogs = logger.exportLogs('json')

// Export as CSV
const csvLogs = logger.exportLogs('csv')

// Save to file
import fs from 'fs'
fs.writeFileSync('logs.json', jsonLogs)
fs.writeFileSync('logs.csv', csvLogs)
```

## API Endpoints

### Health Check Endpoint

```bash
# Public health check
GET /api/monitoring/health

# Admin health check (includes error metrics and security events)
GET /api/monitoring/health
Authorization: Bearer YOUR_ADMIN_API_KEY
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "components": {
    "rpc": {
      "status": "healthy",
      "activeEndpoint": "https://api.mainnet-beta.solana.com",
      "healthyEndpoints": 3,
      "totalEndpoints": 4,
      "averageLatency": 245.5,
      "endpoints": [...]
    },
    "database": {
      "status": "healthy",
      "latency": 45
    }
  },
  "errorMetrics": [...],
  "securityEvents": [...]
}
```

### Logs Query Endpoint

```bash
# Query logs (admin only)
GET /api/monitoring/logs?level=error&category=security&format=json
Authorization: Bearer YOUR_ADMIN_API_KEY

# Export logs as CSV
GET /api/monitoring/logs?format=csv
Authorization: Bearer YOUR_ADMIN_API_KEY
```

## Alert Configuration

### Alert Thresholds

Configure in `lib/logging.ts`:

```typescript
private alertThresholds = {
  errorRate: 10,              // errors per minute
  rpcLatency: 2000,           // milliseconds
  securityEventsPerHour: 50,  // security events per hour
}
```

### Alert Destinations

Configure alert webhook in environment variables:

```bash
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Alerts are triggered for:
- Critical log level events
- High error rates
- RPC endpoint failures
- Excessive security events
- System health degradation

## Environment Variables

```bash
# Required
ESCROW_ENCRYPTION_KEY=your-encryption-key

# Optional
ADMIN_API_KEY=your-admin-api-key
ALERT_WEBHOOK_URL=https://your-alert-webhook
SOLANA_RPC_FALLBACK_URL=https://fallback-rpc-url
```

## Best Practices

### 1. Use Appropriate Log Levels

- **debug**: Development information, verbose details
- **info**: Normal operations, state changes
- **warn**: Unexpected but handled situations
- **error**: Errors that need attention
- **critical**: System failures, security breaches

### 2. Include Context

Always include relevant context:
```typescript
logger.error('transaction', 'Transaction failed', {
  escrowId: 'escrow_123',
  walletAddress: 'wallet_abc',
  error: error.message,
  txSignature: 'sig_xyz',
})
```

### 3. Log Security Events

Always log security-related events:
- Authentication failures
- Authorization violations
- Rate limit hits
- Suspicious patterns

### 4. Monitor RPC Health

Start RPC monitoring in production:
```typescript
import { rpcMonitor } from '@/lib/rpc-monitor'

if (process.env.NODE_ENV === 'production') {
  rpcMonitor.startMonitoring()
}
```

### 5. Regular Log Maintenance

Clear old logs periodically:
```typescript
// Clear logs older than 24 hours
logger.clearOldLogs(24)
```

## Monitoring Dashboard

Access monitoring data through:

1. **Health Check API**: `/api/monitoring/health`
2. **Logs API**: `/api/monitoring/logs`
3. **Console Output**: Color-coded logs in development
4. **External Services**: Integration with Datadog, Logtail, etc.

## Troubleshooting

### High Error Rates

If error rate alerts trigger:
1. Check error metrics: `logger.getErrorMetrics()`
2. Review recent error logs: `logger.getLogs({ level: 'error' })`
3. Identify patterns in error types
4. Check RPC health: `rpcMonitor.getSystemHealth()`

### RPC Issues

If RPC endpoints are unhealthy:
1. Check endpoint status: `rpcMonitor.getHealthStatus()`
2. Review RPC logs: `logger.getLogs({ category: 'rpc' })`
3. Verify network connectivity
4. Check RPC provider status pages

### Security Alerts

If security events spike:
1. Review security events: `logger.getSecurityEvents()`
2. Check for patterns (IP addresses, wallets)
3. Review audit trail for sensitive operations
4. Consider rate limiting or blocking

## Integration Examples

### With Express/Next.js Middleware

```typescript
import { logger } from '@/lib/logging'

export function loggingMiddleware(req, res, next) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('system', 'Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    })
  })
  
  next()
}
```

### With Error Boundaries

```typescript
import { logger } from '@/lib/logging'

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logger.error('system', 'React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }
}
```

## Compliance and Audit

The logging system supports compliance requirements:

- **Audit Trail**: All sensitive operations logged
- **Immutable Logs**: Logs stored with timestamps
- **Access Control**: Admin-only log access
- **Data Retention**: Configurable log retention
- **Export Capability**: JSON/CSV export for audits

## Performance Considerations

- Logs are stored in memory (configurable limit)
- Old logs automatically pruned
- Async logging to external services
- Minimal performance impact
- Efficient filtering and querying

## Support

For issues or questions:
1. Check logs: `logger.getLogs()`
2. Review health status: `/api/monitoring/health`
3. Export logs for analysis
4. Contact system administrators
