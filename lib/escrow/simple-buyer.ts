/**
 * Simple Buyer Escrow (Milestone-based)
 * Handles milestone creation, validation, work submission, and approval
 */

import { supabase } from '../supabase'
import { nanoid } from 'nanoid'
import type {
  EscrowMilestone,
  MilestoneStatus,
  CreateSimpleBuyerEscrowParams,
  EscrowValidation,
} from './types'

// ============================================
// MILESTONE VALIDATION
// ============================================

export interface MilestoneInput {
  description: string
  percentage: number
}

export interface ValidatedMilestone extends MilestoneInput {
  amount: number
  milestone_order: number
}

/**
 * Validate milestone percentages sum to 100%
 * Enforce milestone ordering
 */
export function validateMilestones(
  milestones: MilestoneInput[],
  totalAmount: number
): EscrowValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check minimum milestones
  if (milestones.length === 0) {
    errors.push('At least one milestone is required')
    return { valid: false, errors, warnings }
  }

  // Check maximum milestones (reasonable limit)
  if (milestones.length > 20) {
    errors.push('Maximum 20 milestones allowed')
  }

  // Validate each milestone
  milestones.forEach((milestone, index) => {
    // Check description
    if (!milestone.description || milestone.description.trim().length === 0) {
      errors.push(`Milestone ${index + 1}: Description is required`)
    } else if (milestone.description.length > 500) {
      errors.push(`Milestone ${index + 1}: Description too long (max 500 characters)`)
    }

    // Check percentage
    if (typeof milestone.percentage !== 'number') {
      errors.push(`Milestone ${index + 1}: Percentage must be a number`)
    } else if (milestone.percentage <= 0) {
      errors.push(`Milestone ${index + 1}: Percentage must be greater than 0`)
    } else if (milestone.percentage > 100) {
      errors.push(`Milestone ${index + 1}: Percentage cannot exceed 100`)
    }
  })

  // Calculate total percentage
  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)
  
  // Check if percentages sum to 100% (with small tolerance for floating point)
  const tolerance = 0.01
  if (Math.abs(totalPercentage - 100) > tolerance) {
    errors.push(
      `Milestone percentages must sum to 100% (current total: ${totalPercentage.toFixed(2)}%)`
    )
  }

  // Validate total amount
  if (totalAmount <= 0) {
    errors.push('Total amount must be greater than 0')
  }

  // Warnings for best practices
  if (milestones.length === 1) {
    warnings.push('Single milestone escrow: Consider using traditional escrow instead')
  }

  const hasVerySmallMilestone = milestones.some(m => m.percentage < 5)
  if (hasVerySmallMilestone) {
    warnings.push('Some milestones are less than 5% - consider combining small milestones')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Calculate milestone amounts from percentages
 */
export function calculateMilestoneAmounts(
  milestones: MilestoneInput[],
  totalAmount: number
): ValidatedMilestone[] {
  return milestones.map((milestone, index) => ({
    ...milestone,
    amount: (totalAmount * milestone.percentage) / 100,
    milestone_order: index + 1,
  }))
}

// ============================================
// MILESTONE CREATION
// ============================================

/**
 * Create milestones in database with proper ordering
 */
export async function createMilestones(
  escrowId: string,
  milestones: ValidatedMilestone[]
): Promise<EscrowMilestone[]> {
  const milestoneData = milestones.map((m) => ({
    id: nanoid(10),
    escrow_id: escrowId,
    description: m.description.trim(),
    percentage: m.percentage,
    amount: m.amount,
    milestone_order: m.milestone_order,
    status: 'pending' as MilestoneStatus,
  }))

  const { data, error } = await supabase
    .from('escrow_milestones')
    .insert(milestoneData)
    .select()

  if (error) {
    throw new Error(`Failed to create milestones: ${error.message}`)
  }

  return data as EscrowMilestone[]
}

/**
 * Get milestones for an escrow (ordered)
 */
export async function getMilestones(escrowId: string): Promise<EscrowMilestone[]> {
  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('milestone_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch milestones: ${error.message}`)
  }

  return data as EscrowMilestone[]
}

/**
 * Get a specific milestone by ID
 */
export async function getMilestoneById(milestoneId: string): Promise<EscrowMilestone | null> {
  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch milestone: ${error.message}`)
  }

  return data as EscrowMilestone
}

// ============================================
// MILESTONE STATUS CHECKS
// ============================================

/**
 * Check if milestone can be submitted (must be pending)
 */
export function canSubmitMilestone(milestone: EscrowMilestone): boolean {
  return milestone.status === 'pending'
}

/**
 * Check if milestone can be approved (must be work_submitted)
 */
export function canApproveMilestone(milestone: EscrowMilestone): boolean {
  return milestone.status === 'work_submitted'
}

/**
 * Check if previous milestones are completed (enforce sequential order)
 */
export async function checkPreviousMilestonesCompleted(
  escrowId: string,
  milestoneOrder: number
): Promise<boolean> {
  if (milestoneOrder === 1) {
    return true // First milestone, no previous ones
  }

  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('status')
    .eq('escrow_id', escrowId)
    .lt('milestone_order', milestoneOrder)

  if (error) {
    throw new Error(`Failed to check previous milestones: ${error.message}`)
  }

  // All previous milestones must be released
  return data.every((m) => m.status === 'released')
}

/**
 * Get next pending milestone (for sequential processing)
 */
export async function getNextPendingMilestone(
  escrowId: string
): Promise<EscrowMilestone | null> {
  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('*')
    .eq('escrow_id', escrowId)
    .in('status', ['pending', 'work_submitted'])
    .order('milestone_order', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No pending milestones
    }
    throw new Error(`Failed to fetch next milestone: ${error.message}`)
  }

  return data as EscrowMilestone
}

/**
 * Get milestone completion statistics
 */
export async function getMilestoneStats(escrowId: string) {
  const milestones = await getMilestones(escrowId)

  const stats = {
    total: milestones.length,
    pending: milestones.filter((m) => m.status === 'pending').length,
    submitted: milestones.filter((m) => m.status === 'work_submitted').length,
    approved: milestones.filter((m) => m.status === 'approved').length,
    released: milestones.filter((m) => m.status === 'released').length,
    disputed: milestones.filter((m) => m.status === 'disputed').length,
    completionPercentage: 0,
    releasedAmount: 0,
    remainingAmount: 0,
  }

  // Calculate completion percentage based on released milestones
  const releasedPercentage = milestones
    .filter((m) => m.status === 'released')
    .reduce((sum, m) => sum + m.percentage, 0)

  stats.completionPercentage = releasedPercentage
  stats.releasedAmount = milestones
    .filter((m) => m.status === 'released')
    .reduce((sum, m) => sum + m.amount, 0)
  stats.remainingAmount = milestones
    .filter((m) => m.status !== 'released')
    .reduce((sum, m) => sum + m.amount, 0)

  return stats
}

/**
 * Check if all milestones are released
 */
export async function areAllMilestonesReleased(escrowId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('status')
    .eq('escrow_id', escrowId)

  if (error) {
    throw new Error(`Failed to check milestone completion: ${error.message}`)
  }

  return data.length > 0 && data.every((m) => m.status === 'released')
}

// ============================================
// WORK SUBMISSION SYSTEM
// ============================================

export interface WorkSubmissionInput {
  milestoneId: string
  sellerWallet: string
  notes?: string
  evidenceUrls?: string[]
}

export interface WorkSubmissionResult {
  success: boolean
  milestone?: EscrowMilestone
  error?: string
}

/**
 * Submit work for a milestone (seller action)
 * - Validates seller authorization
 * - Checks milestone status
 * - Enforces sequential order
 * - Updates milestone status
 * - Logs action
 * - Creates notification for buyer
 */
export async function submitMilestoneWork(
  input: WorkSubmissionInput
): Promise<WorkSubmissionResult> {
  const { milestoneId, sellerWallet, notes, evidenceUrls } = input

  try {
    // Fetch milestone with escrow details
    const { data: milestone, error: fetchError } = await supabase
      .from('escrow_milestones')
      .select('*, escrow_contracts(*)')
      .eq('id', milestoneId)
      .single()

    if (fetchError || !milestone) {
      return {
        success: false,
        error: 'Milestone not found',
      }
    }

    const escrow = milestone.escrow_contracts as any

    // Verify seller authorization
    if (escrow.seller_wallet !== sellerWallet) {
      return {
        success: false,
        error: 'Unauthorized: Only the seller can submit work for this milestone',
      }
    }

    // Check escrow is funded
    if (escrow.status !== 'fully_funded' && escrow.status !== 'active') {
      return {
        success: false,
        error: 'Escrow must be fully funded before submitting work',
      }
    }

    // Check milestone status
    if (!canSubmitMilestone(milestone as EscrowMilestone)) {
      return {
        success: false,
        error: `Milestone cannot be submitted (current status: ${milestone.status})`,
      }
    }

    // Enforce sequential order - previous milestones must be completed
    const previousCompleted = await checkPreviousMilestonesCompleted(
      escrow.id,
      milestone.milestone_order
    )

    if (!previousCompleted) {
      return {
        success: false,
        error: 'Previous milestones must be completed before submitting this one',
      }
    }

    // Update milestone status
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('escrow_milestones')
      .update({
        status: 'work_submitted',
        seller_submitted_at: new Date().toISOString(),
        seller_notes: notes || null,
        seller_evidence_urls: evidenceUrls || null,
      })
      .eq('id', milestoneId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: `Failed to update milestone: ${updateError.message}`,
      }
    }

    // Update escrow status to active if first submission
    if (escrow.status === 'fully_funded') {
      await supabase
        .from('escrow_contracts')
        .update({ status: 'active' })
        .eq('id', escrow.id)
    }

    // Log action
    await logMilestoneAction(
      escrow.id,
      milestoneId,
      sellerWallet,
      'submitted',
      notes || 'Work submitted for milestone review',
      {
        milestone_order: milestone.milestone_order,
        evidence_count: evidenceUrls?.length || 0,
      }
    )

    // Create notification for buyer
    await createNotification({
      escrowId: escrow.id,
      recipientWallet: escrow.buyer_wallet,
      notificationType: 'work_submitted',
      title: 'Work Submitted for Review',
      message: `Milestone ${milestone.milestone_order}: ${milestone.description}`,
      link: `/escrow/${escrow.id}`,
    })

    return {
      success: true,
      milestone: updatedMilestone as EscrowMilestone,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to submit milestone work',
    }
  }
}

/**
 * Update work submission (seller can update before approval)
 */
export async function updateMilestoneSubmission(
  milestoneId: string,
  sellerWallet: string,
  notes?: string,
  evidenceUrls?: string[]
): Promise<WorkSubmissionResult> {
  try {
    // Fetch milestone with escrow details
    const { data: milestone, error: fetchError } = await supabase
      .from('escrow_milestones')
      .select('*, escrow_contracts(*)')
      .eq('id', milestoneId)
      .single()

    if (fetchError || !milestone) {
      return {
        success: false,
        error: 'Milestone not found',
      }
    }

    const escrow = milestone.escrow_contracts as any

    // Verify seller authorization
    if (escrow.seller_wallet !== sellerWallet) {
      return {
        success: false,
        error: 'Unauthorized: Only the seller can update this submission',
      }
    }

    // Can only update if work_submitted
    if (milestone.status !== 'work_submitted') {
      return {
        success: false,
        error: 'Can only update submissions that are pending review',
      }
    }

    // Update submission
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('escrow_milestones')
      .update({
        seller_notes: notes || milestone.seller_notes,
        seller_evidence_urls: evidenceUrls || milestone.seller_evidence_urls,
      })
      .eq('id', milestoneId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: `Failed to update submission: ${updateError.message}`,
      }
    }

    // Log action
    await logMilestoneAction(
      escrow.id,
      milestoneId,
      sellerWallet,
      'submitted',
      'Updated work submission',
      { action: 'update_submission' }
    )

    return {
      success: true,
      milestone: updatedMilestone as EscrowMilestone,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update submission',
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Log milestone action to escrow_actions table
 */
async function logMilestoneAction(
  escrowId: string,
  milestoneId: string | null,
  actorWallet: string,
  actionType: string,
  notes?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await supabase.from('escrow_actions').insert({
    id: nanoid(12),
    escrow_id: escrowId,
    milestone_id: milestoneId,
    actor_wallet: actorWallet,
    action_type: actionType,
    notes,
    metadata,
  })
}

/**
 * Create notification for user
 */
interface CreateNotificationInput {
  escrowId: string
  recipientWallet: string
  notificationType: string
  title: string
  message: string
  link?: string
}

async function createNotification(input: CreateNotificationInput): Promise<void> {
  await supabase.from('escrow_notifications').insert({
    id: nanoid(12),
    escrow_id: input.escrowId,
    recipient_wallet: input.recipientWallet,
    notification_type: input.notificationType,
    title: input.title,
    message: input.message,
    link: input.link,
    read: false,
    sent_browser: false,
    sent_email: false,
  })
}

// ============================================
// MILESTONE APPROVAL AND RELEASE
// ============================================

export interface MilestoneApprovalInput {
  milestoneId: string
  buyerWallet: string
  notes?: string
}

export interface MilestoneApprovalResult {
  success: boolean
  milestone?: EscrowMilestone
  shouldRelease: boolean
  error?: string
}

/**
 * Approve milestone (buyer action)
 * - Validates buyer authorization
 * - Checks milestone status (must be work_submitted)
 * - Prevents out-of-order approvals
 * - Updates milestone status to approved
 * - Signals that funds should be released
 * - Logs action
 * - Creates notification for seller
 */
export async function approveMilestone(
  input: MilestoneApprovalInput
): Promise<MilestoneApprovalResult> {
  const { milestoneId, buyerWallet, notes } = input

  try {
    // Fetch milestone with escrow details
    const { data: milestone, error: fetchError } = await supabase
      .from('escrow_milestones')
      .select('*, escrow_contracts(*)')
      .eq('id', milestoneId)
      .single()

    if (fetchError || !milestone) {
      return {
        success: false,
        shouldRelease: false,
        error: 'Milestone not found',
      }
    }

    const escrow = milestone.escrow_contracts as any

    // Verify buyer authorization
    if (escrow.buyer_wallet !== buyerWallet) {
      return {
        success: false,
        shouldRelease: false,
        error: 'Unauthorized: Only the buyer can approve this milestone',
      }
    }

    // Check milestone status
    if (!canApproveMilestone(milestone as EscrowMilestone)) {
      return {
        success: false,
        shouldRelease: false,
        error: `Milestone cannot be approved (current status: ${milestone.status}). Work must be submitted first.`,
      }
    }

    // Enforce sequential order - previous milestones must be released
    const previousCompleted = await checkPreviousMilestonesCompleted(
      escrow.id,
      milestone.milestone_order
    )

    if (!previousCompleted) {
      return {
        success: false,
        shouldRelease: false,
        error: 'Previous milestones must be released before approving this one',
      }
    }

    // Update milestone status to approved
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('escrow_milestones')
      .update({
        status: 'approved',
        buyer_approved_at: new Date().toISOString(),
        buyer_notes: notes || null,
      })
      .eq('id', milestoneId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        shouldRelease: false,
        error: `Failed to approve milestone: ${updateError.message}`,
      }
    }

    // Log action
    await logMilestoneAction(
      escrow.id,
      milestoneId,
      buyerWallet,
      'approved',
      notes || 'Milestone approved by buyer',
      {
        milestone_order: milestone.milestone_order,
        amount: milestone.amount,
      }
    )

    // Create notification for seller
    await createNotification({
      escrowId: escrow.id,
      recipientWallet: escrow.seller_wallet,
      notificationType: 'milestone_approved',
      title: 'Milestone Approved',
      message: `Milestone ${milestone.milestone_order} approved. Funds will be released.`,
      link: `/escrow/${escrow.id}`,
    })

    return {
      success: true,
      milestone: updatedMilestone as EscrowMilestone,
      shouldRelease: true, // Signal to caller to execute on-chain release
    }
  } catch (error: any) {
    return {
      success: false,
      shouldRelease: false,
      error: error.message || 'Failed to approve milestone',
    }
  }
}

export interface MilestoneReleaseInput {
  milestoneId: string
  txSignature: string
  triggeredBy: string
}

export interface MilestoneReleaseResult {
  success: boolean
  milestone?: EscrowMilestone
  escrowCompleted: boolean
  error?: string
}

/**
 * Record milestone fund release
 * - Updates milestone status to released
 * - Records transaction signature
 * - Checks if all milestones are complete
 * - Updates escrow status if complete
 * - Logs release action
 */
export async function releaseMilestoneFunds(
  input: MilestoneReleaseInput
): Promise<MilestoneReleaseResult> {
  const { milestoneId, txSignature, triggeredBy } = input

  try {
    // Fetch milestone with escrow details
    const { data: milestone, error: fetchError } = await supabase
      .from('escrow_milestones')
      .select('*, escrow_contracts(*)')
      .eq('id', milestoneId)
      .single()

    if (fetchError || !milestone) {
      return {
        success: false,
        escrowCompleted: false,
        error: 'Milestone not found',
      }
    }

    const escrow = milestone.escrow_contracts as any

    // Milestone must be approved before release
    if (milestone.status !== 'approved') {
      return {
        success: false,
        escrowCompleted: false,
        error: `Milestone must be approved before release (current status: ${milestone.status})`,
      }
    }

    // Update milestone status to released
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('escrow_milestones')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        tx_signature: txSignature,
      })
      .eq('id', milestoneId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        escrowCompleted: false,
        error: `Failed to record release: ${updateError.message}`,
      }
    }

    // Calculate fees for recording
    const releaseAmounts = calculateMilestoneReleaseAmount(milestone.amount)
    
    // Record release in escrow_releases table (net amount)
    await supabase.from('escrow_releases').insert({
      id: nanoid(12),
      escrow_id: escrow.id,
      milestone_id: milestoneId,
      release_type: 'milestone_release',
      from_wallet: escrow.escrow_wallet,
      to_wallet: escrow.seller_wallet,
      amount: releaseAmounts.netAmount,
      token: escrow.token,
      tx_signature: txSignature,
      confirmed: true,
      triggered_by: triggeredBy,
    })
    
    // Record fee transaction
    if (releaseAmounts.platformFee > 0) {
      const { recordFeeTransaction } = await import('./fee-handler')
      await recordFeeTransaction({
        escrowId: escrow.id,
        milestoneId,
        feeAmount: releaseAmounts.platformFee,
        grossAmount: releaseAmounts.totalAmount,
        netAmount: releaseAmounts.netAmount,
        feePercentage: releaseAmounts.feePercentage,
        txSignature,
        feeType: 'platform_fee',
        paidBy: escrow.buyer_wallet,
        releaseType: 'milestone_release'
      })
    }

    // Log action with fee details
    await logMilestoneAction(
      escrow.id,
      milestoneId,
      triggeredBy,
      'released',
      `Milestone funds released to seller: ${releaseAmounts.netAmount} ${escrow.token} (after ${releaseAmounts.platformFee} ${escrow.token} fee)`,
      {
        milestone_order: milestone.milestone_order,
        gross_amount: milestone.amount,
        net_amount: releaseAmounts.netAmount,
        platform_fee: releaseAmounts.platformFee,
        fee_percentage: releaseAmounts.feePercentage,
        tx_signature: txSignature,
      }
    )

    // Check if all milestones are released
    const allReleased = await areAllMilestonesReleased(escrow.id)

    if (allReleased) {
      // Mark escrow as completed
      await supabase
        .from('escrow_contracts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', escrow.id)

      // Log completion
      await logMilestoneAction(
        escrow.id,
        null,
        'system',
        'completed',
        'All milestones released, escrow completed'
      )

      // Notify both parties
      await createNotification({
        escrowId: escrow.id,
        recipientWallet: escrow.buyer_wallet,
        notificationType: 'escrow_completed',
        title: 'Escrow Completed',
        message: 'All milestones have been completed and funds released.',
        link: `/escrow/${escrow.id}`,
      })

      await createNotification({
        escrowId: escrow.id,
        recipientWallet: escrow.seller_wallet,
        notificationType: 'escrow_completed',
        title: 'Escrow Completed',
        message: 'All milestones have been completed and funds released.',
        link: `/escrow/${escrow.id}`,
      })
    }

    return {
      success: true,
      milestone: updatedMilestone as EscrowMilestone,
      escrowCompleted: allReleased,
    }
  } catch (error: any) {
    return {
      success: false,
      escrowCompleted: false,
      error: error.message || 'Failed to release milestone funds',
    }
  }
}

/**
 * Calculate milestone release amount (after platform fees)
 */
export function calculateMilestoneReleaseAmount(
  milestoneAmount: number,
  platformFeePercentage?: number
): { netAmount: number; platformFee: number; totalAmount: number; feePercentage: number } {
  // Use provided percentage or get from environment
  let feePercentage = platformFeePercentage
  if (feePercentage === undefined) {
    // Import fee handler to get configured percentage
    const envFee = process.env.PLATFORM_FEE_PERCENTAGE || process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE
    if (envFee) {
      feePercentage = parseFloat(envFee)
    } else {
      // Default based on network
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
      feePercentage = network === 'mainnet-beta' ? 1 : 3
    }
  }
  
  const platformFee = (milestoneAmount * feePercentage) / 100
  const netAmount = milestoneAmount - platformFee

  return {
    netAmount,
    platformFee,
    totalAmount: milestoneAmount,
    feePercentage
  }
}

/**
 * Get milestone release details (for UI display)
 */
export async function getMilestoneReleaseDetails(milestoneId: string) {
  const milestone = await getMilestoneById(milestoneId)

  if (!milestone) {
    throw new Error('Milestone not found')
  }

  const { data: escrow } = await supabase
    .from('escrow_contracts')
    .select('*')
    .eq('id', milestone.escrow_id)
    .single()

  if (!escrow) {
    throw new Error('Escrow not found')
  }

  const releaseAmounts = calculateMilestoneReleaseAmount(milestone.amount)

  return {
    milestone,
    escrow,
    releaseAmounts,
    canRelease: milestone.status === 'approved',
  }
}
