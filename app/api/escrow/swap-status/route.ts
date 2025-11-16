/**
 * Atomic Swap Status API
 * Get detailed status of an atomic swap including deposit status and time remaining
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  detectBothDeposits,
  checkSwapTimeout,
  checkSwapReadiness
} from '@/lib/escrow/atomic-swap'

// ============================================
// GET - Get atomic swap status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const escrowId = searchParams.get('escrowId')
    
    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID is required' },
        { status: 400 }
      )
    }
    
    // Get deposit status
    const depositStatus = await detectBothDeposits(escrowId)
    
    // Get timeout status
    const timeoutStatus = await checkSwapTimeout(escrowId)
    
    // Get readiness status
    const readinessStatus = await checkSwapReadiness(escrowId)
    
    return NextResponse.json({
      success: true,
      deposits: depositStatus,
      timeout: timeoutStatus,
      readiness: readinessStatus
    })
  } catch (error: any) {
    console.error('Get swap status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get swap status' },
      { status: 500 }
    )
  }
}
