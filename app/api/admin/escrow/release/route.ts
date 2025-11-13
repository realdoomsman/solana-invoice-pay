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
    const { adminReleaseFunds, releaseMilestoneFunds } = await import('@/lib/escrow')
    
    const { milestoneId, adminWallet, notes } = await request.json()

    if (!milestoneId || !adminWallet || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log admin approval
    const milestone = await adminReleaseFunds(milestoneId, adminWallet, notes)
    const escrow = milestone.escrow_contracts as any

    // Setup connection
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://api.${network}.solana.com`
    const connection = new Connection(rpcUrl, 'confirmed')

    // Reconstruct escrow wallet keypair
    const paymentKeypair = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(escrow.encrypted_private_key, 'base64'))
    )

    // Calculate amount to send
    const amountToSend = Math.floor(milestone.amount * LAMPORTS_PER_SOL)
    const sellerPubkey = new PublicKey(escrow.seller_wallet)

    // Get rent exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0)
    const txFee = 5000

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: paymentKeypair.publicKey,
        toPubkey: sellerPubkey,
        lamports: amountToSend - txFee - rentExemption,
      })
    )

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [paymentKeypair]
    )

    // Update milestone status
    await releaseMilestoneFunds(milestoneId, signature)

    return NextResponse.json({
      success: true,
      signature,
      amount: milestone.amount,
    })
  } catch (error: any) {
    console.error('Admin release error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to release funds' },
      { status: 500 }
    )
  }
}
