# Performance Testing Quick Start

## Quick Commands

```bash
# Run all performance tests (recommended)
npm run perf:all

# Individual tests
npm run perf:load          # Load testing
npm run perf:concurrent    # Concurrent transactions
npm run perf:baseline      # Baseline metrics
npm run perf:monitor       # Continuous monitoring
npm run perf:bottleneck    # Bottleneck analysis
```

## Before You Start

1. Start the dev server: `npm run dev`
2. Verify health: `curl http://localhost:3000/api/health`

## What Gets Tested

### Load Testing (`perf:load`)
- Tests API endpoints with 1, 5, 10, 20, 50 concurrent requests
- Measures throughput, response times, error rates
- **Duration:** ~2-3 minutes

### Concurrent Transactions (`perf:concurrent`)
- Tests escrow creation, deposit monitoring, database queries
- Simulates real-world concurrent operations
- **Duration:** ~3-5 minutes

### Baseline Test (`perf:baseline`)
- Establishes baseline performance for each endpoint
- 50 iterations per endpoint
- **Duration:** ~1 minute

### Continuous Monitoring (`perf:monitor`)
- Monitors endpoints every 2 seconds
- Detects anomalies and trends
- **Duration:** 60 seconds (or Ctrl+C to stop)

### Bottleneck Analysis (`perf:bottleneck`)
- Identifies slow components
- Provides optimization recommendations
- **Duration:** ~2 minutes

## Understanding Results

### Good Performance ✓
- Avg response time < 100ms
- P95 < 200ms
- Success rate > 99%
- Throughput > 50 req/s

### Needs Attention ⚠️
- Avg response time > 500ms
- P95 > 1000ms
- Success rate < 95%
- Throughput < 10 req/s

## Generated Reports

All tests generate JSON reports with timestamps:
- `performance-report-*.json` - Load test results
- `concurrent-test-report-*.json` - Concurrent test results
- `bottleneck-analysis-*.json` - Bottleneck findings
- `response-time-metrics-*.json` - Monitoring data
- `performance-test-summary-*.json` - Overall summary

## Quick Optimization Checklist

If tests show poor performance:

- [ ] Add database indexes on frequently queried columns
- [ ] Implement caching for repeated queries
- [ ] Optimize complex database queries
- [ ] Increase database connection pool size
- [ ] Add response caching for static data
- [ ] Implement retry logic for failed requests
- [ ] Consider horizontal scaling for high load

## Common Issues

**"Server is not running"**
→ Run `npm run dev` first

**Timeout errors**
→ Check server health and database connectivity

**High memory usage**
→ Run with: `NODE_OPTIONS="--max-old-space-size=4096" npm run perf:all`

## Next Steps

1. Run baseline: `npm run perf:baseline`
2. Run full suite: `npm run perf:all`
3. Review bottleneck report
4. Implement top 3 recommendations
5. Re-run tests to verify improvements

## Performance Targets

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| Health Check | < 50ms | < 100ms |
| Database Query | < 100ms | < 200ms |
| List Escrows | < 200ms | < 500ms |
| Create Escrow | < 500ms | < 1000ms |

## Support

See `PERFORMANCE_TESTING.md` for detailed documentation.
