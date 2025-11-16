/**
 * Access Control Verification Script
 * Tests all access control features
 * Requirements: 13.1-13.6
 */

import {
  verifyWalletSignature,
  generateAuthChallenge,
  verifyAuthChallengeTimestamp,
  verifyAdminWallet,
  validateWalletAddress,
  validateAmount,
  validateText,
  validateToken,
  validateId,
  validateEscrowCreation,
  checkRateLimit,
  RateLimitPresets,
} from '../lib/security'

// Test colors
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

let passCount = 0
let failCount = 0

function test(name: string, fn: () => boolean | Promise<boolean>) {
  try {
    const result = fn()
    if (result instanceof Promise) {
      result.then((res) => {
        if (res) {
          console.log(`${GREEN}✓${RESET} ${name}`)
          passCount++
        } else {
          console.log(`${RED}✗${RESET} ${name}`)
          failCount++
        }
      })
    } else {
      if (result) {
        console.log(`${GREEN}✓${RESET} ${name}`)
        passCount++
      } else {
        console.log(`${RED}✗${RESET} ${name}`)
        failCount++
      }
    }
  } catch (error: any) {
    console.log(`${RED}✗${RESET} ${name} - ${error.message}`)
    failCount++
  }
}

console.log('\n' + '='.repeat(60))
console.log('ACCESS CONTROL VERIFICATION')
console.log('='.repeat(60) + '\n')

// ============================================
// 1. WALLET ADDRESS VALIDATION
// ============================================

console.log('1. Wallet Address Validation')
console.log('-'.repeat(60))

test('Valid Solana wallet address', () => {
  const result = validateWalletAddress('11111111111111111111111111111111')
  return result.valid === true
})

test('Reject invalid wallet address', () => {
  const result = validateWalletAddress('invalid')
  return result.valid === false
})

test('Reject empty wallet address', () => {
  const result = validateWalletAddress('')
  return result.valid === false
})

test('Reject too short wallet address', () => {
  const result = validateWalletAddress('123')
  return result.valid === false
})

test('Trim whitespace from wallet address', () => {
  const result = validateWalletAddress('  11111111111111111111111111111111  ')
  return result.valid === true && result.sanitized === '11111111111111111111111111111111'
})

console.log('')

// ============================================
// 2. AMOUNT VALIDATION
// ============================================

console.log('2. Amount Validation')
console.log('-'.repeat(60))

test('Valid positive amount', () => {
  const result = validateAmount(1.5)
  return result.valid === true
})

test('Reject negative amount', () => {
  const result = validateAmount(-1)
  return result.valid === false
})

test('Reject zero amount (default)', () => {
  const result = validateAmount(0)
  return result.valid === false
})

test('Allow zero amount with allowZero option', () => {
  const result = validateAmount(0, { allowZero: true })
  return result.valid === true
})

test('Enforce minimum amount', () => {
  const result = validateAmount(0.5, { min: 1 })
  return result.valid === false
})

test('Enforce maximum amount', () => {
  const result = validateAmount(100, { max: 50 })
  return result.valid === false
})

test('Reject too many decimal places', () => {
  // Use a string to preserve all 10 decimal places
  const result = validateAmount('1.1234567890')
  return result.valid === false
})

test('Accept string numbers', () => {
  const result = validateAmount('1.5')
  return result.valid === true && result.sanitized === 1.5
})

console.log('')

// ============================================
// 3. TEXT VALIDATION
// ============================================

console.log('3. Text Validation')
console.log('-'.repeat(60))

test('Valid text input', () => {
  const result = validateText('Hello world')
  return result.valid === true
})

test('Trim whitespace from text', () => {
  const result = validateText('  Hello  ')
  return result.valid === true && result.sanitized === 'Hello'
})

test('Enforce minimum length', () => {
  const result = validateText('Hi', { minLength: 5 })
  return result.valid === false
})

