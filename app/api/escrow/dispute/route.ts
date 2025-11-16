import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { invalidateEscrowCache, invalidateDisputeCache } from '@/lib/query-cache'
import { sendDisputeNotification } from '@/lib/notifications/send-notification'

/**
 * POST /api/escrow/dispute
 * Raise a dispute on an escrow or milestone
 * Requirements: 6.1, 6.2, 6.3
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

    const { escrowId, milestoneId, actorWallet, reason, description } = await request.json()

    // Validate required fields
    if (!escrowId || !actorWallet || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, actorWallet, reason, and description are required' },
        { status: 400 }
      )
    }

    // Validate reason is detailed (minimum length)
    if (description.trim().length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters to provide sufficient detail' },
        { status: 400 }
      )
    }

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      )
    }

    // Verify actor is buyer or seller
    if (escrow.buyer_wallet !== actorWallet && escrow.seller_wallet !== actorWallet) {
      return NextResponse.json(
        { error: 'Unauthorized: Only buyer or seller can raise dispute' },
        { status: 403 }
      )
    }

    // Check if escrow is already disputed
    if (escrow.status === 'disputed') {
      return NextResponse.json(
        { error: 'Escrow is already disputed' },
        { status: 400 }
      )
    }

    // Check if escrow is in a valid state for disputes
    if (escrow.status === 'completed' || escrow.status === 'cancelled' || escrow.status === 'refunded') {
      return NextResponse.json(
        { error: `Cannot dispute escrow in ${escrow.status} status` },
        { status: 400 }
      )
    }

    // Determine party role
    const partyRole = escrow.buyer_wallet === actorWallet ? 'buyer' : 'seller'
    const counterparty = partyRole === 'buyer' ? escrow.seller_wallet : escrow.buyer_wallet

    // Create dispute record
    const disputeId = nanoid(12)
    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert({
        id: disputeId,
        escrow_id: escrowId,
        milestone_id: milestoneId || null,
        raised_by: actorWallet,
        party_role: partyRole,
        reason: reason,
        description: description,
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single()

    if (disputeError) {
      console.error('Failed to create dispute:', disputeError)
      return NextResponse.json(
        { error: 'Failed to create dispute record' },
        { status: 500 }
      )
    }

    // Freeze automatic releases - update escrow status to disputed
    const { error: updateError } = await supabase
      .from('escrow_contracts')
      .update({ status: 'disputed' })
      .eq('id', escrowId)

    if (updateError) {
      console.error('Failed to update escrow status:', updateError)
      return NextResponse.json(
        { error: 'Failed to freeze escrow' },
        { status: 500 }
      )
    }

    // If milestone specified, mark it as disputed
    if (milestoneId) {
      await supabase
        .from('escrow_milestones')
        .update({ status: 'disputed' })
        .eq('id', milestoneId)
    }

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      milestone_id: milestoneId || null,
      actor_wallet: actorWallet,
      action_type: 'disputed',
      notes: `${partyRole} raised dispute: ${reason}`,
      metadata: { dispute_id: disputeId, description },
    })

    // Notify counterparty using notification system
    try {
      await sendDisputeNotification(
        counterparty,
        escrowId,
        partyRole,
        reason
      )
    } catch (notifError) {
      console.error('Failed to send dispute notification:', notifError)
      // Don't fail the request if notification fails
    }

    // Invalidate caches
    invalidateEscrowCache(escrowId)
    invalidateDisputeCache(disputeId)

    return NextResponse.json({ 
      success: true,
      dispute: {
        id: dispute.id,
        status: dispute.status,
        reason: dispute.reason,
        description: dispute.description,
      }
    })
  } catch (error: any) {
    console.error('Raise dispute error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to raise dispute' },
      { status: 500 }
    )
  }
}
