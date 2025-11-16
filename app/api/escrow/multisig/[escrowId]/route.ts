import { NextRequest, NextResponse } from 'next/server'
import { getPendingMultiSigTransactions, recordMultiSigSignature, canWalletSign } from '@/lib/escrow/multisig-handler'
import { verifyWalletSignature } from '@/lib/security/wallet-auth'

/**
 * GET /api/escrow/multisig/[escrowId]
 * Get pending multi-sig transactions for an escrow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { escrowId: string } }
) {
  try {
    const { escrowId } = params

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID is required' },
        { status: 400 }
      )
    }

    const transactions = await getPendingMultiSigTransactions(escrowId)

    return NextResponse.json({
      success: true,
      transactions
    })
  } catch (error: any) {
    console.error('Get multi-sig transactions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get multi-sig transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/escrow/multisig/[escrowId]
 * Record a signature for a multi-sig transaction
 * Body should include: { signerWallet, signature }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { escrowId: string } }
) {
  try {
    const { escrowId: transactionId } = params
    const body = await request.json()
    const { signerWallet, signature } = body

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    if (!signerWallet) {
      return NextResponse.json(
        { error: 'Signer wallet is required' },
        { status: 400 }
      )
    }

    // Verify wallet signature (optional but recommended)
    if (signature) {
      const isValid = await verifyWalletSignature(
        signerWallet,
        `Sign multi-sig transaction: ${transactionId}`,
        signature
      )

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid wallet signature' },
          { status: 401 }
        )
      }
    }

    // Check if wallet can sign
    const { canSign, reason } = await canWalletSign(transactionId, signerWallet)

    if (!canSign) {
      return NextResponse.json(
        { error: reason || 'Cannot sign this transaction' },
        { status: 403 }
      )
    }

    // Record signature
    const updatedTransaction = await recordMultiSigSignature(
      transactionId,
      signerWallet
    )

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Signature recorded successfully'
    })
  } catch (error: any) {
    console.error('Record multi-sig signature error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record signature' },
      { status: 500 }
    )
  }
}
