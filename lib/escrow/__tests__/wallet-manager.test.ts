/**
 * Wallet Manager Security Tests
 * Tests encryption, decryption, key generation, and security features
 */

import {
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
  hashForLogging
} from '../wallet-manager'

// Mock environment variable
process.env.ESCROW_ENCRYPTION_KEY = 'test-encryption-key-for-testing-only-do-not-use-in-production'

describe('Wallet Generation', () => {
  test('should generate unique keypairs', () => {
    const wallet1 = generateEscrowWallet()
    const wallet2 = generateEscrowWallet()
    
    expect(wallet1.publicKey.toBase58()).not.toBe(wallet2.publicKey.toBase58())
    expect(wallet1.secretKey).not.toEqual(wallet2.secretKey)
  })
  
  test('should create wallet with correct format', () => {
    const wallet = createEscrowWallet()
    
    expect(wallet).toHaveProperty('publicKey')
    expect(wallet).toHaveProperty('privateKey')
    expect(wallet).toHaveProperty('encrypted')
    expect(wallet.encrypted).toBe(false)
    expect(typeof wallet.publicKey).toBe('string')
    expect(typeof wallet.privateKey).toBe('string')
  })
  
  test('should generate cryptographically random keys', () => {
    const wallets = Array.from({ length: 100 }, () => generateEscrowWallet())
    const publicKeys = wallets.map(w => w.publicKey.toBase58())
    const uniqueKeys = new Set(publicKeys)
    
    // All keys should be unique
    expect(uniqueKeys.size).toBe(100)
  })
})

describe('Encryption/Decryption', () => {
  test('should encrypt and decrypt private key correctly', () => {
    const wallet = createEscrowWallet()
    const encrypted = encryptPrivateKey(wallet.privateKey)
    const decrypted = decryptPrivateKey(encrypted)
    
    expect(decrypted).toBe(wallet.privateKey)
  })
  
  test('should produce different encrypted output each time', () => {
    const wallet = createEscrowWallet()
    const encrypted1 = encryptPrivateKey(wallet.privateKey)
    const encrypted2 = encryptPrivateKey(wallet.privateKey)
    
    // Different IVs should produce different encrypted strings
    expect(encrypted1).not.toBe(encrypted2)
    
    // But both should decrypt to the same value
    expect(decryptPrivateKey(encrypted1)).toBe(wallet.privateKey)
    expect(decryptPrivateKey(encrypted2)).toBe(wallet.privateKey)
  })
  
  test('should fail to decrypt with tampered data', () => {
    const wallet = createEscrowWallet()
    const encrypted = encryptPrivateKey(wallet.privateKey)
    
    // Tamper with the encrypted data
    const tampered = encrypted.replace(/a/g, 'b')
    
    expect(() => decryptPrivateKey(tampered)).toThrow()
  })
  
  test('should fail to decrypt with invalid format', () => {
    expect(() => decryptPrivateKey('invalid-format')).toThrow()
    expect(() => decryptPrivateKey('part1:part2')).toThrow()
    expect(() => decryptPrivateKey('')).toThrow()
  })
  
  test('should handle encryption of empty string', () => {
    const encrypted = encryptPrivateKey('')
    const decrypted = decryptPrivateKey(encrypted)
    
    expect(decrypted).toBe('')
  })
  
  test('should handle encryption of long strings', () => {
    const longString = 'a'.repeat(10000)
    const encrypted = encryptPrivateKey(longString)
    const decrypted = decryptPrivateKey(encrypted)
    
    expect(decrypted).toBe(longString)
  })
})

describe('Keypair Recovery', () => {
  test('should recover keypair from encrypted private key', () => {
    const { publicKey, encryptedPrivateKey, keypair } = createEncryptedEscrowWallet()
    const recovered = recoverKeypairFromEncrypted(encryptedPrivateKey)
    
    expect(recovered.publicKey.toBase58()).toBe(publicKey)
    expect(recovered.secretKey).toEqual(keypair.secretKey)
  })
  
  test('should recover keypair from plain private key', () => {
    const wallet = createEscrowWallet()
    const recovered = recoverKeypairFromPrivateKey(wallet.privateKey)
    
    expect(recovered.publicKey.toBase58()).toBe(wallet.publicKey)
  })
  
  test('should fail to recover from invalid encrypted key', () => {
    expect(() => recoverKeypairFromEncrypted('invalid')).toThrow()
  })
  
  test('should fail to recover from invalid private key', () => {
    expect(() => recoverKeypairFromPrivateKey('invalid')).toThrow()
  })
})

