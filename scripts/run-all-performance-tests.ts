#!/usr/bin/env tsx
/**
 * Master Performance Test Runner
 * 
 * Runs all performance tests and generates a comprehensive report
 */

import { runPerformanceTests } from './performance-test';
import { runConcurrentTransactionTests } from './concurrent-transaction-test';
import { runBaselineTest } from './response-time-monitor';
import { runBottleneckAnalysis } from './bottleneck-analyzer';

interface TestSuite {
  name: string;
  description: string;
  run: () => Promise<void>;
  enabled: boolean;
}

/**
 * Main test orchestrator
 */
async function runAllPerformanceTests(): Promise<void> {
  console.log('='.repeat(70));
  console.log('COMPLETE ESCROW SYSTEM - PERFORMANCE TEST SUITE');
  console.log('='.repeat(70));
  console.log('\nThis comprehensive test suite will:');
  console.log('  1. Load test API endpoints');
  console.log('  2. Test concurrent transaction handling');
  console.log('  3. Measure baseline response times');
  console.log('  4. Identify system bottlenecks');
  console.log('\n' + '='.repeat(70));

  const testSuites: TestSuite[] = [
    {
      name: 'Baseline Response Time Test',
      description: 'Establishes baseline performance metrics',
      run: runBaselineTest,
      enabled: true,
    },
    {
      name: 'API Load Testing',
      description: 'Tests API endpoints under various load conditions',
      run: runPerformanceTests,
      enabled: true,
    },
    {
      name: 'Concurrent Transaction Testing',
      description: 'Tests system behavior with simultaneous operations',
      run: runConcurrentTransactionTests,
      enabled: true,
    },
    {
      name: 'Bottleneck Analysis',
      description: 'Identifies performance bottlenecks and optimization opportunities',
      run: runBottleneckAnalysis,
      enabled: true,
    },
  ];

  const startTime = Date.now();
  const results: Array<{ name: string; success: boolean; duration: number; error?: string }> = [];

  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    
    if (!suite.enabled) {
      console.log(`\n\n⏭️  Skipping: ${suite.name}`);
      continue;
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`TEST SUITE ${i + 1}/${testSuites.length}: ${suite.name}`);
    console.log(`Description: ${suite.description}`);
    console.log('='.repeat(70));

    const suiteStartTime = Date.now();
    
    try {
      await suite.run();
      const duration = Date.now() - suiteStartTime;
      results.push({ name: suite.name, success: true, duration });
      console.log(`\n✓ ${suite.name} completed in ${(duration / 1000).toFixed(2)}s`);
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ name: suite.name, success: false, duration, error: errorMessage });
      console.error(`\n❌ ${suite.name} failed:`, errorMessage);
    }

    // Pause between test suites
    if (i < testSuites.length - 1) {
      console.log('\n⏸️  Pausing 5 seconds before next test suite...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Generate final summary
  const totalDuration = Date.now() - startTime;
  generateFinalSummary(results, totalDuration);

  // Save summary
  await saveSummary(results, totalDuration);
}

/**
 * Generate final summary report
 */
function generateFinalSummary(
  results: Array<{ name: string; success: boolean; duration: number; error?: string }>,
  totalDuration: number
): void {
  console.log('\n\n' + '='.repeat(70));
  console.log('FINAL PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n📊 Test Suite Results:`);
  console.log(`   Total Suites: ${results.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  console.log(`\n📋 Individual Suite Results:`);
  results.forEach((result, index) => {
    const status = result.success ? '✓' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`   ${index + 1}. ${status} ${result.name} (${duration}s)`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Overall assessment
  console.log(`\n🎯 Overall Assessment:`);
  if (failed === 0) {
    console.log(`   ✓ All performance tests passed successfully`);
    console.log(`   ✓ System is ready for performance optimization based on findings`);
  } else {
    console.log(`   ⚠️  ${failed} test suite(s) failed`);
    console.log(`   ⚠️  Review errors and fix issues before proceeding`);
  }

  console.log(`\n📁 Generated Reports:`);
  console.log(`   - performance-report-*.json`);
  console.log(`   - concurrent-test-report-*.json`);
  console.log(`   - bottleneck-analysis-*.json`);
  console.log(`   - performance-test-summary-*.json`);

  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Review generated JSON reports for detailed metrics`);
  console.log(`   2. Identify critical bottlenecks from bottleneck analysis`);
  console.log(`   3. Implement recommended optimizations`);
  console.log(`   4. Re-run tests to verify improvements`);

  console.log('\n' + '='.repeat(70));
}

/**
 * Save summary to file
 */
async function saveSummary(
  results: Array<{ name: string; success: boolean; duration: number; error?: string }>,
  totalDuration: number
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-test-summary-${timestamp}.json`;

  const summary = {
    timestamp: new Date().toISOString(),
    totalDuration,
    totalSuites: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
    recommendations: generateRecommendations(results),
  };

  try {
    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(summary, null, 2));
    console.log(`\n📊 Summary saved to: ${filename}`);
  } catch (error) {
    console.error('Failed to save summary:', error);
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(
  results: Array<{ name: string; success: boolean; duration: number; error?: string }>
): string[] {
  const recommendations: string[] = [];

  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    recommendations.push('Fix failed test suites before proceeding with optimization');
    failedTests.forEach(test => {
      recommendations.push(`- Investigate and resolve: ${test.name}`);
    });
  }

  const slowTests = results.filter(r => r.success && r.duration > 60000);
  if (slowTests.length > 0) {
    recommendations.push('Some test suites took longer than expected:');
    slowTests.forEach(test => {
      recommendations.push(`- Review ${test.name} for potential issues`);
    });
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests completed successfully');
    recommendations.push('Review individual reports for optimization opportunities');
    recommendations.push('Focus on bottlenecks identified in bottleneck analysis');
    recommendations.push('Implement caching strategies for frequently accessed data');
    recommendations.push('Consider database query optimization based on load test results');
  }

  return recommendations;
}

/**
 * Check if server is running
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
if (require.main === module) {
  console.log('Checking server health...');
  
  checkServerHealth()
    .then(async (isHealthy) => {
      if (!isHealthy) {
        console.error('\n❌ Server is not running or not responding');
        console.error('Please start the development server with: npm run dev');
        console.error('Then run this test suite again\n');
        process.exit(1);
      }

      console.log('✓ Server is healthy\n');
      
      await runAllPerformanceTests();
      
      console.log('\n✓ All performance tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance test suite failed:', error);
      process.exit(1);
    });
}

export { runAllPerformanceTests };
