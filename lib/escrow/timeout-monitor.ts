/**
 * Timeout Monitoring Service
 * Periodically checks for expired escrows and sends pre-expiration notifications
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import type { EscrowTimeout, EscrowContract, TimeoutType } from './types'
import {
  getTimeoutConfig,
  calculateWarningTimestamp,
  markTimeoutExpired,
  markWarningSent,
  getTimeRemaining,
} from './timeout-config'
import { sendTimeoutWarningNotification } from '../notifications/send-notification'

// ============================================
// TIMEOUT MONITORING
// ============================================

export interface TimeoutCheckResult {
  totalChecked: number
  expiredCount: number
  warningsSent: number
  escalatedToAdmin: number
  errors: string[]
}

/**
 * Check for expired escrows periodically
 * This is the main monitoring function that should be called by a cron job
 */
export async function checkExpiredEscrows(): Promise<TimeoutCheckResult> {
  const result: TimeoutCheckResult = {
    totalChecked: 0,
    expiredCount: 0,
    warningsSent: 0,
    escalatedToAdmin: 0,
    errors: [],
  }

  try {
    const supabase = getSupabase()

    console.log('🔍 Checking for expired escrows...')

    // Get all unresolved timeouts
    const { data: timeouts, error } = await supabase
      .from('escrow_timeouts')
      .select('*, escrow_contracts(*)')
      .eq('resolved', false)
      .order('expires_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch timeouts: ${error.message}`)
    }

    if (!timeouts || timeouts.length === 0) {
      console.log('✅ No active timeouts to check')
      return result
    }

    result.totalChecked = timeouts.length
    console.log(`📋 Checking ${timeouts.length} active timeouts`)

    const now = new Date()

    for (const timeout of timeouts) {
      try {
        const expiresAt = new Date(timeout.expires_at)
        const escrow = timeout.escrow_contracts as any

        // Check if expired
        if (expiresAt <= now && !timeout.expired) {
          console.log(`⏰ Timeout expired: ${timeout.id} (${timeout.timeout_type})`)

          // Mark as expired
          await markTimeoutExpired(timeout.id)
          result.expiredCount++

          // Escalate to admin review
          const escalated = await escalateToAdminReview(
            escrow.id,
            timeout.id,
            timeout.timeout_type
          )

          if (escalated) {
            result.escalatedToAdmin++
          }
        }
        // Check if warning should be sent
        else if (!timeout.warning_sent) {
          const config = getTimeoutConfig(timeout.timeout_type)
          const warningTime = calculateWarningTimestamp(expiresAt, timeout.timeout_type)

          if (warningTime <= now) {
            console.log(`📧 Sending pre-expiration warning: ${timeout.id}`)

            // Send warning notification
            const sent = await sendPreExpirationWarning(
              escrow,
              timeout as EscrowTimeout
            )

            if (sent) {
              await markWarningSent(timeout.id)
              result.warningsSent++
            }
          }
        }
      } catch (error: any) {
        console.error(`Error processing timeout ${timeout.id}:`, error)
        result.errors.push(`Timeout ${timeout.id}: ${error.message}`)
      }
    }

    console.log('\n📊 Timeout Check Summary:')
    console.log(`   Total checked: ${result.totalChecked}`)
    console.log(`   Expired: ${result.expiredCount}`)
    console.log(`   Warnings sent: ${result.warningsSent}`)
    console.log(`   Escalated to admin: ${result.escalatedToAdmin}`)
    console.log(`   Errors: ${result.errors.length}`)

    return result
  } catch (error: any) {
    console.error('Check expired escrows error:', error)
    result.errors.push(error.message)
    return result
  }
}

/**
 * Check timeouts for a specific escrow
 */
export async function checkEscrowTimeouts(escrowId: string): Promise<{
  hasExpired: boolean
  expiredTimeouts: EscrowTimeout[]
  activeTimeouts: EscrowTimeout[]
}> {
  try {
    const supabase = getSupabase()

    const { data: timeouts, error } = await supabase
      .from('escrow_timeouts')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('resolved', false)

    if (error) {
      throw new Error(`Failed to fetch escrow timeouts: ${error.message}`)
    }

    const now = new Date()
    const expiredTimeouts: EscrowTimeout[] = []
    const activeTimeouts: EscrowTimeout[] = []

    for (const timeout of timeouts || []) {
      const expiresAt = new Date(timeout.expires_at)
      if (expiresAt <= now) {
        expiredTimeouts.push(timeout as EscrowTimeout)
      } else {
        activeTimeouts.push(timeout as EscrowTimeout)
      }
    }

    return {
      hasExpired: expiredTimeouts.length > 0,
      expiredTimeouts,
      activeTimeouts,
    }
  } catch (error: any) {
    console.error('Check escrow timeouts error:', error)
    throw error
  }
}

