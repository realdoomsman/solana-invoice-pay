import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { recoverKeypairFromEncrypted } from '@/lib/escrow/wallet-manager'
import {
  verifyAdminAccess,
  rateLimitAdminAction,
  validateId,
  validateText,
  getRateLimitHeaders
} from '@/lib/security'

/**
 * POST /api/admin/escrow/resolve
 * Admin resolution of disputes
 * Requirements: 6.6, 13.1-13.6, 14.3, 14.4
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

    const { 
      disputeId, 
      escrowId,
      adminWallet, 
      resolutionAction, 
      notes,
      amountToBuyer,
      amountToSeller
    } = await request.json()

    // Validate required fields
    if (!disputeId || !escrowId || !adminWallet || !resolutionAction || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: disputeId, escrowId, adminWallet, resolutionAction, and notes are required' },
        { status: 400 }
      )
    }
    
    // Admin access control check
    const accessResult = await verifyAdminAccess(request)
    
    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.error },
        { 
          status: accessResult.statusCode || 403,
          headers: accessResult.headers 
        }
      )
    }
    
    const authenticatedWallet = accessResult.walletAddress!
    
    // Verify authenticated wallet matches admin wallet
    if (authenticatedWallet !== adminWallet) {
      return NextResponse.json(
        { error: 'Authenticated wallet must match admin wallet' },
        { status: 403 }
      )
    }
    
    // Additional rate limit for admin actions
    const adminRateLimit = rateLimitAdminAction(adminWallet, 'resolve_dispute')
    if (!adminRateLimit.allowed) {
      return NextResponse.json(
        { error: adminRateLimit.error },
        { 
          status: 429,
          headers: getRateLimitHeaders(adminRateLimit)
        }
      )
    }
    
    // Validate IDs
    const disputeIdValidation = validateId(disputeId, 'Dispute ID')
    if (!disputeIdValidation.valid) {
      return NextResponse.json(
        { error: disputeIdValidation.error },
        { status: 400 }
      )
    }
    
    const escrowIdValidation = validateId(escrowId, 'Escrow ID')
    if (!escrowIdValidation.valid) {
      return NextResponse.json(
        { error: escrowIdValidation.error },
        { status: 400 }
      )
    }
    
    // Validate notes
    const notesValidation = validateText(notes, { 
      required: true, 
      minLength: 20,
      maxLength: 2000 
    })
    if (!notesValidation.valid) {
      return NextResponse.json(
        { error: notesValidation.error },
        { status: 400 }
      )
    }

    // Validate resolution action
    const validActions = ['release_to_seller', 'refund_to_buyer', 'partial_split', 'other']
    if (!validActions.includes(resolutionAction)) {
      return NextResponse.json(
        { error: `Invalid resolution action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate notes length
    if (notes.trim().length < 20) {
      return NextResponse.json(
        { error: 'Resolution notes must be at least 20 characters to provide sufficient explanation' },
        { status: 400 }
      )
    }

    // Validate partial split amounts
    if (resolutionAction === 'partial_split') {
      if (amountToBuyer === undefined || amountToSeller === undefined) {
        return NextResponse.json(
          { error: 'Partial split requires amountToBuyer and amountToSeller' },
          { status: 400 }
        )
      }
    }

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .select('*')
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      )
    }

    // Check if dispute is already resolved
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      return NextResponse.json(
        { error: 'Dispute is already resolved' },
        { status: 400 }
      )
    }

    // Initialize Solana connection
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )

    // Decrypt escrow wallet private key
    const escrowKeypair = recoverKeypairFromEncrypted(escrow.encrypted_private_key)

    let txSignatureBuyer: string | null = null
    let txSignatureSeller: string | null = null
    let finalAmountToBuyer = 0
    let finalAmountToSeller = 0

    // Execute on-chain transactions based on resolution action
    if (resolutionAction === 'release_to_seller') {
      // Release all funds to seller
      finalAmountToSeller = escrow.buyer_amount
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: escrowKeypair.publicKey,
          toPubkey: new PublicKey(escrow.seller_wallet),
          lamports: Math.floor(escrow.buyer_amount * LAMPORTS_PER_SOL),
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = escrowKeypair.publicKey
      transaction.sign(escrowKeypair)

      txSignatureSeller = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(txSignatureSeller, 'confirmed')

    } else if (resolutionAction === 'refund_to_buyer') {
      // Refund all funds to buyer
      finalAmountToBuyer = escrow.buyer_amount

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: escrowKeypair.publicKey,
          toPubkey: new PublicKey(escrow.buyer_wallet),
          lamports: Math.floor(escrow.buyer_amount * LAMPORTS_PER_SOL),
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = escrowKeypair.publicKey
      transaction.sign(escrowKeypair)

      txSignatureBuyer = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(txSignatureBuyer, 'confirmed')

    } else if (resolutionAction === 'partial_split') {
      // Split funds between buyer and seller
      finalAmountToBuyer = amountToBuyer
      finalAmountToSeller = amountToSeller

      // Validate split amounts
      if (finalAmountToBuyer + finalAmountToSeller > escrow.buyer_amount) {
        return NextResponse.json(
          { error: 'Split amounts exceed total escrow amount' },
          { status: 400 }
        )
      }

      // Send to buyer if amount > 0
      if (finalAmountToBuyer > 0) {
        const buyerTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: escrowKeypair.publicKey,
            toPubkey: new PublicKey(escrow.buyer_wallet),
            lamports: Math.floor(finalAmountToBuyer * LAMPORTS_PER_SOL),
          })
        )

        const { blockhash: buyerBlockhash } = await connection.getLatestBlockhash()
        buyerTx.recentBlockhash = buyerBlockhash
        buyerTx.feePayer = escrowKeypair.publicKey
        buyerTx.sign(escrowKeypair)

        txSignatureBuyer = await connection.sendRawTransaction(buyerTx.serialize())
        await connection.confirmTransaction(txSignatureBuyer, 'confirmed')
      }

      // Send to seller if amount > 0
      if (finalAmountToSeller > 0) {
        const sellerTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: escrowKeypair.publicKey,
            toPubkey: new PublicKey(escrow.seller_wallet),
            lamports: Math.floor(finalAmountToSeller * LAMPORTS_PER_SOL),
          })
        )

        const { blockhash: sellerBlockhash } = await connection.getLatestBlockhash()
        sellerTx.recentBlockhash = sellerBlockhash
        sellerTx.feePayer = escrowKeypair.publicKey
        sellerTx.sign(escrowKeypair)

        txSignatureSeller = await connection.sendRawTransaction(sellerTx.serialize())
        await connection.confirmTransaction(txSignatureSeller, 'confirmed')
      }
    }

    // Record admin action
    const adminActionId = nanoid(12)
    const { error: adminActionError } = await supabase
      .from('escrow_admin_actions')
      .insert({
        id: adminActionId,
        escrow_id: escrowId,
        dispute_id: disputeId,
        milestone_id: dispute.milestone_id || null,
        admin_wallet: adminWallet,
        action: 'resolved_dispute',
        decision: resolutionAction,
        amount_to_buyer: finalAmountToBuyer,
        amount_to_seller: finalAmountToSeller,
        tx_signature_buyer: txSignatureBuyer,
        tx_signature_seller: txSignatureSeller,
        notes: notes,
      })

    if (adminActionError) {
      console.error('Failed to record admin action:', adminActionError)
    }

    // Update dispute status
    const { error: updateDisputeError } = await supabase
      .from('escrow_disputes')
      .update({
        status: 'resolved',
        resolution: notes,
        resolution_action: resolutionAction,
        resolved_by: adminWallet,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    if (updateDisputeError) {
      console.error('Failed to update dispute:', updateDisputeError)
    }

    // Update escrow status
    const { error: updateEscrowError } = await supabase
      .from('escrow_contracts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', escrowId)

    if (updateEscrowError) {
      console.error('Failed to update escrow:', updateEscrowError)
    }

    // Log action
    await supabase.from('escrow_actions').insert({
      id: nanoid(12),
      escrow_id: escrowId,
      milestone_id: dispute.milestone_id || null,
      actor_wallet: adminWallet,
      action_type: 'admin_action',
      notes: `Admin resolved dispute: ${resolutionAction}`,
      metadata: {
        dispute_id: disputeId,
        resolution_action: resolutionAction,
        amount_to_buyer: finalAmountToBuyer,
        amount_to_seller: finalAmountToSeller,
      },
    })

    // Notify both parties
    await supabase.from('escrow_notifications').insert([
      {
        id: nanoid(12),
        escrow_id: escrowId,
        recipient_wallet: escrow.buyer_wallet,
        notification_type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: `Admin has resolved the dispute. Resolution: ${resolutionAction.replace('_', ' ')}`,
        link: `/escrow/${escrowId}`,
        read: false,
        sent_browser: false,
        sent_email: false,
      },
      {
        id: nanoid(12),
        escrow_id: escrowId,
        recipient_wallet: escrow.seller_wallet,
        notification_type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: `Admin has resolved the dispute. Resolution: ${resolutionAction.replace('_', ' ')}`,
        link: `/escrow/${escrowId}`,
        read: false,
        sent_browser: false,
        sent_email: false,
      },
    ])

    return NextResponse.json({
      success: true,
      resolution: {
        dispute_id: disputeId,
        escrow_id: escrowId,
        resolution_action: resolutionAction,
        amount_to_buyer: finalAmountToBuyer,
        amount_to_seller: finalAmountToSeller,
        tx_signature_buyer: txSignatureBuyer,
        tx_signature_seller: txSignatureSeller,
        notes: notes,
      },
    })
  } catch (error: any) {
    console.error('Resolve dispute error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resolve dispute' },
      { status: 500 }
    )
  }
}
