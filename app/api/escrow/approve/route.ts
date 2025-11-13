import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    const { approveMilestone } = await import('@/lib/escrow')
    const { milestoneId, buyerWallet, notes } = await request.json()

    if (!milestoneId || !buyerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await approveMilestone(milestoneId, buyerWallet, notes)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Approve milestone error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve milestone' },
      { status: 500 }
    )
  }
}
