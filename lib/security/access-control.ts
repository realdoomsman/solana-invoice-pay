/**
 * Comprehensive Access Control System
 * Integrates wallet authentication, role verification, and rate limiting
 * Requirements: 13.1-13.6
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAuthenticatedRequest,
  verifyAdminRequest,
  verifyPartyRequest,
  verifyRequestWithReplayProtection,
  AuthenticatedRequest,
} from './wallet-auth'
import {
  rateLimitByIP,
  rateLimitByWallet,
  rateLimitCombined,
  getRateLimitHeaders,
  getClientIP,
  RateLimitConfig,
  RateLimitPresets,
} from './rate-limiter'
import {
  validateWalletAddress,
  validateId,
  ValidationResult,
} from './input-validation'
import { supabase } from '@/lib/supabase'

// ============================================
// ACCESS CONTROL TYPES
// ============================================

export interface AccessControlOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  requireParty?: boolean
  escrowId?: string
  rateLimitConfig?: RateLimitConfig
  allowAnonymous?: boolean
  replayProtection?: boolean
}

export interface AccessControlResult {
  allowed: boolean
  walletAddress?: string
  role?: 'buyer' | 'seller' | 'admin'
  error?: string
  statusCode?: number
  headers?: Record<string, string>
}

export interface EscrowParties {
  buyerWallet: string
  sellerWallet: string
}

// ============================================
// REQUEST PARSING
// ============================================

/**
 * Extract authentication data from request
 */
