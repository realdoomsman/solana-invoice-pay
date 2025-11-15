-- ============================================
-- COMPLETE ESCROW SYSTEM SCHEMA
-- Supports: Traditional, Simple Buyer, Atomic Swap
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ESCROW CONTRACTS (All Types)
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_contracts (
  id TEXT PRIMARY KEY,
  escrow_type TEXT NOT NULL CHECK (escrow_type IN ('traditional', 'simple_buyer', 'atomic_swap')),
  payment_id TEXT UNIQUE NOT NULL,
  
  -- Parties
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  
  -- Amounts
  buyer_amount DECIMAL(20, 9) NOT NULL,
  seller_amount DECIMAL(20, 9), -- NULL for simple_buyer, required for traditional
  token TEXT NOT NULL,
  
  -- Escrow wallet
  escrow_wallet TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'buyer_deposited', 'seller_deposited', 'fully_funded', 'active', 'completed', 'disputed', 'cancelled', 'refunded')),
  buyer_deposited BOOLEAN DEFAULT FALSE,
  seller_deposited BOOLEAN DEFAULT FALSE,
  buyer_confirmed BOOLEAN DEFAULT FALSE,
  seller_confirmed BOOLEAN DEFAULT FALSE,
  
  -- Atomic swap specific
  swap_asset_buyer TEXT, -- Token mint for buyer's asset
  swap_asset_seller TEXT, -- Token mint for seller's asset
  swap_executed BOOLEAN DEFAULT FALSE,
  swap_tx_signature TEXT,
  
  -- Metadata
  description TEXT,
  timeout_hours INTEGER DEFAULT 72,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  funded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT valid_escrow_type CHECK (
    (escrow_type = 'traditional' AND seller_amount IS NOT NULL) OR
    (escrow_type = 'simple_buyer' AND seller_amount IS NULL) OR
    (escrow_type = 'atomic_swap' AND swap_asset_buyer IS NOT NULL AND swap_asset_seller IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_contracts(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_contracts(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_contracts(status);
CREATE INDEX IF NOT EXISTS idx_escrow_type ON escrow_contracts(escrow_type);
CREATE INDEX IF NOT EXISTS idx_escrow_payment ON escrow_contracts(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_expires ON escrow_contracts(expires_at) WHERE status NOT IN ('completed', 'cancelled', 'refunded');

-- ============================================
-- ESCROW MILESTONES (Simple Buyer Type)
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_milestones (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount DECIMAL(20, 9) NOT NULL,
  milestone_order INTEGER NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'work_submitted', 'approved', 'released', 'disputed')),
  
  -- Seller actions
  seller_submitted_at TIMESTAMP WITH TIME ZONE,
  seller_notes TEXT,
  seller_evidence_urls TEXT[],
  
  -- Buyer actions
  buyer_approved_at TIMESTAMP WITH TIME ZONE,
  buyer_notes TEXT,
  
  -- Release
  released_at TIMESTAMP WITH TIME ZONE,
  tx_signature TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(escrow_id, milestone_order)
);

CREATE INDEX IF NOT EXISTS idx_milestone_escrow ON escrow_milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON escrow_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestone_order ON escrow_milestones(escrow_id, milestone_order);

-- ============================================
-- ESCROW DEPOSITS
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_deposits (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  
  depositor_wallet TEXT NOT NULL,
  party_role TEXT NOT NULL CHECK (party_role IN ('buyer', 'seller')),
  amount DECIMAL(20, 9) NOT NULL,
  token TEXT NOT NULL,
  
  tx_signature TEXT NOT NULL UNIQUE,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_count INTEGER DEFAULT 0,
  
  deposited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_deposit_escrow ON escrow_deposits(escrow_id);
CREATE INDEX IF NOT EXISTS idx_deposit_depositor ON escrow_deposits(depositor_wallet);
CREATE INDEX IF NOT EXISTS idx_deposit_tx ON escrow_deposits(tx_signature);
CREATE INDEX IF NOT EXISTS idx_deposit_confirmed ON escrow_deposits(confirmed) WHERE confirmed = FALSE;

-- ============================================
-- ESCROW ACTIONS (Activity Log)
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_actions (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  
  actor_wallet TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'created', 'deposited', 'confirmed', 'submitted', 'approved', 
    'disputed', 'released', 'refunded', 'cancelled', 'swapped',
    'timeout', 'admin_action'
  )),
  
  notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_escrow ON escrow_actions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_action_actor ON escrow_actions(actor_wallet);
CREATE INDEX IF NOT EXISTS idx_action_type ON escrow_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_action_created ON escrow_actions(created_at DESC);

-- ============================================
-- ESCROW DISPUTES
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_disputes (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  
  raised_by TEXT NOT NULL,
  party_role TEXT NOT NULL CHECK (party_role IN ('buyer', 'seller')),
  
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Resolution
  resolved_by TEXT,
  resolution TEXT,
  resolution_action TEXT CHECK (resolution_action IN ('release_to_seller', 'refund_to_buyer', 'partial_split', 'other')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_escrow ON escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_dispute_status ON escrow_disputes(status);
CREATE INDEX IF NOT EXISTS idx_dispute_priority ON escrow_disputes(priority) WHERE status IN ('open', 'under_review');
CREATE INDEX IF NOT EXISTS idx_dispute_created ON escrow_disputes(created_at DESC);

-- ============================================
-- ESCROW EVIDENCE
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_evidence (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  dispute_id TEXT REFERENCES escrow_disputes(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  
  submitted_by TEXT NOT NULL,
  party_role TEXT NOT NULL CHECK (party_role IN ('buyer', 'seller', 'admin')),
  
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('text', 'image', 'document', 'link', 'screenshot')),
  content TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_dispute ON escrow_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_evidence_escrow ON escrow_evidence(escrow_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submitter ON escrow_evidence(submitted_by);

-- ============================================
-- ESCROW ADMIN ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_admin_actions (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  dispute_id TEXT REFERENCES escrow_disputes(id) ON DELETE SET NULL,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  
  admin_wallet TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'approved_release', 'approved_refund', 'partial_split',
    'resolved_dispute', 'cancelled_escrow', 'extended_timeout',
    'manual_intervention'
  )),
  decision TEXT NOT NULL,
  
  -- Fund distribution
  amount_to_buyer DECIMAL(20, 9),
  amount_to_seller DECIMAL(20, 9),
  tx_signature_buyer TEXT,
  tx_signature_seller TEXT,
  
  notes TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_escrow ON escrow_admin_actions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_admin ON escrow_admin_actions(admin_wallet);
CREATE INDEX IF NOT EXISTS idx_admin_action_dispute ON escrow_admin_actions(dispute_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_created ON escrow_admin_actions(created_at DESC);

-- ============================================
-- ESCROW RELEASES (Fund Movement Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_releases (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES escrow_milestones(id) ON DELETE SET NULL,
  
  release_type TEXT NOT NULL CHECK (release_type IN (
    'milestone_release', 'full_release', 'security_deposit_return',
    'refund', 'dispute_resolution', 'swap_execution'
  )),
  
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  token TEXT NOT NULL,
  
  tx_signature TEXT NOT NULL UNIQUE,
  confirmed BOOLEAN DEFAULT FALSE,
  
  triggered_by TEXT NOT NULL, -- 'buyer' | 'seller' | 'admin' | 'system'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_release_escrow ON escrow_releases(escrow_id);
CREATE INDEX IF NOT EXISTS idx_release_tx ON escrow_releases(tx_signature);
CREATE INDEX IF NOT EXISTS idx_release_to ON escrow_releases(to_wallet);
CREATE INDEX IF NOT EXISTS idx_release_confirmed ON escrow_releases(confirmed) WHERE confirmed = FALSE;

-- ============================================
-- ESCROW TIMEOUTS (Monitoring)
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_timeouts (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  
  timeout_type TEXT NOT NULL CHECK (timeout_type IN (
    'deposit_timeout', 'confirmation_timeout', 'milestone_timeout',
    'dispute_timeout', 'swap_timeout'
  )),
  
  expected_action TEXT NOT NULL,
  expected_from TEXT, -- Wallet address
  
  warning_sent BOOLEAN DEFAULT FALSE,
  warning_sent_at TIMESTAMP WITH TIME ZONE,
  
  expired BOOLEAN DEFAULT FALSE,
  expired_at TIMESTAMP WITH TIME ZONE,
  
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_action TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timeout_escrow ON escrow_timeouts(escrow_id);
CREATE INDEX IF NOT EXISTS idx_timeout_expires ON escrow_timeouts(expires_at) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_timeout_expired ON escrow_timeouts(expired) WHERE resolved = FALSE;

-- ============================================
-- ESCROW NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_notifications (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
  
  recipient_wallet TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'deposit_received', 'work_submitted', 'milestone_approved',
    'dispute_raised', 'dispute_resolved', 'timeout_warning',
    'escrow_completed', 'refund_processed', 'swap_executed',
    'action_required'
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  sent_browser BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_recipient ON escrow_notifications(recipient_wallet);
CREATE INDEX IF NOT EXISTS idx_notification_read ON escrow_notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notification_escrow ON escrow_notifications(escrow_id);
CREATE INDEX IF NOT EXISTS idx_notification_created ON escrow_notifications(created_at DESC);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Admin escrow queue view
CREATE OR REPLACE VIEW admin_escrow_queue AS
SELECT 
  ec.id,
  ec.escrow_type,
  ec.status,
  ec.buyer_wallet,
  ec.seller_wallet,
  ec.buyer_amount,
  ec.token,
  ec.description,
  ec.created_at,
  ec.expires_at,
  ed.id as dispute_id,
  ed.reason as dispute_reason,
  ed.priority as dispute_priority,
  ed.created_at as dispute_created_at,
  (SELECT COUNT(*) FROM escrow_evidence WHERE dispute_id = ed.id) as evidence_count
FROM escrow_contracts ec
LEFT JOIN escrow_disputes ed ON ec.id = ed.escrow_id AND ed.status IN ('open', 'under_review')
WHERE ec.status = 'disputed'
ORDER BY ed.priority DESC, ed.created_at ASC;

-- User escrow dashboard view
CREATE OR REPLACE VIEW user_escrow_dashboard AS
SELECT 
  ec.id,
  ec.escrow_type,
  ec.status,
  ec.buyer_wallet,
  ec.seller_wallet,
  ec.buyer_amount,
  ec.seller_amount,
  ec.token,
  ec.description,
  ec.created_at,
  ec.expires_at,
  CASE 
    WHEN ec.buyer_wallet = ec.buyer_wallet THEN 'buyer'
    WHEN ec.seller_wallet = ec.seller_wallet THEN 'seller'
    ELSE 'observer'
  END as user_role,
  (SELECT COUNT(*) FROM escrow_milestones WHERE escrow_id = ec.id AND status = 'pending') as pending_milestones,
  (SELECT COUNT(*) FROM escrow_milestones WHERE escrow_id = ec.id AND status = 'work_submitted') as submitted_milestones,
  (SELECT COUNT(*) FROM escrow_notifications WHERE escrow_id = ec.id AND read = FALSE) as unread_notifications
FROM escrow_contracts ec;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if escrow is fully funded
CREATE OR REPLACE FUNCTION check_escrow_fully_funded()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmed = TRUE THEN
    UPDATE escrow_contracts
    SET 
      buyer_deposited = CASE WHEN NEW.party_role = 'buyer' THEN TRUE ELSE buyer_deposited END,
      seller_deposited = CASE WHEN NEW.party_role = 'seller' THEN TRUE ELSE seller_deposited END,
      status = CASE 
        WHEN escrow_type = 'simple_buyer' AND NEW.party_role = 'buyer' THEN 'fully_funded'
        WHEN escrow_type IN ('traditional', 'atomic_swap') AND 
             (SELECT COUNT(*) FROM escrow_deposits WHERE escrow_id = NEW.escrow_id AND confirmed = TRUE) >= 2 
        THEN 'fully_funded'
        ELSE status
      END,
      funded_at = CASE 
        WHEN status != 'fully_funded' AND (
          (escrow_type = 'simple_buyer' AND NEW.party_role = 'buyer') OR
          (escrow_type IN ('traditional', 'atomic_swap') AND 
           (SELECT COUNT(*) FROM escrow_deposits WHERE escrow_id = NEW.escrow_id AND confirmed = TRUE) >= 2)
        ) THEN NOW()
        ELSE funded_at
      END
    WHERE id = NEW.escrow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_escrow_funded
AFTER INSERT OR UPDATE ON escrow_deposits
FOR EACH ROW
EXECUTE FUNCTION check_escrow_fully_funded();

-- Function to update escrow status on milestone completion
CREATE OR REPLACE FUNCTION check_all_milestones_released()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'released' THEN
    UPDATE escrow_contracts
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = NEW.escrow_id
    AND NOT EXISTS (
      SELECT 1 FROM escrow_milestones 
      WHERE escrow_id = NEW.escrow_id 
      AND status != 'released'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_milestones_complete
AFTER UPDATE ON escrow_milestones
FOR EACH ROW
EXECUTE FUNCTION check_all_milestones_released();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE escrow_contracts IS 'Main escrow contracts table supporting traditional, simple_buyer, and atomic_swap types';
COMMENT ON TABLE escrow_milestones IS 'Milestones for simple_buyer escrow type';
COMMENT ON TABLE escrow_deposits IS 'Tracks all deposits into escrow wallets';
COMMENT ON TABLE escrow_actions IS 'Activity log for all escrow actions';
COMMENT ON TABLE escrow_disputes IS 'Dispute records requiring admin intervention';
COMMENT ON TABLE escrow_evidence IS 'Evidence submitted by parties in disputes';
COMMENT ON TABLE escrow_admin_actions IS 'Admin actions and resolutions';
COMMENT ON TABLE escrow_releases IS 'Fund release tracking';
COMMENT ON TABLE escrow_timeouts IS 'Timeout monitoring and warnings';
COMMENT ON TABLE escrow_notifications IS 'User notifications for escrow events';
