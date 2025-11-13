import { supabase, supabaseAdmin } from './supabase'
import { nanoid } from 'nanoid'

export interface EscrowContract {
  id: string
  payment_id: string
  buyer_wallet: string
  seller_wallet: string
  total_amount: number
  token: string
  description: string
  status: 'created' | 'funded' | 'active' | 'completed' | 'disputed' | 'cancelled'
  payment_wallet: string
  encrypted_private_key: string
  created_at: string
  funded_at?: string
  completed_at?: string
}

export interface EscrowMilestone {
  id: string
  escrow_id: string
  description: string
  percentage: number
  amount: number
  milestone_order: number
  status: 'pending' | 'work_submitted' | 'approved' | 'released' | 'disputed'
  seller_submitted_at?: string
  seller_notes?: string
  buyer_approved_at?: string
  buyer_notes?: string
  released_at?: string
  tx_signature?: string
  created_at: string
}

export interface EscrowAction {
  id: string
  escrow_id: string
  milestone_id?: string
  actor_wallet: string
  action: string
  notes?: string
  metadata?: any
  created_at: string
}

// Create escrow contract
export async function createEscrowContract(
  paymentId: string,
  buyerWallet: string,
  sellerWallet: string,
  totalAmount: number,
  token: string,
  description: string,
  paymentWallet: string,
  encryptedPrivateKey: string,
  milestones: Array<{ description: string; percentage: number }>
) {
  const escrowId = nanoid(12)

  // Create contract
  const { data: contract, error: contractError } = await supabase
    .from('escrow_contracts')
    .insert({
      id: escrowId,
      payment_id: paymentId,
      buyer_wallet: buyerWallet,
      seller_wallet: sellerWallet,
      total_amount: totalAmount,
      token,
      description,
      status: 'created',
      payment_wallet: paymentWallet,
      encrypted_private_key: encryptedPrivateKey,
    })
    .select()
    .single()

  if (contractError) throw contractError

  // Create milestones
  const milestoneData = milestones.map((m, index) => ({
    id: nanoid(10),
    escrow_id: escrowId,
    description: m.description,
    percentage: m.percentage,
    amount: (totalAmount * m.percentage) / 100,
    milestone_order: index + 1,
    status: 'pending' as const,
  }))

  const { error: milestonesError } = await supabase
    .from('escrow_milestones')
    .insert(milestoneData)

  if (milestonesError) throw milestonesError

  // Log action
  await logEscrowAction(escrowId, null, buyerWallet, 'created', 'Escrow contract created')

  return { contract, milestones: milestoneData }
}

