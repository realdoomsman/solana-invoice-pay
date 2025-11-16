import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/admin/escrow/disputes/[id]
 * Get detailed information about a specific dispute
 * Requirements: 6.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id

    // Get dispute with escrow details
    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .select(`
        *,
        escrow_contracts (
          *
        )
      `)
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Get all evidence for this dispute
    const { data: evidence, error: evidenceError } = await supabase
      .from('escrow_evidence')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true })

    if (evidenceError) {
      console.error('Failed to fetch evidence:', evidenceError)
    }

    // Get all actions for this escrow
    const { data: actions, error: actionsError } = await supabase
      .from('escrow_actions')
      .select('*')
      .eq('escrow_id', dispute.escrow_id)
      .order('created_at', { ascending: false })

    if (actionsError) {
      console.error('Failed to fetch actions:', actionsError)
    }

    // Get milestones if it's a simple_buyer escrow
    let milestones = null
    if ((dispute.escrow_contracts as any)?.escrow_type === 'simple_buyer') {
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('escrow_milestones')
        .select('*')
        .eq('escrow_id', dispute.escrow_id)
        .order('milestone_order', { ascending: true })

      if (!milestonesError) {
        milestones = milestonesData
      }
    }

    // Get admin actions for this dispute
    const { data: adminActions, error: adminActionsError } = await supabase
      .from('escrow_admin_actions')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: false })

    if (adminActionsError) {
      console.error('Failed to fetch admin actions:', adminActionsError)
    }

    // Organize evidence by party
    const evidenceByParty = {
      buyer: (evidence || []).filter((e: any) => e.party_role === 'buyer'),
      seller: (evidence || []).filter((e: any) => e.party_role === 'seller'),
      admin: (evidence || []).filter((e: any) => e.party_role === 'admin'),
    }

    return NextResponse.json({
      success: true,
      dispute,
      evidence: evidence || [],
      evidence_by_party: evidenceByParty,
      actions: actions || [],
      milestones,
      admin_actions: adminActions || [],
    })
  } catch (error: any) {
    console.error('Get dispute details error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get dispute details' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/escrow/disputes/[id]
 * Update dispute status or priority
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id
    const { status, priority, adminWallet } = await request.json()

    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Admin wallet is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (status) updates.status = status
    if (priority) updates.priority = priority
    updates.updated_at = new Date().toISOString()

    const { data: dispute, error: updateError } = await supabase
      .from('escrow_disputes')
      .update(updates)
      .eq('id', disputeId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update dispute:', updateError)
      return NextResponse.json(
        { error: 'Failed to update dispute' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dispute,
    })
  } catch (error: any) {
    console.error('Update dispute error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update dispute' },
      { status: 500 }
    )
  }
}
