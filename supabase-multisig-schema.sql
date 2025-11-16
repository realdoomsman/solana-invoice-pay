-- Multi-Signature Transaction Support Schema
-- Handles multi-sig wallet detection and transaction management

-- ============================================
-- MULTI-SIG TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_multisig_transactions (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  
  -- Multi-sig wallet info
  multisig_wallet TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'squads' | 'goki' | 'serum' | 'unknown'
  
  -- Transaction data
  transaction_data TEXT NOT NULL, -- Serialized transaction or proposal ID
  required_signatures INTEGER NOT NULL,
  current_signatures INTEGER DEFAULT 0,
  
  -- Signers
  signers TEXT[] DEFAULT '{}', -- Authorized signers (if known)
  signed_by TEXT[] DEFAULT '{}', -- Wallets that have signed
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'partially_signed' | 'ready' | 'executed' | 'cancelled'
  
  -- Execution
  tx_signature TEXT,
  executed_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MULTI-SIG WALLET INFO TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_multisig_wallets (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  
  -- Detection info
  is_multisig BOOLEAN DEFAULT FALSE,
  provider TEXT, -- 'squads' | 'goki' | 'serum' | 'unknown'
  
  -- Configuration
  threshold INTEGER,
  total_signers INTEGER,
  signers TEXT[] DEFAULT '{}',
  
  -- Metadata
  program_id TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Cache info
  last_checked_at TIMESTAMP DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MULTI-SIG SIGNATURES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_multisig_signatures (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES escrow_multisig_transactions(id) ON DELETE CASCADE,
  
  -- Signer info
  signer_wallet TEXT NOT NULL,
  signature_data TEXT,
  
  -- Metadata
  signed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_multisig_tx_escrow ON escrow_multisig_transactions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_multisig_tx_wallet ON escrow_multisig_transactions(multisig_wallet);
CREATE INDEX IF NOT EXISTS idx_multisig_tx_status ON escrow_multisig_transactions(status);
CREATE INDEX IF NOT EXISTS idx_multisig_tx_created ON escrow_multisig_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_multisig_wallet_address ON escrow_multisig_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_multisig_wallet_provider ON escrow_multisig_wallets(provider);

CREATE INDEX IF NOT EXISTS idx_multisig_sig_tx ON escrow_multisig_signatures(transaction_id);
CREATE INDEX IF NOT EXISTS idx_multisig_sig_signer ON escrow_multisig_signatures(signer_wallet);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multisig_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_multisig_tx_updated_at
  BEFORE UPDATE ON escrow_multisig_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_multisig_updated_at();

CREATE TRIGGER update_multisig_wallet_updated_at
  BEFORE UPDATE ON escrow_multisig_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_multisig_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE escrow_multisig_transactions IS 'Tracks multi-signature transactions requiring multiple approvals';
COMMENT ON TABLE escrow_multisig_wallets IS 'Caches multi-sig wallet detection results';
COMMENT ON TABLE escrow_multisig_signatures IS 'Records individual signatures for multi-sig transactions';

COMMENT ON COLUMN escrow_multisig_transactions.transaction_data IS 'Serialized transaction or external proposal ID';
COMMENT ON COLUMN escrow_multisig_transactions.required_signatures IS 'Number of signatures needed to execute';
COMMENT ON COLUMN escrow_multisig_transactions.current_signatures IS 'Number of signatures collected so far';
COMMENT ON COLUMN escrow_multisig_transactions.status IS 'Transaction status: pending, partially_signed, ready, executed, cancelled';

COMMENT ON COLUMN escrow_multisig_wallets.threshold IS 'Minimum signatures required (M in M-of-N)';
COMMENT ON COLUMN escrow_multisig_wallets.total_signers IS 'Total number of authorized signers (N in M-of-N)';
