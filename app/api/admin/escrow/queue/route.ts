import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured' },
        { status: 503 }
      )
    }

    const { getEscrowsNeedingReview } = await import('@/lib/escrow')
    
    const escrows = await getEscrowsNeedingReview()

    return NextResponse.json({ success: true, escrows })
  } catch (error: any) {
    console.error('Error fetching escrow queue:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch escrow queue' },
      { status: 500 }
    )
  }
}
