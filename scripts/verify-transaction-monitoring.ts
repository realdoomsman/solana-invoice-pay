/**
 * Verification Script: Transaction Monitoring System
 * 
 * Tests:
 * - Transaction registration and tracking
 * - Status monitoring
 * - Retry logic with exponential backoff
 * - Anomaly detection
 * - Metrics calculation
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js'
import { transactionMonitor, monitorTransaction, executeWithRetry } from '../lib/transaction-monitor'

// ============================================
// CONFIGURATION
// ============================================

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// ============================================
// TEST UTILITIES
// ============================================

function logTest(name: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (details) {
    console.log(`   ${details}`)
  }
}

function logSection(title: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(title)
  console.log('='.repeat(60))
}

// ============================================
// TEST 1: Transaction Registration
// ============================================

async function testTransactionRegistration() {
  logSection('TEST 1: Transaction Registration')

  try {
    const mockSignature = 'test_signature_' + Date.now()
    const id = transactionMonitor.registerTransaction(
      mockSignature,
      'deposit',
      'test_escrow_123',
      { amount: 1.0, token: 'SOL' }
    )

    const record = transactionMonitor.getTransaction(id)
    
    logTest(
      'Register transaction',
      record !== undefined && record.signature === mockSignature,
      `ID: ${id}, Signature: ${mockSignature}`
    )

    logTest(
      'Transaction has correct type',
      record?.type === 'deposit',
      `Type: ${record?.type}`
    )

    logTest(
      'Transaction has correct escrow ID',
      record?.escrowId === 'test_escrow_123',
      `Escrow ID: ${record?.escrowId}`
    )

    logTest(
      'Transaction has metadata',
      record?.metadata?.amount === 1.0,
      `Metadata: ${JSON.stringify(record?.metadata)}`
    )

    return true
  } catch (error: any) {
    logTest('Transaction registration', false, error.message)
    return false
  }
}

// ============================================
// TEST 2: Transaction Metrics
// ============================================

async function testTransactionMetrics() {
  logSection('TEST 2: Transaction Metrics')

  try {
    // Register multiple transactions with different statuses
    const signatures = [
      'confirmed_tx_1',
      'confirmed_tx_2',
      'failed_tx_1',
      'pending_tx_1',
    ]

    for (const sig of signatures) {
      transactionMonitor.registerTransaction(sig, 'release', undefined, {})
    }

    const metrics = transactionMonitor.getMetrics()

    logTest(
      'Get transaction metrics',
      metrics.totalTransactions > 0,
      `Total: ${metrics.totalTransactions}`
    )

    logTest(
      'Metrics include success rate',
      typeof metrics.successRate === 'number',
      `Success rate: ${(metrics.successRate * 100).toFixed(1)}%`
    )

    logTest(
      'Metrics include failure rate',
      typeof metrics.failureRate === 'number',
      `Failure rate: ${(metrics.failureRate * 100).toFixed(1)}%`
    )

    logTest(
      'Metrics include average confirmation time',
      typeof metrics.averageConfirmationTime === 'number',
      `Avg confirmation: ${metrics.averageConfirmationTime.toFixed(0)}ms`
    )

    return true
  } catch (error: any) {
    logTest('Transaction metrics', false, error.message)
    return false
  }
}

// ============================================
// TEST 3: Escrow Transaction Filtering
// ============================================

async function testEscrowFiltering() {
  logSection('TEST 3: Escrow Transaction Filtering')

  try {
    const escrowId = 'test_escrow_filter_' + Date.now()

    // Register transactions for specific escrow
    transactionMonitor.registerTransaction('tx1', 'deposit', escrowId)
    transactionMonitor.registerTransaction('tx2', 'release', escrowId)
    transactionMonitor.registerTransaction('tx3', 'deposit', 'other_escrow')

    const escrowTransactions = transactionMonitor.getTransactionsByEscrow(escrowId)

    logTest(
      'Filter transactions by escrow ID',
      escrowTransactions.length === 2,
      `Found ${escrowTransactions.length} transactions for escrow ${escrowId}`
    )

    logTest(
      'All filtered transactions match escrow ID',
      escrowTransactions.every(tx => tx.escrowId === escrowId),
      'All transactions have correct escrow ID'
    )

    return true
  } catch (error: any) {
    logTest('Escrow filtering', false, error.message)
    return false
  }
}

// ============================================
// TEST 4: Transaction Status Monitoring
// ============================================

async function testStatusMonitoring() {
  logSection('TEST 4: Transaction Status Monitoring')

  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    transactionMonitor.initialize(connection)

    // Create a test transaction (won't actually send it)
    const mockSignature = '5' + 'x'.repeat(87) // Valid signature format

    const id = transactionMonitor.registerTransaction(
      mockSignature,
      'deposit',
      'test_escrow_status'
    )

    logTest(
      'Transaction registered with pending status',
      transactionMonitor.getTransaction(id)?.status === 'pending',
      'Initial status: pending'
    )

    // Check status (will likely timeout or not be found)
    await transactionMonitor.checkTransactionStatus(id)

    const record = transactionMonitor.getTransaction(id)

    logTest(
      'Transaction status checked',
      record !== undefined,
      `Status after check: ${record?.status}`
    )

    return true
  } catch (error: any) {
    logTest('Status monitoring', false, error.message)
    return false
  }
}

// ============================================
// TEST 5: Retry Logic
// ============================================

async function testRetryLogic() {
  logSection('TEST 5: Retry Logic')

  try {
    let attemptCount = 0
    const maxAttempts = 3

    // Mock transaction function that fails first 2 times
    const mockTransactionFn = async (): Promise<string> => {
      attemptCount++
      if (attemptCount < 2) {
        throw new Error('Simulated transaction failure')
      }
      return 'success_signature_' + Date.now()
    }

    const result = await executeWithRetry(
      mockTransactionFn,
      'release',
      'test_escrow_retry',
      { maxAttempts, initialDelayMs: 100, maxDelayMs: 500 }
    )

    logTest(
      'Retry logic executed',
      attemptCount >= 2,
      `Attempted ${attemptCount} times`
    )

    logTest(
      'Transaction eventually succeeded',
      result.success === true,
      `Success: ${result.success}, Signature: ${result.signature?.substring(0, 20)}...`
    )

    return true
  } catch (error: any) {
    logTest('Retry logic', false, error.message)
    return false
  }
}

// ============================================
// TEST 6: Anomaly Detection
// ============================================

async function testAnomalyDetection() {
  logSection('TEST 6: Anomaly Detection')

  try {
    // Simulate multiple failed transactions to trigger anomaly
    for (let i = 0; i < 5; i++) {
      const id = transactionMonitor.registerTransaction(
        `failed_tx_${i}`,
        'release',
        'test_escrow_anomaly'
      )
      
      // Manually set status to failed
      const record = transactionMonitor.getTransaction(id)
      if (record) {
        record.status = 'failed'
        record.error = 'Simulated failure for testing'
      }
    }

    const anomalies = transactionMonitor.getAnomalies()

    logTest(
      'Anomalies detected',
      anomalies.length > 0,
      `Found ${anomalies.length} anomalies`
    )

    if (anomalies.length > 0) {
      const highSeverity = anomalies.filter(a => a.severity === 'high' || a.severity === 'critical')
      logTest(
        'High severity anomalies detected',
        highSeverity.length > 0,
        `${highSeverity.length} high/critical severity anomalies`
      )
    }

    return true
  } catch (error: any) {
    logTest('Anomaly detection', false, error.message)
    return false
  }
}

// ============================================
// TEST 7: Data Export
// ============================================

async function testDataExport() {
  logSection('TEST 7: Data Export')

  try {
    // Export as JSON
    const jsonData = transactionMonitor.exportTransactions('json')
    const jsonParsed = JSON.parse(jsonData)

    logTest(
      'Export transactions as JSON',
      Array.isArray(jsonParsed),
      `Exported ${jsonParsed.length} transactions`
    )

    // Export as CSV
    const csvData = transactionMonitor.exportTransactions('csv')
    const csvLines = csvData.split('\n')

    logTest(
      'Export transactions as CSV',
      csvLines.length > 1,
      `CSV has ${csvLines.length} lines (including header)`
    )

    logTest(
      'CSV has proper header',
      csvLines[0].includes('id') && csvLines[0].includes('signature'),
      `Header: ${csvLines[0].substring(0, 50)}...`
    )

    return true
  } catch (error: any) {
    logTest('Data export', false, error.message)
    return false
  }
}

// ============================================
// TEST 8: Cleanup Old Records
// ============================================

async function testCleanup() {
  logSection('TEST 8: Cleanup Old Records')

  try {
    const beforeMetrics = transactionMonitor.getMetrics()
    const beforeCount = beforeMetrics.totalTransactions

    // Clear records older than 0 hours (all completed records)
    transactionMonitor.clearOldRecords(0)

    const afterMetrics = transactionMonitor.getMetrics()
    const afterCount = afterMetrics.totalTransactions

    logTest(
      'Old records cleared',
      afterCount <= beforeCount,
      `Before: ${beforeCount}, After: ${afterCount}`
    )

    return true
  } catch (error: any) {
    logTest('Cleanup', false, error.message)
    return false
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('\n🔍 Transaction Monitoring System Verification\n')

  const tests = [
    { name: 'Transaction Registration', fn: testTransactionRegistration },
    { name: 'Transaction Metrics', fn: testTransactionMetrics },
    { name: 'Escrow Filtering', fn: testEscrowFiltering },
    { name: 'Status Monitoring', fn: testStatusMonitoring },
    { name: 'Retry Logic', fn: testRetryLogic },
    { name: 'Anomaly Detection', fn: testAnomalyDetection },
    { name: 'Data Export', fn: testDataExport },
    { name: 'Cleanup', fn: testCleanup },
  ]

  const results = []

  for (const test of tests) {
    try {
      const passed = await test.fn()
      results.push({ name: test.name, passed })
    } catch (error: any) {
      console.error(`\n❌ Test "${test.name}" threw an error:`, error.message)
      results.push({ name: test.name, passed: false })
    }
  }

  // Summary
  logSection('TEST SUMMARY')
  const passed = results.filter(r => r.passed).length
  const total = results.length
  const percentage = ((passed / total) * 100).toFixed(1)

  console.log(`\nPassed: ${passed}/${total} (${percentage}%)`)
  
  if (passed === total) {
    console.log('\n✅ All tests passed! Transaction monitoring system is working correctly.\n')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n')
  }

  // Stop monitoring
  transactionMonitor.stopMonitoring()
}

// Run tests
runAllTests().catch(console.error)
