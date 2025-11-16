/**
 * Process Timeouts API Endpoint
 * Cron job endpoint to check and handle expired escrows
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkExpiredEscrows } from '@/lib/escrow/timeout-monitor'
import { processAllExpiredTimeouts } from '@/lib/escrow/timeout-handler'

// ============================================
// POST /api/escrow/process-timeouts
// ============================================

/**
 * Process expired timeouts
 * This endpoint should be called periodically by a cron job
 * 
 * Security: Should be protected by API key or Vercel Cron secret
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting timeout processing...')

    // Step 1: Check for expired escrows and send warnings
    const monitorResult = await checkExpiredEscrows()

    // Step 2: Process expired timeouts
    const handlerResult = await processAllExpiredTimeouts()

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      monitoring: {
        totalChecked: monitorResult.totalChecked,
        expiredCount: monitorResult.expiredCount,
        warningsSent: monitorResult.warningsSent,
        escalatedToAdmin: monitorResult.escalatedToAdmin,
        errors: monitorResult.errors,
      },
      handling: {
        processed: handlerResult.processed,
        successful: handlerResult.successful,
        failed: handlerResult.failed,
        errors: handlerResult.errors,
      },
    }

    console.log('✅ Timeout processing completed')
    console.log(JSON.stringify(result, null, 2))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Process timeouts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process timeouts',
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/escrow/process-timeouts
// ============================================

/**
 * Get timeout processing status
 * Returns information about timeout monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const { getTimeoutStatistics } = await import('@/lib/escrow/timeout-monitor')

    const stats = await getTimeoutStatistics()

    return NextResponse.json({
      success: true,
      statistics: stats,
      cronEndpoint: '/api/escrow/process-timeouts',
      recommendedSchedule: 'Every 15 minutes',
    })
  } catch (error: any) {
    console.error('Get timeout status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get timeout status',
      },
      { status: 500 }
    )
  }
}
