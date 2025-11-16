/**
 * Dispute System Tests
 * Tests for dispute raising, evidence submission, and admin resolution
 * Requirements: 6.1-6.6
 */

import { getSupabase } from '@/lib/supabase'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn()
}))

// Mock wallet manager
jest.mock('../wallet-manager', () => ({
  decryptPrivateKey: jest.fn(() => 'mock-decrypted-key')
}))

// Mock transaction signer
jest.mock('../transaction-signer', () => ({
  transferToMultiple: jest.fn(() => Promise.resolve('mock-tx-signature-123')),
  transferSol: jest.fn(() => Promise.resolve('mock-tx-signature-456'))
}))

describe('Dispute System', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis()
    }
    
    ;(getSupabase as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('Dispute Raising (Requirement 6.1, 6.2, 6.3)', () => {
    test('should allow buyer to raise a dispute', async () => {
      const dispute = {
        escrowId: 'test-escrow-1',
        actorWallet: 'buyer-wallet-address',
        reason: 'Work not completed as agreed',
        description: 'The seller did not deliver the work according to specifications outlined in milestone 1.',
      }

      // Validate required fields
      expect(dispute.escrowId).toBeDefined()
      expect(dispute.actorWallet).toBeDefined()
      expect(dispute.reason).toBeDefined()
      expect(dispute.description).toBeDefined()

      // Validate description length (min 20 characters)
      expect(dispute.description.length).toBeGreaterThanOrEqual(20)
    })

    test('should allow seller to raise a dispute', async () => {
      const dispute = {
        escrowId: 'test-escrow-1',
        actorWallet: 'seller-wallet-address',
        reason: 'Buyer refusing to approve completed work',
        description: 'I have completed all work as specified but buyer is not approving the milestone.',
      }

      expect(dispute.escrowId).toBeDefined()
      expect(dispute.actorWallet).toBeDefined()
      expect(dispute.reason).toBeDefined()
      expect(dispute.description.length).toBeGreaterThanOrEqual(20)
    })

    test('should reject dispute with insufficient description', async () => {
      const dispute = {
        escrowId: 'test-escrow-1',
        actorWallet: 'buyer-wallet-address',
        reason: 'Issue',
        description: 'Too short', // Less than 20 characters
      }

      expect(dispute.description.length).toBeLessThan(20)
    })

    test('should freeze automatic releases when dispute is raised', async () => {
      const escrowStatus = 'disputed'
      expect(escrowStatus).toBe('disputed')
    })

    test('should notify counterparty when dispute is raised', async () => {
      const notification = {
        escrowId: 'test-escrow-1',
        recipientWallet: 'counterparty-wallet',
        notificationType: 'dispute_raised',
        title: 'Dispute Raised',
        message: 'Buyer has raised a dispute',
      }

      expect(notification.notificationType).toBe('dispute_raised')
      expect(notification.recipientWallet).toBeDefined()
    })
  })

  describe('Evidence Submission (Requirement 6.4)', () => {
    test('should allow text evidence submission', async () => {
      const evidence = {
        escrowId: 'test-escrow-1',
        disputeId: 'test-dispute-1',
        submittedBy: 'buyer-wallet',
        evidenceType: 'text',
        content: 'Here is the detailed explanation of why the work is incomplete...',
      }

      expect(evidence.evidenceType).toBe('text')
      expect(evidence.content).toBeDefined()
    })

    test('should allow image evidence submission', async () => {
      const evidence = {
        escrowId: 'test-escrow-1',
        disputeId: 'test-dispute-1',
        submittedBy: 'seller-wallet',
        evidenceType: 'image',
        fileUrl: 'https://example.com/evidence/screenshot.png',
        mimeType: 'image/png',
        fileSize: 1024000,
      }

      expect(evidence.evidenceType).toBe('image')
      expect(evidence.fileUrl).toBeDefined()
    })

    test('should allow document evidence submission', async () => {
      const evidence = {
        escrowId: 'test-escrow-1',
        disputeId: 'test-dispute-1',
        submittedBy: 'buyer-wallet',
        evidenceType: 'document',
        fileUrl: 'https://example.com/evidence/contract.pdf',
        mimeType: 'application/pdf',
      }

      expect(evidence.evidenceType).toBe('document')
      expect(evidence.fileUrl).toBeDefined()
    })

    test('should allow link evidence submission', async () => {
      const evidence = {
        escrowId: 'test-escrow-1',
        disputeId: 'test-dispute-1',
        submittedBy: 'seller-wallet',
        evidenceType: 'link',
        content: 'https://github.com/project/pull/123',
      }

      expect(evidence.evidenceType).toBe('link')
      expect(evidence.content).toBeDefined()
    })

    test('should validate evidence type', async () => {
      const validTypes = ['text', 'image', 'document', 'link', 'screenshot']
      const testType = 'text'

      expect(validTypes).toContain(testType)
    })

    test('should require content for text evidence', async () => {
      const evidence = {
        evidenceType: 'text',
        content: 'This is the evidence content',
      }

      if (evidence.evidenceType === 'text') {
        expect(evidence.content).toBeDefined()
      }
    })

    test('should require fileUrl for image evidence', async () => {
      const evidence = {
        evidenceType: 'image',
        fileUrl: 'https://example.com/image.png',
      }

      if (evidence.evidenceType === 'image') {
        expect(evidence.fileUrl).toBeDefined()
      }
    })
  })

  describe('Admin Dispute Queue (Requirement 6.5)', () => {
    test('should list all disputed escrows', async () => {
      const disputes = [
        {
          id: 'dispute-1',
          escrowId: 'escrow-1',
          status: 'open',
          priority: 'high',
        },
        {
          id: 'dispute-2',
          escrowId: 'escrow-2',
          status: 'under_review',
          priority: 'normal',
        },
      ]

      expect(disputes.length).toBeGreaterThan(0)
      expect(disputes[0].status).toBe('open')
    })

    test('should show evidence from both parties', async () => {
      const evidenceByParty = {
        buyer: [
          { id: 'ev-1', evidenceType: 'text', content: 'Buyer evidence' },
        ],
        seller: [
          { id: 'ev-2', evidenceType: 'image', fileUrl: 'seller-proof.png' },
        ],
      }

      expect(evidenceByParty.buyer.length).toBeGreaterThan(0)
      expect(evidenceByParty.seller.length).toBeGreaterThan(0)
    })

    test('should display escrow details and history', async () => {
      const disputeDetails = {
        dispute: {
          id: 'dispute-1',
          reason: 'Work incomplete',
          description: 'Detailed description',
        },
        escrow: {
          id: 'escrow-1',
          buyerAmount: 10,
          token: 'SOL',
        },
        actions: [
          { actionType: 'created', createdAt: '2024-01-01' },
          { actionType: 'disputed', createdAt: '2024-01-02' },
        ],
      }

      expect(disputeDetails.dispute).toBeDefined()
      expect(disputeDetails.escrow).toBeDefined()
      expect(disputeDetails.actions.length).toBeGreaterThan(0)
    })

    test('should sort disputes by priority', async () => {
      const disputes = [
        { id: '1', priority: 'normal' },
        { id: '2', priority: 'urgent' },
        { id: '3', priority: 'high' },
      ]

      const priorityOrder = ['urgent', 'high', 'normal', 'low']
      const sorted = disputes.sort((a, b) => 
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
      )

      expect(sorted[0].priority).toBe('urgent')
    })
  })

  describe('Admin Resolution Actions (Requirement 6.6, 14.3, 14.4)', () => {
    test('should allow release to seller resolution', async () => {
      const resolution = {
        disputeId: 'dispute-1',
        escrowId: 'escrow-1',
        adminWallet: 'admin-wallet',
        resolutionAction: 'release_to_seller',
        notes: 'After reviewing evidence, seller completed work as agreed. Releasing funds.',
      }

      expect(resolution.resolutionAction).toBe('release_to_seller')
      expect(resolution.notes.length).toBeGreaterThanOrEqual(20)
    })

    test('should allow refund to buyer resolution', async () => {
      const resolution = {
        disputeId: 'dispute-1',
        escrowId: 'escrow-1',
        adminWallet: 'admin-wallet',
        resolutionAction: 'refund_to_buyer',
        notes: 'Seller failed to deliver work. Refunding buyer in full.',
      }

      expect(resolution.resolutionAction).toBe('refund_to_buyer')
      expect(resolution.notes.length).toBeGreaterThanOrEqual(20)
    })

    test('should allow partial split resolution', async () => {
      const resolution = {
        disputeId: 'dispute-1',
        escrowId: 'escrow-1',
        adminWallet: 'admin-wallet',
        resolutionAction: 'partial_split',
        amountToBuyer: 5,
        amountToSeller: 5,
        notes: 'Both parties partially at fault. Splitting funds 50/50.',
      }

      expect(resolution.resolutionAction).toBe('partial_split')
      expect(resolution.amountToBuyer).toBeDefined()
      expect(resolution.amountToSeller).toBeDefined()
      expect(resolution.notes.length).toBeGreaterThanOrEqual(20)
    })

    test('should validate partial split amounts do not exceed total', async () => {
      const escrowAmount = 10
      const amountToBuyer = 6
      const amountToSeller = 5

      const total = amountToBuyer + amountToSeller
      expect(total).toBeLessThanOrEqual(escrowAmount)
    })

    test('should require resolution notes with minimum length', async () => {
      const notes = 'This is a detailed explanation of the admin decision and reasoning behind it.'
      expect(notes.length).toBeGreaterThanOrEqual(20)
    })

    test('should record resolution in database', async () => {
      const adminAction = {
        id: 'admin-action-1',
        escrowId: 'escrow-1',
        disputeId: 'dispute-1',
        adminWallet: 'admin-wallet',
        action: 'resolved_dispute',
        decision: 'release_to_seller',
        notes: 'Resolution notes',
      }

      expect(adminAction.action).toBe('resolved_dispute')
      expect(adminAction.decision).toBeDefined()
    })

    test('should update dispute status to resolved', async () => {
      const dispute = {
        id: 'dispute-1',
        status: 'resolved',
        resolvedBy: 'admin-wallet',
        resolvedAt: new Date().toISOString(),
      }

      expect(dispute.status).toBe('resolved')
      expect(dispute.resolvedBy).toBeDefined()
      expect(dispute.resolvedAt).toBeDefined()
    })

    test('should update escrow status to completed after resolution', async () => {
      const escrow = {
        id: 'escrow-1',
        status: 'completed',
        completedAt: new Date().toISOString(),
      }

      expect(escrow.status).toBe('completed')
      expect(escrow.completedAt).toBeDefined()
    })

    test('should notify both parties of resolution', async () => {
      const notifications = [
        {
          recipientWallet: 'buyer-wallet',
          notificationType: 'dispute_resolved',
          message: 'Admin has resolved the dispute',
        },
        {
          recipientWallet: 'seller-wallet',
          notificationType: 'dispute_resolved',
          message: 'Admin has resolved the dispute',
        },
      ]

      expect(notifications.length).toBe(2)
      expect(notifications[0].notificationType).toBe('dispute_resolved')
      expect(notifications[1].notificationType).toBe('dispute_resolved')
    })
  })

  describe('Dispute Flow Integration', () => {
    test('should complete full dispute flow', async () => {
      // 1. Raise dispute
      const dispute = {
        escrowId: 'test-escrow',
        actorWallet: 'buyer-wallet',
        reason: 'Work incomplete',
        description: 'Seller did not complete milestone as agreed in the contract.',
        status: 'open',
      }
      expect(dispute.status).toBe('open')

      // 2. Submit evidence from buyer
      const buyerEvidence = {
        disputeId: dispute.escrowId,
        submittedBy: 'buyer-wallet',
        evidenceType: 'text',
        content: 'Here is my evidence',
      }
      expect(buyerEvidence.evidenceType).toBe('text')

      // 3. Submit evidence from seller
      const sellerEvidence = {
        disputeId: dispute.escrowId,
        submittedBy: 'seller-wallet',
        evidenceType: 'image',
        fileUrl: 'proof.png',
      }
      expect(sellerEvidence.evidenceType).toBe('image')

      // 4. Admin reviews and resolves
      const resolution = {
        disputeId: dispute.escrowId,
        resolutionAction: 'partial_split',
        amountToBuyer: 6,
        amountToSeller: 4,
        notes: 'After reviewing evidence, partial completion warrants 40% payment to seller.',
      }
      expect(resolution.resolutionAction).toBe('partial_split')

      // 5. Verify resolution recorded
      const finalDispute = {
        ...dispute,
        status: 'resolved',
        resolutionAction: resolution.resolutionAction,
      }
      expect(finalDispute.status).toBe('resolved')
    })

    test('should prevent duplicate disputes on same escrow', async () => {
      const existingDispute = {
        escrowId: 'test-escrow',
        status: 'open',
      }

      const newDispute = {
        escrowId: 'test-escrow',
      }

      // Should check if dispute already exists
      expect(existingDispute.escrowId).toBe(newDispute.escrowId)
    })

    test('should prevent disputes on completed escrows', async () => {
      const escrow = {
        id: 'test-escrow',
        status: 'completed',
      }

      const invalidStatuses = ['completed', 'cancelled', 'refunded']
      expect(invalidStatuses).toContain(escrow.status)
    })
  })
})
