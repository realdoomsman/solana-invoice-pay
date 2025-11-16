#!/usr/bin/env tsx
/**
 * Concurrent Transaction Testing
 * 
 * Tests the system's ability to handle multiple simultaneous escrow operations
 */

import { performance } from 'perf_hooks';
import { Keypair } from '@solana/web3.js';

interface TransactionTest {
  name: string;
  operation: () => Promise<any>;
  concurrency: number;
}

interface TransactionResult {
  testName: string;
  concurrency: number;
  totalTransactions: number;
  successful: number;
  failed: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  transactionsPerSecond: number;
  errors: Array<{ error: string; count: number }>;
}

/**
 * Generate test wallet addresses
 */
function generateTestWallets(count: number): string[] {
  return Array(count)
    .fill(null)
    .map(() => Keypair.generate().publicKey.toBase58());
}

/**
 * Simulate escrow creation
 */
async function createEscrowTransaction(
  buyerWallet: string,
  sellerWallet: string,
  amount: number
): Promise<{ success: boolean; duration: number; error?: string }> {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/escrow/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escrowType: 'traditional',
        buyerWallet,
        sellerWallet,
        buyerAmount: amount,
        sellerAmount: amount * 0.1,
        token: 'SOL',
        description: 'Performance test escrow',
        timeoutHours: 24,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        duration,
        error: `HTTP ${response.status}`,
      };
    }

    return { success: true, duration };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simulate deposit monitoring
 */
async function monitorDepositTransaction(
  escrowId: string
): Promise<{ success: boolean; duration: number; error?: string }> {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/escrow/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: 'test-wallet',
        filters: { escrowId },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const duration = performance.now() - startTime;
    
    return {
      success: response.ok,
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run concurrent transactions
 */
async function runConcurrentTransactions(
  testName: string,
  operation: () => Promise<{ success: boolean; duration: number; error?: string }>,
  concurrency: number,
  totalCount: number
): Promise<TransactionResult> {
  console.log(`\nRunning: ${testName}`);
  console.log(`Concurrency: ${concurrency}, Total: ${totalCount}`);

  const results: Array<{ success: boolean; duration: number; error?: string }> = [];
  const batches = Math.ceil(totalCount / concurrency);
  const overallStart = performance.now();

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalCount - batch * concurrency);
    const promises = Array(batchSize)
      .fill(null)
      .map(() => operation());

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Progress indicator
    const progress = ((batch + 1) / batches * 100).toFixed(0);
    process.stdout.write(`\r  Progress: ${progress}%`);
  }

  const overallDuration = performance.now() - overallStart;
  console.log('\r  Progress: 100% ✓');

  // Analyze results
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  
  // Count errors
  const errorCounts = results
    .filter(r => !r.success && r.error)
    .reduce((acc, r) => {
      const error = r.error!;
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const errors = Object.entries(errorCounts).map(([error, count]) => ({
    error,
    count,
  }));

  return {
    testName,
    concurrency,
    totalTransactions: results.length,
    successful,
    failed,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: durations[0] || 0,
    maxDuration: durations[durations.length - 1] || 0,
    transactionsPerSecond: (results.length / overallDuration) * 1000,
    errors,
  };
}

/**
 * Test concurrent escrow creation
 */
async function testConcurrentEscrowCreation(): Promise<TransactionResult[]> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Concurrent Escrow Creation');
  console.log('='.repeat(60));

  const results: TransactionResult[] = [];
  const concurrencyLevels = [1, 5, 10, 20];
  const transactionsPerLevel = 20;

  for (const concurrency of concurrencyLevels) {
    const wallets = generateTestWallets(transactionsPerLevel * 2);
    let walletIndex = 0;

    const result = await runConcurrentTransactions(
      'Escrow Creation',
      async () => {
        const buyer = wallets[walletIndex++];
        const seller = wallets[walletIndex++];
        return createEscrowTransaction(buyer, seller, 1.0);
      },
      concurrency,
      transactionsPerLevel
    );

    results.push(result);
    printResult(result);
  }

  return results;
}

/**
 * Test concurrent deposit monitoring
 */
async function testConcurrentDepositMonitoring(): Promise<TransactionResult[]> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Concurrent Deposit Monitoring');
  console.log('='.repeat(60));

  const results: TransactionResult[] = [];
  const concurrencyLevels = [5, 10, 25, 50];
  const transactionsPerLevel = 50;

  for (const concurrency of concurrencyLevels) {
    const result = await runConcurrentTransactions(
      'Deposit Monitoring',
      async () => monitorDepositTransaction('test-escrow-id'),
      concurrency,
      transactionsPerLevel
    );

    results.push(result);
    printResult(result);
  }

  return results;
}

/**
 * Test database query performance under load
 */
