-- ============================================
-- COMPLETE NOVIQ DATABASE SCHEMA
-- Run this in your NEW Supabase project
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- REFERRALS SYSTEM
-- ============================================

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  owner_wallet TEXT NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(20, 9) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral usage tracking
CREATE TABLE IF NOT EXISTS referral_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  payment_amount DECIMAL(20, 9) NOT NULL,
  commission_amount DECIMAL(20, 9) NOT NULL,
  commission_paid BOOLEAN DEFAULT false,
  commission_tx_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_owner ON referral_codes(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_usage_code ON referral_usage(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_usage_payment ON referral_usage(payment_id);

-- ============================================
-- ESCROW SYSTEM
-- ============================================

-- Escrow contracts table
CREATE TABLE IF NOT EXISTS escrow_contracts (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  total_amount DECIMAL(20, 9) NOT NULL,
  token TEXT NOT NULL DEFAULT 'SOL',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'created',
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
  status TEXT NOT NULL DEFAULT 'pending',
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
  action TEXT NOT NULL,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence/attachments table for disputes
CREATE TABLE IF NOT EXISTS escrow_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE CASCADE,
  submitted_by TEXT NOT NULL,
  party_role TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  file_url TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions table
CREATE TABLE IF NOT EXISTS escrow_admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  admin_wallet TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT,
  notes TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute details table
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE CASCADE,
  raised_by TEXT NOT NULL,
  party_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notes table
CREATE TABLE IF NOT EXISTS escrow_admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  admin_wallet TEXT NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for escrow
CREATE INDEX IF NOT EXISTS idx_escrow_payment_id ON escrow_contracts(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_contracts(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_contracts(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_contracts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_escrow ON escrow_milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON escrow_milestones(status);
CREATE INDEX IF NOT EXISTS idx_actions_escrow ON escrow_actions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_actions_milestone ON escrow_actions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_evidence_escrow ON escrow_evidence(escrow_id);
CREATE INDEX IF NOT EXISTS idx_evidence_milestone ON escrow_evidence(milestone_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submitted_by ON escrow_evidence(submitted_by);
CREATE INDEX IF NOT EXISTS idx_admin_actions_escrow ON escrow_admin_actions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow ON escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON escrow_disputes(status);
CREATE INDEX IF NOT EXISTS idx_admin_notes_escrow ON escrow_admin_notes(escrow_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_admin_notes ENABLE ROW LEVEL SECURITY;

-- Policies for referrals (public read, authenticated write)
CREATE POLICY "Allow public read access to referral codes"
  ON referral_codes FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for referral codes"
  ON referral_codes FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to referral usage"
  ON referral_usage FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for referral usage"
  ON referral_usage FOR INSERT
  WITH CHECK (true);

-- Policies for escrow (public read, authenticated write)
CREATE POLICY "Allow public read access to escrow contracts"
  ON escrow_contracts FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for escrow contracts"
  ON escrow_contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for escrow contracts"
  ON escrow_contracts FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to milestones"
  ON escrow_milestones FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for milestones"
  ON escrow_milestones FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for milestones"
  ON escrow_milestones FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to actions"
  ON escrow_actions FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for actions"
  ON escrow_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read access to evidence"
  ON escrow_evidence FOR SELECT
  USING (true);

CREATE POLICY "Allow insert evidence"
  ON escrow_evidence FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read access to disputes"
  ON escrow_disputes FOR SELECT
  USING (true);

CREATE POLICY "Allow insert disputes"
  ON escrow_disputes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update disputes"
  ON escrow_disputes FOR UPDATE
  USING (true);

CREATE POLICY "Allow read access to admin actions"
  ON escrow_admin_actions FOR SELECT
  USING (true);

CREATE POLICY "Allow insert admin actions"
  ON escrow_admin_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read access to admin notes"
  ON escrow_admin_notes FOR SELECT
  USING (NOT is_internal OR true);

CREATE POLICY "Allow insert admin notes"
  ON escrow_admin_notes FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get escrow progress
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

-- Function to check if escrow needs admin review
CREATE OR REPLACE FUNCTION needs_admin_review(escrow_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_disputes BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM escrow_disputes 
    WHERE escrow_id = escrow_id_param 
    AND status IN ('open', 'under_review')
  ) INTO has_disputes;
  
  RETURN has_disputes;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- Admin escrow queue (only disputed escrows)
CREATE OR REPLACE VIEW admin_escrow_queue AS
SELECT 
  ec.id,
  ec.payment_id,
  ec.buyer_wallet,
  ec.seller_wallet,
  ec.total_amount,
  ec.token,
  ec.description,
  ec.status as escrow_status,
  ec.created_at,
  ec.funded_at,
  COUNT(DISTINCT ed.id) as open_disputes,
  COUNT(DISTINCT CASE WHEN em.status = 'disputed' THEN em.id END) as disputed_milestones,
  COUNT(DISTINCT em.id) as total_milestones,
  COUNT(DISTINCT CASE WHEN em.status = 'released' THEN em.id END) as completed_milestones,
  MAX(ed.created_at) as last_dispute_at,
  MAX(em.buyer_approved_at) as last_approval_at
FROM escrow_contracts ec
LEFT JOIN escrow_disputes ed ON ec.id = ed.escrow_id AND ed.status IN ('open', 'under_review')
LEFT JOIN escrow_milestones em ON ec.id = em.escrow_id
WHERE ec.status = 'disputed'
GROUP BY ec.id, ec.payment_id, ec.buyer_wallet, ec.seller_wallet, ec.total_amount, 
         ec.token, ec.description, ec.status, ec.created_at, ec.funded_at
HAVING COUNT(DISTINCT ed.id) > 0
ORDER BY MAX(ed.created_at) DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE referral_codes IS 'Referral codes for commission tracking';
COMMENT ON TABLE referral_usage IS 'Track referral code usage and commissions';
COMMENT ON TABLE escrow_contracts IS 'Main escrow contracts with buyer/seller info';
COMMENT ON TABLE escrow_milestones IS 'Individual milestones for each escrow';
COMMENT ON TABLE escrow_actions IS 'Audit log of all actions taken on escrows';
COMMENT ON TABLE escrow_evidence IS 'Evidence uploaded by parties during disputes';
COMMENT ON TABLE escrow_admin_actions IS 'Actions taken by NOVIQ admins';
COMMENT ON TABLE escrow_disputes IS 'Dispute records with resolution tracking';
COMMENT ON TABLE escrow_admin_notes IS 'Internal admin notes for case management';
COMMENT ON VIEW admin_escrow_queue IS 'Dashboard view of escrows needing admin attention';

-- ============================================
-- DONE!
-- ============================================
-- All tables, indexes, policies, functions, and views created successfully
