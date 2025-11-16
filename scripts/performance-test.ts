#!/usr/bin/env tsx
/**
 * Performance Testing Suite for Complete Escrow System
 * 
 * Tests:
 * - API endpoint load testing
 * - Concurrent transaction handling
 * - Response time measurements
 * - Bottleneck identification
 */

import { performance } from 'perf_hooks';

// Configuration
const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  concurrentRequests: [1, 5, 10, 20, 50],
  iterations: 100,
  timeout: 30000,
  endpoints: [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/escrow/list', method: 'POST', name: 'List Escrows', body: { wallet: 'test' } },
    { path: '/api/test-db', method: 'GET', name: 'Database Connection' },
  ],
};

interface TestResult {
  endpoint: string;
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  totalDuration: number;
  errors: string[];
}

interface RequestMetrics {
  duration: number;
  success: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Make a single HTTP request and measure performance
 */
async function makeRequest(
  url: string,
  method: string,
  body?: any
): Promise<RequestMetrics> {
  const startTime = performance.now();
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(CONFIG.timeout),
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    return {
      duration,
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run concurrent requests
 */
async function runConcurrentRequests(
  url: string,
  method: string,
  body: any,
  concurrency: number,
  totalRequests: number
): Promise<RequestMetrics[]> {
  const results: RequestMetrics[] = [];
  const batches = Math.ceil(totalRequests / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
    const promises = Array(batchSize)
      .fill(null)
      .map(() => makeRequest(url, method, body));

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming the server
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  return results;
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Analyze request metrics and generate results
 */
function analyzeMetrics(
  endpoint: string,
  concurrency: number,
  metrics: RequestMetrics[],
  totalDuration: number
): TestResult {
  const successfulRequests = metrics.filter(m => m.success).length;
  const failedRequests = metrics.length - successfulRequests;
  
  const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
  const errors = metrics
    .filter(m => !m.success && m.error)
    .map(m => m.error!)
    .filter((error, index, self) => self.indexOf(error) === index);

  return {
    endpoint,
    concurrency,
    totalRequests: metrics.length,
    successfulRequests,
    failedRequests,
    avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    minResponseTime: durations[0] || 0,
    maxResponseTime: durations[durations.length - 1] || 0,
    p50ResponseTime: calculatePercentile(durations, 50),
    p95ResponseTime: calculatePercentile(durations, 95),
    p99ResponseTime: calculatePercentile(durations, 99),
    requestsPerSecond: (metrics.length / totalDuration) * 1000,
    totalDuration,
    errors,
  };
}

/**
 * Test a single endpoint with varying concurrency levels
 */
async function testEndpoint(
  endpoint: { path: string; method: string; name: string; body?: any }
): Promise<TestResult[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
  console.log('='.repeat(60));

  const results: TestResult[] = [];

  for (const concurrency of CONFIG.concurrentRequests) {
    const url = `${CONFIG.baseUrl}${endpoint.path}`;
    
    console.log(`\nConcurrency: ${concurrency} requests`);
    console.log(`Total requests: ${CONFIG.iterations}`);
    
    const startTime = performance.now();
    const metrics = await runConcurrentRequests(
      url,
      endpoint.method,
      endpoint.body,
      concurrency,
      CONFIG.iterations
    );
    const totalDuration = performance.now() - startTime;

    const result = analyzeMetrics(
      endpoint.name,
      concurrency,
      metrics,
      totalDuration
    );
    results.push(result);

    // Print results
    console.log(`✓ Completed in ${result.totalDuration.toFixed(2)}ms`);
    console.log(`  Success: ${result.successfulRequests}/${result.totalRequests}`);
    console.log(`  Failed: ${result.failedRequests}`);
    console.log(`  Avg Response: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`  P50: ${result.p50ResponseTime.toFixed(2)}ms`);
    console.log(`  P95: ${result.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  P99: ${result.p99ResponseTime.toFixed(2)}ms`);
    console.log(`  Throughput: ${result.requestsPerSecond.toFixed(2)} req/s`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.join(', ')}`);
    }
  }

  return results;
}

/**
 * Generate performance report
 */
function generateReport(allResults: TestResult[]): void {
  console.log('\n\n' + '='.repeat(60));
  console.log('PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));

  // Group by endpoint
  const byEndpoint = allResults.reduce((acc, result) => {
    if (!acc[result.endpoint]) {
      acc[result.endpoint] = [];
    }
    acc[result.endpoint].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  for (const [endpoint, results] of Object.entries(byEndpoint)) {
    console.log(`\n${endpoint}:`);
    console.log('-'.repeat(60));
    
    results.forEach(result => {
      console.log(`  Concurrency ${result.concurrency}:`);
      console.log(`    Throughput: ${result.requestsPerSecond.toFixed(2)} req/s`);
      console.log(`    Avg Response: ${result.avgResponseTime.toFixed(2)}ms`);
      console.log(`    P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
      console.log(`    Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
    });
  }

  // Identify bottlenecks
  console.log('\n' + '='.repeat(60));
  console.log('BOTTLENECK ANALYSIS');
  console.log('='.repeat(60));

  const slowEndpoints = allResults
    .filter(r => r.avgResponseTime > 1000)
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime);

  if (slowEndpoints.length > 0) {
    console.log('\n⚠️  Slow Endpoints (>1000ms avg):');
    slowEndpoints.forEach(result => {
      console.log(`  - ${result.endpoint} @ ${result.concurrency} concurrent: ${result.avgResponseTime.toFixed(2)}ms`);
    });
  } else {
    console.log('\n✓ No slow endpoints detected');
  }

  const highFailureRate = allResults
    .filter(r => (r.failedRequests / r.totalRequests) > 0.05)
    .sort((a, b) => (b.failedRequests / b.totalRequests) - (a.failedRequests / a.totalRequests));

  if (highFailureRate.length > 0) {
    console.log('\n⚠️  High Failure Rate (>5%):');
    highFailureRate.forEach(result => {
      const failureRate = ((result.failedRequests / result.totalRequests) * 100).toFixed(2);
      console.log(`  - ${result.endpoint} @ ${result.concurrency} concurrent: ${failureRate}%`);
    });
  } else {
    console.log('\n✓ No high failure rates detected');
  }

  // Performance degradation under load
  console.log('\n' + '='.repeat(60));
  console.log('LOAD PERFORMANCE');
  console.log('='.repeat(60));

  for (const [endpoint, results] of Object.entries(byEndpoint)) {
    const baseline = results[0]; // Lowest concurrency
    const peak = results[results.length - 1]; // Highest concurrency
    
    const responseTimeDegradation = ((peak.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100;
    const throughputChange = ((peak.requestsPerSecond - baseline.requestsPerSecond) / baseline.requestsPerSecond) * 100;

    console.log(`\n${endpoint}:`);
    console.log(`  Response time change: ${responseTimeDegradation > 0 ? '+' : ''}${responseTimeDegradation.toFixed(2)}%`);
    console.log(`  Throughput change: ${throughputChange > 0 ? '+' : ''}${throughputChange.toFixed(2)}%`);
    
    if (responseTimeDegradation > 200) {
      console.log(`  ⚠️  Significant performance degradation under load`);
    } else if (responseTimeDegradation > 100) {
      console.log(`  ⚡ Moderate performance degradation under load`);
    } else {
      console.log(`  ✓ Good performance under load`);
    }
  }

  // Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(60));

  const recommendations: string[] = [];

  if (slowEndpoints.length > 0) {
    recommendations.push('- Optimize slow endpoints with caching or query optimization');
  }

  if (highFailureRate.length > 0) {
    recommendations.push('- Investigate and fix endpoints with high failure rates');
    recommendations.push('- Consider implementing retry logic and circuit breakers');
  }

  const avgThroughput = allResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / allResults.length;
  if (avgThroughput < 10) {
    recommendations.push('- Low throughput detected - consider horizontal scaling');
  }

  const highP99 = allResults.filter(r => r.p99ResponseTime > 5000);
  if (highP99.length > 0) {
    recommendations.push('- High P99 latency detected - investigate tail latency issues');
  }

  if (recommendations.length > 0) {
    recommendations.forEach(rec => console.log(rec));
  } else {
    console.log('✓ System performance is within acceptable parameters');
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main test runner
 */
async function runPerformanceTests(): Promise<void> {
  console.log('Starting Performance Tests...');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Iterations per test: ${CONFIG.iterations}`);
  console.log(`Concurrency levels: ${CONFIG.concurrentRequests.join(', ')}`);

  const allResults: TestResult[] = [];

  for (const endpoint of CONFIG.endpoints) {
    try {
      const results = await testEndpoint(endpoint);
      allResults.push(...results);
    } catch (error) {
      console.error(`\n❌ Error testing ${endpoint.name}:`, error);
    }
  }

  generateReport(allResults);

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `performance-report-${timestamp}.json`;
  
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(
      reportPath,
      JSON.stringify({ timestamp: new Date().toISOString(), results: allResults }, null, 2)
    );
    console.log(`\n📊 Detailed results saved to: ${reportPath}`);
  } catch (error) {
    console.error('Failed to save report:', error);
  }
}

// Run tests
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('\n✓ Performance tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance tests failed:', error);
      process.exit(1);
    });
}

export { runPerformanceTests, testEndpoint, analyzeMetrics };
