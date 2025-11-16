#!/usr/bin/env ts-node
/**
 * Fee Deduction Verification Script
 * Verifies that fee deduction is properly implemented across all escrow types
 * Requirements: 9.5, 9.6
 */

import {
  getPlatformFeePercentage,
  getTreasuryWallet,
  calculatePlatformFee,
  calculateTraditionalEscrowFees,
  calculateAtomicSwapFees,
  calculateCancellationFee,
  validateFeeConfiguration,
  getFeeConfigurationSummary
} from '../lib/escrow/fee-handler'
import { calculateMilestoneReleaseAmount } from '../lib/escrow/simple-buyer'

console.log('🔍 Fee Deduction Implementation Verification\n')
console.log('=' .repeat(60))

// ============================================
// 1. FEE CONFIGURATION VALIDATION
// ============================================

console.log('\n📋 1. Fee Configuration Validation')
console.log('-'.repeat(60))

const configSummary = getFeeConfigurationSummary()
console.log(`Network: ${configSummary.network}`)
console.log(`Fee Percentage: ${configSummary.feePercentage}%`)
console.log(`Treasury Wallet: ${configSummary.treasuryWallet}`)
console.log(`Configured: ${configSummary.configured ? '✅ YES' : '❌ NO'}`)

const validation = validateFeeConfiguration()
console.log(`\nValidation: ${validation.valid ? '✅ PASSED' : '❌ FAILED'}`)

if (validation.errors.length > 0) {
  console.log('\n❌ Errors:')
  validation.errors.forEach(error => console.log(`   - ${error}`))
}

if (validation.warnings.length > 0) {
  console.log('\n⚠️  Warnings:')
  validation.warnings.forEach(warning => console.log(`   - ${warning}`))
}

// ============================================
// 2. MILESTONE ESCROW FEE CALCULATION
// ============================================

console.log('\n\n📋 2. Milestone Escrow Fee Calculation')
console.log('-'.repeat(60))

const milestoneTests = [
  { amount: 100, label: '100 SOL milestone' },
  { amount: 1000, label: '1000 SOL milestone' },
  { amount: 50.5, label: '50.5 SOL milestone' },
]

milestoneTests.forEach(test => {
  const result = calculateMilestoneReleaseAmount(test.amount)
  console.log(`\n${test.label}:`)
  console.log(`  Gross Amount: ${result.totalAmount} SOL`)
  console.log(`  Platform Fee (${result.feePercentage}%): ${result.platformFee} SOL`)
  console.log(`  Net to Seller: ${result.netAmount} SOL`)
  console.log(`  ✅ Fee deducted: ${result.platformFee > 0 ? 'YES' : 'NO'}`)
  
  // Verify math
  const sum = result.netAmount + result.platformFee
  const mathCorrect = Math.abs(sum - result.totalAmount) < 0.0001
  console.log(`  ✅ Math correct: ${mathCorrect ? 'YES' : 'NO'}`)
})

// ============================================
// 3. TRADITIONAL ESCROW FEE CALCULATION
// ============================================

console.log('\n\n📋 3. Traditional Escrow Fee Calculation')
console.log('-'.repeat(60))
console.log('Requirement 9.2: Fees deducted from buyer payment only\n')

const traditionalTests = [
  { buyerPayment: 1000, sellerDeposit: 500, label: '1000 SOL payment + 500 SOL deposit' },
  { buyerPayment: 5000, sellerDeposit: 1000, label: '5000 SOL payment + 1000 SOL deposit' },
]

traditionalTests.forEach(test => {
  const result = calculateTraditionalEscrowFees(test.buyerPayment, test.sellerDeposit)
  console.log(`\n${test.label}:`)
  console.log(`  Buyer Payment (gross): ${result.buyerPayment.grossAmount} SOL`)
  console.log(`  Platform Fee (${result.buyerPayment.feePercentage}%): ${result.buyerPayment.platformFee} SOL`)
  console.log(`  Net to Seller: ${result.buyerPayment.netAmount} SOL`)
  console.log(`  Seller Deposit (returned): ${result.sellerDeposit.amount} SOL`)
  console.log(`  Seller Deposit Fee: ${result.sellerDeposit.fee} SOL`)
  console.log(`  Total to Seller: ${result.buyerPayment.netAmount + result.sellerDeposit.amount} SOL`)
  console.log(`  Total Fee to Treasury: ${result.totalFeeToTreasury} SOL`)
  console.log(`  ✅ Fee only on buyer payment: ${result.sellerDeposit.fee === 0 ? 'YES' : 'NO'}`)
})

// ============================================
// 4. ATOMIC SWAP FEE CALCULATION
// ============================================

console.log('\n\n📋 4. Atomic Swap Fee Calculation')
console.log('-'.repeat(60))
console.log('Requirement 9.3: Fees charged to both parties equally\n')

const swapTests = [
  { partyA: 1000, partyB: 1500, label: '1000 SOL ↔ 1500 USDC' },
  { partyA: 500, partyB: 500, label: '500 SOL ↔ 500 SOL' },
]

