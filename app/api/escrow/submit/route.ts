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

    const { submitMilestone } = await import('@/lib/escrow')
    const { milestoneId, sellerWallet, notes } = await request.json()

    if (!milestoneId || !sellerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await submitMilestone(milestoneId, sellerWallet, notes)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Submit milestone error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit milestone' },
      { status: 500 }
    )
  }
}
