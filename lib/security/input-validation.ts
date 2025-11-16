/**
 * Input Validation and Sanitization
 * Comprehensive input validation for security
 * Requirements: 13.6
 */

import { PublicKey } from '@solana/web3.js'

// ============================================
// WALLET ADDRESS VALIDATION
// ============================================

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: any
}

/**
 * Validate Solana wallet address
 */
export function validateWalletAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      valid: false,
      error: 'Wallet address is required'
    }
  }
  
  // Trim whitespace
  const trimmed = address.trim()
  
  // Check length (Solana addresses are 32-44 characters in base58)
  if (trimmed.length < 32 || trimmed.length > 44) {
    return {
      valid: false,
      error: 'Invalid wallet address length'
    }
  }
  
  // Validate it's a valid Solana public key
  try {
    new PublicKey(trimmed)
    return {
      valid: true,
      sanitized: trimmed
    }
  } catch {
    return {
      valid: false,
      error: 'Invalid Solana wallet address format'
    }
  }
}

// ============================================
// AMOUNT VALIDATION
// ============================================

/**
 * Validate monetary amount
 */
export function validateAmount(
  amount: any,
  options: {
    min?: number
    max?: number
    allowZero?: boolean
  } = {}
): ValidationResult {
  // Check decimal places before parsing (if string)
  if (typeof amount === 'string') {
    const trimmed = amount.trim()
    const decimalIndex = trimmed.indexOf('.')
    if (decimalIndex !== -1) {
      const decimalPlaces = trimmed.length - decimalIndex - 1
      if (decimalPlaces > 9) {
        return {
          valid: false,
          error: 'Amount has too many decimal places (max 9)'
        }
      }
    }
  }
  
  // Check if number
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (typeof num !== 'number' || isNaN(num)) {
    return {
      valid: false,
      error: 'Amount must be a valid number'
    }
  }
  
  // Check if positive
  if (!options.allowZero && num <= 0) {
    return {
      valid: false,
      error: 'Amount must be greater than zero'
    }
  }
  
  if (options.allowZero && num < 0) {
    return {
      valid: false,
      error: 'Amount cannot be negative'
    }
  }
  
  // Check minimum
  if (options.min !== undefined && num < options.min) {
    return {
      valid: false,
      error: `Amount must be at least ${options.min}`
    }
  }
  
  // Check maximum
  if (options.max !== undefined && num > options.max) {
    return {
      valid: false,
      error: `Amount cannot exceed ${options.max}`
    }
  }
  
  return {
    valid: true,
    sanitized: num
  }
}

// ============================================
// STRING VALIDATION
// ============================================

/**
 * Validate and sanitize text input
 */
export function validateText(
  text: any,
  options: {
    minLength?: number
    maxLength?: number
    required?: boolean
    allowEmpty?: boolean
  } = {}
): ValidationResult {
  // Check if string
  if (typeof text !== 'string') {
    if (options.required) {
      return {
        valid: false,
        error: 'Text is required'
      }
    }
    return {
      valid: true,
      sanitized: ''
    }
  }
  
  // Trim whitespace
  const trimmed = text.trim()
  
  // Check if empty
  if (!options.allowEmpty && trimmed.length === 0) {
    if (options.required) {
      return {
        valid: false,
        error: 'Text cannot be empty'
      }
    }
    return {
      valid: true,
      sanitized: ''
    }
  }
  
  // Check minimum length
  if (options.minLength && trimmed.length < options.minLength) {
    return {
      valid: false,
      error: `Text must be at least ${options.minLength} characters`
    }
  }
  
  // Check maximum length
  if (options.maxLength && trimmed.length > options.maxLength) {
    return {
      valid: false,
      error: `Text cannot exceed ${options.maxLength} characters`
    }
  }
  
  // Basic XSS prevention - remove script tags
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  return {
    valid: true,
    sanitized
  }
}

// ============================================
// TOKEN VALIDATION
// ============================================

const SUPPORTED_TOKENS = ['SOL', 'USDC', 'USDT']

/**
 * Validate token type
 */
export function validateToken(token: string): ValidationResult {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Token is required'
    }
  }
  
  const upperToken = token.toUpperCase().trim()
  
  if (!SUPPORTED_TOKENS.includes(upperToken)) {
    return {
      valid: false,
      error: `Unsupported token. Must be one of: ${SUPPORTED_TOKENS.join(', ')}`
    }
  }
  
  return {
    valid: true,
    sanitized: upperToken
  }
}

// ============================================
// ID VALIDATION
// ============================================

/**
 * Validate ID format (nanoid)
 */
