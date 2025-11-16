import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'
import { releaseMilestoneFunds, getMilestoneReleaseDetails, calculateMilestoneReleaseAmount } from '@/lib/escrow/simple-buyer'
import { decryptPrivateKey } from '@/lib/escrow/wallet-manager'
import { supabaseAdmin } from '@/lib/supabase'
import { sendReleaseNotification } from '@/lib/notifications/send-notification'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    const { milestoneId, triggeredBy } = await request.json()

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Missing required field: milestoneId' },
        { status: 400 }
      )
    }

    // Get milestone release details
    const releaseDetails = await getMilestoneReleaseDetails(milestoneId)

    if (!releaseDetails.canRelease) {
      return NextResponse.json(
        { error: `Milestone cannot be released (status: ${releaseDetails.milestone.status})` },
        { status: 400 }
      )
    }

    const { milestone, escrow, releaseAmounts } = releaseDetails

    // Setup Solana connection
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://api.${network}.solana.com`
    const connection = new Connection(rpcUrl, 'confirmed')

    // Decrypt escrow wallet private key
    const privateKeyBase64 = decryptPrivateKey(escrow.encrypted_private_key)
    const privateKeyBytes = Uint8Array.from(Buffer.from(privateKeyBase64, 'base64'))
    const escrowKeypair = Keypair.fromSecretKey(privateKeyBytes)

    // Verify escrow wallet matches
    if (escrowKeypair.publicKey.toString() !== escrow.escrow_wallet) {
      throw new Error('Escrow wallet mismatch after decryption')
    }

    // Calculate amounts in lamports
    const netAmountLamports = Math.floor(releaseAmounts.netAmount * LAMPORTS_PER_SOL)
    const platformFeeLamports = Math.floor(releaseAmounts.platformFee * LAMPORTS_PER_SOL)
    
    const sellerPubkey = new PublicKey(escrow.seller_wallet)
    const treasuryPubkey = new PublicKey(
      process.env.PLATFORM_TREASURY_WALLET || escrow.buyer_wallet // Fallback to buyer if no treasury
    )

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

    // Create transaction with both transfers
    const transaction = new Transaction({
      feePayer: escrowKeypair.publicKey,
      blockhash,
      lastValidBlockHeight,
    })

    // Transfer net amount to seller
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: sellerPubkey,
        lamports: netAmountLamports,
      })
    )

    // Transfer platform fee to treasury (if > 0)
    if (platformFeeLamports > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: escrowKeypair.publicKey,
          toPubkey: treasuryPubkey,
          lamports: platformFeeLamports,
        })
      )
    }

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [escrowKeypair],
      {
        commitment: 'confirmed',
        maxRetries: 3,
      }
    )

    // Record the release in database
    const releaseResult = await releaseMilestoneFunds({
      milestoneId,
      txSignature: signature,
      triggeredBy: triggeredBy || 'system',
    })

    if (!releaseResult.success) {
      // Transaction succeeded but database update failed
      console.error('Database update failed after successful transaction:', releaseResult.error)
      return NextResponse.json(
        {
          success: true,
          signature,
          warning: 'Funds released but database update failed. Please contact support.',
          amount: milestone.amount,
          netAmount: releaseAmounts.netAmount,
          platformFee: releaseAmounts.platformFee,
        },
        { status: 200 }
      )
    }

    // Send release notification to seller
    try {
      await sendReleaseNotification(
        escrow.seller_wallet,
        escrow.id,
        releaseAmounts.netAmount,
        escrow.token
      )
    } catch (notifError) {
      console.error('Failed to send release notification:', notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      signature,
      milestone: releaseResult.milestone,
      escrowCompleted: releaseResult.escrowCompleted,
      amount: milestone.amount,
      netAmount: releaseAmounts.netAmount,
      platformFee: releaseAmounts.platformFee,
      message: releaseResult.escrowCompleted
        ? 'Milestone released. All milestones completed!'
        : 'Milestone released successfully.',
    })
  } catch (error: any) {
    console.error('Release funds error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to release funds' },
      { status: 500 }
    )
  }
}
