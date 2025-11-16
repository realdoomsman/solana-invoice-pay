import { NextRequest, NextResponse } from 'next/server'
import { cancelUnfundedEscrow, canCancelEscrow } from '@/lib/escrow/simple-cancellation'
import { invalidateEscrowCache } from '@/lib/query-cache'
import { sendRefundNotification } from '@/lib/notifications/send-notification'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/escrow/cancel
 * Cancel an unfunded escrow and refund any deposits
 * Requirements: 15.1
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    const { escrowId, creatorWallet, reason } = await request.json()

    // Validate required fields
    if (!escrowId || !creatorWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId and creatorWallet are required' },
        { status: 400 }
      )
    }

    // Check if escrow can be cancelled
    const eligibility = await canCancelEscrow(escrowId, creatorWallet)
    if (!eligibility.canCancel) {
      return NextResponse.json(
        { error: eligibility.reason || 'Cannot cancel this escrow' },
        { status: 400 }
      )
    }

    // Cancel escrow
    const result = await cancelUnfundedEscrow({
      escrowId,
      creatorWallet,
      reason,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send refund notification if deposits were refunded
    if (result.refunded) {
      try {
        const { data: escrow } = await supabase
          .from('escrow_contracts')
          .select('token, buyer_amount, seller_amount, buyer_wallet, seller_wallet')
          .eq('id', escrowId)
          .single()
        
        if (escrow) {
          // Determine refund amount based on who is cancelling
          const refundAmount = escrow.buyer_wallet === creatorWallet 
            ? escrow.buyer_amount 
            : escrow.seller_amount
          
          if (refundAmount > 0) {
            await sendRefundNotification(
              creatorWallet,
              escrowId,
              refundAmount,
              escrow.token,
              reason || 'Escrow cancelled by creator'
            )
          }
        }
      } catch (notifError) {
        console.error('Failed to send refund notification:', notifError)
        // Don't fail the request if notification fails
      }
    }

    // Invalidate cache
    invalidateEscrowCache(escrowId)

    return NextResponse.json({
      success: true,
      refunded: result.refunded,
      refundTxSignature: result.refundTxSignature,
      message: result.refunded
        ? 'Escrow cancelled and deposits refunded successfully'
        : 'Escrow cancelled successfully (no deposits to refund)',
    })
  } catch (error: any) {
    console.error('Cancel escrow API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel escrow' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/escrow/cancel?escrowId=xxx&wallet=xxx
 * Check if an escrow can be cancelled
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
    const wallet = searchParams.get('wallet')

    if (!escrowId || !wallet) {
      return NextResponse.json(
        { error: 'Missing required parameters: escrowId and wallet' },
        { status: 400 }
      )
    }

    const result = await canCancelEscrow(escrowId, wallet)

    return NextResponse.json({
      canCancel: result.canCancel,
      reason: result.reason,
    })
  } catch (error: any) {
    console.error('Check cancel eligibility API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check cancellation eligibility' },
      { status: 500 }
    )
  }
}
