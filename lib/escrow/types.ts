/**
 * Complete Escrow System Types
 * Supports: Traditional, Simple Buyer, and Atomic Swap escrow
 */

// ============================================
// ESCROW TYPES
// ============================================

export type EscrowType = 'traditional' | 'simple_buyer' | 'atomic_swap'

export type EscrowStatus = 
  | 'created'
  | 'buyer_deposited'
  | 'seller_deposited'
  | 'fully_funded'
  | 'active'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'refunded'

export type MilestoneStatus = 
  | 'pending'
  | 'work_submitted'
  | 'approved'
  | 'released'
  | 'disputed'

export type DisputeStatus = 
  | 'open'
  | 'under_review'
  | 'resolved'
  | 'closed'

export type PartyRole = 'buyer' | 'seller' | 'admin'

export type ActionType = 
  | 'created'
  | 'deposited'
  | 'confirmed'
  | 'submitted'
  | 'approved'
  | 'disputed'
  | 'released'
  | 'refunded'
  | 'cancelled'
  | 'swapped'
  | 'timeout'
  | 'admin_action'

export type ReleaseType =
  | 'milestone_release'
  | 'full_release'
  | 'security_deposit_return'
  | 'refund'
  | 'dispute_resolution'
  | 'swap_execution'

export type TimeoutType =
  | 'deposit_timeout'
  | 'confirmation_timeout'
  | 'milestone_timeout'
  | 'dispute_timeout'
  | 'swap_timeout'

export type NotificationType =
  | 'deposit_received'
  | 'work_submitted'
  | 'milestone_approved'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'timeout_warning'
  | 'escrow_completed'
  | 'refund_processed'
  | 'swap_executed'
  | 'action_required'

// ============================================
// MAIN INTERFACES
// ============================================

export interface EscrowContract {
  id: string
  escrow_type: EscrowType
  payment_id: string
  
  // Parties
  buyer_wallet: string
  seller_wallet: string
  
  // Amounts
  buyer_amount: number
  seller_amount?: number // Required for traditional, null for simple_buyer
  token: string
  
  // Escrow wallet
  escrow_wallet: string
  encrypted_private_key: string
  
  // Status
  status: EscrowStatus
  buyer_deposited: boolean
  seller_deposited: boolean
  buyer_confirmed: boolean
  seller_confirmed: boolean
  
  // Atomic swap specific
  swap_asset_buyer?: string
  swap_asset_seller?: string
  swap_executed?: boolean
  swap_tx_signature?: string
  
  // Metadata
  description?: string
  timeout_hours: number
  expires_at?: string
  
  // Timestamps
  created_at: string
  funded_at?: string
  completed_at?: string
  cancelled_at?: string
}

export interface EscrowMilestone {
  id: string
  escrow_id: string
  
  description: string
  percentage: number
  amount: number
  milestone_order: number
  
  status: MilestoneStatus
  
  // Seller actions
  seller_submitted_at?: string
  seller_notes?: string
  seller_evidence_urls?: string[]
  
  // Buyer actions
  buyer_approved_at?: string
  buyer_notes?: string
  
  // Release
  released_at?: string
  tx_signature?: string
  
  created_at: string
}

export interface EscrowDeposit {
  id: string
  escrow_id: string
  
  depositor_wallet: string
  party_role: PartyRole
  amount: number
  token: string
  
  tx_signature: string
  confirmed: boolean
  confirmation_count: number
  
  deposited_at: string
  confirmed_at?: string
}

export interface EscrowAction {
  id: string
  escrow_id: string
  milestone_id?: string
  
  actor_wallet: string
  action_type: ActionType
  
  notes?: string
  metadata?: Record<string, any>
  
  created_at: string
}

export interface EscrowDispute {
  id: string
  escrow_id: string
  milestone_id?: string
  
  raised_by: string
  party_role: PartyRole
  
  reason: string
  description: string
  
  status: DisputeStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  // Resolution
  resolved_by?: string
  resolution?: string
  resolution_action?: 'release_to_seller' | 'refund_to_buyer' | 'partial_split' | 'other'
  resolved_at?: string
  
  created_at: string
  updated_at: string
}

export interface EscrowEvidence {
  id: string
  escrow_id: string
  dispute_id?: string
  milestone_id?: string
  
  submitted_by: string
  party_role: PartyRole
  
  evidence_type: 'text' | 'image' | 'document' | 'link' | 'screenshot'
  content?: string
  file_url?: string
  file_size?: number
  mime_type?: string
  
  created_at: string
}

export interface EscrowAdminAction {
  id: string
  escrow_id: string
  dispute_id?: string
  milestone_id?: string
  
  admin_wallet: string
  action: 'approved_release' | 'approved_refund' | 'partial_split' | 'resolved_dispute' | 'cancelled_escrow' | 'extended_timeout' | 'manual_intervention'
  decision: string
  
  // Fund distribution
  amount_to_buyer?: number
  amount_to_seller?: number
  tx_signature_buyer?: string
  tx_signature_seller?: string
  
  notes: string
  metadata?: Record<string, any>
  
  created_at: string
}

