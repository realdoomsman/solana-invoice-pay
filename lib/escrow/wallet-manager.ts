/**
 * Escrow Wallet Manager
 * Handles secure wallet generation, encryption, and key management
 */

import { Keypair } from '@solana/web3.js'
import * as crypto from 'crypto'
import { EscrowWallet } from './types'

// ============================================
// CONFIGURATION
// ============================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ESCROW_ENCRYPTION_KEY
  
  if (!key) {
    throw new Error('ESCROW_ENCRYPTION_KEY environment variable is not set')
  }
  
  // Derive a proper 32-byte key from the environment variable
  return crypto.scryptSync(key, 'escrow-salt', KEY_LENGTH)
}

// ============================================
// WALLET GENERATION
// ============================================

/**
 * Generate a new Solana keypair for escrow wallet
 * Uses cryptographically secure random number generation
 */
export function generateEscrowWallet(): Keypair {
  // Solana's Keypair.generate() uses crypto.randomBytes internally
  // which is cryptographically secure
  return Keypair.generate()
}

/**
 * Generate escrow wallet and return formatted data
 */
export function createEscrowWallet(): EscrowWallet {
  const keypair = generateEscrowWallet()
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: Buffer.from(keypair.secretKey).toString('base64'),
    encrypted: false
  }
}

// ============================================
// ENCRYPTION
// ============================================

/**
 * Encrypt a private key using AES-256-GCM
 * Returns encrypted data with IV and auth tag
 */
export function encryptPrivateKey(privateKey: string): string {
  try {
    const key = getEncryptionKey()
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
    
    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get authentication tag
    const authTag = cipher.getAuthTag()
    
    // Combine IV + authTag + encrypted data
    // Format: iv:authTag:encryptedData
    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    
    return result
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt private key')
  }
}

/**
 * Decrypt an encrypted private key
 */
export function decryptPrivateKey(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    
    // Split the encrypted data
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }
    
    const [ivHex, authTagHex, encrypted] = parts
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt private key')
  }
}

/**
 * Create and encrypt an escrow wallet in one step
 */
export function createEncryptedEscrowWallet(): {
  publicKey: string
  encryptedPrivateKey: string
  keypair: Keypair
} {
  const keypair = generateEscrowWallet()
  const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64')
  const encryptedPrivateKey = encryptPrivateKey(privateKeyBase64)
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    encryptedPrivateKey,
    keypair // Return for immediate use, don't store
  }
}

// ============================================
// KEY RECOVERY
// ============================================

/**
 * Recover a Keypair from encrypted private key
 * Use this when you need to sign transactions
 */
export function recoverKeypairFromEncrypted(encryptedPrivateKey: string): Keypair {
  try {
    // Decrypt the private key
    const privateKeyBase64 = decryptPrivateKey(encryptedPrivateKey)
    
    // Convert base64 to Uint8Array
    const secretKey = Buffer.from(privateKeyBase64, 'base64')
    
    // Recreate keypair
    return Keypair.fromSecretKey(secretKey)
  } catch (error) {
    console.error('Keypair recovery error:', error)
    throw new Error('Failed to recover keypair from encrypted key')
  }
}

/**
 * Recover a Keypair from plain private key (base64)
 */
export function recoverKeypairFromPrivateKey(privateKeyBase64: string): Keypair {
  try {
    const secretKey = Buffer.from(privateKeyBase64, 'base64')
    return Keypair.fromSecretKey(secretKey)
  } catch (error) {
    console.error('Keypair recovery error:', error)
    throw new Error('Failed to recover keypair from private key')
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that a private key can be decrypted and used
 */
export function validateEncryptedKey(encryptedPrivateKey: string): boolean {
  try {
    const keypair = recoverKeypairFromEncrypted(encryptedPrivateKey)
    // If we can recover the keypair, the key is valid
    return keypair.publicKey !== null
  } catch (error) {
    return false
  }
}

/**
 * Validate that a public key matches an encrypted private key
 */
export function validateKeyPair(publicKey: string, encryptedPrivateKey: string): boolean {
  try {
    const keypair = recoverKeypairFromEncrypted(encryptedPrivateKey)
    return keypair.publicKey.toBase58() === publicKey
  } catch (error) {
    return false
  }
}

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Generate a secure random string for IDs
 */
export function generateSecureId(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash sensitive data for logging (one-way)
 */
export function hashForLogging(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

/**
 * Securely wipe a string from memory (best effort)
 */
export function secureWipe(str: string): void {
  // In JavaScript, we can't truly wipe memory, but we can overwrite
  // This is a best-effort approach
  if (typeof str === 'string') {
    // Overwrite with random data
    const length = str.length
    for (let i = 0; i < length; i++) {
      str = str.substring(0, i) + 'X' + str.substring(i + 1)
    }
  }
}

// ============================================
// KEY ROTATION (Future Enhancement)
// ============================================

/**
 * Re-encrypt a private key with a new encryption key
 * Used for key rotation
 */
export function rotateEncryptedKey(
  encryptedPrivateKey: string,
  oldEncryptionKey: string,
  newEncryptionKey: string
): string {
  // This would be used if we implement key rotation
  // For now, it's a placeholder
  throw new Error('Key rotation not yet implemented')
}

// ============================================
// AUDIT LOGGING
// ============================================

export interface KeyAccessLog {
  timestamp: string
  operation: 'encrypt' | 'decrypt' | 'recover' | 'validate'
  publicKey?: string
  success: boolean
  error?: string
}

const keyAccessLogs: KeyAccessLog[] = []

/**
 * Log key access for security auditing
 */
export function logKeyAccess(log: Omit<KeyAccessLog, 'timestamp'>): void {
  keyAccessLogs.push({
    ...log,
    timestamp: new Date().toISOString()
  })
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    console.log('[KEY_ACCESS]', JSON.stringify(log))
  }
}

/**
 * Get recent key access logs (for admin review)
 */
export function getKeyAccessLogs(limit: number = 100): KeyAccessLog[] {
  return keyAccessLogs.slice(-limit)
}

// ============================================
// EXPORTS
// ============================================

export default {
  generateEscrowWallet,
  createEscrowWallet,
  encryptPrivateKey,
  decryptPrivateKey,
  createEncryptedEscrowWallet,
  recoverKeypairFromEncrypted,
  recoverKeypairFromPrivateKey,
  validateEncryptedKey,
  validateKeyPair,
  generateSecureId,
  hashForLogging,
  logKeyAccess,
  getKeyAccessLogs
}