// ============================================
// PRE-EXPIRATION WARNINGS
// ============================================

/**
 * Send pre-expiration notification to relevant parties
 */
export async function sendPreExpirationWarning(
  escrow: EscrowContract,
  timeout: EscrowTimeout
): Promise<boolean> {
  try {
    const remaining = getTimeRemaining(timeout.expires_at)
    const hoursRemaining = remaining.hours

    // Determine recipients based on timeout type and expected action
    const recipients = determineWarningRecipients(escrow, timeout)

    console.log(`📧 Sending warnings to ${recipients.length} recipient(s)`)

    // Send notifications using the notification system
    for (const recipient of recipients) {
      try {
        await sendTimeoutWarningNotification(
          recipient.wallet,
          escrow.id,
          hoursRemaining
        )
      } catch (error) {
        console.error(`Failed to send notification to ${recipient.wallet}:`, error)
      }
    }

    return true
  } catch (error: any) {
    console.error('Send pre-expiration warning error:', error)
    return false
  }
}

/**
 * Determine who should receive warning notifications
 */
function determineWarningRecipients(
  escrow: EscrowContract,
  timeout: EscrowTimeout
): Array<{ wallet: string; message: string }> {
  const recipients: Array<{ wallet: string; message: string }> = []

  switch (timeout.timeout_type) {
    case 'deposit_timeout':
      if (!escrow.buyer_deposited) {
        recipients.push({
          wallet: escrow.buyer_wallet,
          message: `Please deposit ${escrow.buyer_amount} ${escrow.token} to the escrow wallet.`,
        })
      }
      if (escrow.escrow_type !== 'simple_buyer' && !escrow.seller_deposited) {
        recipients.push({
          wallet: escrow.seller_wallet,
          message: `Please deposit ${escrow.seller_amount} ${escrow.token} to the escrow wallet.`,
        })
      }
      break

    case 'confirmation_timeout':
      if (!escrow.buyer_confirmed) {
        recipients.push({
          wallet: escrow.buyer_wallet,
          message: 'Please confirm the transaction to release funds.',
        })
      }
      if (!escrow.seller_confirmed) {
        recipients.push({
          wallet: escrow.seller_wallet,
          message: 'Please confirm the transaction to release funds.',
        })
      }
      break

    case 'milestone_timeout':
      // Milestone-specific warnings handled separately
      if (timeout.expected_from) {
        recipients.push({
          wallet: timeout.expected_from,
          message: timeout.expected_action,
        })
      }
      break

    case 'swap_timeout':
      if (!escrow.buyer_deposited) {
        recipients.push({
          wallet: escrow.buyer_wallet,
          message: `Please deposit ${escrow.buyer_amount} ${escrow.swap_asset_buyer} for the swap.`,
        })
      }
      if (!escrow.seller_deposited) {
        recipients.push({
          wallet: escrow.seller_wallet,
          message: `Please deposit ${escrow.seller_amount} ${escrow.swap_asset_seller} for the swap.`,
        })
      }
      break

    case 'dispute_timeout':
      // Notify both parties that admin will make a decision soon
      recipients.push(
        {
          wallet: escrow.buyer_wallet,
          message: 'The dispute resolution period is ending. Admin will make a decision soon.',
        },
        {
          wallet: escrow.seller_wallet,
          message: 'The dispute resolution period is ending. Admin will make a decision soon.',
        }
      )
      break
  }

  return recipients
}

/**
 * Format warning time in human-readable format
 */
