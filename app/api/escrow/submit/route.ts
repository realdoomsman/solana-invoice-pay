import { NextRequest, NextResponse } from 'next/server'
import { submitMilestone } from '@/lib/escrow'

export async function POST(request: NextRequest) {
  try {
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