export async function extractAuthData(
  request: NextRequest
): Promise<AuthenticatedRequest | null> {
  try {
    const body = await request.json()
    
    const { walletAddress, signature, message, timestamp } = body
    
    if (!walletAddress || !signature || !message) {
      return null
    }
    
    return {
      walletAddress,
      signature,
      message,
      timestamp: timestamp || Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * Extract wallet address from request (for simpler endpoints)
 */
export async function extractWalletAddress(
  request: NextRequest
): Promise<string | null> {
  try {
    const body = await request.json()
    return body.walletAddress || body.wallet || null
  } catch {
    return null
  }
}

// ============================================
// ESCROW PARTY VERIFICATION
// ============================================

/**
 * Get escrow parties from database
 */
export async function getEscrowParties(
  escrowId: string
): Promise<EscrowParties | null> {
  try {
    const { data: escrow, error } = await supabase
      .from('escrow_contracts')
      .select('buyer_wallet, seller_wallet')
      .eq('id', escrowId)
      .single()
    
    if (error || !escrow) {
      return null
    }
    
    return {
      buyerWallet: escrow.buyer_wallet,
      sellerWallet: escrow.seller_wallet,
    }
  } catch {
    return null
  }
}

/**
 * Verify wallet is a party in the escrow
 */
export async function verifyEscrowAccess(
  walletAddress: string,
  escrowId: string
): Promise<{ allowed: boolean; role?: 'buyer' | 'seller'; error?: string }> {
  // Validate inputs
  const walletValidation = validateWalletAddress(walletAddress)
  if (!walletValidation.valid) {
    return { allowed: false, error: walletValidation.error }
  }
  
  const idValidation = validateId(escrowId, 'Escrow ID')
  if (!idValidation.valid) {
    return { allowed: false, error: idValidation.error }
  }
  
  // Get escrow parties
  const parties = await getEscrowParties(escrowId)
  if (!parties) {
    return { allowed: false, error: 'Escrow not found' }
  }
  
  // Check if wallet is a party
  if (walletAddress === parties.buyerWallet) {
    return { allowed: true, role: 'buyer' }
  }
  
  if (walletAddress === parties.sellerWallet) {
    return { allowed: true, role: 'seller' }
  }
  
  return { allowed: false, error: 'Not authorized to access this escrow' }
}

// ============================================
// COMPREHENSIVE ACCESS CONTROL
// ============================================

/**
 * Perform comprehensive access control check
 */
export async function checkAccess(
  request: NextRequest,
  options: AccessControlOptions = {}
): Promise<AccessControlResult> {
  const {
    requireAuth = false,
    requireAdmin = false,
    requireParty = false,
    escrowId,
    rateLimitConfig = RateLimitPresets.STANDARD,
    allowAnonymous = false,
    replayProtection = true,
  } = options
  
  // Get client IP for rate limiting
  const clientIP = getClientIP(request)
  
  // If anonymous allowed and no auth required, just rate limit by IP
  if (allowAnonymous && !requireAuth && !requireAdmin && !requireParty) {
    const rateLimitResult = rateLimitByIP(clientIP, rateLimitConfig)
    
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        error: rateLimitResult.error,
        statusCode: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    }
    
    return {
      allowed: true,
      headers: getRateLimitHeaders(rateLimitResult),
    }
  }
  
  // Extract authentication data
  const authData = await extractAuthData(request)
  
  if (!authData) {
    return {
      allowed: false,
      error: 'Authentication required. Please provide walletAddress, signature, and message.',
      statusCode: 401,
    }
  }
  
  // Verify signature with optional replay protection
  const signatureResult = replayProtection
    ? verifyRequestWithReplayProtection(authData)
    : verifyAuthenticatedRequest(authData)
  
  if (!signatureResult.valid) {
    return {
      allowed: false,
      error: signatureResult.error || 'Invalid signature',
      statusCode: 401,
    }
  }
  
  const walletAddress = authData.walletAddress
  
  // Rate limit by wallet and IP
  const rateLimitResult = rateLimitCombined(clientIP, walletAddress, rateLimitConfig)
  
  if (!rateLimitResult.allowed) {
    return {
      allowed: false,
      error: rateLimitResult.error,
      statusCode: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    }
  }
  
  // Check admin requirement
  if (requireAdmin) {
    const adminResult = verifyAdminRequest(authData)
    
    if (!adminResult.isAdmin) {
      return {
        allowed: false,
        error: 'Admin privileges required',
        statusCode: 403,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    }
    
    return {
      allowed: true,
      walletAddress,
      role: 'admin',
      headers: getRateLimitHeaders(rateLimitResult),
    }
  }
  
  // Check party requirement
  if (requireParty && escrowId) {
    const parties = await getEscrowParties(escrowId)
    
    if (!parties) {
      return {
        allowed: false,
        error: 'Escrow not found',
        statusCode: 404,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    }
    
    const partyResult = verifyPartyRequest(
      authData,
      parties.buyerWallet,
      parties.sellerWallet
    )
    
    if (!partyResult.valid) {
      return {
        allowed: false,
        error: partyResult.error || 'Not authorized to access this escrow',
        statusCode: 403,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    }
    
    return {
      allowed: true,
      walletAddress,
      role: partyResult.role,
      headers: getRateLimitHeaders(rateLimitResult),
    }
  }
  
  // Basic authentication passed
  return {
    allowed: true,
    walletAddress,
    headers: getRateLimitHeaders(rateLimitResult),
  }
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Create access control middleware for API routes
 */
export function withAccessControl(
  handler: (
    request: NextRequest,
    context: { walletAddress: string; role?: string }
  ) => Promise<NextResponse>,
  options: AccessControlOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Perform access control check
    const accessResult = await checkAccess(request, options)
    
    // If not allowed, return error response
    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.error },
        {
          status: accessResult.statusCode || 403,
          headers: accessResult.headers,
        }
      )
    }
    
    // Add rate limit headers to response
    const response = await handler(request, {
      walletAddress: accessResult.walletAddress!,
      role: accessResult.role,
    })
    
    // Add rate limit headers
    if (accessResult.headers) {
      Object.entries(accessResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    
    return response
  }
}

/**
 * Verify admin access (simplified)
 */
export async function verifyAdminAccess(
  request: NextRequest
): Promise<AccessControlResult> {
  return checkAccess(request, {
    requireAuth: true,
    requireAdmin: true,
    rateLimitConfig: RateLimitPresets.ADMIN,
    replayProtection: true,
  })
}

/**
 * Verify party access to escrow (simplified)
 */
export async function verifyPartyAccess(
  request: NextRequest,
  escrowId: string
): Promise<AccessControlResult> {
  return checkAccess(request, {
    requireAuth: true,
    requireParty: true,
    escrowId,
    rateLimitConfig: RateLimitPresets.STANDARD,
    replayProtection: true,
  })
}

/**
 * Verify transaction access (stricter rate limits)
 */
export async function verifyTransactionAccess(
  request: NextRequest,
  escrowId?: string
): Promise<AccessControlResult> {
  return checkAccess(request, {
    requireAuth: true,
    requireParty: escrowId ? true : false,
    escrowId,
    rateLimitConfig: RateLimitPresets.TRANSACTION,
    replayProtection: true,
  })
}

// ============================================
// ROLE-BASED ACTION VERIFICATION
// ============================================

/**
 * Verify if wallet can perform specific action on escrow
 */
export async function verifyEscrowAction(
  walletAddress: string,
  escrowId: string,
  action: 'approve' | 'submit' | 'dispute' | 'confirm' | 'release'
): Promise<{ allowed: boolean; error?: string }> {
  // Get escrow details
  const { data: escrow, error } = await supabase
    .from('escrow_contracts')
    .select('*')
    .eq('id', escrowId)
    .single()
  
  if (error || !escrow) {
    return { allowed: false, error: 'Escrow not found' }
  }
  
  // Check if wallet is a party
  const isBuyer = walletAddress === escrow.buyer_wallet
  const isSeller = walletAddress === escrow.seller_wallet
  
  if (!isBuyer && !isSeller) {
    return { allowed: false, error: 'Not a party in this escrow' }
  }
  
  // Action-specific checks
  switch (action) {
    case 'approve':
      // Only buyer can approve milestones
      if (!isBuyer) {
        return { allowed: false, error: 'Only buyer can approve milestones' }
      }
      break
    
    case 'submit':
      // Only seller can submit work
      if (!isSeller) {
        return { allowed: false, error: 'Only seller can submit work' }
      }
      break
    
    case 'confirm':
      // Both parties can confirm
      if (!isBuyer && !isSeller) {
        return { allowed: false, error: 'Only parties can confirm' }
      }
      break
    
    case 'dispute':
      // Both parties can raise disputes
      if (!isBuyer && !isSeller) {
        return { allowed: false, error: 'Only parties can raise disputes' }
      }
      break
    
    case 'release':
      // Only buyer can release funds (or admin)
      if (!isBuyer) {
        return { allowed: false, error: 'Only buyer can release funds' }
      }
      break
    
    default:
      return { allowed: false, error: 'Unknown action' }
  }
  
  return { allowed: true }
}

// ============================================
// EXPORTS
// ============================================

export default {
  checkAccess,
  withAccessControl,
  verifyAdminAccess,
  verifyPartyAccess,
  verifyTransactionAccess,
  verifyEscrowAccess,
  verifyEscrowAction,
  getEscrowParties,
  extractAuthData,
  extractWalletAddress,
}
