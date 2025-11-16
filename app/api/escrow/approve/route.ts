import { NextRequest, NextResponse } from 'next/server'
import { 
  approveMilestone, 
  releaseMilestoneFunds, 
  calculateMilestoneReleaseAmount 
} from '@/lib/escrow/simple-buyer'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'
import { decryptPrivateKey } from '@/lib/escrow/wallet-manager'
import { supabase } from '@/lib/supabase'
import { 
  checkAccess,
  verifyEscrowAction,
  validateId,
  RateLimitPresets
} from '@/lib/security'
import { sendApprovalNotification } from '@/lib/notifications/send-notification'

/**
 * POST /api/escrow/approve
 * Approve milestone and release funds
 * Requirements: 13.1-13.6
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    const { milestoneId, buyerWallet, notes } = await request.json()

    if (!milestoneId || !buyerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: milestoneId and buyerWallet are required' },
        { status: 400 }
      )
    }
    
    // Validate milestone ID
    const idValidation = validateId(milestoneId, 'Milestone ID')
    if (!idValidation.valid) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      )
    }
    
    // Get milestone to find escrow ID
    const { data: milestone, error: milestoneError } = await supabase
      .from('escrow_milestones')
      .select('escrow_id')
      .eq('id', milestoneId)
      .single()
    
    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }
    
    // Access control check with transaction rate limits
    const accessResult = await checkAccess(request, {
      requireAuth: true,
      requireParty: true,
      escrowId: milestone.escrow_id,
      rateLimitConfig: RateLimitPresets.TRANSACTION,
      replayProtection: true,
    })
    
    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.error },
        { 
          status: accessResult.statusCode || 403,
          headers: accessResult.headers 
        }
      )
    }
    
    const walletAddress = accessResult.walletAddress!
    
    // Verify wallet matches buyer wallet
    if (walletAddress !== buyerWallet) {
      return NextResponse.json(
        { error: 'Authenticated wallet must match buyer wallet' },
        { status: 403 }
      )
    }
    
    // Verify buyer can approve
    const actionCheck = await verifyEscrowAction(
      walletAddress,
      milestone.escrow_id,
      'approve'
    )
    
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { error: actionCheck.error },
        { status: 403 }
      )
    }

    // Step 1: Approve the milestone
    const approvalResult = await approveMilestone({
      milestoneId,
      buyerWallet,
      notes,
    })

    if (!approvalResult.success) {
      return NextResponse.json(
        { error: approvalResult.error },
        { status: 400 }
      )
    }

    // Step 2: If approval succeeded and should release, execute on-chain transfer
    if (approvalResult.shouldRelease && approvalResult.milestone) {
      const milestone = approvalResult.milestone

      // Fetch escrow details
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_contracts')
        .select('*')
        .eq('id', milestone.escrow_id)
        .single()

      if (escrowError || !escrow) {
        return NextResponse.json(
          { 
            success: true,
            milestone: approvalResult.milestone,
            warning: 'Milestone approved but escrow not found for fund release',
          },
          { status: 200 }
        )
      }

      // Calculate release amounts (net amount after platform fee)
      const releaseAmounts = calculateMilestoneReleaseAmount(milestone.amount)

      try {
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

        // Step 3: Record the release in database
        const releaseResult = await releaseMilestoneFunds({
          milestoneId,
          txSignature: signature,
          triggeredBy: buyerWallet,
        })

        if (!releaseResult.success) {
          // Transaction succeeded but database update failed
          console.error('Database update failed after successful transaction:', releaseResult.error)
          return NextResponse.json(
            {
              success: true,
              signature,
              milestone: approvalResult.milestone,
              warning: 'Funds released but database update failed. Please contact support.',
              amount: milestone.amount,
              netAmount: releaseAmounts.netAmount,
              platformFee: releaseAmounts.platformFee,
            },
            { status: 200 }
          )
        }

        // Send approval notification to seller
        try {
          await sendApprovalNotification(
            escrow.seller_wallet,
            milestone.escrow_id,
            milestoneId,
            milestone.description,
            releaseAmounts.netAmount,
            escrow.token
          )
        } catch (notifError) {
          console.error('Failed to send approval notification:', notifError)
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
            ? 'Milestone approved and released. All milestones completed!'
            : 'Milestone approved and funds released successfully.',
        })
      } catch (txError: any) {
        console.error('Transaction error during milestone release:', txError)
        
        // Milestone was approved but transaction failed
        // Return partial success
        return NextResponse.json(
          {
            success: true,
            milestone: approvalResult.milestone,
            error: `Milestone approved but fund release failed: ${txError.message}`,
            warning: 'Please try releasing funds manually or contact support.',
          },
          { status: 200 }
        )
      }
    }

    // If no release needed (shouldn't happen, but handle gracefully)
    return NextResponse.json({
      success: true,
      milestone: approvalResult.milestone,
      shouldRelease: approvalResult.shouldRelease,
      message: 'Milestone approved.',
    })
  } catch (error: any) {
    console.error('Approve milestone error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve milestone' },
      { status: 500 }
    )
  }
}
