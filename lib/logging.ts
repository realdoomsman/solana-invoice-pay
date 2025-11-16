/**
 * Comprehensive Logging and Alerting System
 * 
 * Features:
 * - Structured logging with severity levels
 * - Security event tracking
 * - RPC health monitoring
 * - Error rate tracking
 * - Alert notifications
 * - Audit trail for sensitive operations
 */

import { Connection } from '@solana/web3.js'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogCategory = 
  | 'security' 
  | 'transaction' 
  | 'escrow' 
  | 'rpc' 
  | 'database' 
  | 'auth'
  | 'admin'
  | 'system'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: Record<string, any>
  userId?: string
  walletAddress?: string
  escrowId?: string
  transactionId?: string
  ipAddress?: string
  userAgent?: string
}

export interface SecurityEvent {
  type: 'unauthorized_access' | 'invalid_signature' | 'rate_limit_exceeded' | 'suspicious_activity' | 'key_access' | 'admin_action'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  walletAddress?: string
  ipAddress?: string
  metadata?: Record<string, any>
}

export interface RPCHealthMetrics {
  endpoint: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  lastChecked: string
  errorCount: number
  successRate: number
}

export interface ErrorMetrics {
  category: LogCategory
  errorType: string
  count: number
  lastOccurrence: string
  rate: number // errors per minute
}

class Logger {
  private logs: LogEntry[] = []
  private securityEvents: SecurityEvent[] = []
  private errorMetrics: Map<string, ErrorMetrics> = new Map()
  private rpcHealthMetrics: Map<string, RPCHealthMetrics> = new Map()
  
  private maxLogs = 1000
  private maxSecurityEvents = 500
  private alertThresholds = {
    errorRate: 10, // errors per minute
    rpcLatency: 2000, // ms
    securityEventsPerHour: 50,
  }

  /**
   * Core logging method
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    context?: {
      userId?: string
      walletAddress?: string
      escrowId?: string
      transactionId?: string
      ipAddress?: string
      userAgent?: string
    }
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      ...context,
    }

    // Store log entry
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output with color coding
    this.consoleLog(entry)

    // Track error metrics
    if (level === 'error' || level === 'critical') {
      this.trackError(category, message, data)
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(entry)
    }

    // Trigger alerts for critical events
    if (level === 'critical') {
      this.triggerAlert(entry)
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: LogCategory, message: string, data?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', category, message, data)
    }
  }

  info(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('info', category, message, data)
  }

  warn(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('warn', category, message, data)
  }

  error(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('error', category, message, data)
  }

  critical(category: LogCategory, message: string, data?: Record<string, any>): void {
    this.log('critical', category, message, data)
  }

  /**
   * Security event logging
   */
  logSecurityEvent(event: SecurityEvent): void {
    const timestamp = new Date().toISOString()
    
    this.securityEvents.push({
      ...event,
      metadata: {
        ...event.metadata,
        timestamp,
      },
    })

    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.shift()
    }

    // Log as critical or error based on severity
    const logLevel = event.severity === 'critical' || event.severity === 'high' ? 'critical' : 'error'
    
    this.log(logLevel, 'security', `Security Event: ${event.type}`, {
      severity: event.severity,
      description: event.description,
      walletAddress: event.walletAddress,
      ipAddress: event.ipAddress,
      ...event.metadata,
    })

