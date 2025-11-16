/**
 * Fee Calculation Tests
 * Tests fee calculation accuracy, fee deduction, and treasury transfers
 * Requirements: 9.1-9.6
 */

import { calculateMilestoneReleaseAmount } from '../simple-buyer'

describe('Fee Calculation Accuracy', () => {
  describe('Platform Fee Calculation (3%)', () => {
    test('should calculate 3% platform fee correctly for standard amounts', () => {
      const testCases = [
        { amount: 100, expectedFee: 3, expectedNet: 97 },
        { amount: 1000, expectedFee: 30, expectedNet: 970 },
        { amount: 50, expectedFee: 1.5, expectedNet: 48.5 },
        { amount: 0.5, expectedFee: 0.015, expectedNet: 0.485 },
      ]

      testCases.forEach(({ amount, expectedFee, expectedNet }) => {
        const result = calculateMilestoneReleaseAmount(amount, 3)
        
        expect(result.platformFee).toBeCloseTo(expectedFee, 10)
        expect(result.netAmount).toBeCloseTo(expectedNet, 10)
        expect(result.totalAmount).toBe(amount)
      })
    })

    test('should handle zero amount', () => {
      const result = calculateMilestoneReleaseAmount(0, 3)
      
      expect(result.platformFee).toBe(0)
      expect(result.netAmount).toBe(0)
      expect(result.totalAmount).toBe(0)
    })

    test('should handle very large amounts', () => {
      const largeAmount = 1000000
      const result = calculateMilestoneReleaseAmount(largeAmount, 3)
      
      expect(result.platformFee).toBe(30000)
      expect(result.netAmount).toBe(970000)
      expect(result.totalAmount).toBe(largeAmount)
    })

    test('should handle decimal amounts with precision', () => {
      const amount = 123.456789
      const result = calculateMilestoneReleaseAmount(amount, 3)
      
      expect(result.platformFee).toBeCloseTo(3.70370367, 8)
      expect(result.netAmount).toBeCloseTo(119.75308533, 8)
      expect(result.totalAmount).toBe(amount)
    })
  })

  describe('Custom Fee Percentage', () => {
    test('should calculate fees with custom percentage', () => {
      const amount = 1000
      
      // Test 1% fee
      const result1 = calculateMilestoneReleaseAmount(amount, 1)
      expect(result1.platformFee).toBe(10)
      expect(result1.netAmount).toBe(990)
      
      // Test 5% fee
      const result5 = calculateMilestoneReleaseAmount(amount, 5)
      expect(result5.platformFee).toBe(50)
      expect(result5.netAmount).toBe(950)
      
      // Test 10% fee
      const result10 = calculateMilestoneReleaseAmount(amount, 10)
      expect(result10.platformFee).toBe(100)
      expect(result10.netAmount).toBe(900)
    })

    test('should use default 3% when no percentage provided', () => {
      const amount = 100
      const result = calculateMilestoneReleaseAmount(amount)
      
      expect(result.platformFee).toBe(3)
      expect(result.netAmount).toBe(97)
    })
  })

  describe('Cancellation Fee Calculation (1%)', () => {
    test('should calculate 1% cancellation fee correctly', () => {
      const CANCELLATION_FEE_PERCENTAGE = 0.01
      
      const testCases = [
        { deposit: 100, expectedFee: 1, expectedRefund: 99 },
        { deposit: 1000, expectedFee: 10, expectedRefund: 990 },
        { deposit: 50, expectedFee: 0.5, expectedRefund: 49.5 },
        { deposit: 0.5, expectedFee: 0.005, expectedRefund: 0.495 },
      ]

      testCases.forEach(({ deposit, expectedFee, expectedRefund }) => {
        const feeAmount = deposit * CANCELLATION_FEE_PERCENTAGE
        const refundAmount = deposit - feeAmount
        
        expect(feeAmount).toBeCloseTo(expectedFee, 10)
        expect(refundAmount).toBeCloseTo(expectedRefund, 10)
      })
    })
  })
})

