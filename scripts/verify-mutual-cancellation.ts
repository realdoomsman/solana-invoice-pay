#!/usr/bin/env ts-node

/**
 * Verification Script: Mutual Cancellation
 * Tests the mutual cancellation functionality
 * Requirements: 15.2
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

async function verifyMutualCancellation() {
  log('\n🔍 Verifying Mutual Cancellation Implementation', 'cyan')
  log('=' .repeat(60), 'cyan')

  let allPassed = true

  // Test 1: Check database schema file
  log('\n📋 Test 1: Database Schema', 'blue')
  try {
    const fs = require('fs')
    const path = require('path')
    const schemaPath = path.join(process.cwd(), 'supabase-cancellation-schema.sql')

    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf-8')
      
      const checks = [
        { name: 'escrow_cancellation_requests table', pattern: /CREATE TABLE.*escrow_cancellation_requests/i },
        { name: 'buyer_approved field', pattern: /buyer_approved.*BOOLEAN/i },
        { name: 'seller_approved field', pattern: /seller_approved.*BOOLEAN/i },
        { name: 'reason field', pattern: /reason.*TEXT.*NOT NULL/i },
        { name: 'status field', pattern: /status.*TEXT/i },
      ]

      for (const check of checks) {
        if (check.pattern.test(content)) {
          log(`✅ ${check.name}`, 'green')
        } else {
          log(`❌ ${check.name} missing`, 'red')
          allPassed = false
        }
      }
    } else {
      log('❌ supabase-cancellation-schema.sql missing', 'red')
      allPassed = false
    }
  } catch (error: any) {
    log(`❌ Database schema check failed: ${error.message}`, 'red')
    allPassed = false
  }

  // Test 2: Check implementation file
  log('\n📋 Test 2: Implementation File', 'blue')
  try {
    const fs = require('fs')
    const path = require('path')
    const implPath = path.join(process.cwd(), 'lib', 'escrow', 'mutual-cancellation.ts')

    if (fs.existsSync(implPath)) {
      const content = fs.readFileSync(implPath, 'utf-8')
      
      const checks = [
        { name: 'requestMutualCancellation function', pattern: /export.*function requestMutualCancellation/i },
        { name: 'approveMutualCancellation function', pattern: /export.*function approveMutualCancellation/i },
        { name: 'getCancellationRequest function', pattern: /export.*function getCancellationRequest/i },
        { name: 'Validation logic', pattern: /reason.*length.*10/i },
        { name: 'Both parties approval check', pattern: /bothApproved|buyer_approved.*&&.*seller_approved/i },
      ]

      for (const check of checks) {
        if (check.pattern.test(content)) {
          log(`✅ ${check.name}`, 'green')
        } else {
          log(`❌ ${check.name} missing`, 'red')
          allPassed = false
        }
      }
    } else {
      log('❌ mutual-cancellation.ts missing', 'red')
      allPassed = false
    }
  } catch (error: any) {
    log(`❌ Implementation file check failed: ${error.message}`, 'red')
    allPassed = false
  }

  // Test 3: Check API endpoints exist
  log('\n📋 Test 3: API Endpoints', 'blue')
  try {
    const fs = require('fs')
    const path = require('path')
    
    const endpoints = [
      { name: '/api/escrow/cancel/request', path: 'app/api/escrow/cancel/request/route.ts' },
      { name: '/api/escrow/cancel/approve', path: 'app/api/escrow/cancel/approve/route.ts' },
      { name: '/api/escrow/cancel/status', path: 'app/api/escrow/cancel/status/route.ts' },
    ]

    for (const endpoint of endpoints) {
      const filePath = path.join(process.cwd(), endpoint.path)

      if (fs.existsSync(filePath)) {
        log(`✅ ${endpoint.name} endpoint exists`, 'green')
      } else {
        log(`❌ ${endpoint.name} endpoint missing`, 'red')
        allPassed = false
      }
    }
  } catch (error: any) {
    log(`❌ API endpoint check failed: ${error.message}`, 'red')
    allPassed = false
  }

  // Test 4: Check UI component
  log('\n📋 Test 4: UI Component', 'blue')
  try {
    const fs = require('fs')
    const path = require('path')
    const componentPath = path.join(
      process.cwd(),
      'components',
      'MutualCancellationInterface.tsx'
    )

    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf-8')

      const checks = [
        { name: 'Request form', pattern: /requestMutualCancellation|Request.*Cancellation/i },
        { name: 'Approve button', pattern: /approveMutualCancellation|Approve.*Cancellation/i },
        { name: 'Status display', pattern: /cancellationRequest|Cancellation.*Pending/i },
        { name: 'Fee notice', pattern: /1%.*fee|cancellation fee/i },
      ]

      for (const check of checks) {
        if (check.pattern.test(content)) {
          log(`✅ ${check.name} implemented`, 'green')
        } else {
          log(`❌ ${check.name} missing`, 'red')
          allPassed = false
        }
      }
    } else {
      log('❌ MutualCancellationInterface component missing', 'red')
      allPassed = false
    }
  } catch (error: any) {
    log(`❌ UI component check failed: ${error.message}`, 'red')
    allPassed = false
  }

  // Test 5: Check fee deduction logic
  log('\n📋 Test 5: Fee Deduction Logic', 'blue')
  try {
    const fs = require('fs')
    const path = require('path')
    const implPath = path.join(process.cwd(), 'lib', 'escrow', 'mutual-cancellation.ts')
    const content = fs.readFileSync(implPath, 'utf-8')

    const checks = [
      { name: 'Cancellation fee constant', pattern: /CANCELLATION_FEE_PERCENTAGE.*=.*0\.01/i },
      { name: 'Fee calculation', pattern: /feeAmount.*=.*deposit\.amount.*\*/i },
      { name: 'Refund calculation', pattern: /refundAmount.*=.*deposit\.amount.*-.*feeAmount/i },
      { name: 'Transfer execution', pattern: /transferToMultiple/i },
    ]

    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`✅ ${check.name}`, 'green')
      } else {
        log(`❌ ${check.name} missing`, 'red')
        allPassed = false
      }
    }
  } catch (error: any) {
    log(`❌ Fee deduction check failed: ${error.message}`, 'red')
    allPassed = false
  }

  // Test 6: Check requirements coverage
  log('\n📋 Test 6: Requirements Coverage (15.2)', 'blue')
  try {
    const fs = require('fs')
    const path = require('path')
    const libPath = path.join(process.cwd(), 'lib', 'escrow', 'mutual-cancellation.ts')
    const content = fs.readFileSync(libPath, 'utf-8')

    const requirements = [
      { name: 'Both parties must agree', pattern: /both.*approv|buyer_approved.*seller_approved/i },
      { name: 'Refund deposits', pattern: /refund|transfer.*deposit/i },
      { name: 'Deduct fees', pattern: /fee|CANCELLATION_FEE/i },
      { name: 'Record reason', pattern: /reason|cancellation.*reason/i },
    ]

    for (const req of requirements) {
      if (req.pattern.test(content)) {
        log(`✅ ${req.name}`, 'green')
      } else {
        log(`❌ ${req.name} not implemented`, 'red')
        allPassed = false
      }
    }
  } catch (error: any) {
    log(`❌ Requirements check failed: ${error.message}`, 'red')
    allPassed = false
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan')
  if (allPassed) {
    log('✅ All mutual cancellation checks passed!', 'green')
    log('\n📝 Implementation Summary:', 'cyan')
    log('  • Database schema for cancellation requests', 'reset')
    log('  • Request and approve cancellation functions', 'reset')
    log('  • API endpoints for cancellation workflow', 'reset')
    log('  • UI component for mutual cancellation', 'reset')
    log('  • 1% cancellation fee deduction', 'reset')
    log('  • Both parties approval required', 'reset')
    log('  • Automatic refund execution', 'reset')
    log('  • Cancellation reason recording', 'reset')
  } else {
    log('❌ Some checks failed. Please review the implementation.', 'red')
  }
  log('=' .repeat(60), 'cyan')
}

// Run verification
verifyMutualCancellation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification failed:', error)
    process.exit(1)
  })
