# Performance Testing Guide

This document describes the comprehensive performance testing suite for the Complete Escrow System.

## Overview

The performance testing suite includes multiple tools to measure, analyze, and optimize system performance:

1. **Load Testing** - Tests API endpoints under various load conditions
2. **Concurrent Transaction Testing** - Tests simultaneous escrow operations
3. **Response Time Monitoring** - Measures and tracks API response times
4. **Bottleneck Analysis** - Identifies performance bottlenecks

## Prerequisites

Before running performance tests:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure the database is properly configured and accessible

3. Verify the server is healthy:
   ```bash
   curl http://localhost:3000/api/health
   ```

## Running Tests

### Run All Performance Tests

Execute the complete test suite (recommended):

```bash
npm run perf:all
```

This will run all test suites in sequence and generate a comprehensive report.

**Duration:** ~5-10 minutes  
**Output:** Multiple JSON reports with detailed metrics

### Individual Test Suites

#### 1. Load Testing

Tests API endpoints with varying concurrency levels:

```bash
npm run perf:load
```

**What it tests:**
- API endpoint throughput
- Response times under load
- Success/failure rates
- Performance degradation patterns

**Metrics:**
- Requests per second
- Average response time
- P50, P95, P99 latency
- Error rates

**Output:** `performance-report-*.json`

#### 2. Concurrent Transaction Testing

Tests the system's ability to handle multiple simultaneous operations:

```bash
npm run perf:concurrent
```

**What it tests:**
- Concurrent escrow creation
- Concurrent deposit monitoring
- Database query performance under load
- Transaction throughput

**Concurrency Levels:** 1, 5, 10, 20, 50, 100 (varies by test)

**Output:** `concurrent-test-report-*.json`

#### 3. Baseline Response Time Test

Establishes baseline performance metrics:

```bash
npm run perf:baseline
```

**What it tests:**
- Single-request response times
- Baseline latency for each endpoint
- Performance consistency

**Iterations:** 50 per endpoint

**Output:** Console output with baseline metrics

#### 4. Continuous Response Time Monitoring

Monitors response times over a period:

```bash
npm run perf:monitor
```

**What it does:**
- Continuously monitors endpoints
- Detects anomalies
- Tracks performance trends

**Duration:** 60 seconds (default)  
**Output:** `response-time-metrics-*.json`

Press `Ctrl+C` to stop monitoring early.

#### 5. Bottleneck Analysis

Identifies performance bottlenecks:

```bash
npm run perf:bottleneck
```

**What it analyzes:**
- API overhead
- Database query performance
- Complex operations
- Full-stack flows

**Output:** `bottleneck-analysis-*.json`

## Understanding Results

### Performance Metrics

#### Response Time Metrics

- **Average (Avg):** Mean response time across all requests
- **P50 (Median):** 50% of requests complete faster than this
- **P95:** 95% of requests complete faster than this
- **P99:** 99% of requests complete faster than this
- **Min/Max:** Fastest and slowest response times

#### Throughput Metrics

- **Requests per Second (req/s):** Number of requests handled per second
- **Transactions per Second (tx/s):** Number of transactions processed per second

#### Success Metrics

- **Success Rate:** Percentage of successful requests
- **Failure Rate:** Percentage of failed requests

### Severity Levels

Bottleneck analysis assigns severity levels:

- **✓ Low:** < 100ms average - Excellent performance
- **⚡ Medium:** 100-500ms average - Good performance
- **⚠️ High:** 500-1000ms average - Needs optimization
- **🔴 Critical:** > 1000ms average - Immediate attention required

## Performance Targets

### Recommended Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| API Response Time (avg) | < 100ms | < 500ms | > 1000ms |
| P95 Latency | < 200ms | < 1000ms | > 2000ms |
| P99 Latency | < 500ms | < 2000ms | > 5000ms |
| Success Rate | > 99.9% | > 99% | < 99% |
| Throughput | > 100 req/s | > 50 req/s | < 10 req/s |

### Endpoint-Specific Targets

| Endpoint | Target Response Time |
|----------|---------------------|
| Health Check | < 50ms |
| Database Connection | < 100ms |
| List Escrows | < 200ms |
| Create Escrow | < 500ms |
| Process Transaction | < 1000ms |

## Interpreting Reports

### Load Test Report

```json
{
  "endpoint": "Health Check",
  "concurrency": 10,
  "totalRequests": 100,
  "successfulRequests": 100,
  "avgResponseTime": 45.23,
  "p95ResponseTime": 78.45,
  "requestsPerSecond": 125.5
}
```

**Analysis:**
- All requests succeeded (100/100)
- Average response time is excellent (< 50ms)
- System handles 125 requests/second at this concurrency
- P95 latency is acceptable

### Bottleneck Report

```json
{
  "name": "Complex Database Query",
  "category": "database",
  "avgDuration": 850.5,
  "severity": "high",
  "recommendations": [
    "Add database indexes on frequently queried columns",
    "Consider implementing query result caching"
  ]
}
```