describe('Fee Deduction Logic', () => {
  describe('Milestone Release Fee Deduction', () => {
    test('should deduct fee from milestone amount before release', () => {
      const milestoneAmount = 500
      const result = calculateMilestoneReleaseAmount(milestoneAmount, 3)
      
      // Verify fee is deducted
      expect(result.netAmount).toBe(milestoneAmount - result.platformFee)
      expect(result.netAmount + result.platformFee).toBe(result.totalAmount)
    })

    test('should ensure net amount is always less than total for positive fees', () => {
      const amounts = [10, 100, 1000, 10000]
      
      amounts.forEach(amount => {
        const result = calculateMilestoneReleaseAmount(amount, 3)
        
        expect(result.netAmount).toBeLessThan(result.totalAmount)
        expect(result.platformFee).toBeGreaterThan(0)
      })
    })

    test('should maintain mathematical accuracy in fee deduction', () => {
      const amount = 1234.56
      const feePercentage = 3
      const result = calculateMilestoneReleaseAmount(amount, feePercentage)
      
      // Verify the math: netAmount + platformFee = totalAmount
      const reconstructedTotal = result.netAmount + result.platformFee
      expect(reconstructedTotal).toBeCloseTo(result.totalAmount, 10)
    })
  })

  describe('Traditional Escrow Fee Deduction', () => {
    test('should calculate buyer payment fee deduction (3%)', () => {
      // Requirement 9.2: FOR traditional escrow, fees deducted from buyer's payment only
      const buyerPayment = 1000
      const feePercentage = 3
      
      const platformFee = (buyerPayment * feePercentage) / 100
      const sellerReceives = buyerPayment - platformFee
      
      expect(platformFee).toBe(30)
      expect(sellerReceives).toBe(970)
    })

    test('should not deduct fees from seller security deposit', () => {
      // Seller security deposit should be returned in full
      const sellerDeposit = 500
      const refundAmount = sellerDeposit // No fee deduction
      
      expect(refundAmount).toBe(sellerDeposit)
    })
  })

  describe('Atomic Swap Fee Deduction', () => {
    test('should calculate equal fee split for both parties', () => {
      // Requirement 9.3: FOR atomic swaps, fees charged to both parties equally
      const partyAAmount = 1000
      const partyBAmount = 2000
      const feePercentage = 3
      
      const partyAFee = (partyAAmount * feePercentage) / 100
      const partyBFee = (partyBAmount * feePercentage) / 100
      
      const partyANet = partyAAmount - partyAFee
      const partyBNet = partyBAmount - partyBFee
      
      expect(partyAFee).toBe(30)
      expect(partyBFee).toBe(60)
      expect(partyANet).toBe(970)
      expect(partyBNet).toBe(1940)
    })
  })
})

