// Simple monitoring and logging utilities

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
}

class Monitor {
  private logs: LogEntry[] = []
  private maxLogs = 100

  log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }

    this.logs.push(entry)
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '')

    // In production, you could send to external monitoring service
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.reportError(entry)
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data)
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }

  private reportError(entry: LogEntry) {
    // Implement error reporting to external service
    // Example: Sentry, LogRocket, etc.
    // For now, just store locally
    try {
      const errors = JSON.parse(localStorage.getItem('error_logs') || '[]')
      errors.push(entry)
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift()
      }
      localStorage.setItem('error_logs', JSON.stringify(errors))
    } catch (e) {
      console.error('Failed to store error log:', e)
    }
  }

  // Track payment events
  trackPayment(event: string, data: any) {
    this.info(`Payment Event: ${event}`, data)
    
    // In production, send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data)
    }
  }

  // Track user actions
  trackAction(action: string, data?: any) {
    this.debug(`User Action: ${action}`, data)
    
    // In production, send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, data)
    }
  }

  // Performance monitoring
  measurePerformance(label: string, fn: () => any) {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.debug(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`Performance Error: ${label}`, { duration: `${duration.toFixed(2)}ms`, error })
      throw error
    }
  }

  async measureAsync(label: string, fn: () => Promise<any>) {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.debug(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`Performance Error: ${label}`, { duration: `${duration.toFixed(2)}ms`, error })
      throw error
    }
  }
}

// Export singleton instance
export const monitor = new Monitor()

// Helper functions for common monitoring tasks
export function trackPaymentCreated(paymentId: string, amount: number, token: string) {
  monitor.trackPayment('payment_created', { paymentId, amount, token })
}

export function trackPaymentCompleted(paymentId: string, amount: number, token: string) {
  monitor.trackPayment('payment_completed', { paymentId, amount, token })
}

export function trackPaymentFailed(paymentId: string, error: string) {
  monitor.trackPayment('payment_failed', { paymentId, error })
}

export function trackWalletConnected(walletType: string) {
  monitor.trackAction('wallet_connected', { walletType })
}

export function trackError(context: string, error: any) {
  monitor.error(`Error in ${context}`, {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
  })
}
