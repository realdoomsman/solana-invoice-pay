-- ============================================
-- DATABASE OPTIMIZATION: ADDITIONAL INDEXES
-- Task 20.1: Optimize database queries
-- ============================================

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- Escrow contracts: User dashboard queries (wallet + status)
CREATE INDEX IF NOT EXISTS idx_escrow_buyer_status ON escrow_contracts(buyer_wallet, status);
CREATE INDEX IF NOT EXISTS idx_escrow_seller_status ON escrow_contracts(seller_wallet, status);

-- Escrow contracts: User dashboard with type filter
CREATE INDEX IF NOT EXISTS idx_escrow_buyer_type_status ON escrow_contracts(buyer_wallet, escrow_type, status);
CREATE INDEX IF NOT EXISTS idx_escrow_seller_type_status ON escrow_contracts(seller_wallet, escrow_type, status);

-- Escrow contracts: Date-based queries with status
CREATE INDEX IF NOT EXISTS idx_escrow_created_status ON escrow_contracts(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_escrow_completed_date ON escrow_contracts(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Escrow contracts: Active escrows needing attention
CREATE INDEX IF NOT EXISTS idx_escrow_active_expires ON escrow_contracts(expires_at, status) 
  WHERE status IN ('created', 'buyer_deposited', 'seller_deposited', 'fully_funded', 'active');

-- Milestones: Escrow with status for quick filtering
CREATE INDEX IF NOT EXISTS idx_milestone_escrow_status_order ON escrow_milestones(escrow_id, status, milestone_order);

-- Milestones: Work submitted milestones for notifications
CREATE INDEX IF NOT EXISTS idx_milestone_submitted ON escrow_milestones(status, seller_submitted_at DESC) 
  WHERE status = 'work_submitted';

-- Deposits: Unconfirmed deposits for monitoring
CREATE INDEX IF NOT EXISTS idx_deposit_escrow_confirmed ON escrow_deposits(escrow_id, confirmed, deposited_at);

-- Deposits: Party-specific deposit tracking
CREATE INDEX IF NOT EXISTS idx_deposit_escrow_party ON escrow_deposits(escrow_id, party_role, confirmed);

-- Actions: Recent actions per escrow
CREATE INDEX IF NOT EXISTS idx_action_escrow_created ON escrow_actions(escrow_id, created_at DESC);

-- Actions: User activity history
CREATE INDEX IF NOT EXISTS idx_action_actor_created ON escrow_actions(actor_wallet, created_at DESC);

-- Disputes: Active disputes by priority
CREATE INDEX IF NOT EXISTS idx_dispute_status_priority_created ON escrow_disputes(status, priority DESC, created_at ASC) 
  WHERE status IN ('open', 'under_review');

-- Disputes: Escrow disputes with status
CREATE INDEX IF NOT EXISTS idx_dispute_escrow_status ON escrow_disputes(escrow_id, status);

-- Evidence: Dispute evidence with party role
CREATE INDEX IF NOT EXISTS idx_evidence_dispute_party ON escrow_evidence(dispute_id, party_role, created_at DESC);

-- Evidence: Escrow evidence for quick lookup
CREATE INDEX IF NOT EXISTS idx_evidence_escrow_created ON escrow_evidence(escrow_id, created_at DESC);

-- Admin actions: Recent admin activity
CREATE INDEX IF NOT EXISTS idx_admin_action_created_admin ON escrow_admin_actions(created_at DESC, admin_wallet);

-- Admin actions: Escrow admin history
CREATE INDEX IF NOT EXISTS idx_admin_action_escrow_created ON escrow_admin_actions(escrow_id, created_at DESC);

-- Releases: Pending releases for monitoring
CREATE INDEX IF NOT EXISTS idx_release_escrow_confirmed ON escrow_releases(escrow_id, confirmed, created_at DESC);

-- Releases: Recipient release history
CREATE INDEX IF NOT EXISTS idx_release_to_created ON escrow_releases(to_wallet, created_at DESC);

-- Timeouts: Active timeouts needing monitoring
CREATE INDEX IF NOT EXISTS idx_timeout_expires_resolved ON escrow_timeouts(expires_at ASC, resolved) 
  WHERE resolved = FALSE;

-- Timeouts: Escrow timeout status
CREATE INDEX IF NOT EXISTS idx_timeout_escrow_resolved ON escrow_timeouts(escrow_id, resolved, expires_at);

-- Notifications: Unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notification_recipient_read_created ON escrow_notifications(recipient_wallet, read, created_at DESC);

-- Notifications: Escrow notifications
CREATE INDEX IF NOT EXISTS idx_notification_escrow_created ON escrow_notifications(escrow_id, created_at DESC);

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC STATES
-- ============================================

-- Active escrows only (most common queries)
CREATE INDEX IF NOT EXISTS idx_escrow_active_buyer ON escrow_contracts(buyer_wallet, created_at DESC) 
  WHERE status NOT IN ('completed', 'cancelled', 'refunded');

CREATE INDEX IF NOT EXISTS idx_escrow_active_seller ON escrow_contracts(seller_wallet, created_at DESC) 
  WHERE status NOT IN ('completed', 'cancelled', 'refunded');

-- Disputed escrows for admin queue
CREATE INDEX IF NOT EXISTS idx_escrow_disputed_created ON escrow_contracts(created_at DESC) 
  WHERE status = 'disputed';

-- Pending deposits for monitoring
CREATE INDEX IF NOT EXISTS idx_deposit_pending ON escrow_deposits(escrow_id, deposited_at DESC) 
  WHERE confirmed = FALSE;

-- Pending milestones for seller
CREATE INDEX IF NOT EXISTS idx_milestone_pending_escrow ON escrow_milestones(escrow_id, milestone_order) 
  WHERE status = 'pending';

-- Work submitted milestones for buyer
CREATE INDEX IF NOT EXISTS idx_milestone_work_submitted_escrow ON escrow_milestones(escrow_id, seller_submitted_at DESC) 
  WHERE status = 'work_submitted';

-- ============================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================

-- Escrow list with essential fields (reduce table lookups)
CREATE INDEX IF NOT EXISTS idx_escrow_list_buyer ON escrow_contracts(buyer_wallet, created_at DESC) 
  INCLUDE (id, escrow_type, status, seller_wallet, buyer_amount, token, description);

CREATE INDEX IF NOT EXISTS idx_escrow_list_seller ON escrow_contracts(seller_wallet, created_at DESC) 
  INCLUDE (id, escrow_type, status, buyer_wallet, buyer_amount, token, description);

-- ============================================
-- STATISTICS UPDATE
-- ============================================

-- Analyze tables to update query planner statistics
ANALYZE escrow_contracts;
ANALYZE escrow_milestones;
ANALYZE escrow_deposits;
ANALYZE escrow_actions;
ANALYZE escrow_disputes;
ANALYZE escrow_evidence;
ANALYZE escrow_admin_actions;
ANALYZE escrow_releases;
ANALYZE escrow_timeouts;
ANALYZE escrow_notifications;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_escrow_buyer_status IS 'Optimizes user dashboard queries filtering by buyer wallet and status';
COMMENT ON INDEX idx_escrow_seller_status IS 'Optimizes user dashboard queries filtering by seller wallet and status';
COMMENT ON INDEX idx_escrow_active_expires IS 'Optimizes timeout monitoring queries for active escrows';
COMMENT ON INDEX idx_milestone_escrow_status_order IS 'Optimizes milestone queries with status filtering';
COMMENT ON INDEX idx_dispute_status_priority_created IS 'Optimizes admin dispute queue with priority sorting';
COMMENT ON INDEX idx_notification_recipient_read_created IS 'Optimizes unread notification queries per user';
COMMENT ON INDEX idx_escrow_list_buyer IS 'Covering index for escrow list queries to reduce table lookups';
COMMENT ON INDEX idx_escrow_list_seller IS 'Covering index for escrow list queries to reduce table lookups';
