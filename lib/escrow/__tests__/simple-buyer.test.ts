/**
 * Simple Buyer Escrow (Milestone-based) Tests
 * Tests milestone creation, validation, work submission, approval, and release
 */

import {
  validateMilestones,
  calculateMilestoneAmounts,
  createMilestones,
  getMilestones,
  submitMilestoneWork,
  approveMilestone,
  releaseMilestoneFunds,
  checkPreviousMilestonesCompleted,
  getMilestoneStats,
  areAllMilestonesReleased,
} from '../simple-buyer'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}))

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn((length?: number) => {
    if (length === 12) return 'action-id-12'
    if (length === 10) return 'milestone-id'
    return 'random-id'
  }),
}))

describe('Milestone Creation and Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should validate milestones that sum to 100%', () => {
    const milestones = [
      { description: 'Phase 1', percentage: 30 },
      { description: 'Phase 2', percentage: 40 },
      { description: 'Phase 3', percentage: 30 },
    ]

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject milestones that do not sum to 100%', () => {
    const milestones = [
      { description: 'Phase 1', percentage: 30 },
      { description: 'Phase 2', percentage: 40 },
    ]

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      expect.stringContaining('must sum to 100%')
    )
  })

  test('should reject milestones with zero or negative percentages', () => {
    const milestones = [
      { description: 'Phase 1', percentage: 0 },
      { description: 'Phase 2', percentage: 100 },
    ]

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      expect.stringContaining('must be greater than 0')
    )
  })

  test('should reject milestones with percentage over 100', () => {
    const milestones = [{ description: 'Phase 1', percentage: 150 }]

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      expect.stringContaining('cannot exceed 100')
    )
  })

  test('should reject empty milestone list', () => {
    const result = validateMilestones([], 1000)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one milestone is required')
  })

  test('should reject milestones with empty descriptions', () => {
    const milestones = [
      { description: '', percentage: 50 },
      { description: 'Phase 2', percentage: 50 },
    ]

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      expect.stringContaining('Description is required')
    )
  })

  test('should reject too many milestones', () => {
    const milestones = Array.from({ length: 25 }, (_, i) => ({
      description: `Phase ${i + 1}`,
      percentage: 4,
    }))

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Maximum 20 milestones allowed')
  })

  test('should warn about single milestone', () => {
    const milestones = [{ description: 'Complete project', percentage: 100 }]

    const result = validateMilestones(milestones, 1000)

    expect(result.valid).toBe(true)
    expect(result.warnings).toContain(
      expect.stringContaining('consider using traditional escrow')
    )
  })

  test('should calculate milestone amounts correctly', () => {
    const milestones = [
      { description: 'Phase 1', percentage: 30 },
      { description: 'Phase 2', percentage: 70 },
    ]

    const result = calculateMilestoneAmounts(milestones, 1000)

    expect(result).toHaveLength(2)
    expect(result[0].amount).toBe(300)
    expect(result[0].milestone_order).toBe(1)
    expect(result[1].amount).toBe(700)
    expect(result[1].milestone_order).toBe(2)
  })

  test('should create milestones in database with proper ordering', async () => {
    const mockMilestones = [
      {
        id: 'milestone-id',
        escrow_id: 'escrow-123',
        description: 'Phase 1',
        percentage: 50,
        amount: 500,
        milestone_order: 1,
        status: 'pending',
      },
      {
        id: 'milestone-id',
        escrow_id: 'escrow-123',
        description: 'Phase 2',
        percentage: 50,
        amount: 500,
        milestone_order: 2,
        status: 'pending',
      },
    ]

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestones,
      error: null,
    })

    const validatedMilestones = [
      { description: 'Phase 1', percentage: 50, amount: 500, milestone_order: 1 },
      { description: 'Phase 2', percentage: 50, amount: 500, milestone_order: 2 },
    ]

    const result = await createMilestones('escrow-123', validatedMilestones)

    expect(supabase.from).toHaveBeenCalledWith('escrow_milestones')
    expect(supabase.insert).toHaveBeenCalled()
  })
})

