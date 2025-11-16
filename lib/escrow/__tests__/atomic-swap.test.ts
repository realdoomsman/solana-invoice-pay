/**
 * Atomic Swap Escrow Tests
 * Tests successful swap execution, timeout refund scenarios, and partial deposit handling
 */

import {
  createAtomicSwap,
  monitorSwapDeposits,
  monitorPartyADeposit,
  monitorPartyBDeposit,
  detectBothDeposits,
  checkSwapReadiness,
  executeAtomicSwap,
  handleSwapTimeout,
  checkSwapTimeout
} from '../atomic-swap'
import { getSupabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn()
}))

// Mock wallet manager
jest.mock('../wallet-manager', () => ({
  createEncryptedEscrowWallet: jest.fn(() => ({
    publicKey: 'mock-swap-wallet-public-key',
    encryptedPrivateKey: 'mock-encrypted-swap-key',
    keypair: {}
  }))
}))

// Mock transaction signer
jest.mock('../transaction-signer', () => ({
  transferToMultiple: jest.fn(() => Promise.resolve('mock-swap-tx-signature')),
  transferSOL: jest.fn(() => Promise.resolve('mock-sol-tx-signature')),
  transferSPLToken: jest.fn(() => Promise.resolve('mock-spl-tx-signature'))
}))

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn((length?: number) => {
    if (length === 12) return 'swap-id-12'
    if (length === 10) return 'swap-payment-10'
    return 'random-id'
  })
}))

describe('Atomic Swap - Creation', () => {
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
  
  test('should create atomic swap with both party assets', async () => {
    const mockSwap = {
      id: 'swap-id-12',
      escrow_type: 'atomic_swap',
      payment_id: 'swap-payment-10',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      token: 'SOL',
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'mock-swap-wallet-public-key',
      encrypted_private_key: 'mock-encrypted-swap-key',
      status: 'created',
      buyer_deposited: false,
      seller_deposited: false,
      swap_executed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    mockSupabase.insert.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await createAtomicSwap({
      partyAWallet: 'party-a-wallet',
      partyBWallet: 'party-b-wallet',
      partyAAsset: {
        token: 'SOL',
        amount: 10
      },
      partyBAsset: {
        token: 'USDC',
        amount: 1000
      },
      timeoutHours: 24
    })
    
    expect(result.success).toBe(true)
    expect(result.escrow.escrow_type).toBe('atomic_swap')
    expect(result.escrow.buyer_amount).toBe(10)
    expect(result.escrow.seller_amount).toBe(1000)
    expect(result.escrow.swap_asset_buyer).toBe('SOL')
    expect(result.escrow.swap_asset_seller).toBe('USDC')
    expect(result.paymentLink).toBe('/pay/swap-payment-10')
  })
  
  test('should reject swap with same party wallets', async () => {
    const result = await createAtomicSwap({
      partyAWallet: 'same-wallet',
      partyBWallet: 'same-wallet',
      partyAAsset: { token: 'SOL', amount: 10 },
      partyBAsset: { token: 'USDC', amount: 1000 }
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('cannot be the same wallet')
  })
  
  test('should reject swap with zero amounts', async () => {
    const result = await createAtomicSwap({
      partyAWallet: 'party-a-wallet',
      partyBWallet: 'party-b-wallet',
      partyAAsset: { token: 'SOL', amount: 0 },
      partyBAsset: { token: 'USDC', amount: 1000 }
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('must be greater than 0')
  })
})

describe('Atomic Swap - Deposit Detection', () => {
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
  
  test('should detect when party A deposits', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: false,
      swap_executed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await monitorSwapDeposits('swap-123')
    
    expect(result.partyADeposited).toBe(true)
    expect(result.partyBDeposited).toBe(false)
    expect(result.bothDeposited).toBe(false)
    expect(result.readyForSwap).toBe(false)
  })
  
  test('should detect when party B deposits', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: false,
      seller_deposited: true,
      swap_executed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await monitorSwapDeposits('swap-123')
    
    expect(result.partyADeposited).toBe(false)
    expect(result.partyBDeposited).toBe(true)
    expect(result.bothDeposited).toBe(false)
    expect(result.readyForSwap).toBe(false)
  })
  
  test('should detect when both parties deposit', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await monitorSwapDeposits('swap-123')
    
    expect(result.partyADeposited).toBe(true)
    expect(result.partyBDeposited).toBe(true)
    expect(result.bothDeposited).toBe(true)
    expect(result.readyForSwap).toBe(true)
  })
  
  test('should not be ready if swap already executed', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: true
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await monitorSwapDeposits('swap-123')
    
    expect(result.bothDeposited).toBe(true)
    expect(result.readyForSwap).toBe(false)
  })
})

describe('Atomic Swap - Individual Party Deposit Monitoring', () => {
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
  
  test('should monitor party A deposit status', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      buyer_amount: 10,
      swap_asset_buyer: 'SOL',
      escrow_wallet: 'escrow-wallet-123'
    }
    
    const mockDeposit = {
      id: 'deposit-1',
      escrow_id: 'swap-123',
      party_role: 'buyer',
      amount: 10,
      token: 'SOL',
      confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDeposit, error: null })
    
    const result = await monitorPartyADeposit('swap-123')
    
    expect(result.deposited).toBe(true)
    expect(result.expectedAmount).toBe(10)
    expect(result.expectedAsset).toBe('SOL')
    expect(result.escrowWallet).toBe('escrow-wallet-123')
    expect(result.deposit).toBeDefined()
  })
  
  test('should detect party A has not deposited', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      buyer_amount: 10,
      swap_asset_buyer: 'SOL',
      escrow_wallet: 'escrow-wallet-123'
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    
    const result = await monitorPartyADeposit('swap-123')
    
    expect(result.deposited).toBe(false)
    expect(result.expectedAmount).toBe(10)
    expect(result.expectedAsset).toBe('SOL')
    expect(result.deposit).toBeUndefined()
  })
  
  test('should monitor party B deposit status', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      seller_wallet: 'party-b-wallet',
      seller_amount: 1000,
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123'
    }
    
    const mockDeposit = {
      id: 'deposit-2',
      escrow_id: 'swap-123',
      party_role: 'seller',
      amount: 1000,
      token: 'USDC',
      confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDeposit, error: null })
    
    const result = await monitorPartyBDeposit('swap-123')
    
    expect(result.deposited).toBe(true)
    expect(result.expectedAmount).toBe(1000)
    expect(result.expectedAsset).toBe('USDC')
    expect(result.escrowWallet).toBe('escrow-wallet-123')
    expect(result.deposit).toBeDefined()
  })
  
  test('should detect party B has not deposited', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      seller_wallet: 'party-b-wallet',
      seller_amount: 1000,
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123'
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    
    const result = await monitorPartyBDeposit('swap-123')
    
    expect(result.deposited).toBe(false)
    expect(result.expectedAmount).toBe(1000)
    expect(result.expectedAsset).toBe('USDC')
    expect(result.deposit).toBeUndefined()
  })
})

