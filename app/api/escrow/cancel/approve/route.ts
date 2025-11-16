import { NextRequest, NextResponse } from 'next/server'
import { approveMutualCancellation } from '@/lib/escrow/mutual-cancellation'
import { invalidateEscrowCache } from '@/lib/query-cache'
import { sendRefundNotification } from '@/lib/notifications/send-notification'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/escrow/cancel/approve
 * Approve a pending cancellation request
 * Requirements: 15.2
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

    const { cancellationId, approverWallet, escrowId } = await request.json()

    // Validate required fields
    if (!cancellationId || !approverWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: cancellationId and approverWallet are required' },
        { status: 400 }
      )
    }

    // Approve cancellation
    const result = await approveMutualCancellation({
      cancellationId,
      approverWallet,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send refund notifications if cancellation was executed
    if (result.executed && result.refundDetails) {
      try {
        const { data: escrow } = await supabase
          .from('escrow_contracts')
          .select('buyer_wallet, seller_wallet, token, id')
          .eq('id', result.refundDetails.escrowId)
          .single()
        
        if (escrow) {
          // Notify both parties about refunds
          if (result.refundDetails.buyerRefund > 0) {
            await sendRefundNotification(
              escrow.buyer_wallet,
              escrow.id,
              result.refundDetails.buyerRefund,
              escrow.token,
              'Mutual cancellation approved'
            )
          }
          if (result.refundDetails.sellerRefund > 0) {
            await sendRefundNotification(
              escrow.seller_wallet,
              escrow.id,
              result.refundDetails.sellerRefund,
              escrow.token,
              'Mutual cancellation approved'
            )
          }
        }
      } catch (notifError) {
        console.error('Failed to send refund notifications:', notifError)
        // Don't fail the request if notification fails
      }
    }

    // Invalidate cache if escrowId provided
    if (escrowId) {
      invalidateEscrowCache(escrowId)
    }

    return NextResponse.json({
      success: true,
      executed: result.executed,
      message: result.executed
        ? 'Cancellation approved and executed. Refunds have been processed.'
        : 'Cancellation approved. Waiting for counterparty approval.',
    })
  } catch (error: any) {
    console.error('Approve cancellation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve cancellation' },
      { status: 500 }
    )
  }
}
