/**
 * Escrow Deposit API
 * Handles deposit recording and status checking
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  recordAndVerifyDeposit,
  getDepositStatus,
  monitorEscrowDeposits
} from '@/lib/escrow/deposit-monitor'
import { sendDepositNotification } from '@/lib/notifications/send-notification'
import { supabase } from '@/lib/supabase'

// ============================================
// POST - Record a deposit
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { escrowId, depositorWallet, amount, token, txSignature } = body
    
    // Validate inputs
    if (!escrowId || !depositorWallet || !amount || !token || !txSignature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }
    
    // Record and verify the deposit
    const result = await recordAndVerifyDeposit(
      escrowId,
      depositorWallet,
      amount,
      token,
      txSignature
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // Get updated deposit status
    const status = await getDepositStatus(escrowId)
    
    // Send deposit notification to both parties
    try {
      const { data: escrow } = await supabase
        .from('escrow_contracts')
        .select('buyer_wallet, seller_wallet')
        .eq('id', escrowId)
        .single()
      
      if (escrow) {
        const depositor = escrow.buyer_wallet === depositorWallet ? 'buyer' : 'seller'
        await sendDepositNotification(
          escrow.buyer_wallet,
          escrow.seller_wallet,
          escrowId,
          depositor,
          amount,
          token
        )
      }
    } catch (notifError) {
      console.error('Failed to send deposit notification:', notifError)
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({
      success: true,
      deposit: result.deposit,
      status
    })
  } catch (error: any) {
    console.error('Deposit API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record deposit' },
      { status: 500 }
    )
  }
}

// ============================================
// GET - Get deposit status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const escrowId = searchParams.get('escrowId')
    
    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID is required' },
        { status: 400 }
      )
    }
    
    // Get deposit status
    const status = await getDepositStatus(escrowId)
    
    return NextResponse.json({
      success: true,
      ...status
    })
  } catch (error: any) {
    console.error('Get deposit status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deposit status' },
      { status: 500 }
    )
  }
}
