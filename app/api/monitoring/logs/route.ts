/**
 * Logs API endpoint
 * Allows admins to query and export logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, LogLevel, LogCategory } from '@/lib/logging'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level') as LogLevel | null
    const category = searchParams.get('category') as LogCategory | null
    const startTime = searchParams.get('startTime') || undefined
    const endTime = searchParams.get('endTime') || undefined
    const walletAddress = searchParams.get('walletAddress') || undefined
    const escrowId = searchParams.get('escrowId') || undefined
    const format = searchParams.get('format') || 'json'

    // Get filtered logs
    const logs = logger.getLogs({
      level: level || undefined,
      category: category || undefined,
      startTime,
      endTime,
      walletAddress,
      escrowId,
    })

    // Return in requested format
    if (format === 'csv') {
      const csv = logger.exportLogs('csv')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="logs.csv"',
        },
      })
    }

    return NextResponse.json({
      count: logs.length,
      logs: logs.slice(-100), // Return last 100 logs
    })
  } catch (error: any) {
    logger.error('system', 'Logs API error', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    )
  }
}
