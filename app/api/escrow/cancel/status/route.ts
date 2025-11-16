import { NextRequest, NextResponse } from 'next/server'
import { getCancellationRequest } from '@/lib/escrow/mutual-cancellation'

/**
 * GET /api/escrow/cancel/status?escrowId=xxx
 * Get cancellation request status for an escrow
 * Requirements: 15.2
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const escrowId = searchParams.get('escrowId')

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Missing required parameter: escrowId' },
        { status: 400 }
      )
    }

    // Get cancellation request
    const result = await getCancellationRequest(escrowId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      cancellationRequest: result.cancellationRequest || null,
      hasPendingCancellation: !!result.cancellationRequest,
    })
  } catch (error: any) {
    console.error('Get cancellation status API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get cancellation status' },
      { status: 500 }
    )
  }
}
