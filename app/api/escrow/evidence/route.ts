import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

/**
 * POST /api/escrow/evidence
 * Submit evidence for a dispute
 * Requirements: 6.4
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

    const { 
      escrowId, 
      disputeId, 
      milestoneId,
      submittedBy, 
      evidenceType, 
      content, 
      fileUrl,
      fileSize,
      mimeType
    } = await request.json()

    // Validate required fields
    if (!escrowId || !submittedBy || !evidenceType) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, submittedBy, and evidenceType are required' },
        { status: 400 }
      )
    }

    // Validate evidence type
    const validTypes = ['text', 'image', 'document', 'link', 'screenshot']
    if (!validTypes.includes(evidenceType)) {
      return NextResponse.json(
        { error: `Invalid evidence type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate content based on type
    if (evidenceType === 'text' && !content) {
      return NextResponse.json(
        { error: 'Text evidence requires content field' },
        { status: 400 }
      )
    }

    if ((evidenceType === 'image' || evidenceType === 'document' || evidenceType === 'screenshot') && !fileUrl) {
      return NextResponse.json(
        { error: `${evidenceType} evidence requires fileUrl field` },
        { status: 400 }
      )
    }

    if (evidenceType === 'link' && !content) {
      return NextResponse.json(
        { error: 'Link evidence requires content field with URL' },
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

    // Verify submitter is buyer or seller
    if (escrow.buyer_wallet !== submittedBy && escrow.seller_wallet !== submittedBy) {
      return NextResponse.json(
        { error: 'Unauthorized: Only buyer or seller can submit evidence' },
        { status: 403 }
      )
    }

    // Determine party role
    const partyRole = escrow.buyer_wallet === submittedBy ? 'buyer' : 'seller'

    // If disputeId provided, verify it exists and belongs to this escrow
    if (disputeId) {
      const { data: dispute, error: disputeError } = await supabase
        .from('escrow_disputes')
        .select('*')
        .eq('id', disputeId)
        .eq('escrow_id', escrowId)
        .single()

      if (disputeError || !dispute) {
        return NextResponse.json(
          { error: 'Dispute not found or does not belong to this escrow' },
          { status: 404 }
        )
      }
    }

    // Create evidence record
    const evidenceId = nanoid(12)
    const { data: evidence, error: evidenceError } = await supabase
      .from('escrow_evidence')
      .insert({
        id: evidenceId,
        escrow_id: escrowId,
        dispute_id: disputeId || null,
        milestone_id: milestoneId || null,
        submitted_by: submittedBy,
        party_role: partyRole,
        evidence_type: evidenceType,
        content: content || null,
        file_url: fileUrl || null,
        file_size: fileSize || null,
        mime_type: mimeType || null,
      })
      .select()
      .single()

    if (evidenceError) {
      console.error('Failed to create evidence:', evidenceError)
      return NextResponse.json(
        { error: 'Failed to submit evidence' },
        { status: 500 }
      )
    }

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      milestone_id: milestoneId || null,
      actor_wallet: submittedBy,
      action_type: 'admin_action',
      notes: `${partyRole} submitted ${evidenceType} evidence`,
      metadata: { 
        evidence_id: evidenceId, 
        evidence_type: evidenceType,
        dispute_id: disputeId 
      },
    })

    // Notify counterparty
    const counterparty = partyRole === 'buyer' ? escrow.seller_wallet : escrow.buyer_wallet
    await supabase.from('escrow_notifications').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      recipient_wallet: counterparty,
      notification_type: 'action_required',
      title: 'Evidence Submitted',
      message: `${partyRole === 'buyer' ? 'Buyer' : 'Seller'} has submitted ${evidenceType} evidence`,
      link: `/escrow/${escrowId}`,
      read: false,
      sent_browser: false,
      sent_email: false,
    })

    return NextResponse.json({ 
      success: true,
      evidence: {
        id: evidence.id,
        evidence_type: evidence.evidence_type,
        submitted_by: evidence.submitted_by,
        party_role: evidence.party_role,
        created_at: evidence.created_at,
      }
    })
  } catch (error: any) {
    console.error('Submit evidence error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit evidence' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/escrow/evidence?escrowId=xxx&disputeId=xxx
 * Get evidence for an escrow or dispute
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const escrowId = searchParams.get('escrowId')
    const disputeId = searchParams.get('disputeId')

    if (!escrowId && !disputeId) {
      return NextResponse.json(
        { error: 'Either escrowId or disputeId is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('escrow_evidence')
      .select('*')
      .order('created_at', { ascending: false })

    if (disputeId) {
      query = query.eq('dispute_id', disputeId)
    } else if (escrowId) {
      query = query.eq('escrow_id', escrowId)
    }

    const { data: evidence, error } = await query

    if (error) {
      console.error('Failed to fetch evidence:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      evidence: evidence || []
    })
  } catch (error: any) {
    console.error('Get evidence error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get evidence' },
      { status: 500 }
    )
  }
}
