-- Escrow System Database Schema

-- Escrow contracts table
CREATE TABLE IF NOT EXISTS escrow_contracts (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  total_amount DECIMAL(20, 9) NOT NULL,
  token TEXT NOT NULL DEFAULT 'SOL',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'created', -- 'created', 'funded', 'active', 'completed', 'disputed', 'cancelled'
  payment_wallet TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  funded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Milestones table
CREATE TABLE IF NOT EXISTS escrow_milestones (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  milestone_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'work_submitted', 'approved', 'released', 'disputed'
  seller_submitted_at TIMESTAMP WITH TIME ZONE,
  seller_notes TEXT,
  buyer_approved_at TIMESTAMP WITH TIME ZONE,
  buyer_notes TEXT,
  released_at TIMESTAMP WITH TIME ZONE,
  tx_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions log for audit trail
CREATE TABLE IF NOT EXISTS escrow_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  actor_wallet TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'funded', 'submitted', 'approved', 'released', 'disputed', 'resolved', 'cancelled'
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_payment_id ON escrow_contracts(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_contracts(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_contracts(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_contracts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_escrow ON escrow_milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON escrow_milestones(status);
CREATE INDEX IF NOT EXISTS idx_actions_escrow ON escrow_actions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_actions_milestone ON escrow_actions(milestone_id);

-- Enable Row Level Security
ALTER TABLE escrow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_actions ENABLE ROW LEVEL SECURITY;

-- Policies (allow read for all, write for authenticated)
CREATE POLICY "Allow public read access to escrow contracts"
  ON escrow_contracts FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to milestones"
  ON escrow_milestones FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to actions"
  ON escrow_actions FOR SELECT
  USING (true);

-- Insert policies (for API)
CREATE POLICY "Allow insert for escrow contracts"
  ON escrow_contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert for milestones"
  ON escrow_milestones FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert for actions"
  ON escrow_actions FOR INSERT
  WITH CHECK (true);

-- Update policies (for API)
CREATE POLICY "Allow update for escrow contracts"
  ON escrow_contracts FOR UPDATE
  USING (true);

CREATE POLICY "Allow update for milestones"
  ON escrow_milestones FOR UPDATE
  USING (true);

-- Helper function to get escrow status
CREATE OR REPLACE FUNCTION get_escrow_progress(escrow_id_param TEXT)
RETURNS TABLE (
  total_milestones INTEGER,
  completed_milestones INTEGER,
  total_released DECIMAL(20, 9),
  progress_percentage DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_milestones,
    COUNT(*) FILTER (WHERE status = 'released')::INTEGER as completed_milestones,
    COALESCE(SUM(amount) FILTER (WHERE status = 'released'), 0) as total_released,
    COALESCE(
      (COUNT(*) FILTER (WHERE status = 'released')::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0)) * 100,
      0
    ) as progress_percentage
  FROM escrow_milestones
  WHERE escrow_id = escrow_id_param;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE escrow_contracts IS 'Main escrow contracts with buyer/seller info';
COMMENT ON TABLE escrow_milestones IS 'Individual milestones for each escrow';
COMMENT ON TABLE escrow_actions IS 'Audit log of all actions taken on escrows';
COMMENT ON COLUMN escrow_contracts.status IS 'created: just created, funded: buyer paid, active: work in progress, completed: all done, disputed: issue raised, cancelled: cancelled';
COMMENT ON COLUMN escrow_milestones.status IS 'pending: not started, work_submitted: seller submitted, approved: buyer approved, released: funds sent, disputed: issue raised';
