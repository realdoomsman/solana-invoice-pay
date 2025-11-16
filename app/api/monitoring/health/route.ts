/**
 * Health monitoring endpoint
 * Returns system health status including RPC, database, and error metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging'
import { rpcMonitor } from '@/lib/rpc-monitor'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if request is from admin (optional authentication)
    const authHeader = request.headers.get('authorization')
    const isAdmin = authHeader === `Bearer ${process.env.ADMIN_API_KEY}`

    // Get RPC health
    const rpcHealth = rpcMonitor.getSystemHealth()
    const rpcEndpoints = rpcMonitor.getHealthStatus()

    // Check database health
    let databaseHealth = {
      status: 'unknown' as 'healthy' | 'degraded' | 'down' | 'unknown',
      latency: 0,
    }

    try {
      const startTime = Date.now()
      const { error } = await supabase
        .from('escrow_contracts')
        .select('id')
        .limit(1)
      
      const latency = Date.now() - startTime
      
      if (error) {
        databaseHealth = { status: 'down', latency }
        logger.error('database', 'Database health check failed', { error: error.message })
      } else if (latency > 1000) {
        databaseHealth = { status: 'degraded', latency }
      } else {
        databaseHealth = { status: 'healthy', latency }
      }
    } catch (error: any) {
      databaseHealth = { status: 'down', latency: 0 }
      logger.error('database', 'Database health check error', { error: error.message })
    }

    // Get error metrics (only for admins)
    const errorMetrics = isAdmin ? logger.getErrorMetrics() : []

    // Get recent security events (only for admins)
    const securityEvents = isAdmin ? logger.getSecurityEvents() : []

    // Determine overall system status
    let overallStatus: 'healthy' | 'degraded' | 'critical'
    if (rpcHealth.status === 'healthy' && databaseHealth.status === 'healthy') {
      overallStatus = 'healthy'
    } else if (rpcHealth.status === 'critical' || databaseHealth.status === 'down') {
      overallStatus = 'critical'
    } else {
      overallStatus = 'degraded'
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components: {
        rpc: {
          status: rpcHealth.status,
          activeEndpoint: rpcHealth.activeEndpoint,
          healthyEndpoints: rpcHealth.healthyEndpoints,
          totalEndpoints: rpcHealth.totalEndpoints,
          averageLatency: rpcHealth.averageLatency,
          endpoints: rpcEndpoints.map(e => ({
            name: e.name,
            endpoint: e.endpoint,
            isHealthy: e.isHealthy,
            latency: e.latency,
            successRate: e.successRate,
            lastCheck: e.lastCheck,
          })),
        },
        database: databaseHealth,
      },
      ...(isAdmin && {
        errorMetrics: errorMetrics.map(m => ({
          category: m.category,
          errorType: m.errorType,
          count: m.count,
          rate: m.rate,
          lastOccurrence: m.lastOccurrence,
        })),
        securityEvents: securityEvents.slice(-10).map(e => ({
          type: e.type,
          severity: e.severity,
          description: e.description,
          timestamp: e.metadata?.timestamp,
        })),
      }),
    }

    logger.debug('system', 'Health check completed', { status: overallStatus })

    return NextResponse.json(response)
  } catch (error: any) {
    logger.error('system', 'Health check endpoint error', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to retrieve health status',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