test('Enforce maximum length', () => {
  const result = validateText('A'.repeat(100), { maxLength: 50 })
  return result.valid === false
})

test('Remove script tags (XSS prevention)', () => {
  const result = validateText('Hello <script>alert("xss")</script> world')
  return result.valid === true && !result.sanitized?.includes('<script>')
})

test('Remove javascript: protocol', () => {
  const result = validateText('Click <a href="javascript:alert()">here</a>')
  return result.valid === true && !result.sanitized?.includes('javascript:')
})

console.log('')

// ============================================
// 4. TOKEN VALIDATION
// ============================================

console.log('4. Token Validation')
console.log('-'.repeat(60))

test('Valid SOL token', () => {
  const result = validateToken('SOL')
  return result.valid === true
})

test('Valid USDC token', () => {
  const result = validateToken('USDC')
  return result.valid === true
})

test('Valid USDT token', () => {
  const result = validateToken('USDT')
  return result.valid === true
})

test('Case insensitive token validation', () => {
  const result = validateToken('sol')
  return result.valid === true && result.sanitized === 'SOL'
})

test('Reject unsupported token', () => {
  const result = validateToken('BTC')
  return result.valid === false
})

console.log('')

// ============================================
// 5. ID VALIDATION
// ============================================

console.log('5. ID Validation')
console.log('-'.repeat(60))

test('Valid nanoid format', () => {
  const result = validateId('abc123xyz789')
  return result.valid === true
})

test('Reject too short ID', () => {
  const result = validateId('abc')
  return result.valid === false
})

test('Reject too long ID', () => {
  const result = validateId('a'.repeat(50))
  return result.valid === false
})

test('Reject invalid characters in ID', () => {
  const result = validateId('abc@123')
  return result.valid === false
})

console.log('')

// ============================================
// 6. AUTH CHALLENGE GENERATION
// ============================================

console.log('6. Auth Challenge Generation')
console.log('-'.repeat(60))

test('Generate auth challenge with timestamp', () => {
  const challenge = generateAuthChallenge()
  return challenge.includes('Timestamp:') && challenge.includes('Nonce:')
})

test('Generate auth challenge with custom nonce', () => {
  const challenge = generateAuthChallenge('custom_nonce')
  return challenge.includes('custom_nonce')
})

test('Verify recent challenge timestamp', () => {
  const challenge = generateAuthChallenge()
  return verifyAuthChallengeTimestamp(challenge) === true
})

test('Reject old challenge timestamp', () => {
  const oldTimestamp = Date.now() - (10 * 60 * 1000) // 10 minutes ago
  const challenge = `Sign this message\n\nTimestamp: ${oldTimestamp}\nNonce: test`
  return verifyAuthChallengeTimestamp(challenge) === false
})

console.log('')

// ============================================
// 7. ADMIN WALLET VERIFICATION
// ============================================

console.log('7. Admin Wallet Verification')
console.log('-'.repeat(60))

// Set test admin wallet
process.env.ADMIN_WALLETS = 'AdminWallet1,AdminWallet2,AdminWallet3'

test('Verify admin wallet', () => {
  return verifyAdminWallet('AdminWallet1') === true
})

test('Reject non-admin wallet', () => {
  return verifyAdminWallet('RegularWallet') === false
})

test('Handle multiple admin wallets', () => {
  return verifyAdminWallet('AdminWallet2') === true && 
         verifyAdminWallet('AdminWallet3') === true
})

console.log('')

// ============================================
// 8. RATE LIMITING
// ============================================

console.log('8. Rate Limiting')
console.log('-'.repeat(60))

test('Allow request within rate limit', () => {
  const result = checkRateLimit('test_user_1', RateLimitPresets.STANDARD)
  return result.allowed === true
})

test('Track remaining requests', () => {
  const result1 = checkRateLimit('test_user_2', RateLimitPresets.STANDARD)
  const result2 = checkRateLimit('test_user_2', RateLimitPresets.STANDARD)
  return result2.remaining < result1.remaining
})

