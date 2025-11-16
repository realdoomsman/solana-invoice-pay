import { NextRequest, NextResponse } from 'next/server'
import { createTraditionalEscrow } from '@/lib/escrow/traditional'
import { createAtomicSwap } from '@/lib/escrow/atomic-swap'
import { invalidateEscrowCache } from '@/lib/query-cache'
import { 
  checkAccess, 
  rateLimitEscrowCreation,
  validateEscrowCreation,
  getClientIP,
  getRateLimitHeaders
} from '@/lib/security'

/**
 * POST /api/escrow/create
 * Creates an escrow contract based on type
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

    const body = await request.json()
    
    // Access control check
    const accessResult = await checkAccess(request, {
      requireAuth: true,
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
    
    // Additional rate limit for escrow creation
    const creationRateLimit = rateLimitEscrowCreation(walletAddress)
    if (!creationRateLimit.allowed) {
      return NextResponse.json(
        { error: creationRateLimit.error },
        { 
          status: 429,
          headers: getRateLimitHeaders(creationRateLimit)
        }
      )
    }
    const { escrowType } = body

    if (!escrowType) {
      return NextResponse.json(
        { error: 'Escrow type is required' },
        { status: 400 }
      )
    }
    
    // Validate that the authenticated wallet matches the creator
    if (escrowType === 'traditional' && body.buyerWallet !== walletAddress) {
      return NextResponse.json(
        { error: 'Authenticated wallet must match buyer wallet' },
        { status: 403 }
      )
    }
    
    if (escrowType === 'atomic_swap' && body.partyAWallet !== walletAddress) {
      return NextResponse.json(
        { error: 'Authenticated wallet must match party A wallet' },
        { status: 403 }
      )
    }

    let result

    switch (escrowType) {
      case 'traditional':
        // Validate input data
        const validationResult = validateEscrowCreation({
          buyerWallet: body.buyerWallet,
          sellerWallet: body.sellerWallet,
          buyerAmount: body.buyerAmount,
          token: body.token,
          description: body.description,
          timeoutHours: body.timeoutHours
        })
        
        if (!validationResult.valid) {
          return NextResponse.json(
            { error: validationResult.error },
            { status: 400 }
          )
        }
        
        result = await createTraditionalEscrow({
          buyerWallet: body.buyerWallet,
          sellerWallet: body.sellerWallet,
          buyerAmount: body.buyerAmount,
          sellerSecurityDeposit: body.sellerSecurityDeposit,
          token: body.token,
          description: body.description,
          timeoutHours: body.timeoutHours
        })
        break

      case 'simple_buyer':
        // Simple buyer escrow creation is handled by existing API
        // For now, return not implemented
        return NextResponse.json(
          { error: 'Simple buyer escrow creation not yet implemented in this endpoint. Use existing flow.' },
          { status: 501 }
        )

      case 'atomic_swap':
        result = await createAtomicSwap({
          partyAWallet: body.partyAWallet,
          partyBWallet: body.partyBWallet,
          partyAAsset: body.partyAAsset,
          partyBAsset: body.partyBAsset,
          timeoutHours: body.timeoutHours
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid escrow type' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Invalidate escrow list caches for both parties
    if (result.escrow) {
      invalidateEscrowCache(result.escrow.id)
    }

    return NextResponse.json({
      success: true,
      escrow: result.escrow,
      milestones: result.milestones,
      paymentLink: result.paymentLink
    })
  } catch (error: any) {
    console.error('Create escrow error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    )
  }
}