describe('Work Submission System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should submit work for pending milestone', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'pending',
      milestone_order: 1,
      description: 'Phase 1',
      escrow_contracts: {
        id: 'escrow-456',
        seller_wallet: 'seller-wallet-123',
        buyer_wallet: 'buyer-wallet-456',
        status: 'fully_funded',
      },
    }

    const mockUpdated = {
      ...mockMilestone,
      status: 'work_submitted',
      seller_submitted_at: expect.any(String),
      seller_notes: 'Work completed',
    }

    ;(supabase.single as jest.Mock)
      .mockResolvedValueOnce({ data: mockMilestone, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    ;(supabase.insert as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.update as jest.Mock).mockResolvedValue({ error: null })

    const result = await submitMilestoneWork({
      milestoneId: 'milestone-123',
      sellerWallet: 'seller-wallet-123',
      notes: 'Work completed',
    })

    expect(result.success).toBe(true)
    expect(result.milestone?.status).toBe('work_submitted')
  })

  test('should reject work submission from non-seller', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'pending',
      escrow_contracts: {
        seller_wallet: 'seller-wallet-123',
        buyer_wallet: 'buyer-wallet-456',
      },
    }

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestone,
      error: null,
    })

    const result = await submitMilestoneWork({
      milestoneId: 'milestone-123',
      sellerWallet: 'unauthorized-wallet',
      notes: 'Work completed',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only the seller can submit work')
  })

  test('should reject work submission for non-pending milestone', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'approved',
      escrow_contracts: {
        seller_wallet: 'seller-wallet-123',
        status: 'fully_funded',
      },
    }

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestone,
      error: null,
    })

    const result = await submitMilestoneWork({
      milestoneId: 'milestone-123',
      sellerWallet: 'seller-wallet-123',
      notes: 'Work completed',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('cannot be submitted')
  })

  test('should enforce sequential order for work submission', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'pending',
      milestone_order: 2,
      escrow_contracts: {
        seller_wallet: 'seller-wallet-123',
        status: 'fully_funded',
      },
    }

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestone,
      error: null,
    })

    // Mock previous milestone not completed
    ;(supabase.eq as jest.Mock).mockReturnValue({
      ...supabase,
      single: jest.fn().mockResolvedValue({
        data: [{ status: 'pending' }],
        error: null,
      }),
    })

    const result = await submitMilestoneWork({
      milestoneId: 'milestone-123',
      sellerWallet: 'seller-wallet-123',
      notes: 'Work completed',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Previous milestones must be completed')
  })

  test('should include evidence URLs in submission', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'pending',
      milestone_order: 1,
      escrow_contracts: {
        seller_wallet: 'seller-wallet-123',
        buyer_wallet: 'buyer-wallet-456',
        status: 'fully_funded',
      },
    }

    const mockUpdated = {
      ...mockMilestone,
      status: 'work_submitted',
      seller_evidence_urls: ['https://example.com/proof1.jpg'],
    }

    ;(supabase.single as jest.Mock)
      .mockResolvedValueOnce({ data: mockMilestone, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    ;(supabase.insert as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.update as jest.Mock).mockResolvedValue({ error: null })

    const result = await submitMilestoneWork({
      milestoneId: 'milestone-123',
      sellerWallet: 'seller-wallet-123',
      notes: 'Work completed',
      evidenceUrls: ['https://example.com/proof1.jpg'],
    })

    expect(result.success).toBe(true)
  })
})

