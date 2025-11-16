/**
 * Security Module Exports
 * Central export point for all security features
 */

// Access Control
export {
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
  type AccessControlOptions,
  type AccessControlResult,
  type EscrowParties,
} from './access-control'

// Wallet Authentication
export {
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
  verifyRequestWithReplayProtection,
  type SignatureVerificationResult,
  type AuthenticatedRequest,
} from './wallet-auth'

// Rate Limiting
export {
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
  RateLimitPresets,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter'

// Input Validation
export {
  validateWalletAddress,
  validateAmount,
  validateText,
  validateToken,
  validateId,
  validateTxSignature,
  validatePercentage,
  validateTimeoutHours,
  validateUrl,
  validateEscrowCreation,
  type ValidationResult,
} from './input-validation'

// Re-export default objects for convenience
export { default as walletAuth } from './wallet-auth'
export { default as rateLimiter } from './rate-limiter'
export { default as inputValidation } from './input-validation'
export { default as accessControl } from './access-control'
