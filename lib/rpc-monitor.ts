/**
 * RPC Health Monitoring Service
 * 
 * Monitors Solana RPC endpoints for:
 * - Availability
 * - Latency
 * - Error rates
 * - Automatic failover
 */

import { Connection, Commitment } from '@solana/web3.js'
import { logger } from './logging'

export interface RPCEndpoint {
  url: string
  name: string
  priority: number // Lower is higher priority
}

export interface RPCHealthStatus {
  endpoint: string
  name: string
  isHealthy: boolean
  latency: number
  lastCheck: Date
  errorCount: number
  successRate: number
  consecutiveFailures: number
}

class RPCMonitor {
  private endpoints: RPCEndpoint[] = []
  private healthStatus: Map<string, RPCHealthStatus> = new Map()
  private activeEndpoint: string | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly checkIntervalMs = 30000 // 30 seconds
  private readonly maxConsecutiveFailures = 3
  private readonly latencyThreshold = 2000 // 2 seconds

  constructor() {
    this.initializeEndpoints()
  }

  /**
   * Initialize RPC endpoints from environment
   */
  private initializeEndpoints(): void {
    const primaryRPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    const fallbackRPC = process.env.SOLANA_RPC_FALLBACK_URL
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'

    this.endpoints = [
      {
        url: primaryRPC,
        name: 'Primary RPC',
        priority: 1,
      },
    ]

    if (fallbackRPC) {
      this.endpoints.push({
        url: fallbackRPC,
        name: 'Fallback RPC',
        priority: 2,
      })
    }

    // Add public endpoints as additional fallbacks
    if (network === 'mainnet-beta') {
      this.endpoints.push(
        {
          url: 'https://api.mainnet-beta.solana.com',
          name: 'Solana Public RPC',
          priority: 3,
        },
        {
          url: 'https://solana-api.projectserum.com',
          name: 'Serum RPC',
          priority: 4,
        }
      )
    } else if (network === 'devnet') {
      this.endpoints.push({
        url: 'https://api.devnet.solana.com',
        name: 'Devnet Public RPC',
        priority: 3,
      })
    }

    // Initialize health status for all endpoints
    this.endpoints.forEach(endpoint => {
      this.healthStatus.set(endpoint.url, {
        endpoint: endpoint.url,
        name: endpoint.name,
        isHealthy: true,
        latency: 0,
        lastCheck: new Date(),
        errorCount: 0,
        successRate: 1.0,
        consecutiveFailures: 0,
      })
    })

    // Set initial active endpoint
    this.activeEndpoint = this.endpoints[0].url

    logger.info('rpc', 'RPC Monitor initialized', {
      endpoints: this.endpoints.map(e => e.name),
      activeEndpoint: this.endpoints[0].name,
    })
  }

  /**
   * Start monitoring RPC health
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return // Already monitoring
    }

    logger.info('rpc', 'Starting RPC health monitoring')

    // Initial health check
    this.checkAllEndpoints()

    // Set up periodic checks
    this.monitoringInterval = setInterval(() => {
      this.checkAllEndpoints()
    }, this.checkIntervalMs)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('rpc', 'Stopped RPC health monitoring')
    }
  }

  /**
   * Check health of all endpoints
   */
  private async checkAllEndpoints(): Promise<void> {
    const checks = this.endpoints.map(endpoint => this.checkEndpointHealth(endpoint))
    await Promise.allSettled(checks)

    // Check if we need to failover
    this.evaluateFailover()
  }

  /**
   * Check health of a single endpoint
   */
  private async checkEndpointHealth(endpoint: RPCEndpoint): Promise<void> {
    const startTime = Date.now()
    const connection = new Connection(endpoint.url, 'confirmed')

    try {
      // Perform a simple health check
      const slot = await Promise.race([
        connection.getSlot(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        ),
      ]) as number

      const latency = Date.now() - startTime
      const status = this.healthStatus.get(endpoint.url)!

      // Update health status
      const isHealthy = latency < this.latencyThreshold
      const successRate = status.successRate * 0.9 + (isHealthy ? 0.1 : 0)

      this.healthStatus.set(endpoint.url, {
        ...status,
        isHealthy,
        latency,
        lastCheck: new Date(),
        successRate,
        consecutiveFailures: isHealthy ? 0 : status.consecutiveFailures + 1,
      })

      if (!isHealthy) {
        logger.warn('rpc', `RPC endpoint degraded: ${endpoint.name}`, {
          latency,
          threshold: this.latencyThreshold,
        })
      }

      logger.debug('rpc', `Health check completed: ${endpoint.name}`, {
        latency,
        slot,
        isHealthy,
      })
    } catch (error: any) {
      const latency = Date.now() - startTime
      const status = this.healthStatus.get(endpoint.url)!

      // Update health status for failure
      const errorCount = status.errorCount + 1
      const consecutiveFailures = status.consecutiveFailures + 1
      const successRate = status.successRate * 0.9

      this.healthStatus.set(endpoint.url, {
        ...status,
        isHealthy: false,
        latency,
        lastCheck: new Date(),
        errorCount,
        successRate,
        consecutiveFailures,
      })

      logger.error('rpc', `RPC endpoint health check failed: ${endpoint.name}`, {
        error: error.message,
        consecutiveFailures,
        errorCount,
      })

      // Alert if endpoint is consistently down
      if (consecutiveFailures >= this.maxConsecutiveFailures) {
        logger.critical('rpc', `RPC endpoint is down: ${endpoint.name}`, {
          endpoint: endpoint.url,
          consecutiveFailures,
        })
      }
    }
  }