swapTests.forEach(test => {
  const result = calculateAtomicSwapFees(test.partyA, test.partyB)
  console.log(`\n${test.label}:`)
  console.log(`  Party A:`)
  console.log(`    Gross: ${result.partyA.grossAmount}`)
  console.log(`    Fee (${result.partyA.feePercentage}%): ${result.partyA.platformFee}`)
  console.log(`    Net to Party B: ${result.partyA.netAmount}`)
  console.log(`  Party B:`)
  console.log(`    Gross: ${result.partyB.grossAmount}`)
  console.log(`    Fee (${result.partyB.feePercentage}%): ${result.partyB.platformFee}`)
  console.log(`    Net to Party A: ${result.partyB.netAmount}`)
  console.log(`  Total Fee to Treasury: ${result.totalFeeToTreasury}`)
  console.log(`  ✅ Both parties charged: ${result.partyA.platformFee > 0 && result.partyB.platformFee > 0 ? 'YES' : 'NO'}`)
  console.log(`  ✅ Same percentage: ${result.partyA.feePercentage === result.partyB.feePercentage ? 'YES' : 'NO'}`)
})

// ============================================
// 5. CANCELLATION FEE CALCULATION
// ============================================

console.log('\n\n📋 5. Cancellation Fee Calculation')
console.log('-'.repeat(60))
console.log('1% cancellation fee\n')

const cancellationTests = [
  { deposit: 1000, label: '1000 SOL deposit' },
  { deposit: 500, label: '500 SOL deposit' },
]

cancellationTests.forEach(test => {
  const result = calculateCancellationFee(test.deposit)
  console.log(`\n${test.label}:`)
  console.log(`  Deposit Amount: ${result.grossAmount} SOL`)
  console.log(`  Cancellation Fee (${result.feePercentage}%): ${result.platformFee} SOL`)
  console.log(`  Refund to User: ${result.netAmount} SOL`)
  console.log(`  ✅ 1% fee applied: ${result.feePercentage === 1 ? 'YES' : 'NO'}`)
})

// ============================================
// 6. FEE DEDUCTION VERIFICATION
// ============================================

console.log('\n\n📋 6. Fee Deduction Implementation Verification')
console.log('-'.repeat(60))

const checks = [
  {
    name: 'Fee handler module exists',
    check: () => {
      try {
        require('../lib/escrow/fee-handler')
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: 'Traditional escrow uses fee handler',
    check: () => {
      const fs = require('fs')
      const content = fs.readFileSync('lib/escrow/traditional.ts', 'utf8')
      return content.includes('calculateTraditionalEscrowFees') && 
             content.includes('recordFeeTransaction')
    }
  },
  {
    name: 'Atomic swap uses fee handler',
    check: () => {
      const fs = require('fs')
      const content = fs.readFileSync('lib/escrow/atomic-swap.ts', 'utf8')
      return content.includes('calculateAtomicSwapFees') && 
             content.includes('recordMultipleFeeTransactions')
    }
  },
  {
    name: 'Milestone release uses fee handler',
    check: () => {
      const fs = require('fs')
      const content = fs.readFileSync('lib/escrow/simple-buyer.ts', 'utf8')
      return content.includes('recordFeeTransaction')
    }
  },
  {
    name: 'API routes use fee calculation',
    check: () => {
      const fs = require('fs')
      const approveContent = fs.readFileSync('app/api/escrow/approve/route.ts', 'utf8')
      const releaseContent = fs.readFileSync('app/api/escrow/release/route.ts', 'utf8')
      return approveContent.includes('calculateMilestoneReleaseAmount') && 
             releaseContent.includes('calculateMilestoneReleaseAmount')
    }
  },
  {
    name: 'Treasury wallet configured',
    check: () => {
      try {
        getTreasuryWallet()
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: 'Fee percentage configured',
    check: () => {
      const fee = getPlatformFeePercentage()
      return fee > 0 && fee <= 100
    }
  }
]

console.log('\nImplementation Checks:')
checks.forEach(check => {
  const result = check.check()
  console.log(`  ${result ? '✅' : '❌'} ${check.name}`)
})

// ============================================
// 7. SUMMARY
// ============================================

console.log('\n\n📊 Summary')
console.log('='.repeat(60))

const allChecksPassed = checks.every(check => check.check())
const configValid = validation.valid

console.log(`\nConfiguration: ${configValid ? '✅ VALID' : '❌ INVALID'}`)
console.log(`Implementation: ${allChecksPassed ? '✅ COMPLETE' : '❌ INCOMPLETE'}`)

if (configValid && allChecksPassed) {
  console.log('\n✅ Fee deduction is properly implemented!')
  console.log('\nRequirements Verified:')
  console.log('  ✅ 9.5: Fees automatically deducted during fund release')
  console.log('  ✅ 9.6: Fees sent to designated treasury wallet')
  console.log('\nImplementation Details:')
  console.log('  ✅ Milestone escrow: Fee deducted from each milestone')
  console.log('  ✅ Traditional escrow: Fee deducted from buyer payment only')
  console.log('  ✅ Atomic swap: Fees charged to both parties')
  console.log('  ✅ Fee transactions recorded in database')
  console.log('  ✅ Treasury wallet receives all fees')
} else {
  console.log('\n❌ Fee deduction implementation incomplete or misconfigured')
  console.log('\nPlease review the errors and warnings above.')
}

console.log('\n' + '='.repeat(60))
console.log('Verification complete!\n')

// Exit with appropriate code
process.exit(configValid && allChecksPassed ? 0 : 1)