describe('Atomic Swap - Dual Deposit Detection', () => {
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
  
  test('should detect both deposits complete', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123',
      swap_executed: false
    }
    
    const mockDepositA = {
      id: 'deposit-1',
      party_role: 'buyer',
      confirmed: true
    }
    
    const mockDepositB = {
      id: 'deposit-2',
      party_role: 'seller',
      confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositA, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositB, error: null })
    
    const result = await detectBothDeposits('swap-123')
    
    expect(result.bothDeposited).toBe(true)
    expect(result.readyForSwap).toBe(true)
    expect(result.partyAStatus.deposited).toBe(true)
    expect(result.partyBStatus.deposited).toBe(true)
    expect(result.swapExecuted).toBe(false)
  })
  
  test('should detect only party A deposited', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123',
      swap_executed: false
    }
    
    const mockDepositA = {
      id: 'deposit-1',
      party_role: 'buyer',
      confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositA, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    
    const result = await detectBothDeposits('swap-123')
    
    expect(result.bothDeposited).toBe(false)
    expect(result.readyForSwap).toBe(false)
    expect(result.partyAStatus.deposited).toBe(true)
    expect(result.partyBStatus.deposited).toBe(false)
  })
  
  test('should detect only party B deposited', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123',
      swap_executed: false
    }
    
    const mockDepositB = {
      id: 'deposit-2',
      party_role: 'seller',
      confirmed: true
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositB, error: null })
    
    const result = await detectBothDeposits('swap-123')
    
    expect(result.bothDeposited).toBe(false)
    expect(result.readyForSwap).toBe(false)
    expect(result.partyAStatus.deposited).toBe(false)
    expect(result.partyBStatus.deposited).toBe(true)
  })
  
  test('should detect neither party deposited', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123',
      swap_executed: false
    }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    
    const result = await detectBothDeposits('swap-123')
    
    expect(result.bothDeposited).toBe(false)
    expect(result.readyForSwap).toBe(false)
    expect(result.partyAStatus.deposited).toBe(false)
    expect(result.partyBStatus.deposited).toBe(false)
  })
  
  test('should not be ready if swap already executed', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123',
      swap_executed: true
    }
    
    const mockDepositA = { id: 'deposit-1', party_role: 'buyer', confirmed: true }
    const mockDepositB = { id: 'deposit-2', party_role: 'seller', confirmed: true }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositA, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositB, error: null })
    
    const result = await detectBothDeposits('swap-123')
    
    expect(result.bothDeposited).toBe(true)
    expect(result.readyForSwap).toBe(false)
    expect(result.swapExecuted).toBe(true)
  })
  
  test('should return comprehensive status information', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      escrow_wallet: 'escrow-wallet-123',
      swap_executed: false
    }
    
    const mockDepositA = { id: 'deposit-1', party_role: 'buyer', confirmed: true }
    const mockDepositB = { id: 'deposit-2', party_role: 'seller', confirmed: true }
    
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositA, error: null })
      .mockResolvedValueOnce({ data: mockSwap, error: null })
      .mockResolvedValueOnce({ data: mockDepositB, error: null })
    
    const result = await detectBothDeposits('swap-123')
    
    expect(result.partyAStatus).toEqual({
      deposited: true,
      amount: 10,
      asset: 'SOL',
      wallet: 'party-a-wallet'
    })
    
    expect(result.partyBStatus).toEqual({
      deposited: true,
      amount: 1000,
      asset: 'USDC',
      wallet: 'party-b-wallet'
    })
    
    expect(result.escrowWallet).toBe('escrow-wallet-123')
  })
})