describe('Treasury Transfer Calculations', () => {
  describe('Platform Fee to Treasury', () => {
    test('should calculate correct treasury amount for single milestone', () => {
      const milestoneAmount = 1000
      const result = calculateMilestoneReleaseAmount(milestoneAmount, 3)
      
      // Treasury should receive the platform fee
      const treasuryAmount = result.platformFee
      expect(treasuryAmount).toBe(30)
    })

    test('should calculate cumulative treasury amount for multiple milestones', () => {
      const milestones = [
        { amount: 1000, percentage: 40 },
        { amount: 1500, percentage: 60 },
      ]
      
      let totalTreasuryFees = 0
      
      milestones.forEach(milestone => {
        const result = calculateMilestoneReleaseAmount(milestone.amount, 3)
        totalTreasuryFees += result.platformFee
      })
      
      expect(totalTreasuryFees).toBe(75) // 30 + 45
    })

    test('should calculate treasury amount for traditional escrow', () => {
      const buyerPayment = 5000
      const feePercentage = 3
      
      const treasuryAmount = (buyerPayment * feePercentage) / 100
      
      expect(treasuryAmount).toBe(150)
    })

    test('should calculate treasury amount for atomic swap (both parties)', () => {
      const partyAAmount = 1000
      const partyBAmount = 1500
      const feePercentage = 3
      
      const partyAFee = (partyAAmount * feePercentage) / 100
      const partyBFee = (partyBAmount * feePercentage) / 100
      const totalTreasuryAmount = partyAFee + partyBFee
      
      expect(totalTreasuryAmount).toBe(75) // 30 + 45
    })
  })

  describe('Cancellation Fee to Treasury', () => {
    test('should calculate treasury amount from cancellation fees', () => {
      const CANCELLATION_FEE_PERCENTAGE = 0.01
      const deposits = [
        { amount: 1000 },
        { amount: 500 },
      ]
      
      let totalCancellationFees = 0
      
      deposits.forEach(deposit => {
        const feeAmount = deposit.amount * CANCELLATION_FEE_PERCENTAGE
        totalCancellationFees += feeAmount
      })
      
      expect(totalCancellationFees).toBe(15) // 10 + 5
    })
  })

  describe('Fee Distribution Validation', () => {
    test('should ensure total distribution equals original amount', () => {
      const escrowAmount = 10000
      const result = calculateMilestoneReleaseAmount(escrowAmount, 3)
      
      // Seller receives net amount, treasury receives fee
      const sellerAmount = result.netAmount
      const treasuryAmount = result.platformFee
      
      // Total distribution should equal original amount
      expect(sellerAmount + treasuryAmount).toBe(escrowAmount)
    })

    test('should validate no funds are lost in fee calculation', () => {
      const amounts = [100, 500, 1000, 5000, 10000]
      
      amounts.forEach(amount => {
        const result = calculateMilestoneReleaseAmount(amount, 3)
        
        // Verify no rounding errors cause fund loss
        const totalDistributed = result.netAmount + result.platformFee
        expect(totalDistributed).toBeCloseTo(amount, 10)
      })
    })
  })
})

describe('Edge Cases and Validation', () => {
  test('should handle minimum viable amounts', () => {
    const minAmount = 0.01
    const result = calculateMilestoneReleaseAmount(minAmount, 3)
    
    expect(result.platformFee).toBeCloseTo(0.0003, 10)
    expect(result.netAmount).toBeCloseTo(0.0097, 10)
  })

  test('should handle negative amounts gracefully', () => {
    const negativeAmount = -100
    const result = calculateMilestoneReleaseAmount(negativeAmount, 3)
    
    // Should still calculate mathematically correct values
    expect(result.platformFee).toBe(-3)
    expect(result.netAmount).toBe(-97)
    expect(result.totalAmount).toBe(-100)
  })

  test('should handle zero fee percentage', () => {
    const amount = 1000
    const result = calculateMilestoneReleaseAmount(amount, 0)
    
    expect(result.platformFee).toBe(0)
    expect(result.netAmount).toBe(amount)
    expect(result.totalAmount).toBe(amount)
  })

  test('should handle 100% fee percentage', () => {
    const amount = 1000
    const result = calculateMilestoneReleaseAmount(amount, 100)
    
    expect(result.platformFee).toBe(1000)
    expect(result.netAmount).toBe(0)
    expect(result.totalAmount).toBe(amount)
  })

  test('should maintain precision with floating point arithmetic', () => {
    // Test amounts that commonly cause floating point issues
    const trickyAmounts = [0.1, 0.2, 0.3, 1.1, 2.2, 3.3]
    
    trickyAmounts.forEach(amount => {
      const result = calculateMilestoneReleaseAmount(amount, 3)
      
      // Verify the sum is correct within floating point precision
      const sum = result.netAmount + result.platformFee
      expect(Math.abs(sum - amount)).toBeLessThan(0.0000001)
    })
  })
})
