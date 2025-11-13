import { NextRequest, NextResponse } from 'next/server'
import { approveMilestone } from '@/lib/escrow'

export async function POST(request: NextRequest) {
  try {
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
