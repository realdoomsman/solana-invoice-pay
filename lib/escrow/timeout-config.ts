/**
 * Timeout Configuration System
 * Manages timeout periods and expiration timestamps for all escrow types
 */

import { nanoid } from 'nanoid'
import { getSupabase } from '../supabase'
import type { EscrowType, TimeoutType, EscrowTimeout } from './types'

// ============================================
// DEFAULT TIMEOUT CONFIGURATIONS
// ============================================

/**
 * Default timeout hours per escrow type
 */
export const DEFAULT_TIMEOUTS: Record<EscrowType, number> = {
  traditional: 72, // 3 days for both parties to deposit and confirm
  simple_buyer: 168, // 7 days for milestone work
  atomic_swap: 24, // 1 day for swap deposits
}

/**
 * Timeout type configurations
 */
export const TIMEOUT_CONFIGS: Record<
  TimeoutType,
  {
    defaultHours: number
    warningHoursBefore: number
    description: string
  }
> = {
  deposit_timeout: {
    defaultHours: 72,
    warningHoursBefore: 24,
    description: 'Waiting for deposits from parties',
  },
  confirmation_timeout: {
    defaultHours: 48,
    warningHoursBefore: 12,
    description: 'Waiting for confirmation from parties',
  },
  milestone_timeout: {
    defaultHours: 168, // 7 days
    warningHoursBefore: 48,
    description: 'Waiting for milestone work submission or approval',
  },
  dispute_timeout: {
    defaultHours: 336, // 14 days
    warningHoursBefore: 72,
    description: 'Waiting for dispute resolution',
  },
  swap_timeout: {
    defaultHours: 24,
    warningHoursBefore: 6,
    description: 'Waiting for swap deposits',
  },
}

// ============================================
// TIMEOUT CONFIGURATION
// ============================================

export interface TimeoutConfigInput {
  escrowId: string
  timeoutType: TimeoutType
  customHours?: number
  expectedAction: string
  expectedFrom?: string
}

export interface TimeoutConfigResult {
  success: boolean
  timeout?: EscrowTimeout
  error?: string
}

/**
 * Create a timeout monitor for an escrow
 * Allows custom timeout periods or uses defaults
 */
export async function createTimeoutMonitor(
  input: TimeoutConfigInput
): Promise<TimeoutConfigResult> {
  try {
    const supabase = getSupabase()

    // Get timeout configuration
    const config = TIMEOUT_CONFIGS[input.timeoutType]
    const hours = input.customHours || config.defaultHours

    // Calculate expiration timestamp
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + hours)

    // Create timeout record
    const timeoutData: Partial<EscrowTimeout> = {
      id: nanoid(10),
      escrow_id: input.escrowId,
      timeout_type: input.timeoutType,
      expected_action: input.expectedAction,
      expected_from: input.expectedFrom,
      warning_sent: false,
      expired: false,
      resolved: false,
      expires_at: expiresAt.toISOString(),
    }

    const { data: timeout, error } = await supabase
      .from('escrow_timeouts')
      .insert(timeoutData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create timeout monitor:', error)
      return {
        success: false,
        error: `Failed to create timeout monitor: ${error.message}`,
      }
    }

    console.log(`⏰ Timeout monitor created for ${input.escrowId}`)
    console.log(`   Type: ${input.timeoutType}`)
    console.log(`   Duration: ${hours} hours`)
    console.log(`   Expires: ${expiresAt.toISOString()}`)

    return {
      success: true,
      timeout: timeout as EscrowTimeout,
    }
  } catch (error: any) {
    console.error('Create timeout monitor error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create timeout monitor',
    }
  }
}

/**
 * Get default timeout hours for an escrow type
 */
export function getDefaultTimeout(escrowType: EscrowType): number {
  return DEFAULT_TIMEOUTS[escrowType]
}

/**
 * Get timeout configuration for a specific timeout type
 */
export function getTimeoutConfig(timeoutType: TimeoutType) {
  return TIMEOUT_CONFIGS[timeoutType]
}

/**
 * Calculate expiration timestamp from hours
 */
export function calculateExpirationTimestamp(hours: number): Date {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + hours)
  return expiresAt
}

/**
 * Calculate warning timestamp (when to send pre-expiration warning)
 */
export function calculateWarningTimestamp(
  expiresAt: Date,
  timeoutType: TimeoutType
): Date {
  const config = TIMEOUT_CONFIGS[timeoutType]
  const warningAt = new Date(expiresAt)
  warningAt.setHours(warningAt.getHours() - config.warningHoursBefore)
  return warningAt
}

// ============================================
// TIMEOUT RETRIEVAL
// ============================================

/**
 * Get active timeouts for an escrow
 */
export async function getActiveTimeouts(escrowId: string): Promise<EscrowTimeout[]> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('escrow_timeouts')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('resolved', false)
      .order('expires_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch timeouts: ${error.message}`)
    }

    return (data as EscrowTimeout[]) || []
  } catch (error: any) {
    console.error('Get active timeouts error:', error)
    throw error
  }
}

/**
 * Get timeout by ID
 */
