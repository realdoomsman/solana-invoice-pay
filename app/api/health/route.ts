import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check Solana RPC connection
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    const connection = new Connection(rpcUrl)
    
    let solanaStatus = 'healthy'
    let rpcLatency = 0
    
    try {
      const version = await connection.getVersion()
      rpcLatency = Date.now() - startTime
      
      if (!version) {
        solanaStatus = 'unhealthy'
      } else if (rpcLatency > 3000) {
        solanaStatus = 'degraded'
      }
    } catch (error) {
      solanaStatus = 'unhealthy'
    }

    const health = {
      status: solanaStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        solana: {
          status: solanaStatus,
          latency: rpcLatency,
          network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
        },
        platform: {
          status: 'healthy',
          version: '1.0.0',
        },
      },
      uptime: process.uptime(),
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