// Get escrow by payment ID
export async function getEscrowByPaymentId(paymentId: string) {
  const { data, error } = await supabase
    .from('escrow_contracts')
    .select('*')
    .eq('payment_id', paymentId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Get escrow milestones
export async function getEscrowMilestones(escrowId: string) {
  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('milestone_order', { ascending: true })

  if (error) throw error
  return data || []
}

// Submit milestone for review (seller action)
export async function submitMilestone(
  milestoneId: string,
  sellerWallet: string,
  notes?: string
) {
  // Verify seller
  const { data: milestone } = await supabase
    .from('escrow_milestones')
    .select('*, escrow_contracts(*)')
    .eq('id', milestoneId)
    .single()

  if (!milestone) throw new Error('Milestone not found')
  
  const escrow = milestone.escrow_contracts as any
  if (escrow.seller_wallet !== sellerWallet) {
    throw new Error('Unauthorized: Only seller can submit work')
  }

  if (milestone.status !== 'pending') {
    throw new Error('Milestone is not in pending status')
  }

  // Update milestone
  const { error } = await supabase
    .from('escrow_milestones')
    .update({
      status: 'work_submitted',
      seller_submitted_at: new Date().toISOString(),
      seller_notes: notes,
    })
    .eq('id', milestoneId)

  if (error) throw error

  // Log action
  await logEscrowAction(
    milestone.escrow_id,
    milestoneId,
    sellerWallet,
    'submitted',
    notes || 'Work submitted for review'
  )

  return true
}

// Approve milestone (buyer action) - AUTO-RELEASE unless disputed
export async function approveMilestone(
  milestoneId: string,
  buyerWallet: string,
  notes?: string
) {
  // Verify buyer
  const { data: milestone } = await supabase
    .from('escrow_milestones')
    .select('*, escrow_contracts(*)')
    .eq('id', milestoneId)
    .single()

  if (!milestone) throw new Error('Milestone not found')
  
  const escrow = milestone.escrow_contracts as any
  if (escrow.buyer_wallet !== buyerWallet) {
    throw new Error('Unauthorized: Only buyer can approve')
  }

  if (milestone.status !== 'work_submitted') {
    throw new Error('Milestone must be submitted before approval')
  }

  // Update milestone - mark as approved (will auto-release)
  const { error } = await supabase
    .from('escrow_milestones')
    .update({
      status: 'approved',
      buyer_approved_at: new Date().toISOString(),
      buyer_notes: notes,
    })
    .eq('id', milestoneId)

  if (error) throw error

  // Log action
  await logEscrowAction(
    milestone.escrow_id,
    milestoneId,
    buyerWallet,
    'approved',
    notes || 'Milestone approved by buyer, ready for automatic release'
  )

  return true
}

// Release milestone funds (triggered after approval)
export async function releaseMilestoneFunds(
  milestoneId: string,
  txSignature: string
) {
  const { error } = await supabase
    .from('escrow_milestones')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      tx_signature: txSignature,
    })
    .eq('id', milestoneId)

  if (error) throw error

  // Check if all milestones are released
  const { data: milestone } = await supabase
    .from('escrow_milestones')
    .select('escrow_id')
    .eq('id', milestoneId)
    .single()

  if (milestone) {
    const { data: allMilestones } = await supabase
      .from('escrow_milestones')
      .select('status')
      .eq('escrow_id', milestone.escrow_id)

    const allReleased = allMilestones?.every(m => m.status === 'released')

    if (allReleased) {
      // Mark escrow as completed
      await supabase
        .from('escrow_contracts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', milestone.escrow_id)

      await logEscrowAction(
        milestone.escrow_id,
        null,
        'system',
        'completed',
        'All milestones released, escrow completed'
      )
    }
  }

  return true
}

// Raise dispute - BLOCKS AUTO-RELEASE, requires admin intervention
export async function raiseDispute(
  escrowId: string,
  milestoneId: string | null,
  actorWallet: string,
  reason: string
) {
  // Verify actor is buyer or seller
  const { data: escrow } = await supabase
    .from('escrow_contracts')
    .select('*')
    .eq('id', escrowId)
    .single()

  if (!escrow) throw new Error('Escrow not found')

  if (escrow.buyer_wallet !== actorWallet && escrow.seller_wallet !== actorWallet) {
    throw new Error('Unauthorized: Only buyer or seller can raise dispute')
  }

  // Determine party role
  const partyRole = escrow.buyer_wallet === actorWallet ? 'buyer' : 'seller'

  // Create dispute record
  await createDispute(escrowId, milestoneId, actorWallet, partyRole, reason, reason)

  // Update escrow status
  await supabase
    .from('escrow_contracts')
    .update({ status: 'disputed' })
    .eq('id', escrowId)

  // Update milestone if specified - BLOCKS AUTO-RELEASE
  if (milestoneId) {
    await supabase
      .from('escrow_milestones')
      .update({ status: 'disputed' })
      .eq('id', milestoneId)
  }

  // Log action
  await logEscrowAction(escrowId, milestoneId, actorWallet, 'disputed', reason)

  return true
}

// Log escrow action
async function logEscrowAction(
  escrowId: string,
  milestoneId: string | null,
  actorWallet: string,
  action: string,
  notes?: string,
  metadata?: any
) {
  await supabase.from('escrow_actions').insert({
    escrow_id: escrowId,
    milestone_id: milestoneId,
    actor_wallet: actorWallet,
    action,
    notes,
    metadata,
  })
}

