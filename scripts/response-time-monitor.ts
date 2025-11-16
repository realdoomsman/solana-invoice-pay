#!/usr/bin/env tsx
/**
 * Response Time Monitoring and Analysis
 * 
 * Continuously monitors API response times and identifies patterns
 */

import { performance } from 'perf_hooks';

interface ResponseTimeMetric {
  timestamp: number;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
}

interface EndpointStats {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  responseTimes: number[];
}

class ResponseTimeMonitor {
  private metrics: ResponseTimeMetric[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor(
    private endpoints: Array<{ path: string; method: string; body?: any }>,
    private baseUrl: string = 'http://localhost:3000',
    private intervalMs: number = 1000
  ) {}

  /**
   * Make a request and record metrics
   */
  private async measureRequest(
    endpoint: { path: string; method: string; body?: any }
  ): Promise<ResponseTimeMetric> {
    const startTime = performance.now();
    const url = `${this.baseUrl}${endpoint.path}`;

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
      };

      if (endpoint.body && endpoint.method !== 'GET') {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(url, options);
      const duration = performance.now() - startTime;

      return {
        timestamp: Date.now(),
        endpoint: endpoint.path,
        method: endpoint.method,
        duration,
        statusCode: response.status,
        success: response.ok,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        timestamp: Date.now(),
        endpoint: endpoint.path,
        method: endpoint.method,
        duration,
        statusCode: 0,
        success: false,
      };
    }
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting response time monitoring...');
    console.log(`Monitoring ${this.endpoints.length} endpoints every ${this.intervalMs}ms`);

    this.intervalId = setInterval(async () => {
      for (const endpoint of this.endpoints) {
        const metric = await this.measureRequest(endpoint);
        this.metrics.push(metric);

        // Keep only last 1000 metrics per endpoint
        if (this.metrics.length > this.endpoints.length * 1000) {
          this.metrics = this.metrics.slice(-this.endpoints.length * 1000);
        }
      }
    }, this.intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('Monitoring stopped');
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get statistics for an endpoint
   */
  getEndpointStats(endpoint: string): EndpointStats | null {
    const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) {
      return null;
    }

    const responseTimes = endpointMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulRequests = endpointMetrics.filter(m => m.success).length;

    return {
      endpoint,
      totalRequests: endpointMetrics.length,
      successfulRequests,
      failedRequests: endpointMetrics.length - successfulRequests,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: responseTimes[0],
      maxResponseTime: responseTimes[responseTimes.length - 1],
      p50: this.calculatePercentile(responseTimes, 50),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99),
      responseTimes,
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): EndpointStats[] {
    const uniqueEndpoints = [...new Set(this.metrics.map(m => m.endpoint))];
    return uniqueEndpoints
      .map(endpoint => this.getEndpointStats(endpoint))
      .filter((stats): stats is EndpointStats => stats !== null);
  }

  /**
   * Detect response time anomalies
   */
  detectAnomalies(threshold: number = 2): Array<{ endpoint: string; anomalies: number[] }> {
    const allStats = this.getAllStats();
    const anomalies: Array<{ endpoint: string; anomalies: number[] }> = [];

    for (const stats of allStats) {
      const mean = stats.avgResponseTime;
      const stdDev = Math.sqrt(
        stats.responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
          stats.responseTimes.length
      );

      const anomalyValues = stats.responseTimes.filter(
        time => Math.abs(time - mean) > threshold * stdDev
      );

      if (anomalyValues.length > 0) {
        anomalies.push({
          endpoint: stats.endpoint,
          anomalies: anomalyValues,
        });
      }
    }

    return anomalies;
  }

  /**
   * Print current statistics
   */
  printStats(): void {
    const stats = this.getAllStats();

    console.log('\n' + '='.repeat(60));
    console.log('RESPONSE TIME STATISTICS');
    console.log('='.repeat(60));

    for (const stat of stats) {
      console.log(`\n${stat.endpoint}:`);
      console.log(`  Total Requests: ${stat.totalRequests}`);
      console.log(`  Success Rate: ${((stat.successfulRequests / stat.totalRequests) * 100).toFixed(2)}%`);
      console.log(`  Avg Response: ${stat.avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min/Max: ${stat.minResponseTime.toFixed(2)}ms / ${stat.maxResponseTime.toFixed(2)}ms`);
      console.log(`  P50: ${stat.p50.toFixed(2)}ms`);
      console.log(`  P95: ${stat.p95.toFixed(2)}ms`);
      console.log(`  P99: ${stat.p99.toFixed(2)}ms`);

      // Warning indicators
      if (stat.avgResponseTime > 1000) {
        console.log(`  ⚠️  High average response time`);
      }
      if (stat.p99 > 5000) {
        console.log(`  ⚠️  High P99 latency`);
      }
      if ((stat.failedRequests / stat.totalRequests) > 0.05) {
        console.log(`  ⚠️  High failure rate`);
      }
    }

    // Detect anomalies
    const anomalies = this.detectAnomalies();
    if (anomalies.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('ANOMALIES DETECTED');
      console.log('='.repeat(60));

      for (const { endpoint, anomalies: values } of anomalies) {
        console.log(`\n${endpoint}:`);
        console.log(`  ${values.length} anomalous response times detected`);
        console.log(`  Range: ${Math.min(...values).toFixed(2)}ms - ${Math.max(...values).toFixed(2)}ms`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Export metrics to JSON
   */
  async exportMetrics(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      statistics: this.getAllStats(),
      anomalies: this.detectAnomalies(),
    };

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`\n📊 Metrics exported to: ${filename}`);
  }
}

/**
 * Run continuous monitoring
 */
async function runContinuousMonitoring(durationSeconds: number = 60): Promise<void> {
  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/test-db', method: 'GET' },
    { path: '/api/escrow/list', method: 'POST', body: { wallet: 'test' } },
  ];

  const monitor = new ResponseTimeMonitor(endpoints, 'http://localhost:3000', 2000);

  console.log(`Starting ${durationSeconds}s monitoring session...`);
  console.log('Press Ctrl+C to stop early\n');

  monitor.start();

  // Print stats every 10 seconds
  const statsInterval = setInterval(() => {
    monitor.printStats();
  }, 10000);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    clearInterval(statsInterval);
    monitor.stop();
    monitor.printStats();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await monitor.exportMetrics(`response-time-metrics-${timestamp}.json`);
    
    process.exit(0);
  });