export interface EscrowRelease {
  id: string
  escrow_id: string
  milestone_id?: string
  
  release_type: ReleaseType
  
  from_wallet: string
  to_wallet: string
  amount: number
  token: string
  
  tx_signature: string
  confirmed: boolean
  
  triggered_by: string
  
  created_at: string
  confirmed_at?: string
}

export interface EscrowTimeout {
  id: string
  escrow_id: string
  
  timeout_type: TimeoutType
  
  expected_action: string
  expected_from?: string
  
  warning_sent: boolean
  warning_sent_at?: string
  
  expired: boolean
  expired_at?: string
  
  resolved: boolean
  resolved_at?: string
  resolution_action?: string
  
  created_at: string
  expires_at: string
}

export interface EscrowNotification {
  id: string
  escrow_id: string
  
  recipient_wallet: string
  notification_type: NotificationType
  
  title: string
  message: string
  link?: string
  
  read: boolean
  read_at?: string
  
  sent_browser: boolean
  sent_email: boolean
  
  created_at: string
}

export interface EscrowMultiSigTransaction {
  id: string
  escrow_id: string
  
  multisig_wallet: string
  provider: 'squads' | 'goki' | 'serum' | 'unknown'
  
  transaction_data: string
  required_signatures: number
  current_signatures: number
  
  signers: string[]
  signed_by: string[]
  
  status: 'pending' | 'partially_signed' | 'ready' | 'executed' | 'cancelled'
  
  tx_signature?: string
  executed_at?: string
  
  metadata?: Record<string, any>
  
  created_at: string
  updated_at: string
}

export interface EscrowMultiSigWallet {
  id: string
  wallet_address: string
  
  is_multisig: boolean
  provider?: 'squads' | 'goki' | 'serum' | 'unknown'
  
  threshold?: number
  total_signers?: number
  signers?: string[]
  
  program_id?: string
  metadata?: Record<string, any>
  
  last_checked_at: string
  created_at: string
  updated_at: string
}

// ============================================
// CREATION INTERFACES
// ============================================

export interface CreateTraditionalEscrowParams {
  buyerWallet: string
  sellerWallet: string
  buyerAmount: number
  sellerSecurityDeposit: number
  token: string
  description?: string
  timeoutHours?: number
}

export interface CreateSimpleBuyerEscrowParams {
  buyerWallet: string
  sellerWallet: string
  totalAmount: number
  token: string
  description?: string
  milestones: {
    description: string
    percentage: number
  }[]
  timeoutHours?: number
}

export interface CreateAtomicSwapParams {
  partyAWallet: string
  partyBWallet: string
  partyAAsset: {
    token: string
    amount: number
    mint?: string
  }
  partyBAsset: {
    token: string
    amount: number
    mint?: string
  }
  timeoutHours?: number
}

// ============================================
// VIEW INTERFACES
// ============================================

export interface AdminEscrowQueueItem {
  id: string
  escrow_type: EscrowType
  status: EscrowStatus
  buyer_wallet: string
  seller_wallet: string
  buyer_amount: number
  token: string
  description?: string
  created_at: string
  expires_at?: string
  dispute_id?: string
  dispute_reason?: string
  dispute_priority?: string
  dispute_created_at?: string
  evidence_count: number
}

export interface UserEscrowDashboardItem {
  id: string
  escrow_type: EscrowType
  status: EscrowStatus
  buyer_wallet: string
  seller_wallet: string
  buyer_amount: number
  seller_amount?: number
  token: string
  description?: string
  created_at: string
  expires_at?: string
  user_role: 'buyer' | 'seller' | 'observer'
  pending_milestones: number
  submitted_milestones: number
  unread_notifications: number
}

// ============================================
// UTILITY TYPES
// ============================================

export interface EscrowWallet {
  publicKey: string
  privateKey: string
  encrypted: boolean
}

export interface EscrowFees {
  platformFee: number
  platformFeePercentage: number
  networkFee: number
  totalFees: number
}

export interface EscrowValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CreateEscrowResponse {
  success: boolean
  escrow: EscrowContract
  milestones?: EscrowMilestone[]
  paymentLink: string
  error?: string
}

export interface DepositStatusResponse {
  escrow_id: string
  buyer_deposited: boolean
  seller_deposited: boolean
  fully_funded: boolean
  deposits: EscrowDeposit[]
  buyer_amount: number
  seller_amount?: number
  token: string
  escrow_wallet: string
}

export interface DepositMonitorResult {
  buyerDeposited: boolean
  sellerDeposited: boolean
  fullyFunded: boolean
  deposits: EscrowDeposit[]
}

export interface RecordDepositResult {
  success: boolean
  deposit?: EscrowDeposit
  error?: string
}

export interface EscrowDetailsResponse {
  escrow: EscrowContract
  milestones: EscrowMilestone[]
  actions: EscrowAction[]
  deposits: EscrowDeposit[]
  disputes: EscrowDispute[]
  releases: EscrowRelease[]
}

export interface DisputeDetailsResponse {
  dispute: EscrowDispute
  evidence: EscrowEvidence[]
  escrow: EscrowContract
  admin_actions: EscrowAdminAction[]
}
