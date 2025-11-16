-- ============================================
-- ESCROW CANCELLATION SCHEMA
-- Mutual cancellation requires both parties to agree
-- ============================================

-- Cancellation requests table
CREATE TABLE IF NOT EXISTS escrow_cancellation_requests (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  
  -- Tracking who requested and who approved
  requested_by TEXT NOT NULL,
  requested_by_role TEXT NOT NULL CHECK (requested_by_role IN ('buyer', 'seller')),
  
  buyer_approved BOOLEAN DEFAULT FALSE,
  seller_approved BOOLEAN DEFAULT FALSE,
  
  buyer_approved_at TIMESTAMP WITH TIME ZONE,
  seller_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation details
  reason TEXT NOT NULL,
  notes TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
  
  -- Execution details
  executed_at TIMESTAMP WITH TIME ZONE,
  refund_tx_signature TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Only one active cancellation request per escrow
  UNIQUE(escrow_id, status) WHERE status = 'pending'
);

CREATE INDEX IF NOT EXISTS idx_cancellation_escrow ON escrow_cancellation_requests(escrow_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_status ON escrow_cancellation_requests(status);
CREATE INDEX IF NOT EXISTS idx_cancellation_requested_by ON escrow_cancellation_requests(requested_by);

COMMENT ON TABLE escrow_cancellation_requests IS 'Tracks mutual cancellation requests requiring both parties approval';
