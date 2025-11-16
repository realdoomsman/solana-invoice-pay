/**
 * Wallet Authentication and Signature Verification
 * Implements secure wallet-based authentication
 * Requirements: 13.4, 13.5
 */

import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import bs58 from 'bs58'

// ============================================
// SIGNATURE VERIFICATION
// ============================================

export interface SignatureVerificationResult {
  valid: boolean
  publicKey?: string
  error?: string
}

/**
 * Verify a wallet signature
 * @param message - The message that was signed
 * @param signature - The signature (base58 encoded)
 * @param publicKey - The public key that signed the message
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): SignatureVerificationResult {
  try {
    // Decode the signature from base58
    const signatureBytes = bs58.decode(signature)
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message)
    
    // Decode public key
    const publicKeyObj = new PublicKey(publicKey)
    const publicKeyBytes = publicKeyObj.toBytes()
    
    // Verify signature
    const valid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    )
    
    return {
      valid,
      publicKey: valid ? publicKey : undefined
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Signature verification failed'
    }
  }
}

/**
 * Generate a challenge message for wallet authentication
 * Includes timestamp to prevent replay attacks
 */
export function generateAuthChallenge(nonce?: string): string {
  const timestamp = Date.now()
  const randomNonce = nonce || Math.random().toString(36).substring(7)
  
  return `Sign this message to authenticate with Escrow System\n\nTimestamp: ${timestamp}\nNonce: ${randomNonce}`
}

/**
 * Verify auth challenge is recent (within 5 minutes)
 */
export function verifyAuthChallengeTimestamp(message: string): boolean {
  try {
    const timestampMatch = message.match(/Timestamp: (\d+)/)
    if (!timestampMatch) return false
    
    const timestamp = parseInt(timestampMatch[1])
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    return (now - timestamp) < fiveMinutes
  } catch {
    return false
  }
}

// ============================================
// REQUEST AUTHENTICATION
// ============================================

export interface AuthenticatedRequest {
  walletAddress: string
  signature: string
  message: string
  timestamp: number
}

/**
 * Verify an authenticated API request
 */
export function verifyAuthenticatedRequest(
  request: AuthenticatedRequest
): SignatureVerificationResult {
  // Verify timestamp is recent
  if (!verifyAuthChallengeTimestamp(request.message)) {
    return {
      valid: false,
      error: 'Authentication challenge expired'
    }
  }
  
  // Verify signature
  return verifyWalletSignature(
    request.message,
    request.signature,
    request.walletAddress
  )
}

// ============================================
// ADMIN VERIFICATION
// ============================================

/**
 * Verify if a wallet is an authorized admin
 */
export function verifyAdminWallet(walletAddress: string): boolean {
  const adminWallets = process.env.ADMIN_WALLETS?.split(',').map(w => w.trim()) || []
  return adminWallets.includes(walletAddress)
}

/**
 * Verify admin request with signature
 */
export function verifyAdminRequest(
  request: AuthenticatedRequest
): SignatureVerificationResult & { isAdmin: boolean } {
  // First verify the signature
  const signatureResult = verifyAuthenticatedRequest(request)
  
  if (!signatureResult.valid) {
    return {
      ...signatureResult,
      isAdmin: false
    }
  }
  
  // Then verify admin status
  const isAdmin = verifyAdminWallet(request.walletAddress)
  
  if (!isAdmin) {
    return {
      valid: false,
      error: 'Wallet is not authorized as admin',
      isAdmin: false
    }
  }
  
  return {
    ...signatureResult,
    isAdmin: true
  }
}

// ============================================
// PARTY VERIFICATION
// ============================================

/**
 * Verify if wallet is a party in the escrow
 */
export function verifyEscrowParty(
  walletAddress: string,
  buyerWallet: string,
  sellerWallet: string
): { isParty: boolean; role?: 'buyer' | 'seller' } {
  if (walletAddress === buyerWallet) {
    return { isParty: true, role: 'buyer' }
  }
  
  if (walletAddress === sellerWallet) {
    return { isParty: true, role: 'seller' }
  }
  
  return { isParty: false }
}

/**
 * Verify party request with signature
 */
export function verifyPartyRequest(
  request: AuthenticatedRequest,
  buyerWallet: string,
  sellerWallet: string
): SignatureVerificationResult & { role?: 'buyer' | 'seller' } {
  // First verify the signature
  const signatureResult = verifyAuthenticatedRequest(request)
  
  if (!signatureResult.valid) {
    return signatureResult
  }
  
  // Then verify party status
  const partyCheck = verifyEscrowParty(
    request.walletAddress,
    buyerWallet,
    sellerWallet
  )
  
  if (!partyCheck.isParty) {
    return {
      valid: false,
      error: 'Wallet is not a party in this escrow'
    }
  }
  
  return {
    ...signatureResult,
    role: partyCheck.role
  }
}

// ============================================
// NONCE MANAGEMENT (Replay Protection)
// ============================================

// In-memory nonce store (use Redis in production)
const usedNonces = new Set<string>()
const nonceExpiry = new Map<string, number>()

/**
 * Check if nonce has been used
 */
export function isNonceUsed(nonce: string): boolean {
  // Clean up expired nonces
  const now = Date.now()
  for (const [n, expiry] of nonceExpiry.entries()) {
    if (expiry < now) {
      usedNonces.delete(n)
      nonceExpiry.delete(n)
    }
  }
  
  return usedNonces.has(nonce)
}

/**
 * Mark nonce as used
 */
export function markNonceUsed(nonce: string, expiryMs: number = 5 * 60 * 1000): void {
  usedNonces.add(nonce)
  nonceExpiry.set(nonce, Date.now() + expiryMs)
}

/**
 * Extract nonce from auth message
 */
export function extractNonce(message: string): string | null {
  const nonceMatch = message.match(/Nonce: ([a-zA-Z0-9]+)/)
  return nonceMatch ? nonceMatch[1] : null
}

/**
 * Verify request with nonce replay protection
 */
export function verifyRequestWithReplayProtection(
  request: AuthenticatedRequest
): SignatureVerificationResult {
  // Extract nonce
  const nonce = extractNonce(request.message)
  
  if (!nonce) {
    return {
      valid: false,
      error: 'No nonce found in authentication message'
    }
  }
  
  // Check if nonce already used
  if (isNonceUsed(nonce)) {
    return {
      valid: false,
      error: 'Nonce already used (replay attack detected)'
    }
  }
  
  // Verify signature
  const result = verifyAuthenticatedRequest(request)
  
  if (result.valid) {
    // Mark nonce as used
    markNonceUsed(nonce)
  }
  
  return result
}

// ============================================
// EXPORTS
// ============================================

export default {
  verifyWalletSignature,
  generateAuthChallenge,
  verifyAuthChallengeTimestamp,
  verifyAuthenticatedRequest,
  verifyAdminWallet,
  verifyAdminRequest,
  verifyEscrowParty,
  verifyPartyRequest,
  isNonceUsed,
  markNonceUsed,
  extractNonce,
  verifyRequestWithReplayProtection
}
