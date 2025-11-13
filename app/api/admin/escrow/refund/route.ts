import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured' },
        { status: 503 }
      )
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const { adminRefundToBuyer } = await import('@/lib/escrow')
    
    const { escrowId, milestoneId, adminWallet, notes } = await request.json()

    if (!escrowId || !adminWallet || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log admin refund decision
    const escrow = await adminRefundToBuyer(escrowId, milestoneId, adminWallet, notes)

    // Setup connection
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://api.${network}.solana.com`
    const connection = new Connection(rpcUrl, 'confirmed')

    // Reconstruct escrow wallet keypair
    const paymentKeypair = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(escrow.encrypted_private_key, 'base64'))
    )

    // Get current balance
    const balance = await connection.getBalance(paymentKeypair.publicKey)
    const buyerPubkey = new PublicKey(escrow.buyer_wallet)

    // Get rent exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0)
    const txFee = 5000

    // Refund everything minus fees
    const refundAmount = balance - txFee - rentExemption

    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Insufficient balance for refund' },
        { status: 400 }
      )
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: paymentKeypair.publicKey,
        toPubkey: buyerPubkey,
        lamports: refundAmount,
      })
    )

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [paymentKeypair]
    )

    // Update escrow status
    await supabaseAdmin
      .from('escrow_contracts')
      .update({ status: 'cancelled' })
      .eq('id', escrowId)

    if (milestoneId) {
      await supabaseAdmin
        .from('escrow_milestones')
        .update({ status: 'cancelled' })
        .eq('id', milestoneId)
    }

    return NextResponse.json({
      success: true,
      signature,
      amount: refundAmount / LAMPORTS_PER_SOL,
    })
  } catch (error: any) {
    console.error('Admin refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    )
  }
}