describe('Milestone Approval and Release', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should approve submitted milestone', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'work_submitted',
      milestone_order: 1,
      amount: 500,
      escrow_contracts: {
        id: 'escrow-456',
        buyer_wallet: 'buyer-wallet-456',
        seller_wallet: 'seller-wallet-123',
      },
    }

    const mockUpdated = {
      ...mockMilestone,
      status: 'approved',
      buyer_approved_at: expect.any(String),
    }

    ;(supabase.single as jest.Mock)
      .mockResolvedValueOnce({ data: mockMilestone, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    ;(supabase.insert as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.update as jest.Mock).mockResolvedValue({ error: null })

    const result = await approveMilestone({
      milestoneId: 'milestone-123',
      buyerWallet: 'buyer-wallet-456',
      notes: 'Looks good',
    })

    expect(result.success).toBe(true)
    expect(result.shouldRelease).toBe(true)
    expect(result.milestone?.status).toBe('approved')
  })

  test('should reject approval from non-buyer', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'work_submitted',
      escrow_contracts: {
        buyer_wallet: 'buyer-wallet-456',
        seller_wallet: 'seller-wallet-123',
      },
    }

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestone,
      error: null,
    })

    const result = await approveMilestone({
      milestoneId: 'milestone-123',
      buyerWallet: 'unauthorized-wallet',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only the buyer can approve')
  })

  test('should reject approval for non-submitted milestone', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'pending',
      escrow_contracts: {
        buyer_wallet: 'buyer-wallet-456',
      },
    }

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestone,
      error: null,
    })

    const result = await approveMilestone({
      milestoneId: 'milestone-123',
      buyerWallet: 'buyer-wallet-456',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Work must be submitted first')
  })

  test('should prevent out-of-order approvals', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'work_submitted',
      milestone_order: 2,
      escrow_contracts: {
        buyer_wallet: 'buyer-wallet-456',
      },
    }

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestone,
      error: null,
    })

    // Mock previous milestone not released
    ;(supabase.eq as jest.Mock).mockReturnValue({
      ...supabase,
      single: jest.fn().mockResolvedValue({
        data: [{ status: 'approved' }],
        error: null,
      }),
    })

    const result = await approveMilestone({
      milestoneId: 'milestone-123',
      buyerWallet: 'buyer-wallet-456',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Previous milestones must be released')
  })

  test('should record milestone fund release', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'approved',
      amount: 500,
      milestone_order: 1,
      escrow_contracts: {
        id: 'escrow-456',
        escrow_wallet: 'escrow-wallet-789',
        seller_wallet: 'seller-wallet-123',
        token: 'SOL',
      },
    }

    const mockUpdated = {
      ...mockMilestone,
      status: 'released',
      released_at: expect.any(String),
      tx_signature: 'tx-sig-123',
    }

    ;(supabase.single as jest.Mock)
      .mockResolvedValueOnce({ data: mockMilestone, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
      .mockResolvedValueOnce({ data: [{ status: 'pending' }], error: null })

    ;(supabase.insert as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.update as jest.Mock).mockResolvedValue({ error: null })

    const result = await releaseMilestoneFunds({
      milestoneId: 'milestone-123',
      txSignature: 'tx-sig-123',
      triggeredBy: 'system',
    })

    expect(result.success).toBe(true)
    expect(result.milestone?.status).toBe('released')
    expect(result.escrowCompleted).toBe(false)
  })

  test('should complete escrow when all milestones released', async () => {
    const mockMilestone = {
      id: 'milestone-123',
      escrow_id: 'escrow-456',
      status: 'approved',
      amount: 500,
      escrow_contracts: {
        id: 'escrow-456',
        escrow_wallet: 'escrow-wallet-789',
        seller_wallet: 'seller-wallet-123',
        buyer_wallet: 'buyer-wallet-456',
        token: 'SOL',
      },
    }

    const mockUpdated = {
      ...mockMilestone,
      status: 'released',
    }

    ;(supabase.single as jest.Mock)
      .mockResolvedValueOnce({ data: mockMilestone, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
      .mockResolvedValueOnce({
        data: [{ status: 'released' }, { status: 'released' }],
        error: null,
      })

    ;(supabase.insert as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.update as jest.Mock).mockResolvedValue({ error: null })

    const result = await releaseMilestoneFunds({
      milestoneId: 'milestone-123',
      txSignature: 'tx-sig-123',
      triggeredBy: 'system',
    })

    expect(result.success).toBe(true)
    expect(result.escrowCompleted).toBe(true)
  })
})

describe('Milestone Statistics and Completion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should calculate milestone statistics correctly', async () => {
    const mockMilestones = [
      {
        id: 'm1',
        status: 'released',
        percentage: 30,
        amount: 300,
        milestone_order: 1,
      },
      {
        id: 'm2',
        status: 'approved',
        percentage: 40,
        amount: 400,
        milestone_order: 2,
      },
      {
        id: 'm3',
        status: 'pending',
        percentage: 30,
        amount: 300,
        milestone_order: 3,
      },
    ]

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestones,
      error: null,
    })

    const stats = await getMilestoneStats('escrow-123')

    expect(stats.total).toBe(3)
    expect(stats.released).toBe(1)
    expect(stats.approved).toBe(1)
    expect(stats.pending).toBe(1)
    expect(stats.completionPercentage).toBe(30)
    expect(stats.releasedAmount).toBe(300)
    expect(stats.remainingAmount).toBe(700)
  })

  test('should check if all milestones are released', async () => {
    const mockMilestones = [
      { status: 'released' },
      { status: 'released' },
      { status: 'released' },
    ]

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestones,
      error: null,
    })

    const result = await areAllMilestonesReleased('escrow-123')

    expect(result).toBe(true)
  })

  test('should return false if not all milestones released', async () => {
    const mockMilestones = [
      { status: 'released' },
      { status: 'approved' },
      { status: 'pending' },
    ]

    ;(supabase.single as jest.Mock).mockResolvedValue({
      data: mockMilestones,
      error: null,
    })

    const result = await areAllMilestonesReleased('escrow-123')

    expect(result).toBe(false)
  })
})