async function testDatabaseQueryLoad(): Promise<TransactionResult[]> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Database Query Load');
  console.log('='.repeat(60));

  const results: TransactionResult[] = [];
  const concurrencyLevels = [10, 25, 50, 100];
  const queriesPerLevel = 100;

  for (const concurrency of concurrencyLevels) {
    const testWallet = Keypair.generate().publicKey.toBase58();

    const result = await runConcurrentTransactions(
      'Database Queries',
      async () => {
        const startTime = performance.now();
        try {
          const response = await fetch('http://localhost:3000/api/escrow/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: testWallet }),
            signal: AbortSignal.timeout(10000),
          });

          const duration = performance.now() - startTime;
          return {
            success: response.ok,
            duration,
            error: response.ok ? undefined : `HTTP ${response.status}`,
          };
        } catch (error) {
          const duration = performance.now() - startTime;
          return {
            success: false,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
      concurrency,
      queriesPerLevel
    );

    results.push(result);
    printResult(result);
  }

  return results;
}

/**
 * Print test result
 */
function printResult(result: TransactionResult): void {
  console.log(`\n  Results:`);
  console.log(`    Success: ${result.successful}/${result.totalTransactions}`);
  console.log(`    Failed: ${result.failed}`);
  console.log(`    Avg Duration: ${result.avgDuration.toFixed(2)}ms`);
  console.log(`    Min/Max: ${result.minDuration.toFixed(2)}ms / ${result.maxDuration.toFixed(2)}ms`);
  console.log(`    Throughput: ${result.transactionsPerSecond.toFixed(2)} tx/s`);
  
  if (result.errors.length > 0) {
    console.log(`    Errors:`);
    result.errors.forEach(({ error, count }) => {
      console.log(`      - ${error}: ${count}`);
    });
  }
}

/**
 * Generate summary report
 */
function generateSummary(allResults: TransactionResult[]): void {
  console.log('\n\n' + '='.repeat(60));
  console.log('CONCURRENT TRANSACTION TEST SUMMARY');
  console.log('='.repeat(60));

  // Group by test name
  const byTest = allResults.reduce((acc, result) => {
    if (!acc[result.testName]) {
      acc[result.testName] = [];
    }
    acc[result.testName].push(result);
    return acc;
  }, {} as Record<string, TransactionResult[]>);

  for (const [testName, results] of Object.entries(byTest)) {
    console.log(`\n${testName}:`);
    console.log('-'.repeat(60));

    const baseline = results[0];
    const peak = results[results.length - 1];

    console.log(`  Baseline (${baseline.concurrency} concurrent):`);
    console.log(`    Throughput: ${baseline.transactionsPerSecond.toFixed(2)} tx/s`);
    console.log(`    Avg Duration: ${baseline.avgDuration.toFixed(2)}ms`);
    console.log(`    Success Rate: ${((baseline.successful / baseline.totalTransactions) * 100).toFixed(2)}%`);

    console.log(`\n  Peak Load (${peak.concurrency} concurrent):`);
    console.log(`    Throughput: ${peak.transactionsPerSecond.toFixed(2)} tx/s`);
    console.log(`    Avg Duration: ${peak.avgDuration.toFixed(2)}ms`);
    console.log(`    Success Rate: ${((peak.successful / peak.totalTransactions) * 100).toFixed(2)}%`);

    const throughputChange = ((peak.transactionsPerSecond - baseline.transactionsPerSecond) / baseline.transactionsPerSecond) * 100;
    const durationChange = ((peak.avgDuration - baseline.avgDuration) / baseline.avgDuration) * 100;

    console.log(`\n  Performance Change:`);
    console.log(`    Throughput: ${throughputChange > 0 ? '+' : ''}${throughputChange.toFixed(2)}%`);
    console.log(`    Duration: ${durationChange > 0 ? '+' : ''}${durationChange.toFixed(2)}%`);

    if (durationChange > 100) {
      console.log(`    ⚠️  Significant performance degradation under load`);
    } else if (durationChange > 50) {
      console.log(`    ⚡ Moderate performance impact under load`);
    } else {
      console.log(`    ✓ Good scalability`);
    }
  }

  // Overall statistics
  console.log('\n' + '='.repeat(60));
  console.log('OVERALL STATISTICS');
  console.log('='.repeat(60));

  const totalTransactions = allResults.reduce((sum, r) => sum + r.totalTransactions, 0);
  const totalSuccessful = allResults.reduce((sum, r) => sum + r.successful, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);
  const avgThroughput = allResults.reduce((sum, r) => sum + r.transactionsPerSecond, 0) / allResults.length;

  console.log(`\n  Total Transactions: ${totalTransactions}`);
  console.log(`  Successful: ${totalSuccessful} (${((totalSuccessful / totalTransactions) * 100).toFixed(2)}%)`);
  console.log(`  Failed: ${totalFailed} (${((totalFailed / totalTransactions) * 100).toFixed(2)}%)`);
  console.log(`  Average Throughput: ${avgThroughput.toFixed(2)} tx/s`);

  console.log('\n' + '='.repeat(60));
}

/**
 * Main test runner
 */
async function runConcurrentTransactionTests(): Promise<void> {
  console.log('Starting Concurrent Transaction Tests...');
  console.log('This will test the system\'s ability to handle multiple simultaneous operations');

  const allResults: TransactionResult[] = [];

  try {
    // Test 1: Concurrent escrow creation
    const escrowResults = await testConcurrentEscrowCreation();
    allResults.push(...escrowResults);

    // Test 2: Concurrent deposit monitoring
    const depositResults = await testConcurrentDepositMonitoring();
    allResults.push(...depositResults);

    // Test 3: Database query load
    const dbResults = await testDatabaseQueryLoad();
    allResults.push(...dbResults);

    // Generate summary
    generateSummary(allResults);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `concurrent-test-report-${timestamp}.json`;
    
    const fs = await import('fs/promises');
    await fs.writeFile(
      reportPath,
      JSON.stringify({ timestamp: new Date().toISOString(), results: allResults }, null, 2)
    );
    console.log(`\n📊 Detailed results saved to: ${reportPath}`);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  runConcurrentTransactionTests()
    .then(() => {
      console.log('\n✓ Concurrent transaction tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

export { runConcurrentTransactionTests, testConcurrentEscrowCreation };
