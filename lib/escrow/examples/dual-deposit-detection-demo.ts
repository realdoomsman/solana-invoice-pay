/**
 * Dual Deposit Detection Demo
 * Demonstrates the new dual deposit detection functionality for atomic swaps
 */

import {
  monitorSwapDeposits,
  monitorPartyADeposit,
  monitorPartyBDeposit,
  detectBothDeposits
} from '../atomic-swap'

/**
 * Demo: Monitor individual party deposits
 */
async function demoIndividualPartyMonitoring(escrowId: string) {
  console.log('\n=== Individual Party Deposit Monitoring ===\n')
  
  try {
    // Monitor Party A deposit
    console.log('Checking Party A deposit status...')
    const partyAStatus = await monitorPartyADeposit(escrowId)
    console.log(`Party A Status:`)
    console.log(`  - Deposited: ${partyAStatus.deposited}`)
    console.log(`  - Expected: ${partyAStatus.expectedAmount} ${partyAStatus.expectedAsset}`)
    console.log(`  - Escrow Wallet: ${partyAStatus.escrowWallet}`)
    
    // Monitor Party B deposit
    console.log('\nChecking Party B deposit status...')
    const partyBStatus = await monitorPartyBDeposit(escrowId)
    console.log(`Party B Status:`)
    console.log(`  - Deposited: ${partyBStatus.deposited}`)
    console.log(`  - Expected: ${partyBStatus.expectedAmount} ${partyBStatus.expectedAsset}`)
    console.log(`  - Escrow Wallet: ${partyBStatus.escrowWallet}`)
    
  } catch (error: any) {
    console.error('Error monitoring individual deposits:', error.message)
  }
}

/**
 * Demo: Comprehensive dual deposit detection
 */
async function demoDualDepositDetection(escrowId: string) {
  console.log('\n=== Dual Deposit Detection ===\n')
  
  try {
    const result = await detectBothDeposits(escrowId)
    
    console.log('Deposit Detection Results:')
    console.log(`  Both Deposited: ${result.bothDeposited ? '✓ YES' : '✗ NO'}`)
    console.log(`  Ready for Swap: ${result.readyForSwap ? '✓ YES' : '✗ NO'}`)
    console.log(`  Swap Executed: ${result.swapExecuted ? 'YES' : 'NO'}`)
    
    console.log('\nParty A Status:')
    console.log(`  - Wallet: ${result.partyAStatus.wallet}`)
    console.log(`  - Deposited: ${result.partyAStatus.deposited ? '✓' : '✗'}`)
    console.log(`  - Amount: ${result.partyAStatus.amount} ${result.partyAStatus.asset}`)
    
    console.log('\nParty B Status:')
    console.log(`  - Wallet: ${result.partyBStatus.wallet}`)
    console.log(`  - Deposited: ${result.partyBStatus.deposited ? '✓' : '✗'}`)
    console.log(`  - Amount: ${result.partyBStatus.amount} ${result.partyBStatus.asset}`)
    
    console.log(`\nEscrow Wallet: ${result.escrowWallet}`)
    
    if (result.readyForSwap) {
      console.log('\n🎉 Both deposits detected! Swap is ready to execute.')
    } else if (result.bothDeposited && result.swapExecuted) {
      console.log('\n✅ Swap has already been executed.')
    } else {
      console.log('\n⏳ Waiting for deposits...')
    }
    
  } catch (error: any) {
    console.error('Error detecting dual deposits:', error.message)
  }
}

/**
 * Demo: Monitor swap deposits with auto-trigger
 */
async function demoMonitorWithAutoTrigger(escrowId: string) {
  console.log('\n=== Monitor Swap Deposits (with auto-trigger) ===\n')
  
  try {
    // Monitor without auto-trigger
    console.log('Monitoring deposits (auto-trigger disabled)...')
    const result1 = await monitorSwapDeposits(escrowId, false)
    console.log(`  Party A: ${result1.partyADeposited ? '✓' : '✗'}`)
    console.log(`  Party B: ${result1.partyBDeposited ? '✓' : '✗'}`)
    console.log(`  Both: ${result1.bothDeposited ? '✓' : '✗'}`)
    console.log(`  Ready: ${result1.readyForSwap ? '✓' : '✗'}`)
    
    // Monitor with auto-trigger (if both deposited, will trigger swap)
    if (result1.readyForSwap) {
      console.log('\nMonitoring deposits (auto-trigger enabled)...')
      const result2 = await monitorSwapDeposits(escrowId, true)
      console.log(`  Swap Triggered: ${result2.swapTriggered ? '✓ YES' : '✗ NO'}`)
    }
    
  } catch (error: any) {
    console.error('Error monitoring with auto-trigger:', error.message)
  }
}

/**
 * Main demo function
 */
export async function runDualDepositDetectionDemo(escrowId: string) {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   Dual Deposit Detection Demo for Atomic Swaps        ║')
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log(`\nEscrow ID: ${escrowId}\n`)
  
  // Run all demos
  await demoIndividualPartyMonitoring(escrowId)
  await demoDualDepositDetection(escrowId)
  await demoMonitorWithAutoTrigger(escrowId)
  
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   Demo Complete                                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
}

/**
 * Usage example:
 * 
 * import { runDualDepositDetectionDemo } from './lib/escrow/examples/dual-deposit-detection-demo'
 * 
 * // Run demo for a specific atomic swap escrow
 * await runDualDepositDetectionDemo('your-escrow-id-here')
 */

export default {
  runDualDepositDetectionDemo,
  demoIndividualPartyMonitoring,
  demoDualDepositDetection,
  demoMonitorWithAutoTrigger
}