describe('Atomic Swap - Successful Execution', () => {
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
  
  test('should execute swap when both parties deposited', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'SOL',
      encrypted_private_key: 'encrypted-key',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false,
      status: 'fully_funded'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await executeAtomicSwap('swap-123')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        swap_executed: true,
        swap_tx_signature: expect.any(String)
      })
    )
  })
  
  test('should check swap readiness correctly', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false,
      status: 'fully_funded',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapReadiness('swap-123')
    
    expect(result.ready).toBe(true)
    expect(result.escrow).toBeDefined()
  })
  
  test('should not be ready if swap already executed', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: true,
      status: 'completed'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapReadiness('swap-123')
    
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('already executed')
  })
  
  test('should not be ready if deposits incomplete', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: false,
      swap_executed: false,
      status: 'buyer_deposited'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapReadiness('swap-123')
    
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('Waiting for both deposits')
  })
})

describe('Atomic Swap - Timeout Scenarios', () => {
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
  
  test('should detect timeout correctly', async () => {
    const mockSwap = {
      id: 'swap-123',
      expires_at: new Date(Date.now() - 1000).toISOString()
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapTimeout('swap-123')
    
    expect(result.timedOut).toBe(true)
    expect(result.timeRemaining).toBe(0)
  })
  
  test('should detect not timed out', async () => {
    const mockSwap = {
      id: 'swap-123',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapTimeout('swap-123')
    
    expect(result.timedOut).toBe(false)
    expect(result.timeRemaining).toBeGreaterThan(0)
  })
  
  test('should cancel swap with no deposits on timeout', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: false,
      seller_deposited: false,
      status: 'created',
      expires_at: new Date(Date.now() - 1000).toISOString()
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await handleSwapTimeout('swap-123')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled'
      })
    )
  })
  
  test('should refund party A if party B did not deposit', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      encrypted_private_key: 'encrypted-key',
      buyer_deposited: true,
      seller_deposited: false,
      status: 'buyer_deposited',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      escrow_wallet: 'escrow-wallet'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await handleSwapTimeout('swap-123')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'refunded'
      })
    )
  })
  
  test('should refund party B if party A did not deposit', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 1000,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'USDC',
      encrypted_private_key: 'encrypted-key',
      buyer_deposited: false,
      seller_deposited: true,
      status: 'seller_deposited',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      escrow_wallet: 'escrow-wallet'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await handleSwapTimeout('swap-123')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'refunded'
      })
    )
  })
  
  test('should execute swap if both deposited despite timeout', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_wallet: 'party-a-wallet',
      seller_wallet: 'party-b-wallet',
      buyer_amount: 10,
      seller_amount: 10,
      swap_asset_buyer: 'SOL',
      swap_asset_seller: 'SOL',
      encrypted_private_key: 'encrypted-key',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false,
      status: 'fully_funded',
      expires_at: new Date(Date.now() - 1000).toISOString()
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    mockSupabase.update.mockResolvedValue({ error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
    
    const result = await handleSwapTimeout('swap-123')
    
    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        swap_executed: true
      })
    )
  })
})

describe('Atomic Swap - Validation', () => {
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
  
  test('should reject swap with missing party A wallet', async () => {
    const result = await createAtomicSwap({
      partyAWallet: '',
      partyBWallet: 'party-b-wallet',
      partyAAsset: { token: 'SOL', amount: 10 },
      partyBAsset: { token: 'USDC', amount: 1000 }
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('wallet addresses are required')
  })
  
  test('should reject swap with missing assets', async () => {
    const result = await createAtomicSwap({
      partyAWallet: 'party-a-wallet',
      partyBWallet: 'party-b-wallet',
      partyAAsset: null as any,
      partyBAsset: { token: 'USDC', amount: 1000 }
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Both assets must be specified')
  })
  
  test('should not execute swap if disputed', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false,
      status: 'disputed'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapReadiness('swap-123')
    
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('disputed')
  })
  
  test('should not execute swap if cancelled', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false,
      status: 'cancelled'
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapReadiness('swap-123')
    
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('cancelled')
  })
  
  test('should not execute swap if expired', async () => {
    const mockSwap = {
      id: 'swap-123',
      escrow_type: 'atomic_swap',
      buyer_deposited: true,
      seller_deposited: true,
      swap_executed: false,
      status: 'fully_funded',
      expires_at: new Date(Date.now() - 1000).toISOString()
    }
    
    mockSupabase.single.mockResolvedValue({ data: mockSwap, error: null })
    
    const result = await checkSwapReadiness('swap-123')
    
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('expired')
  })
})
