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

    const { raiseDispute } = await import('@/lib/escrow')
    const { escrowId, milestoneId, actorWallet, reason } = await request.json()

    if (!escrowId || !actorWallet || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await raiseDispute(escrowId, milestoneId, actorWallet, reason)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Raise dispute error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to raise dispute' },
      { status: 500 }
    )
  }
}
