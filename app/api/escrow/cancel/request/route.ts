import { NextRequest, NextResponse } from 'next/server'
import { requestMutualCancellation } from '@/lib/escrow/mutual-cancellation'
import { invalidateEscrowCache } from '@/lib/query-cache'
import { sendNotification } from '@/lib/notifications/send-notification'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/escrow/cancel/request
 * Request mutual cancellation of an escrow
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

    const { escrowId, requestorWallet, reason, notes } = await request.json()

    // Validate required fields
    if (!escrowId || !requestorWallet || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, requestorWallet, and reason are required' },
        { status: 400 }
      )
    }

    // Request cancellation
    const result = await requestMutualCancellation({
      escrowId,
      requestorWallet,
      reason,
      notes,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send notification to counterparty
    try {
      const { data: escrow } = await supabase
        .from('escrow_contracts')
        .select('buyer_wallet, seller_wallet')
        .eq('id', escrowId)
        .single()
      
      if (escrow) {
        const counterparty = escrow.buyer_wallet === requestorWallet 
          ? escrow.seller_wallet 
          : escrow.buyer_wallet
        const requestorRole = escrow.buyer_wallet === requestorWallet ? 'Buyer' : 'Seller'
        
        await sendNotification({
          userWallet: counterparty,
          escrowId,
          type: 'refund',
          title: 'Cancellation Request',
          message: `${requestorRole} has requested to cancel the escrow. Reason: ${reason}`,
          metadata: { requestorWallet, requestorRole, reason }
        })
      }
    } catch (notifError) {
      console.error('Failed to send cancellation request notification:', notifError)
      // Don't fail the request if notification fails
    }

    // Invalidate cache
    invalidateEscrowCache(escrowId)

    return NextResponse.json({
      success: true,
      cancellationRequest: result.cancellationRequest,
    })
  } catch (error: any) {
    console.error('Request cancellation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to request cancellation' },
      { status: 500 }
    )
  }
}
