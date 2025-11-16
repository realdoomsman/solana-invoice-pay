/**
 * Timeout Monitoring Service Tests
 * Tests for periodic timeout checking, warnings, and admin escalation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  checkExpiredEscrows,
  checkEscrowTimeouts,
  sendPreExpirationWarning,
  escalateToAdminReview,
  getTimeoutStatistics,
} from '../timeout-monitor'

// Mock Supabase
jest.mock('../../supabase', () => ({
  getSupabase: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        lt: jest.fn(() => ({
          limit: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        is: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null,
          })),
        })),
        data: {},
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null,
        })),
      })),
    })),
  })),
}))

describe('Timeout Monitoring Service', () => {
  describe('checkExpiredEscrows', () => {
    it('should check for expired escrows and return summary', async () => {
      const result = await checkExpiredEscrows()

      expect(result).toHaveProperty('totalChecked')
      expect(result).toHaveProperty('expiredCount')
      expect(result).toHaveProperty('warningsSent')
      expect(result).toHaveProperty('escalatedToAdmin')
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should handle no active timeouts gracefully', async () => {
      const result = await checkExpiredEscrows()

      expect(result.totalChecked).toBe(0)
      expect(result.expiredCount).toBe(0)
      expect(result.warningsSent).toBe(0)
      expect(result.escalatedToAdmin).toBe(0)
    })
  })

  describe('checkEscrowTimeouts', () => {
    it('should check timeouts for specific escrow', async () => {
      const escrowId = 'test-escrow-123'
      const result = await checkEscrowTimeouts(escrowId)

      expect(result).toHaveProperty('hasExpired')
      expect(result).toHaveProperty('expiredTimeouts')
      expect(result).toHaveProperty('activeTimeouts')
      expect(Array.isArray(result.expiredTimeouts)).toBe(true)
      expect(Array.isArray(result.activeTimeouts)).toBe(true)
    })
  })

  describe('getTimeoutStatistics', () => {
    it('should return timeout statistics', async () => {
      const stats = await getTimeoutStatistics()

      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('active')
      expect(stats).toHaveProperty('expired')
      expect(stats).toHaveProperty('resolved')
      expect(stats).toHaveProperty('byType')
      expect(stats).toHaveProperty('avgResolutionTime')
      expect(typeof stats.total).toBe('number')
      expect(typeof stats.avgResolutionTime).toBe('number')
    })

    it('should categorize timeouts by type', async () => {
      const stats = await getTimeoutStatistics()

      expect(stats.byType).toHaveProperty('deposit_timeout')
      expect(stats.byType).toHaveProperty('confirmation_timeout')
      expect(stats.byType).toHaveProperty('milestone_timeout')
      expect(stats.byType).toHaveProperty('dispute_timeout')
      expect(stats.byType).toHaveProperty('swap_timeout')
    })
  })
})
