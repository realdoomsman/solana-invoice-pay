import { NextRequest, NextResponse } from 'next/server'
import { detectMultiSigWallet } from '@/lib/escrow/multisig-handler'

/**
 * POST /api/escrow/multisig/detect
 * Detect if a wallet is a multi-sig wallet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Detect multi-sig wallet
    const walletInfo = await detectMultiSigWallet(walletAddress)

    return NextResponse.json({
      success: true,
      walletInfo
    })
  } catch (error: any) {
    console.error('Multi-sig detection error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to detect multi-sig wallet',
        walletInfo: {
          address: '',
          isMultiSig: false
        }
      },
      { status: 500 }
    )
  }
}