test('Block request when limit exceeded', () => {
  const config = { windowMs: 60000, maxRequests: 2 }
  checkRateLimit('test_user_3', config)
  checkRateLimit('test_user_3', config)
  const result = checkRateLimit('test_user_3', config)
  return result.allowed === false
})

test('Reset rate limit after window', () => {
  const config = { windowMs: 100, maxRequests: 1 } // 100ms window
  checkRateLimit('test_user_4', config)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = checkRateLimit('test_user_4', config)
      resolve(result.allowed === true)
    }, 150)
  })
})

test('Different users have separate rate limits', () => {
  const config = { windowMs: 60000, maxRequests: 1 }
  checkRateLimit('user_a', config)
  const result = checkRateLimit('user_b', config)
  return result.allowed === true
})

console.log('')

// ============================================
// 9. RATE LIMIT PRESETS
// ============================================

console.log('9. Rate Limit Presets')
console.log('-'.repeat(60))

test('STRICT preset has low limit', () => {
  return RateLimitPresets.STRICT.maxRequests === 5
})

test('STANDARD preset has moderate limit', () => {
  return RateLimitPresets.STANDARD.maxRequests === 100
})

test('RELAXED preset has high limit', () => {
  return RateLimitPresets.RELAXED.maxRequests === 300
})

test('ADMIN preset has hourly window', () => {
  return RateLimitPresets.ADMIN.windowMs === 60 * 60 * 1000
})

test('TRANSACTION preset has short window', () => {
  return RateLimitPresets.TRANSACTION.windowMs === 5 * 60 * 1000
})

console.log('')

// ============================================
// 10. COMPOSITE VALIDATION
// ============================================

console.log('10. Composite Validation (Escrow Creation)')
console.log('-'.repeat(60))

test('Valid escrow creation data', () => {
  const result = validateEscrowCreation({
    buyerWallet: 'So11111111111111111111111111111111111111112',
    sellerWallet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    buyerAmount: 1.5,
    token: 'SOL',
    description: 'Test escrow',
    timeoutHours: 72,
  })
  return result.valid === true
})

test('Reject same buyer and seller wallet', () => {
  const result = validateEscrowCreation({
    buyerWallet: 'So11111111111111111111111111111111111111112',
    sellerWallet: 'So11111111111111111111111111111111111111112',
    buyerAmount: 1.5,
    token: 'SOL',
  })
  return result.valid === false
})

test('Reject invalid buyer wallet', () => {
  const result = validateEscrowCreation({
    buyerWallet: 'invalid',
    sellerWallet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    buyerAmount: 1.5,
    token: 'SOL',
  })
  return result.valid === false
})

test('Reject invalid amount', () => {
  const result = validateEscrowCreation({
    buyerWallet: 'So11111111111111111111111111111111111111112',
    sellerWallet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    buyerAmount: -1,
    token: 'SOL',
  })
  return result.valid === false
})

test('Reject invalid token', () => {
  const result = validateEscrowCreation({
    buyerWallet: 'So11111111111111111111111111111111111111112',
    sellerWallet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    buyerAmount: 1.5,
    token: 'BTC',
  })
  return result.valid === false
})

console.log('')

// ============================================
// SUMMARY
// ============================================

setTimeout(() => {
  console.log('='.repeat(60))
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`${GREEN}Passed:${RESET} ${passCount}`)
  console.log(`${RED}Failed:${RESET} ${failCount}`)
  console.log(`${YELLOW}Total:${RESET} ${passCount + failCount}`)
  console.log('='.repeat(60))
  
  if (failCount === 0) {
    console.log(`\n${GREEN}✓ All access control tests passed!${RESET}\n`)
    process.exit(0)
  } else {
    console.log(`\n${RED}✗ Some tests failed. Please review the implementation.${RESET}\n`)
    process.exit(1)
  }
}, 1000) // Wait for async tests