describe('Validation', () => {
  test('should validate correct encrypted key', () => {
    const { encryptedPrivateKey } = createEncryptedEscrowWallet()
    
    expect(validateEncryptedKey(encryptedPrivateKey)).toBe(true)
  })
  
  test('should reject invalid encrypted key', () => {
    expect(validateEncryptedKey('invalid')).toBe(false)
    expect(validateEncryptedKey('')).toBe(false)
  })
  
  test('should validate matching key pair', () => {
    const { publicKey, encryptedPrivateKey } = createEncryptedEscrowWallet()
    
    expect(validateKeyPair(publicKey, encryptedPrivateKey)).toBe(true)
  })
  
  test('should reject mismatched key pair', () => {
    const wallet1 = createEncryptedEscrowWallet()
    const wallet2 = createEncryptedEscrowWallet()
    
    expect(validateKeyPair(wallet1.publicKey, wallet2.encryptedPrivateKey)).toBe(false)
  })
})

describe('Security Utilities', () => {
  test('should generate secure random IDs', () => {
    const id1 = generateSecureId()
    const id2 = generateSecureId()
    
    expect(id1).not.toBe(id2)
    expect(id1.length).toBe(64) // 32 bytes = 64 hex chars
  })
  
  test('should generate IDs of specified length', () => {
    const id = generateSecureId(16)
    
    expect(id.length).toBe(32) // 16 bytes = 32 hex chars
  })
  
  test('should hash data for logging', () => {
    const data = 'sensitive-private-key-data'
    const hash = hashForLogging(data)
    
    expect(hash).not.toBe(data)
    expect(hash.length).toBe(16)
    expect(typeof hash).toBe('string')
  })
  
  test('should produce consistent hashes', () => {
    const data = 'test-data'
    const hash1 = hashForLogging(data)
    const hash2 = hashForLogging(data)
    
    expect(hash1).toBe(hash2)
  })
  
  test('should produce different hashes for different data', () => {
    const hash1 = hashForLogging('data1')
    const hash2 = hashForLogging('data2')
    
    expect(hash1).not.toBe(hash2)
  })
})

describe('End-to-End Workflow', () => {
  test('should complete full encryption workflow', () => {
    // 1. Create wallet
    const { publicKey, encryptedPrivateKey } = createEncryptedEscrowWallet()
    
    // 2. Validate
    expect(validateEncryptedKey(encryptedPrivateKey)).toBe(true)
    expect(validateKeyPair(publicKey, encryptedPrivateKey)).toBe(true)
    
    // 3. Recover
    const recovered = recoverKeypairFromEncrypted(encryptedPrivateKey)
    expect(recovered.publicKey.toBase58()).toBe(publicKey)
    
    // 4. Use recovered keypair (simulate signing)
    expect(recovered.secretKey).toBeDefined()
    expect(recovered.secretKey.length).toBe(64)
  })
  
  test('should handle multiple encrypt/decrypt cycles', () => {
    const wallet = createEscrowWallet()
    
    // Encrypt and decrypt multiple times
    for (let i = 0; i < 10; i++) {
      const encrypted = encryptPrivateKey(wallet.privateKey)
      const decrypted = decryptPrivateKey(encrypted)
      expect(decrypted).toBe(wallet.privateKey)
    }
  })
})

describe('Error Handling', () => {
  test('should throw error when encryption key is missing', () => {
    const originalKey = process.env.ESCROW_ENCRYPTION_KEY
    delete process.env.ESCROW_ENCRYPTION_KEY
    
    expect(() => encryptPrivateKey('test')).toThrow('ESCROW_ENCRYPTION_KEY')
    
    // Restore
    process.env.ESCROW_ENCRYPTION_KEY = originalKey
  })
  
  test('should handle concurrent encryption operations', async () => {
    const wallet = createEscrowWallet()
    
    // Encrypt same key multiple times concurrently
    const promises = Array.from({ length: 10 }, () => 
      Promise.resolve(encryptPrivateKey(wallet.privateKey))
    )
    
    const encrypted = await Promise.all(promises)
    
    // All should decrypt correctly
    encrypted.forEach(enc => {
      expect(decryptPrivateKey(enc)).toBe(wallet.privateKey)
    })
  })
})

describe('Security Properties', () => {
  test('encrypted data should not contain original private key', () => {
    const wallet = createEscrowWallet()
    const encrypted = encryptPrivateKey(wallet.privateKey)
    
    expect(encrypted).not.toContain(wallet.privateKey)
  })
  
  test('encrypted data should have proper format', () => {
    const wallet = createEscrowWallet()
    const encrypted = encryptPrivateKey(wallet.privateKey)
    
    // Should have format: iv:authTag:encryptedData
    const parts = encrypted.split(':')
    expect(parts.length).toBe(3)
    
    // IV should be 32 hex chars (16 bytes)
    expect(parts[0].length).toBe(32)
    
    // Auth tag should be 32 hex chars (16 bytes)
    expect(parts[1].length).toBe(32)
    
    // Encrypted data should exist
    expect(parts[2].length).toBeGreaterThan(0)
  })
  
  test('should not leak private key in error messages', () => {
    const wallet = createEscrowWallet()
    
    try {
      // Try to decrypt with wrong data
      decryptPrivateKey('invalid:data:here')
    } catch (error: any) {
      expect(error.message).not.toContain(wallet.privateKey)
    }
  })
})