// Get escrow actions (audit log)
export async function getEscrowActions(escrowId: string) {
  const { data, error } = await supabase
    .from('escrow_actions')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Mark escrow as funded
export async function markEscrowFunded(escrowId: string) {
  const { error } = await supabase
    .from('escrow_contracts')
    .update({
      status: 'funded',
      funded_at: new Date().toISOString(),
    })
    .eq('id', escrowId)

  if (error) throw error

  await logEscrowAction(escrowId, null, 'system', 'funded', 'Escrow funded by buyer')

  return true
}

// ============================================
// ADMIN FUNCTIONS (Manual Control)
// ============================================

// Submit evidence for dispute
export async function submitEvidence(
  escrowId: string,
  milestoneId: string | null,
  submittedBy: string,
  partyRole: 'buyer' | 'seller',
  evidenceType: string,
  description: string,
  fileUrl?: string,
  metadata?: any
) {
  const { error } = await supabase
    .from('escrow_evidence')
    .insert({
      escrow_id: escrowId,
      milestone_id: milestoneId,
      submitted_by: submittedBy,
      party_role: partyRole,
      evidence_type: evidenceType,
      file_url: fileUrl,
      description,
      metadata,
    })

  if (error) throw error

  await logEscrowAction(
    escrowId,
    milestoneId,
    submittedBy,
    'evidence_submitted',
    `${partyRole} submitted evidence: ${description}`
  )

  return true
}

// Create dispute record
export async function createDispute(
  escrowId: string,
  milestoneId: string | null,
  raisedBy: string,
  partyRole: 'buyer' | 'seller',
  reason: string,
  description: string
) {
  const { data, error } = await supabase
    .from('escrow_disputes')
    .insert({
      escrow_id: escrowId,
      milestone_id: milestoneId,
      raised_by: raisedBy,
      party_role: partyRole,
      reason,
      description,
      status: 'open',
    })
    .select()
    .single()

  if (error) throw error

  // Update escrow status
  await supabase
    .from('escrow_contracts')
    .update({ status: 'disputed' })
    .eq('id', escrowId)

  // Update milestone if specified
  if (milestoneId) {
    await supabase
      .from('escrow_milestones')
      .update({ status: 'disputed' })
      .eq('id', milestoneId)
  }

  await logEscrowAction(escrowId, milestoneId, raisedBy, 'disputed', description)

  return data
}

// Admin: Manually release funds to seller
export async function adminReleaseFunds(
  milestoneId: string,
  adminWallet: string,
  notes: string
) {
  const { data: milestone } = await supabase
    .from('escrow_milestones')
    .select('*, escrow_contracts(*)')
    .eq('id', milestoneId)
    .single()

  if (!milestone) throw new Error('Milestone not found')

  // Log admin action
  await supabase.from('escrow_admin_actions').insert({
    escrow_id: milestone.escrow_id,
    milestone_id: milestoneId,
    admin_wallet: adminWallet,
    action: 'approved_release',
    decision: 'release_to_seller',
    notes,
  })

  await logEscrowAction(
    milestone.escrow_id,
    milestoneId,
    adminWallet,
    'admin_approved_release',
    notes
  )

  return milestone
}

// Admin: Refund to buyer
export async function adminRefundToBuyer(
  escrowId: string,
  milestoneId: string | null,
  adminWallet: string,
  notes: string
) {
  const { data: escrow } = await supabase
    .from('escrow_contracts')
    .select('*')
    .eq('id', escrowId)
    .single()

  if (!escrow) throw new Error('Escrow not found')

  // Log admin action
  await supabase.from('escrow_admin_actions').insert({
    escrow_id: escrowId,
    milestone_id: milestoneId,
    admin_wallet: adminWallet,
    action: 'approved_refund',
    decision: 'refund_to_buyer',
    notes,
  })

  await logEscrowAction(escrowId, milestoneId, adminWallet, 'admin_approved_refund', notes)

  return escrow
}

// Admin: Resolve dispute
export async function adminResolveDispute(
  disputeId: string,
  adminWallet: string,
  resolution: string,
  notes: string
) {
  const { error } = await supabase
    .from('escrow_disputes')
    .update({
      status: 'resolved',
      resolution,
      resolved_by: adminWallet,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId)

  if (error) throw error

  return true
}

// Get all escrows needing admin review
export async function getEscrowsNeedingReview() {
  const { data, error } = await supabase
    .from('admin_escrow_queue')
    .select('*')

  if (error) throw error
  return data || []
}

// Get dispute details
export async function getDisputeDetails(disputeId: string) {
  const { data, error } = await supabase
    .from('escrow_disputes')
    .select('*, escrow_evidence(*)')
    .eq('id', disputeId)
    .single()

  if (error) throw error
  return data
}

// Get all evidence for an escrow
export async function getEscrowEvidence(escrowId: string) {
  const { data, error } = await supabase
    .from('escrow_evidence')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get admin actions for an escrow
export async function getAdminActions(escrowId: string) {
  const { data, error } = await supabase
    .from('escrow_admin_actions')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