    // Check if we're exceeding security event threshold
    this.checkSecurityEventRate()
  }

  /**
   * Log sensitive operations for audit trail
   */
  logSensitiveOperation(
    operation: string,
    actor: string,
    details: Record<string, any>
  ): void {
    this.log('info', 'security', `Sensitive Operation: ${operation}`, {
      actor,
      ...details,
      auditTrail: true,
    })

    // Store in separate audit log if needed
    if (process.env.NODE_ENV === 'production') {
      this.storeAuditLog({
        timestamp: new Date().toISOString(),
        operation,
        actor,
        details,
      })
    }
  }

  /**
   * RPC Health Monitoring
   */
  async monitorRPCHealth(endpoint: string, connection: Connection): Promise<RPCHealthMetrics> {
    const startTime = Date.now()
    let status: 'healthy' | 'degraded' | 'down' = 'down'
    let errorCount = 0

    try {
      // Test RPC endpoint with a simple call
      await connection.getSlot()
      const latency = Date.now() - startTime

      if (latency < 1000) {
        status = 'healthy'
      } else if (latency < this.alertThresholds.rpcLatency) {
        status = 'degraded'
      } else {
        status = 'down'
      }

      const existingMetrics = this.rpcHealthMetrics.get(endpoint)
      const successRate = existingMetrics 
        ? (existingMetrics.successRate * 0.9 + 0.1) // Exponential moving average
        : 1.0

      const metrics: RPCHealthMetrics = {
        endpoint,
        status,
        latency,
        lastChecked: new Date().toISOString(),
        errorCount: 0,
        successRate,
      }

      this.rpcHealthMetrics.set(endpoint, metrics)

      // Log if degraded or down
      if (status !== 'healthy') {
        this.warn('rpc', `RPC endpoint ${status}`, {
          endpoint,
          latency,
          status,
        })
      }

      return metrics
    } catch (error: any) {
      const existingMetrics = this.rpcHealthMetrics.get(endpoint)
      errorCount = (existingMetrics?.errorCount || 0) + 1
      const successRate = existingMetrics 
        ? (existingMetrics.successRate * 0.9) // Decrease success rate
        : 0.0

      const metrics: RPCHealthMetrics = {
        endpoint,
        status: 'down',
        latency: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        errorCount,
        successRate,
      }

      this.rpcHealthMetrics.set(endpoint, metrics)

      this.error('rpc', 'RPC endpoint health check failed', {
        endpoint,
        error: error.message,
        errorCount,
      })

      // Alert if RPC is consistently down
      if (errorCount >= 3) {
        this.critical('rpc', 'RPC endpoint is down', {
          endpoint,
          consecutiveErrors: errorCount,
        })
      }

      return metrics
    }
  }

  /**
   * Get RPC health status
   */
  getRPCHealth(endpoint?: string): RPCHealthMetrics | RPCHealthMetrics[] {
    if (endpoint) {
      return this.rpcHealthMetrics.get(endpoint) || {
        endpoint,
        status: 'down',
        latency: 0,
        lastChecked: new Date().toISOString(),
        errorCount: 0,
        successRate: 0,
      }
    }
    return Array.from(this.rpcHealthMetrics.values())
  }

  /**
   * Track error rates
   */
  private trackError(category: LogCategory, message: string, data?: Record<string, any>): void {
    const errorType = data?.errorType || message
    const key = `${category}:${errorType}`
    
    const existing = this.errorMetrics.get(key)
    const now = new Date().toISOString()

    if (existing) {
      const timeDiff = new Date(now).getTime() - new Date(existing.lastOccurrence).getTime()
      const minutesDiff = timeDiff / (1000 * 60)
      const rate = minutesDiff > 0 ? existing.count / minutesDiff : existing.count

      this.errorMetrics.set(key, {
        category,
        errorType,
        count: existing.count + 1,
        lastOccurrence: now,
        rate,
      })

      // Alert if error rate exceeds threshold
      if (rate > this.alertThresholds.errorRate) {
        this.critical('system', 'High error rate detected', {
          category,
          errorType,
          rate: rate.toFixed(2),
          threshold: this.alertThresholds.errorRate,
        })
      }
    } else {
      this.errorMetrics.set(key, {
        category,
        errorType,
        count: 1,
        lastOccurrence: now,
        rate: 0,
      })
    }
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(category?: LogCategory): ErrorMetrics[] {
    const metrics = Array.from(this.errorMetrics.values())
    if (category) {
      return metrics.filter(m => m.category === category)
    }
    return metrics
  }

  /**
   * Check security event rate
   */
  private checkSecurityEventRate(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const recentEvents = this.securityEvents.filter(
      e => (e.metadata?.timestamp || '') > oneHourAgo
    )

    if (recentEvents.length > this.alertThresholds.securityEventsPerHour) {
      this.critical('security', 'High rate of security events', {
        eventsInLastHour: recentEvents.length,
        threshold: this.alertThresholds.securityEventsPerHour,
      })
    }
  }

  /**
   * Get logs with filtering
   */
  getLogs(filters?: {
    level?: LogLevel
    category?: LogCategory
    startTime?: string
    endTime?: string
    walletAddress?: string
    escrowId?: string
  }): LogEntry[] {
    let filtered = this.logs

    if (filters) {
      if (filters.level) {
        filtered = filtered.filter(log => log.level === filters.level)
      }
      if (filters.category) {
        filtered = filtered.filter(log => log.category === filters.category)
      }
      if (filters.startTime) {
        filtered = filtered.filter(log => log.timestamp >= filters.startTime!)
      }
      if (filters.endTime) {
        filtered = filtered.filter(log => log.timestamp <= filters.endTime!)
      }
      if (filters.walletAddress) {
        filtered = filtered.filter(log => log.walletAddress === filters.walletAddress)
      }
      if (filters.escrowId) {
        filtered = filtered.filter(log => log.escrowId === filters.escrowId)
      }
    }

    return filtered
  }

  /**
   * Get security events
   */
  getSecurityEvents(severity?: SecurityEvent['severity']): SecurityEvent[] {
    if (severity) {
      return this.securityEvents.filter(e => e.severity === severity)
    }
    return this.securityEvents
  }

  /**
   * Clear old logs (for maintenance)
   */
  clearOldLogs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString()
    this.logs = this.logs.filter(log => log.timestamp > cutoffTime)
    this.securityEvents = this.securityEvents.filter(
      e => (e.metadata?.timestamp || '') > cutoffTime
    )
  }

  /**
   * Console logging with colors
   */
  private consoleLog(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[32m',     // Green
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      critical: '\x1b[35m', // Magenta
    }
    const reset = '\x1b[0m'

    const color = colors[entry.level]
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset} [${entry.category}]`
    
    console.log(`${prefix} ${entry.message}`, entry.data || '')
  }

  /**
   * Send to external logging service
   */
  private sendToExternalLogger(entry: LogEntry): void {
    // Implement integration with external logging service
    // Examples: Datadog, Logtail, CloudWatch, etc.
    
    // For now, store in database or send to API endpoint
    if (typeof window === 'undefined') {
      // Server-side: could send to logging API
      // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
    }
  }

  /**
   * Store audit log
   */
  private storeAuditLog(audit: any): void {
    // Store in database for compliance
    // This should be implemented based on your database setup
  }

  /**
   * Trigger alert
   */
  private triggerAlert(entry: LogEntry): void {
    // Implement alerting mechanism
    // Examples: Email, Slack, PagerDuty, SMS, etc.
    
    console.error('🚨 CRITICAL ALERT:', entry.message, entry.data)
    
    // In production, send to alerting service
    if (process.env.NODE_ENV === 'production') {
      // Send email, Slack notification, etc.
      this.sendAlert(entry)
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(entry: LogEntry): Promise<void> {
    // Implement alert sending
    // Could integrate with:
    // - Email service
    // - Slack webhook
    // - PagerDuty
    // - SMS service
    
    try {
      // Example: Send to webhook
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Alert: ${entry.message}`,
            level: entry.level,
            category: entry.category,
            data: entry.data,
            timestamp: entry.timestamp,
          }),
        })
      }
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2)
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'category', 'message', 'walletAddress', 'escrowId']
      const rows = this.logs.map(log => 
        headers.map(h => log[h as keyof LogEntry] || '').join(',')
      )
      return [headers.join(','), ...rows].join('\n')
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions for common logging scenarios
export function logEscrowCreated(escrowId: string, type: string, creator: string, amount: number): void {
  logger.info('escrow', 'Escrow created', {
    escrowId,
    type,
    creator,
    amount,
  })
}

