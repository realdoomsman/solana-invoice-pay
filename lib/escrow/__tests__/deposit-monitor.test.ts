/**
 * Deposit Monitor Tests
 * Tests deposit tracking, verification, and status updates
 */

import {
  monitorEscrowDeposits,
  getDepositStatus,
  checkAndUpdateFundingStatus
} from '../deposit-monitor'
import { getSupabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn()
}))

// Mock Solana connection
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn(),
  LAMPORTS_PER_SOL: 1000000000
}))

describe('Deposit Monitoring', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup mock Supabase client
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
  
  describe('monitorEscrowDeposits', () => {
    test('should track buyer deposit for simple_buyer escrow', async () => {
      const mockEscrow = {
        id: 'test-escrow-1',
        escrow_type: 'simple_buyer',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_amount: 100,
        token: 'SOL',
        buyer_deposited: true,
        seller_deposited: false
      }
      
      const mockDeposits = [
        {
          id: 'deposit-1',
          escrow_id: 'test-escrow-1',
          party_role: 'buyer',
          amount: 100,
          confirmed: true
        }
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      mockSupabase.select.mockResolvedValueOnce({ data: mockDeposits, error: null })
      
      const result = await monitorEscrowDeposits('test-escrow-1')
      
      expect(result.buyerDeposited).toBe(true)
      expect(result.sellerDeposited).toBe(false)
      expect(result.fullyFunded).toBe(true) // Simple buyer only needs buyer deposit
      expect(result.deposits).toHaveLength(1)
    })
    
    test('should track both deposits for traditional escrow', async () => {
      const mockEscrow = {
        id: 'test-escrow-2',
        escrow_type: 'traditional',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_amount: 100,
        seller_amount: 50,
        token: 'SOL',
        buyer_deposited: true,
        seller_deposited: true
      }
      
      const mockDeposits = [
        {
          id: 'deposit-1',
          escrow_id: 'test-escrow-2',
          party_role: 'buyer',
          amount: 100,
          confirmed: true
        },
        {
          id: 'deposit-2',
          escrow_id: 'test-escrow-2',
          party_role: 'seller',
          amount: 50,
          confirmed: true
        }
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      mockSupabase.select.mockResolvedValueOnce({ data: mockDeposits, error: null })
      
      const result = await monitorEscrowDeposits('test-escrow-2')
      
      expect(result.buyerDeposited).toBe(true)
      expect(result.sellerDeposited).toBe(true)
      expect(result.fullyFunded).toBe(true)
      expect(result.deposits).toHaveLength(2)
    })
    
    test('should return not fully funded when deposits missing', async () => {
      const mockEscrow = {
        id: 'test-escrow-3',
        escrow_type: 'traditional',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_amount: 100,
        seller_amount: 50,
        token: 'SOL',
        buyer_deposited: true,
        seller_deposited: false
      }
      
      const mockDeposits = [
        {
          id: 'deposit-1',
          escrow_id: 'test-escrow-3',
          party_role: 'buyer',
          amount: 100,
          confirmed: true
        }
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      mockSupabase.select.mockResolvedValueOnce({ data: mockDeposits, error: null })
      
      const result = await monitorEscrowDeposits('test-escrow-3')
      
      expect(result.buyerDeposited).toBe(true)
      expect(result.sellerDeposited).toBe(false)
      expect(result.fullyFunded).toBe(false)
    })
    
    test('should throw error for non-existent escrow', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
      
      await expect(monitorEscrowDeposits('invalid-id')).rejects.toThrow('Escrow not found')
    })
  })
  
  describe('getDepositStatus', () => {
    test('should return complete deposit status', async () => {
      const mockEscrow = {
        id: 'test-escrow-1',
        escrow_type: 'traditional',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_amount: 100,
        seller_amount: 50,
        token: 'SOL',
        escrow_wallet: 'escrow123',
        buyer_deposited: true,
        seller_deposited: true
      }
      
      const mockDeposits = [
        {
          id: 'deposit-1',
          party_role: 'buyer',
          amount: 100,
          deposited_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'deposit-2',
          party_role: 'seller',
          amount: 50,
          deposited_at: '2024-01-01T01:00:00Z'
        }
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: mockDeposits, error: null })
      
      const result = await getDepositStatus('test-escrow-1')
      
      expect(result.escrow_id).toBe('test-escrow-1')
      expect(result.buyer_deposited).toBe(true)
      expect(result.seller_deposited).toBe(true)
      expect(result.fully_funded).toBe(true)
      expect(result.buyer_amount).toBe(100)
      expect(result.seller_amount).toBe(50)
      expect(result.token).toBe('SOL')
      expect(result.escrow_wallet).toBe('escrow123')
      expect(result.deposits).toHaveLength(2)
    })
  })
  
  describe('checkAndUpdateFundingStatus', () => {
    test('should update status to fully_funded when both parties deposit', async () => {
      const mockEscrow = {
        id: 'test-escrow-1',
        escrow_type: 'traditional',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_deposited: true,
        seller_deposited: true,
        status: 'buyer_deposited'
      }
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      mockSupabase.update.mockResolvedValueOnce({ data: null, error: null })
      
      await checkAndUpdateFundingStatus('test-escrow-1')
      
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fully_funded'
        })
      )
    })
    
    test('should not update status if already fully_funded', async () => {
      const mockEscrow = {
        id: 'test-escrow-1',
        escrow_type: 'traditional',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_deposited: true,
        seller_deposited: true,
        status: 'fully_funded'
      }
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      
      await checkAndUpdateFundingStatus('test-escrow-1')
      
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })
    
    test('should handle simple_buyer escrow with only buyer deposit', async () => {
      const mockEscrow = {
        id: 'test-escrow-1',
        escrow_type: 'simple_buyer',
        buyer_wallet: 'buyer123',
        seller_wallet: 'seller123',
        buyer_deposited: true,
        seller_deposited: false,
        status: 'created'
      }
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockEscrow, error: null })
      mockSupabase.update.mockResolvedValueOnce({ data: null, error: null })
      
      await checkAndUpdateFundingStatus('test-escrow-1')
      
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fully_funded'
        })
      )
    })
  })
})