export function validateId(id: string, fieldName: string = 'ID'): ValidationResult {
  if (!id || typeof id !== 'string') {
    return {
      valid: false,
      error: `${fieldName} is required`
    }
  }
  
  const trimmed = id.trim()
  
  // Check length (nanoid default is 21, we use 12)
  if (trimmed.length < 8 || trimmed.length > 32) {
    return {
      valid: false,
      error: `Invalid ${fieldName} format`
    }
  }
  
  // Check characters (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid ${fieldName} format`
    }
  }
  
  return {
    valid: true,
    sanitized: trimmed
  }
}

// ============================================
// TRANSACTION SIGNATURE VALIDATION
// ============================================

/**
 * Validate Solana transaction signature
 */
export function validateTxSignature(signature: string): ValidationResult {
  if (!signature || typeof signature !== 'string') {
    return {
      valid: false,
      error: 'Transaction signature is required'
    }
  }
  
  const trimmed = signature.trim()
  
  // Solana signatures are base58 encoded, typically 87-88 characters
  if (trimmed.length < 80 || trimmed.length > 90) {
    return {
      valid: false,
      error: 'Invalid transaction signature length'
    }
  }
  
  // Check base58 characters
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid transaction signature format'
    }
  }
  
  return {
    valid: true,
    sanitized: trimmed
  }
}

// ============================================
// PERCENTAGE VALIDATION
// ============================================

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(percentage: any): ValidationResult {
  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage
  
  if (typeof num !== 'number' || isNaN(num)) {
    return {
      valid: false,
      error: 'Percentage must be a valid number'
    }
  }
  
  if (num < 0 || num > 100) {
    return {
      valid: false,
      error: 'Percentage must be between 0 and 100'
    }
  }
  
  return {
    valid: true,
    sanitized: num
  }
}

// ============================================
// TIMEOUT VALIDATION
// ============================================

/**
 * Validate timeout hours
 */
export function validateTimeoutHours(hours: any): ValidationResult {
  const num = typeof hours === 'string' ? parseInt(hours) : hours
  
  if (typeof num !== 'number' || isNaN(num)) {
    return {
      valid: false,
      error: 'Timeout must be a valid number'
    }
  }
  
  if (num < 1) {
    return {
      valid: false,
      error: 'Timeout must be at least 1 hour'
    }
  }
  
  if (num > 720) { // 30 days
    return {
      valid: false,
      error: 'Timeout cannot exceed 720 hours (30 days)'
    }
  }
  
  return {
    valid: true,
    sanitized: num
  }
}

// ============================================
// URL VALIDATION
// ============================================

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL is required'
    }
  }
  
  try {
    const urlObj = new URL(url)
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: 'URL must use http or https protocol'
      }
    }
    
    return {
      valid: true,
      sanitized: url.trim()
    }
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }
}

// ============================================
// COMPOSITE VALIDATION
// ============================================

/**
 * Validate escrow creation data
 */
export function validateEscrowCreation(data: {
  buyerWallet: string
  sellerWallet: string
  buyerAmount: number
  token: string
  description?: string
  timeoutHours?: number
}): ValidationResult {
  // Validate buyer wallet
  const buyerResult = validateWalletAddress(data.buyerWallet)
  if (!buyerResult.valid) {
    return { valid: false, error: `Buyer wallet: ${buyerResult.error}` }
  }
  
  // Validate seller wallet
  const sellerResult = validateWalletAddress(data.sellerWallet)
  if (!sellerResult.valid) {
    return { valid: false, error: `Seller wallet: ${sellerResult.error}` }
  }
  
  // Check wallets are different
  if (buyerResult.sanitized === sellerResult.sanitized) {
    return { valid: false, error: 'Buyer and seller wallets must be different' }
  }
  
  // Validate amount
  const amountResult = validateAmount(data.buyerAmount, { min: 0.001 })
  if (!amountResult.valid) {
    return { valid: false, error: `Amount: ${amountResult.error}` }
  }
  
  // Validate token
  const tokenResult = validateToken(data.token)
  if (!tokenResult.valid) {
    return { valid: false, error: `Token: ${tokenResult.error}` }
  }
  
  // Validate description if provided
  if (data.description) {
    const descResult = validateText(data.description, { maxLength: 1000 })
    if (!descResult.valid) {
      return { valid: false, error: `Description: ${descResult.error}` }
    }
  }
  
  // Validate timeout if provided
  if (data.timeoutHours) {
    const timeoutResult = validateTimeoutHours(data.timeoutHours)
    if (!timeoutResult.valid) {
      return { valid: false, error: `Timeout: ${timeoutResult.error}` }
    }
  }
  
  return { valid: true }
}

// ============================================
// EXPORTS
// ============================================

export default {
  validateWalletAddress,
  validateAmount,
  validateText,
  validateToken,
  validateId,
  validateTxSignature,
  validatePercentage,
  validateTimeoutHours,
  validateUrl,
  validateEscrowCreation
}