function formatWarningTime(hours: number): string {
  if (hours < 1) {
    return 'less than 1 hour'
  } else if (hours === 1) {
    return '1 hour'
  } else if (hours < 24) {
    return `${hours} hours`
  } else {
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''}`
  }
}

// ============================================
// ADMIN ESCALATION
// ============================================

/**
 * Escalate expired escrow to admin review
 */
export async function escalateToAdminReview(
  escrowId: string,
  timeoutId: string,
  timeoutType: TimeoutType
): Promise<boolean> {
  try {
    const supabase = getSupabase()

    console.log(`🚨 Escalating escrow ${escrowId} to admin review`)

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_contracts')
      .select('*')
      .eq('id', escrowId)
      .single()

    if (escrowError || !escrow) {
      throw new Error('Escrow not found')
    }

    // Check if already disputed or completed
    if (escrow.status === 'disputed' || escrow.status === 'completed') {
      console.log(`   Escrow already ${escrow.status}, skipping escalation`)
      return false
    }

    // Create admin action record
    const adminActionId = nanoid(10)
    const { error: actionError } = await supabase
      .from('escrow_admin_actions')
      .insert({
        id: adminActionId,
        escrow_id: escrowId,
        admin_wallet: 'system',
        action: 'manual_intervention',
        decision: 'Escalated due to timeout',
        notes: `Timeout expired: ${timeoutType}. Requires admin review and decision.`,
        metadata: {
          timeout_id: timeoutId,
          timeout_type: timeoutType,
          escalated_at: new Date().toISOString(),
        },
      })

    if (actionError) {
      console.error('Failed to create admin action:', actionError)
      throw new Error(`Failed to create admin action: ${actionError.message}`)
    }

    // Log escalation action
    await supabase.from('escrow_actions').insert({
      id: nanoid(10),
      escrow_id: escrowId,
      actor_wallet: 'system',
      action_type: 'admin_action',
      notes: `Escalated to admin review due to ${timeoutType} expiration`,
      metadata: {
        timeout_id: timeoutId,
        admin_action_id: adminActionId,
      },
    })

    // Notify admin (in a real system, this would send to admin dashboard/email)
    console.log(`   ✅ Escalated to admin review`)

    return true
  } catch (error: any) {
    console.error('Escalate to admin review error:', error)
    return false
  }
}

/**
 * Get all escrows requiring admin review due to timeout
 */
export async function getEscrowsRequiringAdminReview(): Promise<
  Array<{
    escrow: EscrowContract
    timeout: EscrowTimeout
    adminAction: any
  }>
> {
  try {
    const supabase = getSupabase()

    // Get admin actions for timeout escalations
    const { data: adminActions, error } = await supabase
      .from('escrow_admin_actions')
      .select('*, escrow_contracts(*), escrow_timeouts(*)')
      .eq('action', 'manual_intervention')
      .is('amount_to_buyer', null) // Not yet resolved
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch admin review queue: ${error.message}`)
    }

    return (adminActions || []).map((action: any) => ({
      escrow: action.escrow_contracts,
      timeout: action.escrow_timeouts,
      adminAction: action,
    }))
  } catch (error: any) {
    console.error('Get escrows requiring admin review error:', error)
    throw error
  }
}

// ============================================
// TIMEOUT STATISTICS
// ============================================

/**
 * Get timeout statistics for monitoring
 */
export async function getTimeoutStatistics(): Promise<{
  total: number
  active: number
  expired: number
  resolved: number
  byType: Record<TimeoutType, number>
  avgResolutionTime: number
}> {
  try {
    const supabase = getSupabase()

    const { data: timeouts, error } = await supabase
      .from('escrow_timeouts')
      .select('*')

    if (error) {
      throw new Error(`Failed to fetch timeout statistics: ${error.message}`)
    }

    const stats = {
      total: timeouts?.length || 0,
      active: 0,
      expired: 0,
      resolved: 0,
      byType: {
        deposit_timeout: 0,
        confirmation_timeout: 0,
        milestone_timeout: 0,
        dispute_timeout: 0,
        swap_timeout: 0,
      } as Record<TimeoutType, number>,
      avgResolutionTime: 0,
    }

    let totalResolutionTime = 0
    let resolvedCount = 0

    for (const timeout of timeouts || []) {
      // Count by status
      if (timeout.resolved) {
        stats.resolved++

        // Calculate resolution time
        if (timeout.created_at && timeout.resolved_at) {
          const created = new Date(timeout.created_at).getTime()
          const resolved = new Date(timeout.resolved_at).getTime()
          totalResolutionTime += resolved - created
          resolvedCount++
        }
      } else if (timeout.expired) {
        stats.expired++
      } else {
        stats.active++
      }

      // Count by type
      stats.byType[timeout.timeout_type as TimeoutType]++
    }

    // Calculate average resolution time in hours
    if (resolvedCount > 0) {
      stats.avgResolutionTime = totalResolutionTime / resolvedCount / (1000 * 60 * 60)
    }

    return stats
  } catch (error: any) {
    console.error('Get timeout statistics error:', error)
    throw error
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  checkExpiredEscrows,
  checkEscrowTimeouts,
  sendPreExpirationWarning,
  escalateToAdminReview,
  getEscrowsRequiringAdminReview,
  getTimeoutStatistics,
}