  // Run for specified duration
  await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));

  clearInterval(statsInterval);
  monitor.stop();
  monitor.printStats();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await monitor.exportMetrics(`response-time-metrics-${timestamp}.json`);
}

/**
 * Run baseline response time test
 */
async function runBaselineTest(): Promise<void> {
  console.log('Running baseline response time test...\n');

  const endpoints = [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/test-db', method: 'GET', name: 'Database Connection' },
    { path: '/api/escrow/list', method: 'POST', body: { wallet: 'test' }, name: 'List Escrows' },
  ];

  const iterations = 50;
  const results: Record<string, number[]> = {};

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    results[endpoint.name] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const options: RequestInit = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
        };

        if (endpoint.body && endpoint.method !== 'GET') {
          options.body = JSON.stringify(endpoint.body);
        }

        await fetch(`http://localhost:3000${endpoint.path}`, options);
        const duration = performance.now() - startTime;
        results[endpoint.name].push(duration);
      } catch (error) {
        console.error(`  Error on iteration ${i + 1}:`, error);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('BASELINE RESPONSE TIME RESULTS');
  console.log('='.repeat(60));

  for (const [name, times] of Object.entries(results)) {
    const sorted = times.sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    console.log(`\n${name}:`);
    console.log(`  Iterations: ${sorted.length}`);
    console.log(`  Avg: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${sorted[0].toFixed(2)}ms`);
    console.log(`  Max: ${sorted[sorted.length - 1].toFixed(2)}ms`);
    console.log(`  P50: ${p50.toFixed(2)}ms`);
    console.log(`  P95: ${p95.toFixed(2)}ms`);
    console.log(`  P99: ${p99.toFixed(2)}ms`);

    // Performance assessment
    if (avg < 100) {
      console.log(`  ✓ Excellent performance`);
    } else if (avg < 500) {
      console.log(`  ✓ Good performance`);
    } else if (avg < 1000) {
      console.log(`  ⚡ Acceptable performance`);
    } else {
      console.log(`  ⚠️  Slow performance - optimization needed`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'baseline';

  if (mode === 'continuous') {
    const duration = parseInt(args[1]) || 60;
    runContinuousMonitoring(duration)
      .then(() => {
        console.log('\n✓ Monitoring completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Monitoring failed:', error);
        process.exit(1);
      });
  } else {
    runBaselineTest()
      .then(() => {
        console.log('\n✓ Baseline test completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Baseline test failed:', error);
        process.exit(1);
      });
  }
}

export { ResponseTimeMonitor, runContinuousMonitoring, runBaselineTest };
