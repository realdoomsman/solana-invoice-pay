/**
 * Rate Limiting Implementation
 * Protects API endpoints from abuse
 * Requirements: 13.6
 */

// ============================================
// RATE LIMIT CONFIGURATION
// ============================================

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}

// ============================================
// IN-MEMORY STORE
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredEntries, 60 * 1000)

// ============================================
// RATE LIMITING LOGIC
// ============================================

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = `ratelimit:${identifier}`
  
  // Get or create entry
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: config.message || 'Rate limit exceeded. Please try again later.'
    }
  }
  
  // Increment count
  entry.count++
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Reset rate limit for identifier
 */
export function resetRateLimit(identifier: string): void {
  const key = `ratelimit:${identifier}`
  rateLimitStore.delete(key)
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const RateLimitPresets = {
  // Strict limits for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many requests. Please try again in 15 minutes.'
  },
  
  // Standard limits for authenticated endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests. Please try again later.'
  },
  
  // Relaxed limits for read operations
  RELAXED: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 300,
    message: 'Too many requests. Please try again later.'
  },
  
  // Very strict for admin operations
  ADMIN: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Admin rate limit exceeded. Please try again later.'
  },
  
  // For transaction operations
  TRANSACTION: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Too many transaction requests. Please wait before trying again.'
  }
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Rate limit by IP address
 */
export function rateLimitByIP(
  ip: string,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): RateLimitResult {
  return checkRateLimit(`ip:${ip}`, config)
}

/**
 * Rate limit by wallet address
 */
export function rateLimitByWallet(
  walletAddress: string,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): RateLimitResult {
  return checkRateLimit(`wallet:${walletAddress}`, config)
}

/**
 * Rate limit by endpoint
 */
export function rateLimitByEndpoint(
  endpoint: string,
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): RateLimitResult {
  return checkRateLimit(`endpoint:${endpoint}:${identifier}`, config)
}

/**
 * Combined rate limit (IP + wallet)
 */
export function rateLimitCombined(
  ip: string,
  walletAddress: string,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): RateLimitResult {
  // Check IP limit
  const ipResult = rateLimitByIP(ip, config)
  if (!ipResult.allowed) {
    return ipResult
  }
  
  // Check wallet limit
  const walletResult = rateLimitByWallet(walletAddress, config)
  if (!walletResult.allowed) {
    return walletResult
  }
  
  return {
    allowed: true,
    remaining: Math.min(ipResult.remaining, walletResult.remaining),
    resetTime: Math.max(ipResult.resetTime, walletResult.resetTime)
  }
}

// ============================================
// SPECIALIZED RATE LIMITERS
// ============================================

/**
 * Rate limit for escrow creation
 */
export function rateLimitEscrowCreation(
  walletAddress: string
): RateLimitResult {
  return rateLimitByWallet(walletAddress, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many escrow creations. Please wait before creating more.'
  })
}

/**
 * Rate limit for dispute raising
 */
export function rateLimitDisputeRaising(
  walletAddress: string
): RateLimitResult {
  return rateLimitByWallet(walletAddress, {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 5,
    message: 'Too many disputes raised. Please wait before raising another dispute.'
  })
}

/**
 * Rate limit for fund releases
 */
export function rateLimitFundRelease(
  escrowId: string
): RateLimitResult {
  return checkRateLimit(`release:${escrowId}`, {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    message: 'Too many release attempts. Please wait before trying again.'
  })
}

/**
 * Rate limit for evidence submission
 */
export function rateLimitEvidenceSubmission(
  walletAddress: string
): RateLimitResult {
  return rateLimitByWallet(walletAddress, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many evidence submissions. Please wait before submitting more.'
  })
}

/**
 * Rate limit for admin actions
 */
export function rateLimitAdminAction(
  adminWallet: string,
  action: string
): RateLimitResult {
  return checkRateLimit(`admin:${adminWallet}:${action}`, RateLimitPresets.ADMIN)
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    ...(result.allowed ? {} : { 'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString() })
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP
  const headers = request.headers
  
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  )
}

// ============================================
// EXPORTS
// ============================================

export default {
  checkRateLimit,
  resetRateLimit,
  rateLimitByIP,
  rateLimitByWallet,
  rateLimitByEndpoint,
  rateLimitCombined,
  rateLimitEscrowCreation,
  rateLimitDisputeRaising,
  rateLimitFundRelease,
  rateLimitEvidenceSubmission,
  rateLimitAdminAction,
  getRateLimitHeaders,
  getClientIP,
  RateLimitPresets
}
