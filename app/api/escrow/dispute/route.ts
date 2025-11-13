import { NextRequest, NextResponse } from 'next/server'
import { raiseDispute } from '@/lib/escrow'

export async function POST(request: NextRequest) {
  try {
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
