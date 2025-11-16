/**
 * Transaction Monitoring System
 * 
 * Features:
 * - Monitor failed transactions
 * - Track confirmation times
 * - Alert on anomalies
 * - Implement retry logic with exponential backoff
 * - Transaction health metrics
 */

import { Connection, TransactionSignature, SignatureStatus } from '@solana/web3.js'
import { logger } from './logging'
import { nanoid } from 'nanoid'

// ============================================
// TYPES
// ============================================

export interface TransactionRecord {
  id: string
  signature: string
  escrowId?: string
  type: 'deposit' | 'release' | 'refund' | 'swap' | 'admin_action'
  status: 'pending' | 'confirmed' | 'failed' | 'timeout'
  attempts: number
  maxAttempts: number
  createdAt: string
  lastAttemptAt?: string
  confirmedAt?: string
  failedAt?: string
  error?: string
  confirmationTime?: number // milliseconds
  metadata?: Record<string, any>
}

export interface TransactionMetrics {
  totalTransactions: number
  confirmedTransactions: number
  failedTransactions: number
  pendingTransactions: number
  averageConfirmationTime: number
  successRate: number
  failureRate: number
  timeoutRate: number
}

export interface TransactionAnomaly {
  type: 'slow_confirmation' | 'high_failure_rate' | 'repeated_failures' | 'unusual_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedTransactions: string[]
  detectedAt: string
  metadata?: Record<string, any>
}

export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  timeoutMs: number
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeoutMs: 60000,
}

const ANOMALY_THRESHOLDS = {
  slowConfirmationMs: 30000, // 30 seconds
  highFailureRate: 0.2, // 20%
  repeatedFailureCount: 3,
  timeoutThresholdMs: 90000, // 90 seconds
}

// ============================================
// TRANSACTION MONITOR CLASS
// ============================================

class TransactionMonitor {
  private transactions: Map<string, TransactionRecord> = new Map()
  private anomalies: TransactionAnomaly[] = []
  private connection: Connection | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private maxRecords = 1000
  private maxAnomalies = 100

  /**
   * Initialize the monitor with a Solana connection
   */
  initialize(connection: Connection): void {
    this.connection = connection
    logger.info('transaction', 'Transaction monitor initialized')
  }

