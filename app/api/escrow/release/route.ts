import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'
import { supabaseAdmin } from '@/lib/supabase'
import { releaseMilestoneFunds } from '@/lib/escrow'

export async function POST(request: NextRequest) {
  try {
    const { milestoneId } = await request.json()

    if (!milestoneId) {
      return NextResponse.json({ error: 'Missing milestone ID' }, { status: 400 })
    }

    // Get milestone and escrow data
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from('escrow_milestones')
      .select('*, escrow_contracts(*)')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if (milestone.status !== 'approved') {
      return NextResponse.json({ error: 'Milestone must be approved first' }, { status: 400 })
    }

    const escrow = milestone.escrow_contracts as any

    // Setup connection
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://api.${network}.solana.com`
    const connection = new Connection(rpcUrl, 'confirmed')

    // Reconstruct escrow wallet keypair
    const paymentKeypair = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(escrow.encrypted_private_key, 'base64'))
    )

    // Calculate amount to send (milestone amount in lamports)
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
    console.error('Release funds error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to release funds' },
      { status: 500 }
    )
  }
}
