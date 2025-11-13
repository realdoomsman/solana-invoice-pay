import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured' },
        { status: 503 }
      )
    }

    const {
      getEscrowByPaymentId,
      getEscrowMilestones,
      getEscrowActions,
      getEscrowEvidence,
      getAdminActions,
    } = await import('@/lib/escrow')
    const { supabase } = await import('@/lib/supabase')

    // Get escrow by ID (not payment_id)
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (escrowError || !escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    const milestones = await getEscrowMilestones(escrow.id)
    const actions = await getEscrowActions(escrow.id)
    const evidence = await getEscrowEvidence(escrow.id)
    const adminActions = await getAdminActions(escrow.id)

    return NextResponse.json({
      success: true,
      escrow,
      milestones,
      actions,
      evidence,
      adminActions,
    })
  } catch (error: any) {
    console.error('Error fetching escrow details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch escrow details' },
      { status: 500 }
    )
  }
}
