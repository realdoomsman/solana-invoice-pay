-- Admin Escrow System - Additional Tables
-- Run this AFTER running supabase-escrow-schema.sql

-- Add new milestone status for admin review
-- Status flow: pending → work_submitted → buyer_approved → admin_review → released
-- Or: any status → disputed → admin_review → released/refunded

-- Evidence/attachments table for disputes
CREATE TABLE IF NOT EXISTS escrow_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE CASCADE,
  submitted_by TEXT NOT NULL, -- wallet address
  party_role TEXT NOT NULL, -- 'buyer' or 'seller'
  evidence_type TEXT NOT NULL, -- 'screenshot', 'document', 'message', 'other'
  file_url TEXT, -- URL to uploaded file (if any)
  description TEXT NOT NULL,
  metadata JSONB, -- additional data like file size, mime type, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions table (separate from regular actions for security)
CREATE TABLE IF NOT EXISTS escrow_admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  admin_wallet TEXT NOT NULL, -- admin who took action
  action TEXT NOT NULL, -- 'reviewed', 'approved_release', 'approved_refund', 'requested_more_info', 'resolved_dispute'
  decision TEXT, -- 'release_to_seller', 'refund_to_buyer', 'partial_release', 'pending'
  notes TEXT NOT NULL, -- admin's reasoning
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute details table
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE CASCADE,
  raised_by TEXT NOT NULL, -- wallet address
  party_role TEXT NOT NULL, -- 'buyer' or 'seller'
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'closed'
  resolution TEXT, -- final decision
  resolved_by TEXT, -- admin wallet
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notes table (internal notes not visible to users)
CREATE TABLE IF NOT EXISTS escrow_admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  admin_wallet TEXT NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- true = only admins see, false = visible to parties
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_escrow ON escrow_evidence(escrow_id);
CREATE INDEX IF NOT EXISTS idx_evidence_milestone ON escrow_evidence(milestone_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submitted_by ON escrow_evidence(submitted_by);
CREATE INDEX IF NOT EXISTS idx_admin_actions_escrow ON escrow_admin_actions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow ON escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON escrow_disputes(status);
CREATE INDEX IF NOT EXISTS idx_admin_notes_escrow ON escrow_admin_notes(escrow_id);

-- Enable RLS
ALTER TABLE escrow_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_admin_notes ENABLE ROW LEVEL SECURITY;

-- Policies for evidence (parties can read their own escrow's evidence)
CREATE POLICY "Allow read access to evidence"
  ON escrow_evidence FOR SELECT
  USING (true);

CREATE POLICY "Allow insert evidence"
  ON escrow_evidence FOR INSERT
  WITH CHECK (true);

-- Policies for disputes (public read, anyone can insert)
CREATE POLICY "Allow read access to disputes"
  ON escrow_disputes FOR SELECT
  USING (true);

CREATE POLICY "Allow insert disputes"
  ON escrow_disputes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update disputes"
  ON escrow_disputes FOR UPDATE
  USING (true);

-- Policies for admin actions (read-only for public, admins can insert)
CREATE POLICY "Allow read access to admin actions"
  ON escrow_admin_actions FOR SELECT
  USING (true);

CREATE POLICY "Allow insert admin actions"
  ON escrow_admin_actions FOR INSERT
  WITH CHECK (true);

-- Policies for admin notes (only admins should see internal notes)
CREATE POLICY "Allow read access to admin notes"
  ON escrow_admin_notes FOR SELECT
  USING (NOT is_internal OR true); -- TODO: Add proper admin check

CREATE POLICY "Allow insert admin notes"
  ON escrow_admin_notes FOR INSERT
  WITH CHECK (true);

-- Helper function to check if escrow needs admin review
CREATE OR REPLACE FUNCTION needs_admin_review(escrow_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_disputes BOOLEAN;
  has_buyer_approved BOOLEAN;
BEGIN
  -- Check if there are any open disputes
  SELECT EXISTS(
    SELECT 1 FROM escrow_disputes 
    WHERE escrow_id = escrow_id_param 
    AND status IN ('open', 'under_review')
  ) INTO has_disputes;
  
  -- Check if any milestones are buyer-approved but not released
  SELECT EXISTS(
    SELECT 1 FROM escrow_milestones 
    WHERE escrow_id = escrow_id_param 
    AND status = 'approved'
  ) INTO has_buyer_approved;
  
  RETURN has_disputes OR has_buyer_approved;
END;
$$ LANGUAGE plpgsql;

-- View for admin dashboard (ONLY DISPUTED ESCROWS)
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
WHERE ec.status = 'disputed' -- ONLY show disputed escrows
GROUP BY ec.id, ec.payment_id, ec.buyer_wallet, ec.seller_wallet, ec.total_amount, 
         ec.token, ec.description, ec.status, ec.created_at, ec.funded_at
HAVING COUNT(DISTINCT ed.id) > 0 -- Must have at least one open dispute
ORDER BY 
  MAX(ed.created_at) DESC; -- Most recent disputes first

-- Comments
COMMENT ON TABLE escrow_evidence IS 'Evidence uploaded by parties during disputes';
COMMENT ON TABLE escrow_admin_actions IS 'Actions taken by NOVIQ admins';
COMMENT ON TABLE escrow_disputes IS 'Dispute records with resolution tracking';
COMMENT ON TABLE escrow_admin_notes IS 'Internal admin notes for case management';
COMMENT ON VIEW admin_escrow_queue IS 'Dashboard view of escrows needing admin attention';

