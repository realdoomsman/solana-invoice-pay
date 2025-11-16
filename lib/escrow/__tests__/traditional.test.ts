/**
 * Traditional Escrow Tests
 * Tests full happy path flow, single confirmation timeout, and dispute scenarios
 */

import {
  createTraditionalEscrow,
  confirmEscrow,
  releaseTraditionalEscrowFunds
} from '../traditional'
import { getSupabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn()
}))

// Mock wallet manager
jest.mock('../wallet-manager', () => ({
  createEncryptedEscrowWallet: jest.fn(() => ({
    publicKey: 'mock-escrow-wallet-public-key',
    encryptedPrivateKey: 'mock-encrypted-private-key',
    keypair: {}
  }))
}))

// Mock transaction signer
jest.mock('../transaction-signer', () => ({
  transferToMultiple: jest.fn(() => Promise.resolve('mock-tx-signature-123'))
}))

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn((length?: number) => {
    if (length === 12) return 'escrow-id-12'
    if (length === 10) return 'payment-id-10'
    return 'random-id'
  })
}))

describe('Traditional Escrow - Happy Path Flow', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    ;(getSupabase as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  test('should create traditional escrow with both party deposits required', async () => {
    const mockEscrow = {
      id: 'escrow-id-12',
      escrow_type: 'traditional',
      payment_id: 'payment-id-10',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      buyer_amount: 100,
      seller_amount: 50,
      token: 'SOL',
      escrow_wallet: 'mock-escrow-wallet-public-key',
      encrypted_private_key: 'mock-encrypted-private-key',
      status: 'created',
      buyer_deposited: false,
      seller_deposited: false,
      buyer_confirmed: false,
      seller_confirmed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    mockSupabase.insert.mockResolvedValue({ data: mockEscrow, error: null })
    
    const result = await createTraditionalEscrow({
      buyerWallet: 'buyer-wallet-123',
      sellerWallet: 'seller-wallet-456',
      buyerAmount: 100,
      sellerSecurityDeposit: 50,
      token: 'SOL',
      description: 'Test escrow',
      timeoutHours: 72
    })
    
    expect(result.success).toBe(true)
    expect(result.escrow.escrow_type).toBe('traditional')
    expect(result.escrow.buyer_amount).toBe(100)
    expect(result.escrow.seller_amount).toBe(50)
    expect(result.escrow.buyer_deposited).toBe(false)
    expect(result.escrow.seller_deposited).toBe(false)
    expect(result.paymentLink).toBe('/pay/payment-id-10')
  })
  
  test('should confirm escrow by buyer', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'fully_funded',
      buyer_confirmed: false,
      seller_confirmed: false
    }
    
    const mockUpdated = {
      buyer_confirmed: true,
      seller_confirmed: false
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockEscrow, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
    
    mockSupabase.update.mockResolvedValue({ error: null })
    
    const result = await confirmEscrow('escrow-123', 'buyer-wallet-123', 'Transaction completed successfully')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ buyer_confirmed: true })
    )
  })
  
  test('should confirm escrow by seller', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'fully_funded',
      buyer_confirmed: false,
      seller_confirmed: false
    }
    
    const mockUpdated = {
      buyer_confirmed: false,
      seller_confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockEscrow, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
    
    mockSupabase.update.mockResolvedValue({ error: null })
    
    const result = await confirmEscrow('escrow-123', 'seller-wallet-456', 'Goods delivered')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ seller_confirmed: true })
    )
  })
  
  test('should automatically release funds when both parties confirm', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      buyer_amount: 100,
      seller_amount: 50,
      token: 'SOL',
      escrow_wallet: 'escrow-wallet-789',
      encrypted_private_key: 'encrypted-key',
      status: 'fully_funded',
      buyer_confirmed: false,
      seller_confirmed: true
    }
    
    const mockUpdated = {
      buyer_confirmed: true,
      seller_confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockEscrow, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
      .mockResolvedValueOnce({ data: { ...mockEscrow, buyer_confirmed: true, seller_confirmed: true }, error: null })
    
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await confirmEscrow('escrow-123', 'buyer-wallet-123')
    
    expect(result).toBe(true)
  })
  
  test('should release funds to seller and return security deposit', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      buyer_amount: 100,
      seller_amount: 50,
      token: 'SOL',
      escrow_wallet: 'escrow-wallet-789',
      encrypted_private_key: 'encrypted-key',
      status: 'fully_funded',
      buyer_confirmed: true,
      seller_confirmed: true
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await releaseTraditionalEscrowFunds('escrow-123')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        completed_at: expect.any(String)
      })
    )
  })
})