export async function getTimeoutById(timeoutId: string): Promise<EscrowTimeout | null> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('escrow_timeouts')
      .select('*')
      .eq('id', timeoutId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch timeout: ${error.message}`)
    }

    return data as EscrowTimeout
  } catch (error: any) {
    console.error('Get timeout by ID error:', error)
    throw error
  }
}

/**
 * Check if escrow has expired timeouts
 */
export async function hasExpiredTimeouts(escrowId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('escrow_timeouts')
      .select('id')
      .eq('escrow_id', escrowId)
      .eq('resolved', false)
      .lt('expires_at', new Date().toISOString())
      .limit(1)

    if (error) {
      throw new Error(`Failed to check expired timeouts: ${error.message}`)
    }

    return (data?.length || 0) > 0
  } catch (error: any) {
    console.error('Has expired timeouts error:', error)
    throw error
  }
}

// ============================================
// TIMEOUT UPDATES
// ============================================

/**
 * Mark timeout as resolved
 */
export async function resolveTimeout(
  timeoutId: string,
  resolutionAction: string
): Promise<boolean> {
  try {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('escrow_timeouts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_action: resolutionAction,
      })
      .eq('id', timeoutId)

    if (error) {
      throw new Error(`Failed to resolve timeout: ${error.message}`)
    }

    console.log(`✅ Timeout ${timeoutId} resolved: ${resolutionAction}`)
    return true
  } catch (error: any) {
    console.error('Resolve timeout error:', error)
    throw error
  }
}

/**
 * Mark timeout as expired
 */
export async function markTimeoutExpired(timeoutId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('escrow_timeouts')
      .update({
        expired: true,
        expired_at: new Date().toISOString(),
      })
      .eq('id', timeoutId)

    if (error) {
      throw new Error(`Failed to mark timeout expired: ${error.message}`)
    }

    console.log(`⏰ Timeout ${timeoutId} marked as expired`)
    return true
  } catch (error: any) {
    console.error('Mark timeout expired error:', error)
    throw error
  }
}

/**
 * Mark warning as sent
 */
export async function markWarningSent(timeoutId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('escrow_timeouts')
      .update({
        warning_sent: true,
        warning_sent_at: new Date().toISOString(),
      })
      .eq('id', timeoutId)

    if (error) {
      throw new Error(`Failed to mark warning sent: ${error.message}`)
    }

    console.log(`📧 Warning sent for timeout ${timeoutId}`)
    return true
  } catch (error: any) {
    console.error('Mark warning sent error:', error)
    throw error
  }
}

/**
 * Extend timeout (admin action)
 */
export async function extendTimeout(
  timeoutId: string,
  additionalHours: number
): Promise<TimeoutConfigResult> {
  try {
    const supabase = getSupabase()

    // Get current timeout
    const timeout = await getTimeoutById(timeoutId)
    if (!timeout) {
      return {
        success: false,
        error: 'Timeout not found',
      }
    }

    // Calculate new expiration
    const currentExpires = new Date(timeout.expires_at)
    const newExpires = new Date(currentExpires)
    newExpires.setHours(newExpires.getHours() + additionalHours)

    // Update timeout
    const { data, error } = await supabase
      .from('escrow_timeouts')
      .update({
        expires_at: newExpires.toISOString(),
        warning_sent: false, // Reset warning flag
      })
      .eq('id', timeoutId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: `Failed to extend timeout: ${error.message}`,
      }
    }

    console.log(`⏰ Timeout ${timeoutId} extended by ${additionalHours} hours`)
    console.log(`   New expiration: ${newExpires.toISOString()}`)

    return {
      success: true,
      timeout: data as EscrowTimeout,
    }
  } catch (error: any) {
    console.error('Extend timeout error:', error)
    return {
      success: false,
      error: error.message || 'Failed to extend timeout',
    }
  }
}

// ============================================
// TIMEOUT VALIDATION
// ============================================

/**
 * Validate timeout hours
 */
export function validateTimeoutHours(hours: number): {
  valid: boolean
  error?: string
} {
  if (hours <= 0) {
    return {
      valid: false,
      error: 'Timeout hours must be greater than 0',
    }
  }

  if (hours > 8760) {
    // 1 year
    return {
      valid: false,
      error: 'Timeout hours cannot exceed 1 year (8760 hours)',
    }
  }

  return { valid: true }
}

/**
 * Get time remaining until timeout
 */
export function getTimeRemaining(expiresAt: string | Date): {
  milliseconds: number
  seconds: number
  minutes: number
  hours: number
  days: number
  expired: boolean
} {
  const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const now = new Date()
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) {
    return {
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      expired: true,
    }
  }

  return {
    milliseconds: diff,
    seconds: Math.floor(diff / 1000),
    minutes: Math.floor(diff / (1000 * 60)),
    hours: Math.floor(diff / (1000 * 60 * 60)),
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    expired: false,
  }
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(expiresAt: string | Date): string {
  const remaining = getTimeRemaining(expiresAt)

  if (remaining.expired) {
    return 'Expired'
  }

  if (remaining.days > 0) {
    return `${remaining.days} day${remaining.days !== 1 ? 's' : ''}`
  }

  if (remaining.hours > 0) {
    return `${remaining.hours} hour${remaining.hours !== 1 ? 's' : ''}`
  }

  if (remaining.minutes > 0) {
    return `${remaining.minutes} minute${remaining.minutes !== 1 ? 's' : ''}`
  }

  return 'Less than 1 minute'
}

// ============================================
// EXPORTS
// ============================================

export default {
  DEFAULT_TIMEOUTS,
  TIMEOUT_CONFIGS,
  createTimeoutMonitor,
  getDefaultTimeout,
  getTimeoutConfig,
  calculateExpirationTimestamp,
  calculateWarningTimestamp,
  getActiveTimeouts,
  getTimeoutById,
  hasExpiredTimeouts,
  resolveTimeout,
  markTimeoutExpired,
  markWarningSent,
  extendTimeout,
  validateTimeoutHours,
  getTimeRemaining,
  formatTimeRemaining,
}
