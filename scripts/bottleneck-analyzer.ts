#!/usr/bin/env tsx
/**
 * Bottleneck Analysis Tool
 * 
 * Identifies performance bottlenecks in the escrow system
 */

import { performance } from 'perf_hooks';

interface BottleneckTest {
  name: string;
  category: 'database' | 'blockchain' | 'api' | 'computation';
  test: () => Promise<{ duration: number; success: boolean; details?: any }>;
}

interface BottleneckResult {
  name: string;
  category: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  iterations: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

/**
 * Test database query performance
 */
async function testDatabaseQuery(): Promise<{ duration: number; success: boolean }> {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/test-db', {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    
    const duration = performance.now() - startTime;
    return { duration, success: response.ok };
  } catch (error) {
    const duration = performance.now() - startTime;
    return { duration, success: false };
  }
}

/**
 * Test escrow list query (complex query with joins)
 */
async function testComplexQuery(): Promise<{ duration: number; success: boolean }> {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/escrow/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: 'test-wallet-address' }),
      signal: AbortSignal.timeout(10000),
    });
    
    const duration = performance.now() - startTime;
    return { duration, success: response.ok };
  } catch (error) {
    const duration = performance.now() - startTime;
    return { duration, success: false };
  }
}

/**
 * Test API endpoint overhead
 */
async function testAPIOverhead(): Promise<{ duration: number; success: boolean }> {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    const duration = performance.now() - startTime;
    return { duration, success: response.ok };
  } catch (error) {
    const duration = performance.now() - startTime;
    return { duration, success: false };
  }
}

/**
 * Test escrow creation (full stack)
 */
async function testEscrowCreation(): Promise<{ duration: number; success: boolean }> {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/escrow/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escrowType: 'traditional',
        buyerWallet: 'test-buyer-wallet',
        sellerWallet: 'test-seller-wallet',
        buyerAmount: 1.0,
        sellerAmount: 0.1,
        token: 'SOL',
        description: 'Bottleneck test',
        timeoutHours: 24,
      }),
      signal: AbortSignal.timeout(15000),
    });
    
    const duration = performance.now() - startTime;
    return { duration, success: response.ok };
  } catch (error) {
    const duration = performance.now() - startTime;
    return { duration, success: false };
  }
}

/**
 * Run a bottleneck test multiple times
 */