  /**
   * Start monitoring active transactions
   */
  startMonitoring(intervalMs: number = 10000): void {
    if (this.monitoringInterval) {
      return // Already monitoring
    }

    this.monitoringInterval = setInterval(() => {
      this.checkPendingTransactions()
      this.detectAnomalies()
    }, intervalMs)

    logger.info('transaction', 'Transaction monitoring started', { intervalMs })
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('transaction', 'Transaction monitoring stopped')
    }
  }

  /**
   * Register a new transaction for monitoring
   */
  registerTransaction(
    signature: string,
    type: TransactionRecord['type'],
    escrowId?: string,
    metadata?: Record<string, any>
  ): string {
    const id = nanoid(12)
    const record: TransactionRecord = {
      id,
      signature,
      escrowId,
      type,
      status: 'pending',
      attempts: 1,
      maxAttempts: DEFAULT_RETRY_CONFIG.maxAttempts,
      createdAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString(),
      metadata,
    }

    this.transactions.set(id, record)

    // Trim old records if needed
    if (this.transactions.size > this.maxRecords) {
      const oldestKey = this.transactions.keys().next().value
      if (oldestKey) {
        this.transactions.delete(oldestKey)
      }
    }

    logger.info('transaction', 'Transaction registered for monitoring', {
      id,
      signature,
      type,
      escrowId,
    })

    return id
  }

  /**
   * Check status of a specific transaction
   */
  async checkTransactionStatus(id: string): Promise<TransactionRecord | null> {
    const record = this.transactions.get(id)
    if (!record || !this.connection) {
      return null
    }

    if (record.status !== 'pending') {
      return record // Already resolved
    }

    try {
      const status = await this.connection.getSignatureStatus(record.signature)
      
      if (status.value === null) {
        // Transaction not found - might be too old or never submitted
        const ageMs = Date.now() - new Date(record.createdAt).getTime()
        
        if (ageMs > ANOMALY_THRESHOLDS.timeoutThresholdMs) {
          record.status = 'timeout'
          record.failedAt = new Date().toISOString()
          record.error = 'Transaction timeout - not found on chain'
          
          logger.warn('transaction', 'Transaction timeout', {
            id: record.id,
            signature: record.signature,
            ageMs,
          })

          this.reportAnomaly({
            type: 'slow_confirmation',
            severity: 'medium',
            description: 'Transaction timed out',
            affectedTransactions: [record.signature],
            detectedAt: new Date().toISOString(),
            metadata: { ageMs },
          })
        }
      } else if (status.value.err) {
        // Transaction failed
        record.status = 'failed'
        record.failedAt = new Date().toISOString()
        record.error = JSON.stringify(status.value.err)
        
        logger.error('transaction', 'Transaction failed', {
          id: record.id,
          signature: record.signature,
          error: record.error,
          escrowId: record.escrowId,
        })

        // Check for repeated failures
        this.checkRepeatedFailures(record)
      } else if (
        status.value.confirmationStatus === 'confirmed' ||
        status.value.confirmationStatus === 'finalized'
      ) {
        // Transaction confirmed
        const confirmationTime = Date.now() - new Date(record.createdAt).getTime()
        record.status = 'confirmed'
        record.confirmedAt = new Date().toISOString()
        record.confirmationTime = confirmationTime

        logger.info('transaction', 'Transaction confirmed', {
          id: record.id,
          signature: record.signature,
          confirmationTime,
          escrowId: record.escrowId,
        })

        // Check if confirmation was slow
        if (confirmationTime > ANOMALY_THRESHOLDS.slowConfirmationMs) {
          this.reportAnomaly({
            type: 'slow_confirmation',
            severity: 'low',
            description: 'Transaction took longer than expected to confirm',
            affectedTransactions: [record.signature],
            detectedAt: new Date().toISOString(),
            metadata: { confirmationTime },
          })
        }
      }

      this.transactions.set(id, record)
      return record
    } catch (error: any) {
      logger.error('transaction', 'Error checking transaction status', {
        id,
        signature: record.signature,
        error: error.message,
      })
      return record
    }
  }

  /**
   * Check all pending transactions
   */
  private async checkPendingTransactions(): Promise<void> {
    const pending = Array.from(this.transactions.values()).filter(
      tx => tx.status === 'pending'
    )

    if (pending.length === 0) {
      return
    }

    logger.debug('transaction', 'Checking pending transactions', {
      count: pending.length,
    })

    for (const record of pending) {
      await this.checkTransactionStatus(record.id)
    }
  }

  /**
   * Retry a failed transaction with exponential backoff
   */
  async retryTransaction(
    id: string,
    retryFn: () => Promise<string>,
    config: Partial<RetryConfig> = {}
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    const record = this.transactions.get(id)
    if (!record) {
      return { success: false, error: 'Transaction record not found' }
    }

    if (record.attempts >= record.maxAttempts) {
      logger.warn('transaction', 'Max retry attempts reached', {
        id,
        attempts: record.attempts,
        maxAttempts: record.maxAttempts,
      })
      return { success: false, error: 'Max retry attempts reached' }
    }

    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    const delay = Math.min(
      retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, record.attempts - 1),
      retryConfig.maxDelayMs
    )

    logger.info('transaction', 'Retrying transaction', {
      id,
      attempt: record.attempts + 1,
      maxAttempts: record.maxAttempts,
      delayMs: delay,
    })

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      // Execute retry function with timeout
      const signature = await Promise.race([
        retryFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Retry timeout')), retryConfig.timeoutMs)
        ),
      ])

      // Update record
      record.attempts++
      record.lastAttemptAt = new Date().toISOString()
      record.signature = signature
      record.status = 'pending'
      this.transactions.set(id, record)

      logger.info('transaction', 'Transaction retry successful', {
        id,
        newSignature: signature,
        attempt: record.attempts,
      })

      // Start monitoring the new signature
      await this.checkTransactionStatus(id)

      return { success: true, signature }
    } catch (error: any) {
      record.attempts++
      record.lastAttemptAt = new Date().toISOString()
      record.error = error.message
      this.transactions.set(id, record)

      logger.error('transaction', 'Transaction retry failed', {
        id,
        attempt: record.attempts,
        error: error.message,
      })

      // If max attempts reached, mark as failed
      if (record.attempts >= record.maxAttempts) {
        record.status = 'failed'
        record.failedAt = new Date().toISOString()
        this.transactions.set(id, record)

        this.reportAnomaly({
          type: 'repeated_failures',
          severity: 'high',
          description: 'Transaction failed after multiple retry attempts',
          affectedTransactions: [record.signature],
          detectedAt: new Date().toISOString(),
          metadata: {
            attempts: record.attempts,
            lastError: error.message,
          },
        })
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Get transaction metrics
   */
  getMetrics(): TransactionMetrics {
    const transactions = Array.from(this.transactions.values())
    const total = transactions.length
    const confirmed = transactions.filter(tx => tx.status === 'confirmed').length
    const failed = transactions.filter(tx => tx.status === 'failed').length
    const pending = transactions.filter(tx => tx.status === 'pending').length
    const timeout = transactions.filter(tx => tx.status === 'timeout').length

    const confirmedTxs = transactions.filter(tx => tx.status === 'confirmed' && tx.confirmationTime)
    const avgConfirmationTime = confirmedTxs.length > 0
      ? confirmedTxs.reduce((sum, tx) => sum + (tx.confirmationTime || 0), 0) / confirmedTxs.length
      : 0

    const successRate = total > 0 ? confirmed / total : 0
    const failureRate = total > 0 ? failed / total : 0
    const timeoutRate = total > 0 ? timeout / total : 0

    return {
      totalTransactions: total,
      confirmedTransactions: confirmed,
      failedTransactions: failed,
      pendingTransactions: pending,
      averageConfirmationTime: avgConfirmationTime,
      successRate,
      failureRate,
      timeoutRate,
    }
  }

  /**
   * Detect anomalies in transaction patterns
   */
  private detectAnomalies(): void {
    const metrics = this.getMetrics()

    // Check for high failure rate
    if (metrics.failureRate > ANOMALY_THRESHOLDS.highFailureRate && metrics.totalTransactions >= 10) {
      this.reportAnomaly({
        type: 'high_failure_rate',
        severity: 'critical',
        description: `High transaction failure rate detected: ${(metrics.failureRate * 100).toFixed(1)}%`,
        affectedTransactions: [],
        detectedAt: new Date().toISOString(),
        metadata: {
          failureRate: metrics.failureRate,
          totalTransactions: metrics.totalTransactions,
          failedTransactions: metrics.failedTransactions,
        },
      })
    }

    // Check for unusual patterns (e.g., all recent transactions failing)
    const recentTransactions = Array.from(this.transactions.values())
      .filter(tx => {
        const ageMs = Date.now() - new Date(tx.createdAt).getTime()
        return ageMs < 300000 // Last 5 minutes
      })

    if (recentTransactions.length >= 5) {
      const recentFailed = recentTransactions.filter(tx => tx.status === 'failed').length
      if (recentFailed === recentTransactions.length) {
        this.reportAnomaly({
          type: 'unusual_pattern',
          severity: 'critical',
          description: 'All recent transactions are failing',
          affectedTransactions: recentTransactions.map(tx => tx.signature),
          detectedAt: new Date().toISOString(),
          metadata: {
            recentCount: recentTransactions.length,
            failedCount: recentFailed,
          },
        })
      }
    }
  }

  /**
   * Check for repeated failures of same transaction type
   */
  private checkRepeatedFailures(record: TransactionRecord): void {
    const recentFailures = Array.from(this.transactions.values()).filter(tx => {
      const ageMs = Date.now() - new Date(tx.createdAt).getTime()
      return (
        tx.type === record.type &&
        tx.status === 'failed' &&
        ageMs < 600000 // Last 10 minutes
      )
    })

    if (recentFailures.length >= ANOMALY_THRESHOLDS.repeatedFailureCount) {
      this.reportAnomaly({
        type: 'repeated_failures',
        severity: 'high',
        description: `Multiple ${record.type} transactions failing`,
        affectedTransactions: recentFailures.map(tx => tx.signature),
        detectedAt: new Date().toISOString(),
        metadata: {
          transactionType: record.type,
          failureCount: recentFailures.length,
        },
      })
    }
  }

  /**
   * Report an anomaly
   */
  private reportAnomaly(anomaly: TransactionAnomaly): void {
    // Check if similar anomaly was recently reported
    const recentSimilar = this.anomalies.find(a => {
      const ageMs = Date.now() - new Date(a.detectedAt).getTime()
      return a.type === anomaly.type && ageMs < 300000 // Last 5 minutes
    })

    if (recentSimilar) {
      return // Don't spam with duplicate anomalies
    }

    this.anomalies.push(anomaly)

    // Trim old anomalies
    if (this.anomalies.length > this.maxAnomalies) {
      this.anomalies.shift()
    }

    // Log the anomaly
    const logLevel = anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'critical' : 'warn'
    logger.log(logLevel, 'transaction', `Transaction anomaly detected: ${anomaly.type}`, {
      severity: anomaly.severity,
      description: anomaly.description,
      affectedCount: anomaly.affectedTransactions.length,
      ...anomaly.metadata,
    })
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): TransactionRecord | undefined {
    return this.transactions.get(id)
  }

  /**
   * Get transactions by escrow ID
   */
  getTransactionsByEscrow(escrowId: string): TransactionRecord[] {
    return Array.from(this.transactions.values()).filter(
      tx => tx.escrowId === escrowId
    )
  }

  /**
   * Get all anomalies
   */
  getAnomalies(severity?: TransactionAnomaly['severity']): TransactionAnomaly[] {
    if (severity) {
      return this.anomalies.filter(a => a.severity === severity)
    }
    return this.anomalies
  }

  /**
   * Clear old records
   */
  clearOldRecords(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString()
    
    for (const [id, record] of this.transactions.entries()) {
      if (record.createdAt < cutoffTime && record.status !== 'pending') {
        this.transactions.delete(id)
      }
    }

    this.anomalies = this.anomalies.filter(a => a.detectedAt > cutoffTime)

    logger.info('transaction', 'Cleared old transaction records', {
      olderThanHours,
      cutoffTime,
    })
  }

  /**
   * Export transaction data for analysis
   */
  exportTransactions(format: 'json' | 'csv' = 'json'): string {
    const transactions = Array.from(this.transactions.values())

    if (format === 'json') {
      return JSON.stringify(transactions, null, 2)
    } else {
      // CSV format
      const headers = ['id', 'signature', 'type', 'status', 'attempts', 'confirmationTime', 'createdAt', 'confirmedAt']
      const rows = transactions.map(tx =>
        headers.map(h => tx[h as keyof TransactionRecord] || '').join(',')
      )
      return [headers.join(','), ...rows].join('\n')
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const transactionMonitor = new TransactionMonitor()

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Monitor a transaction and wait for confirmation
 */
export async function monitorTransaction(
  signature: string,
  type: TransactionRecord['type'],
  escrowId?: string,
  timeoutMs: number = 60000
): Promise<{ success: boolean; record?: TransactionRecord; error?: string }> {
  const id = transactionMonitor.registerTransaction(signature, type, escrowId)

  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    const record = await transactionMonitor.checkTransactionStatus(id)
    
    if (!record) {
      return { success: false, error: 'Transaction record not found' }
    }

    if (record.status === 'confirmed') {
      return { success: true, record }
    }

    if (record.status === 'failed' || record.status === 'timeout') {
      return { success: false, record, error: record.error }
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return { success: false, error: 'Monitoring timeout' }
}

/**
 * Execute transaction with automatic retry
 */
export async function executeWithRetry(
  transactionFn: () => Promise<string>,
  type: TransactionRecord['type'],
  escrowId?: string,
  config?: Partial<RetryConfig>
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // First attempt
    const signature = await transactionFn()
    const id = transactionMonitor.registerTransaction(signature, type, escrowId)

    // Monitor the transaction
    const result = await monitorTransaction(signature, type, escrowId)

    if (result.success) {
      return { success: true, signature }
    }

    // If failed, retry
    logger.info('transaction', 'Transaction failed, attempting retry', {
      signature,
      type,
      escrowId,
    })

    return await transactionMonitor.retryTransaction(id, transactionFn, config)
  } catch (error: any) {
    logger.error('transaction', 'Transaction execution failed', {
      type,
      escrowId,
      error: error.message,
    })
    return { success: false, error: error.message }
  }
}

// ============================================
// EXPORTS
// ============================================

export default transactionMonitor