  /**
   * Evaluate if we need to failover to a different endpoint
   */
  private evaluateFailover(): void {
    if (!this.activeEndpoint) return

    const activeStatus = this.healthStatus.get(this.activeEndpoint)
    
    // Check if active endpoint is unhealthy
    if (activeStatus && !activeStatus.isHealthy) {
      logger.warn('rpc', 'Active RPC endpoint is unhealthy, evaluating failover', {
        activeEndpoint: activeStatus.name,
        consecutiveFailures: activeStatus.consecutiveFailures,
      })

      // Find the best healthy endpoint
      const healthyEndpoint = this.findBestHealthyEndpoint()

      if (healthyEndpoint && healthyEndpoint !== this.activeEndpoint) {
        this.performFailover(healthyEndpoint)
      } else {
        logger.error('rpc', 'No healthy RPC endpoints available')
      }
    }
  }

  /**
   * Find the best healthy endpoint based on priority and health
   */
  private findBestHealthyEndpoint(): string | null {
    // Sort endpoints by priority
    const sortedEndpoints = [...this.endpoints].sort((a, b) => a.priority - b.priority)

    for (const endpoint of sortedEndpoints) {
      const status = this.healthStatus.get(endpoint.url)
      if (status && status.isHealthy && status.consecutiveFailures === 0) {
        return endpoint.url
      }
    }

    // If no perfectly healthy endpoint, find the least unhealthy
    let bestEndpoint: string | null = null
    let bestScore = -1

    for (const endpoint of sortedEndpoints) {
      const status = this.healthStatus.get(endpoint.url)
      if (status) {
        const score = status.successRate - (status.consecutiveFailures * 0.1)
        if (score > bestScore) {
          bestScore = score
          bestEndpoint = endpoint.url
        }
      }
    }

    return bestEndpoint
  }

  /**
   * Perform failover to a new endpoint
   */
  private performFailover(newEndpoint: string): void {
    const oldEndpoint = this.activeEndpoint
    const oldStatus = oldEndpoint ? this.healthStatus.get(oldEndpoint) : null
    const newStatus = this.healthStatus.get(newEndpoint)

    this.activeEndpoint = newEndpoint

    logger.critical('rpc', 'RPC failover performed', {
      from: oldStatus?.name || 'unknown',
      to: newStatus?.name || 'unknown',
      reason: 'Active endpoint unhealthy',
    })

    // In production, you might want to notify admins
    if (process.env.NODE_ENV === 'production') {
      // Send alert notification
    }
  }

  /**
   * Get the current active endpoint
   */
  getActiveEndpoint(): string {
    return this.activeEndpoint || this.endpoints[0].url
  }

  /**
   * Get a connection to the active endpoint
   */
  getConnection(commitment: Commitment = 'confirmed'): Connection {
    return new Connection(this.getActiveEndpoint(), commitment)
  }

  /**
   * Get health status for all endpoints
   */
  getHealthStatus(): RPCHealthStatus[] {
    return Array.from(this.healthStatus.values())
  }

  /**
   * Get health status for a specific endpoint
   */
  getEndpointHealth(url: string): RPCHealthStatus | undefined {
    return this.healthStatus.get(url)
  }

  /**
   * Force a health check now
   */
  async forceHealthCheck(): Promise<void> {
    logger.info('rpc', 'Forcing RPC health check')
    await this.checkAllEndpoints()
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical'
    healthyEndpoints: number
    totalEndpoints: number
    activeEndpoint: string
    averageLatency: number
  } {
    const statuses = Array.from(this.healthStatus.values())
    const healthyCount = statuses.filter(s => s.isHealthy).length
    const totalCount = statuses.length
    const averageLatency = statuses.reduce((sum, s) => sum + s.latency, 0) / totalCount

    let status: 'healthy' | 'degraded' | 'critical'
    if (healthyCount === totalCount) {
      status = 'healthy'
    } else if (healthyCount > 0) {
      status = 'degraded'
    } else {
      status = 'critical'
    }

    return {
      status,
      healthyEndpoints: healthyCount,
      totalEndpoints: totalCount,
      activeEndpoint: this.getActiveEndpoint(),
      averageLatency,
    }
  }
}

// Export singleton instance
export const rpcMonitor = new RPCMonitor()

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  rpcMonitor.startMonitoring()
}
