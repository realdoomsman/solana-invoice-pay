import { NextRequest, NextResponse } from 'next/server'
import { submitMilestoneWork } from '@/lib/escrow/simple-buyer'
import { sendWorkSubmissionNotification } from '@/lib/notifications/send-notification'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    const { milestoneId, sellerWallet, notes, evidenceUrls } = await request.json()

    if (!milestoneId || !sellerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: milestoneId and sellerWallet are required' },
        { status: 400 }
      )
    }

    const result = await submitMilestoneWork({
      milestoneId,
      sellerWallet,
      notes,
      evidenceUrls,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Send work submission notification to buyer
    try {
      const { data: milestone } = await supabase
        .from('escrow_milestones')
        .select('escrow_id, description')
        .eq('id', milestoneId)
        .single()
      
      if (milestone) {
        const { data: escrow } = await supabase
          .from('escrow_contracts')
          .select('buyer_wallet')
          .eq('id', milestone.escrow_id)
          .single()
        
        if (escrow) {
          await sendWorkSubmissionNotification(
            escrow.buyer_wallet,
            milestone.escrow_id,
            milestoneId,
            milestone.description
          )
        }
      }
    } catch (notifError) {
      console.error('Failed to send work submission notification:', notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      milestone: result.milestone,
      message: 'Work submitted successfully. Buyer will be notified for review.',
    })
  } catch (error: any) {
    console.error('Submit milestone error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit milestone' },
      { status: 500 }
    )
  }
}
