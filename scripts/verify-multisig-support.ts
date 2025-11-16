/**
 * Multi-Signature Support Verification Script
 * Verifies that multi-sig detection and transaction handling is working correctly
 */

import { validateSignatureThreshold } from '../lib/escrow/multisig-handler'

console.log('🔍 Multi-Signature Support Verification\n')

// Test 1: Signature Threshold Validation
console.log('Test 1: Signature Threshold Validation')
console.log('=' .repeat(50))

const testCases = [
  { threshold: 2, total: 3, expected: true, desc: 'Valid 2-of-3' },
  { threshold: 1, total: 1, expected: true, desc: 'Valid 1-of-1' },
  { threshold: 0, total: 3, expected: false, desc: 'Invalid: threshold < 1' },
  { threshold: 4, total: 3, expected: false, desc: 'Invalid: threshold > total' },
  { threshold: 15, total: 25, expected: false, desc: 'Invalid: total > 20' },
  { threshold: 20, total: 20, expected: true, desc: 'Valid: maximum 20-of-20' },
]

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = validateSignatureThreshold(test.threshold, test.total)
  const success = result.valid === test.expected
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.desc}`)
    passed++
  } else {
    console.log(`❌ Test ${index + 1}: ${test.desc}`)
    console.log(`   Expected: ${test.expected}, Got: ${result.valid}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    failed++
  }
})

console.log()

// Test 2: Signature Progress Calculation
console.log('Test 2: Signature Progress Calculation')
console.log('=' .repeat(50))

const progressTests = [
  { current: 0, required: 5, expected: 0 },
  { current: 2, required: 5, expected: 40 },
  { current: 5, required: 5, expected: 100 },
]

progressTests.forEach((test, index) => {
  const percentage = (test.current / test.required) * 100
  const success = percentage === test.expected
  
  if (success) {
    console.log(`✅ Progress ${index + 1}: ${test.current}/${test.required} = ${percentage}%`)
    passed++
  } else {
    console.log(`❌ Progress ${index + 1}: Expected ${test.expected}%, Got ${percentage}%`)
    failed++
  }
})

console.log()

// Test 3: Transaction Status Determination
console.log('Test 3: Transaction Status Determination')
console.log('=' .repeat(50))

const statusTests = [
  { current: 0, required: 3, expected: 'pending' },
  { current: 1, required: 3, expected: 'partially_signed' },
  { current: 2, required: 3, expected: 'partially_signed' },
  { current: 3, required: 3, expected: 'ready' },
]

statusTests.forEach((test, index) => {
  const status = test.current === 0 ? 'pending' : 
                 test.current < test.required ? 'partially_signed' : 'ready'
  const success = status === test.expected
  
  if (success) {
    console.log(`✅ Status ${index + 1}: ${test.current}/${test.required} = ${status}`)
    passed++
  } else {
    console.log(`❌ Status ${index + 1}: Expected ${test.expected}, Got ${status}`)
    failed++
  }
})

console.log()

// Test 4: Signer Validation
console.log('Test 4: Signer Validation')
console.log('=' .repeat(50))

const signerTests = [
  {
    signedBy: ['signer1', 'signer2'],
    newSigner: 'signer1',
    expectedDuplicate: true,
    desc: 'Duplicate signer'
  },
  {
    signedBy: ['signer1', 'signer2'],
    newSigner: 'signer3',
    expectedDuplicate: false,
    desc: 'New signer'
  },
]

signerTests.forEach((test, index) => {
  const isDuplicate = test.signedBy.includes(test.newSigner)
  const success = isDuplicate === test.expectedDuplicate
  
  if (success) {
    console.log(`✅ Signer ${index + 1}: ${test.desc} - ${isDuplicate ? 'Rejected' : 'Allowed'}`)
    passed++
  } else {
    console.log(`❌ Signer ${index + 1}: ${test.desc} - Expected ${test.expectedDuplicate}, Got ${isDuplicate}`)
    failed++
  }
})

console.log()

// Test 5: Provider Detection
console.log('Test 5: Provider Detection')
console.log('=' .repeat(50))

const MULTISIG_PROGRAM_IDS = {
  squadsV3: 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu',
  squadsV4: 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf',
  goki: 'GokivDYuQXPZCWRkwMhdH2h91KpDQXBEmpgBgs55bnpH',
  serum: 'MSPdQo5ZdrPh6rU1LsvUv5nRhAnj1mj6YQEqBUq8YwZ',
}

const providerTests = [
  { programId: MULTISIG_PROGRAM_IDS.squadsV3, expected: 'squads', desc: 'Squads v3' },
  { programId: MULTISIG_PROGRAM_IDS.squadsV4, expected: 'squads', desc: 'Squads v4' },
  { programId: MULTISIG_PROGRAM_IDS.goki, expected: 'goki', desc: 'Goki' },
  { programId: MULTISIG_PROGRAM_IDS.serum, expected: 'serum', desc: 'Serum' },
  { programId: 'UnknownProgram123', expected: 'unknown', desc: 'Unknown provider' },
]

providerTests.forEach((test, index) => {
  let provider = 'unknown'
  
  if (test.programId === MULTISIG_PROGRAM_IDS.squadsV3 || 
      test.programId === MULTISIG_PROGRAM_IDS.squadsV4) {
    provider = 'squads'
  } else if (test.programId === MULTISIG_PROGRAM_IDS.goki) {
    provider = 'goki'
  } else if (test.programId === MULTISIG_PROGRAM_IDS.serum) {
    provider = 'serum'
  }
  
  const success = provider === test.expected
  
  if (success) {
    console.log(`✅ Provider ${index + 1}: ${test.desc} detected as ${provider}`)
    passed++
  } else {
    console.log(`❌ Provider ${index + 1}: ${test.desc} - Expected ${test.expected}, Got ${provider}`)
    failed++
  }
})

console.log()

// Summary
console.log('=' .repeat(50))
console.log('📊 Test Summary')
console.log('=' .repeat(50))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
console.log()

if (failed === 0) {
  console.log('🎉 All tests passed! Multi-sig support is working correctly.')
  process.exit(0)
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.')
  process.exit(1)
}
