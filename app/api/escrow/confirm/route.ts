import { NextRequest, NextResponse } from 'next/server'
import { sendNotification } from '@/lib/notifications/send-notification'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/escrow/confirm
 * Allows buyer or seller to confirm successful transaction completion
 * When both parties confirm, funds are automatically released
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

    const { confirmEscrow } = await import('@/lib/escrow/traditional')
    const { escrowId, confirmerWallet, notes } = await request.json()

    // Validate required fields
    if (!escrowId || !confirmerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId and confirmerWallet' },
        { status: 400 }
      )
    }

    // Confirm escrow
    await confirmEscrow(escrowId, confirmerWallet, notes)

    // Send confirmation notification to counterparty
    try {
      const { data: escrow } = await supabase
        .from('escrow_contracts')
        .select('buyer_wallet, seller_wallet, buyer_confirmed, seller_confirmed')
        .eq('id', escrowId)
        .single()
      
      if (escrow) {
        const isConfirmerBuyer = escrow.buyer_wallet === confirmerWallet
        const counterparty = isConfirmerBuyer ? escrow.seller_wallet : escrow.buyer_wallet
        const confirmerRole = isConfirmerBuyer ? 'Buyer' : 'Seller'
        
        // Notify counterparty of confirmation
        await sendNotification({
          userWallet: counterparty,
          escrowId,
          type: 'approval',
          title: 'Transaction Confirmed',
          message: `${confirmerRole} has confirmed the transaction. ${
            escrow.buyer_confirmed && escrow.seller_confirmed 
              ? 'Funds will be released automatically.' 
              : 'Waiting for your confirmation to release funds.'
          }`,
          metadata: { confirmerRole, confirmerWallet }
        })
      }
    } catch (notifError) {
      console.error('Failed to send confirmation notification:', notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Confirmation recorded successfully'
    })
  } catch (error: any) {
    console.error('Confirm escrow error:', error)
    
    // Handle specific error cases
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      )
    }
    
    if (error.message.includes('must be fully funded')) {
      return NextResponse.json(
        { error: 'Escrow must be fully funded before confirmation' },
        { status: 400 }
      )
    }
    
    if (error.message.includes('Only buyer or seller')) {
      return NextResponse.json(
        { error: 'Only the buyer or seller can confirm this escrow' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to confirm escrow' },
      { status: 500 }
    )
  }
}