describe('Traditional Escrow - Single Confirmation Timeout', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    ;(getSupabase as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  test('should not release funds with only buyer confirmation', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'fully_funded',
      buyer_confirmed: true,
      seller_confirmed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    
    await expect(releaseTraditionalEscrowFunds('escrow-123')).rejects.toThrow(
      'Both parties must confirm before release'
    )
  })
  
  test('should not release funds with only seller confirmation', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'fully_funded',
      buyer_confirmed: false,
      seller_confirmed: true
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    
    await expect(releaseTraditionalEscrowFunds('escrow-123')).rejects.toThrow(
      'Both parties must confirm before release'
    )
  })
  
  test('should notify counterparty when one party confirms', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'fully_funded',
      buyer_confirmed: false,
      seller_confirmed: false
    }
    
    const mockUpdated = {
      buyer_confirmed: true,
      seller_confirmed: false
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockEscrow, error: null })
      .mockResolvedValueOnce({ data: mockUpdated, error: null })
    
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    await confirmEscrow('escrow-123', 'buyer-wallet-123')
    
    // Verify notification was created for seller
    expect(mockSupabase.insert).toHaveBeenCalled()
  })
})

describe('Traditional Escrow - Dispute Scenarios', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    ;(getSupabase as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  test('should reject confirmation if escrow not fully funded', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'created',
      buyer_confirmed: false,
      seller_confirmed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    
    await expect(confirmEscrow('escrow-123', 'buyer-wallet-123')).rejects.toThrow(
      'Escrow must be fully funded before confirmation'
    )
  })
  
  test('should reject confirmation from unauthorized wallet', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'fully_funded',
      buyer_confirmed: false,
      seller_confirmed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    
    await expect(confirmEscrow('escrow-123', 'unauthorized-wallet')).rejects.toThrow(
      'Only buyer or seller can confirm'
    )
  })
  
  test('should reject fund release if not fully funded', async () => {
    const mockEscrow = {
      id: 'escrow-123',
      buyer_wallet: 'buyer-wallet-123',
      seller_wallet: 'seller-wallet-456',
      status: 'buyer_deposited',
      buyer_confirmed: true,
      seller_confirmed: true
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockEscrow, error: null })
    
    await expect(releaseTraditionalEscrowFunds('escrow-123')).rejects.toThrow(
      'Escrow must be fully funded before release'
    )
  })
})

describe('Traditional Escrow - Validation', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    ;(getSupabase as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  test('should reject creation with missing buyer wallet', async () => {
    const result = await createTraditionalEscrow({
      buyerWallet: '',
      sellerWallet: 'seller-wallet-456',
      buyerAmount: 100,
      sellerSecurityDeposit: 50,
      token: 'SOL'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('buyer and seller wallet addresses are required')
  })
  
  test('should reject creation with missing seller wallet', async () => {
    const result = await createTraditionalEscrow({
      buyerWallet: 'buyer-wallet-123',
      sellerWallet: '',
      buyerAmount: 100,
      sellerSecurityDeposit: 50,
      token: 'SOL'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('buyer and seller wallet addresses are required')
  })
  
  test('should reject creation with zero buyer amount', async () => {
    const result = await createTraditionalEscrow({
      buyerWallet: 'buyer-wallet-123',
      sellerWallet: 'seller-wallet-456',
      buyerAmount: 0,
      sellerSecurityDeposit: 50,
      token: 'SOL'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Buyer amount must be greater than 0')
  })
  
  test('should reject creation with zero seller security deposit', async () => {
    const result = await createTraditionalEscrow({
      buyerWallet: 'buyer-wallet-123',
      sellerWallet: 'seller-wallet-456',
      buyerAmount: 100,
      sellerSecurityDeposit: 0,
      token: 'SOL'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Seller security deposit must be greater than 0')
  })
  
  test('should reject creation when buyer and seller are same wallet', async () => {
    const result = await createTraditionalEscrow({
      buyerWallet: 'same-wallet-123',
      sellerWallet: 'same-wallet-123',
      buyerAmount: 100,
      sellerSecurityDeposit: 50,
      token: 'SOL'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Buyer and seller cannot be the same wallet')
  })
  
  test('should reject confirmation for non-existent escrow', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    
    await expect(confirmEscrow('invalid-escrow-id', 'buyer-wallet-123')).rejects.toThrow(
      'Escrow not found'
    )
  })
  
  test('should reject fund release for non-existent escrow', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    
    await expect(releaseTraditionalEscrowFunds('invalid-escrow-id')).rejects.toThrow(
      'Escrow not found'
    )
  })
})