export function logEscrowDeposit(escrowId: string, depositor: string, amount: number, token: string): void {
  logger.info('escrow', 'Deposit received', {
    escrowId,
    depositor,
    amount,
    token,
  })
}

export function logEscrowRelease(escrowId: string, recipient: string, amount: number, txSignature: string): void {
  logger.info('escrow', 'Funds released', {
    escrowId,
    recipient,
    amount,
    txSignature,
  })
}

export function logDisputeRaised(escrowId: string, raisedBy: string, reason: string): void {
  logger.warn('escrow', 'Dispute raised', {
    escrowId,
    raisedBy,
    reason,
  })
}

export function logAdminAction(action: string, admin: string, escrowId: string, details: Record<string, any>): void {
  logger.logSensitiveOperation(action, admin, {
    escrowId,
    ...details,
  })
}

export function logSecurityEvent(event: SecurityEvent): void {
  logger.logSecurityEvent(event)
}

export function logTransactionError(context: string, error: any, txSignature?: string): void {
  logger.error('transaction', `Transaction error: ${context}`, {
    error: error.message,
    stack: error.stack,
    txSignature,
  })
}

export function logDatabaseError(operation: string, error: any): void {
  logger.error('database', `Database error: ${operation}`, {
    error: error.message,
    stack: error.stack,
  })
}

export function logAuthFailure(walletAddress: string, reason: string, ipAddress?: string): void {
  logger.logSecurityEvent({
    type: 'unauthorized_access',
    severity: 'medium',
    description: `Authentication failed: ${reason}`,
    walletAddress,
    ipAddress,
  })
}

export function logRateLimitExceeded(identifier: string, ipAddress?: string): void {
  logger.logSecurityEvent({
    type: 'rate_limit_exceeded',
    severity: 'low',
    description: 'Rate limit exceeded',
    walletAddress: identifier,
    ipAddress,
  })
}

export function logKeyAccess(escrowId: string, accessor: string, purpose: string): void {
  logger.logSensitiveOperation('key_access', accessor, {
    escrowId,
    purpose,
  })
}