**Action Items:**
1. Review database schema and add missing indexes
2. Implement caching for this query
3. Re-run tests to verify improvement

## Common Issues and Solutions

### Issue: High Response Times

**Symptoms:**
- Average response time > 1000ms
- P99 latency > 5000ms

**Possible Causes:**
- Database queries not optimized
- Missing database indexes
- No caching implemented
- Network latency to external services

**Solutions:**
1. Add database indexes
2. Implement query result caching
3. Optimize complex queries
4. Use connection pooling

### Issue: Low Throughput

**Symptoms:**
- Requests per second < 10
- System struggles under load

**Possible Causes:**
- Synchronous blocking operations
- Resource constraints (CPU, memory)
- Database connection limits

**Solutions:**
1. Implement async operations
2. Scale server resources
3. Increase database connection pool
4. Add horizontal scaling

### Issue: High Failure Rate

**Symptoms:**
- Success rate < 95%
- Many timeout errors

**Possible Causes:**
- Timeout values too low
- Server overload
- Database connection issues

**Solutions:**
1. Increase timeout values
2. Implement retry logic
3. Add circuit breakers
4. Scale infrastructure

### Issue: Performance Degradation Under Load

**Symptoms:**
- Response time increases significantly with concurrency
- Throughput doesn't scale linearly

**Possible Causes:**
- Resource contention
- Lock contention in database
- Memory leaks

**Solutions:**
1. Optimize database transactions
2. Implement proper connection pooling
3. Profile for memory leaks
4. Add caching layers

## Optimization Workflow

1. **Establish Baseline**
   ```bash
   npm run perf:baseline
   ```

2. **Run Full Test Suite**
   ```bash
   npm run perf:all
   ```

3. **Identify Bottlenecks**
   - Review bottleneck analysis report
   - Focus on critical and high severity issues

4. **Implement Optimizations**
   - Add database indexes
   - Implement caching
   - Optimize queries
   - Improve algorithms

5. **Verify Improvements**
   ```bash
   npm run perf:all
   ```

6. **Compare Results**
   - Compare before/after metrics
   - Ensure improvements are significant
   - Check for regressions

7. **Iterate**
   - Continue optimizing until targets are met
   - Focus on highest impact improvements first

## Best Practices

### Before Testing

1. **Consistent Environment**
   - Use the same hardware for all tests
   - Close unnecessary applications
   - Ensure stable network connection

2. **Clean State**
   - Clear caches before testing
   - Restart server between major test runs
   - Use consistent test data

3. **Realistic Conditions**
   - Test with production-like data volumes
   - Use realistic concurrency levels
   - Include typical user workflows

### During Testing

1. **Monitor Resources**
   - Watch CPU usage
   - Monitor memory consumption
   - Check database connections

2. **Document Conditions**
   - Record server specifications
   - Note any unusual conditions
   - Save all test outputs

3. **Avoid Interference**
   - Don't run other intensive tasks
   - Avoid network-heavy operations
   - Keep system load minimal

### After Testing

1. **Analyze Thoroughly**
   - Review all generated reports
   - Look for patterns and trends
   - Identify root causes

2. **Prioritize Issues**
   - Focus on critical bottlenecks first
   - Consider impact vs. effort
   - Address high-frequency issues

3. **Document Findings**
   - Record baseline metrics
   - Document optimizations made
   - Track improvement over time

## Continuous Performance Testing

### Integration with CI/CD

Add performance tests to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Performance Tests
  run: |
    npm run dev &
    sleep 10
    npm run perf:baseline
    npm run perf:load
```

### Regular Monitoring

Schedule regular performance tests:

- **Daily:** Baseline tests to catch regressions
- **Weekly:** Full test suite for comprehensive analysis
- **Before Releases:** Complete performance validation

### Performance Budgets

Set and enforce performance budgets:

```javascript
// Example performance budget
const PERFORMANCE_BUDGET = {
  healthCheck: { maxAvg: 50, maxP95: 100 },
  listEscrows: { maxAvg: 200, maxP95: 500 },
  createEscrow: { maxAvg: 500, maxP95: 1000 },
};
```

## Troubleshooting

### Tests Fail to Start

**Error:** "Server is not running or not responding"

**Solution:**
```bash
# Start the development server
npm run dev

# In another terminal, run tests
npm run perf:all
```

### Timeout Errors

**Error:** "AbortError: The operation was aborted"

**Solution:**
- Increase timeout values in test scripts
- Check server health
- Verify database connectivity

### Out of Memory

**Error:** "JavaScript heap out of memory"

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run perf:all
```

## Additional Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Database Query Optimization](https://supabase.com/docs/guides/database/query-optimization)

## Support

For issues or questions about performance testing:

1. Check this documentation
2. Review generated reports for recommendations
3. Consult the development team
4. File an issue with test results attached
