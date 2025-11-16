import { NextRequest, NextResponse } from 'next/server'
import { getPlatformFeePercentage, getTreasuryWallet, getFeeConfigurationSummary } from '@/lib/escrow/fee-handler'

/**
 * GET /api/escrow/fee-config
 * Get current platform fee configuration
 * Requirements: 9.1, 9.4
 */
export async function GET(request: NextRequest) {
  try {
    const config = getFeeConfigurationSummary()
    
    return NextResponse.json({
      success: true,
      feePercentage: config.feePercentage,
      treasuryWallet: config.treasuryWallet,
      network: config.network,
      configured: config.configured
    })
  } catch (error: any) {
    console.error('Error fetching fee config:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch fee configuration',
        feePercentage: 3, // Default fallback
        configured: false
      },
      { status: 500 }
    )
  }
}