async function runBottleneckTest(
  test: BottleneckTest,
  iterations: number = 20
): Promise<BottleneckResult> {
  console.log(`\nTesting: ${test.name}`);
  console.log(`Category: ${test.category}`);
  console.log(`Iterations: ${iterations}`);

  const results: Array<{ duration: number; success: boolean }> = [];

  for (let i = 0; i < iterations; i++) {
    const result = await test.test();
    results.push(result);
    
    // Small delay between iterations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress indicator
    if ((i + 1) % 5 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
    }
  }
  console.log(`\r  Progress: ${iterations}/${iterations} ✓`);

  // Analyze results
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const successCount = results.filter(r => r.success).length;
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical';
  if (avgDuration < 100) {
    severity = 'low';
  } else if (avgDuration < 500) {
    severity = 'medium';
  } else if (avgDuration < 1000) {
    severity = 'high';
  } else {
    severity = 'critical';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (test.category === 'database') {
    if (avgDuration > 500) {
      recommendations.push('Add database indexes on frequently queried columns');
      recommendations.push('Consider implementing query result caching');
      recommendations.push('Review and optimize complex JOIN operations');
    }
    if (avgDuration > 1000) {
      recommendations.push('Consider database connection pooling optimization');
      recommendations.push('Evaluate database server resources (CPU, RAM, IOPS)');
    }
  }

  if (test.category === 'api') {
    if (avgDuration > 200) {
      recommendations.push('Reduce middleware overhead');
      recommendations.push('Implement response caching for static data');
    }
    if (avgDuration > 500) {
      recommendations.push('Consider API gateway or CDN for static responses');
    }
  }

  if (test.category === 'blockchain') {
    if (avgDuration > 1000) {
      recommendations.push('Use faster RPC endpoints or multiple fallbacks');
      recommendations.push('Implement transaction batching where possible');
      recommendations.push('Cache blockchain data that changes infrequently');
    }
  }

  if (test.category === 'computation') {
    if (avgDuration > 500) {
      recommendations.push('Optimize algorithms and data structures');
      recommendations.push('Consider moving heavy computation to background jobs');
      recommendations.push('Implement result caching for expensive operations');
    }
  }

  if (successCount < iterations * 0.95) {
    recommendations.push('High failure rate detected - investigate error causes');
    recommendations.push('Implement retry logic with exponential backoff');
  }

  return {
    name: test.name,
    category: test.category,
    avgDuration,
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    successRate: successCount / iterations,
    iterations,
    severity,
    recommendations,
  };
}

/**
 * Print bottleneck result
 */
function printResult(result: BottleneckResult): void {
  const severityEmoji = {
    low: '✓',
    medium: '⚡',
    high: '⚠️',
    critical: '🔴',
  };

  console.log(`\n  ${severityEmoji[result.severity]} Severity: ${result.severity.toUpperCase()}`);
  console.log(`  Avg Duration: ${result.avgDuration.toFixed(2)}ms`);
  console.log(`  Min/Max: ${result.minDuration.toFixed(2)}ms / ${result.maxDuration.toFixed(2)}ms`);
  console.log(`  Success Rate: ${(result.successRate * 100).toFixed(2)}%`);
  
  if (result.recommendations.length > 0) {
    console.log(`\n  Recommendations:`);
    result.recommendations.forEach(rec => {
      console.log(`    - ${rec}`);
    });
  }
}

/**
 * Generate comprehensive bottleneck report
 */
function generateBottleneckReport(results: BottleneckResult[]): void {
  console.log('\n\n' + '='.repeat(60));
  console.log('BOTTLENECK ANALYSIS REPORT');
  console.log('='.repeat(60));

  // Group by category
  const byCategory = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, BottleneckResult[]>);

  // Print by category
  for (const [category, categoryResults] of Object.entries(byCategory)) {
    console.log(`\n${category.toUpperCase()} BOTTLENECKS:`);
    console.log('-'.repeat(60));

    categoryResults.forEach(result => {
      const severityEmoji = {
        low: '✓',
        medium: '⚡',
        high: '⚠️',
        critical: '🔴',
      };

      console.log(`\n  ${severityEmoji[result.severity]} ${result.name}`);
      console.log(`     Avg: ${result.avgDuration.toFixed(2)}ms | Severity: ${result.severity}`);
    });
  }

  // Critical bottlenecks
  const critical = results.filter(r => r.severity === 'critical' || r.severity === 'high');
  
  if (critical.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('CRITICAL BOTTLENECKS REQUIRING IMMEDIATE ATTENTION');
    console.log('='.repeat(60));

    critical.forEach(result => {
      console.log(`\n🔴 ${result.name} (${result.category})`);
      console.log(`   Average Duration: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`   Impact: ${result.severity.toUpperCase()}`);
      console.log(`\n   Recommended Actions:`);
      result.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    });
  }

  // Performance summary
  console.log('\n' + '='.repeat(60));
  console.log('PERFORMANCE SUMMARY');
  console.log('='.repeat(60));

  const avgOverall = results.reduce((sum, r) => sum + r.avgDuration, 0) / results.length;
  const criticalCount = results.filter(r => r.severity === 'critical').length;
  const highCount = results.filter(r => r.severity === 'high').length;
  const mediumCount = results.filter(r => r.severity === 'medium').length;
  const lowCount = results.filter(r => r.severity === 'low').length;

  console.log(`\n  Overall Average Response Time: ${avgOverall.toFixed(2)}ms`);
  console.log(`\n  Bottleneck Severity Distribution:`);
  console.log(`    🔴 Critical: ${criticalCount}`);
  console.log(`    ⚠️  High: ${highCount}`);
  console.log(`    ⚡ Medium: ${mediumCount}`);
  console.log(`    ✓ Low: ${lowCount}`);

  // Overall assessment
  console.log(`\n  Overall System Assessment:`);
  if (criticalCount > 0) {
    console.log(`    🔴 CRITICAL - Immediate optimization required`);
  } else if (highCount > 2) {
    console.log(`    ⚠️  HIGH - Significant optimization needed`);
  } else if (mediumCount > results.length / 2) {
    console.log(`    ⚡ MEDIUM - Some optimization recommended`);
  } else {
    console.log(`    ✓ GOOD - System performance is acceptable`);
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main bottleneck analysis
 */
async function runBottleneckAnalysis(): Promise<void> {
  console.log('Starting Bottleneck Analysis...');
  console.log('This will identify performance bottlenecks in the system\n');

  const tests: BottleneckTest[] = [
    {
      name: 'API Endpoint Overhead',
      category: 'api',
      test: testAPIOverhead,
    },
    {
      name: 'Simple Database Query',
      category: 'database',
      test: testDatabaseQuery,
    },
    {
      name: 'Complex Database Query (Escrow List)',
      category: 'database',
      test: testComplexQuery,
    },
    {
      name: 'Full Escrow Creation Flow',
      category: 'computation',
      test: testEscrowCreation,
    },
  ];

  const results: BottleneckResult[] = [];

  for (const test of tests) {
    try {
      const result = await runBottleneckTest(test, 20);
      results.push(result);
      printResult(result);
    } catch (error) {
      console.error(`\n❌ Error testing ${test.name}:`, error);
    }
  }

  // Generate comprehensive report
  generateBottleneckReport(results);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `bottleneck-analysis-${timestamp}.json`;
  
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(
      reportPath,
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    );
    console.log(`\n📊 Detailed analysis saved to: ${reportPath}`);
  } catch (error) {
    console.error('Failed to save report:', error);
  }
}

// Run analysis
if (require.main === module) {
  runBottleneckAnalysis()
    .then(() => {
      console.log('\n✓ Bottleneck analysis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { runBottleneckAnalysis, runBottleneckTest };
