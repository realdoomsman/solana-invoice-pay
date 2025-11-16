import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/security'
import queryCache, { CachePrefix, CacheTTL } from '@/lib/query-cache'

/**
 * GET /api/admin/escrow/overview
 * Get admin overview statistics
 * Requirements: 14.6
 * 
 * Returns:
 * - Total escrow volume (sum of all escrow amounts)
 * - Dispute rate (percentage of escrows with disputes)
 * - Average resolution time (for resolved disputes)
 * - Active escrows count (escrows in progress)
 * - Additional metrics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured. Please set up Supabase.' },
        { status: 503 }
      )
    }

    // Admin access control check
    const accessResult = await verifyAdminAccess(request)
    
    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.error },
        { 
          status: accessResult.statusCode || 403,
          headers: accessResult.headers 
        }
      )
    }

    // Try to get from cache
    const cacheKey = queryCache['generateKey'](CachePrefix.ADMIN_STATS, {})
    const cached = queryCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get all escrows for volume and count calculations
    const { data: allEscrows, error: escrowsError } = await supabase
      .from('escrow_contracts')
      .select('id, buyer_amount, seller_amount, token, status, escrow_type, created_at, funded_at, completed_at')

    if (escrowsError) {
      console.error('Failed to fetch escrows:', escrowsError)
      return NextResponse.json(
        { error: 'Failed to fetch escrow data' },
        { status: 500 }
      )
    }

    const escrows = allEscrows || []

    // Calculate total escrow volume
    const volumeByToken: Record<string, number> = {}
    let totalVolumeSOL = 0

    escrows.forEach((escrow: any) => {
      const amount = parseFloat(escrow.buyer_amount || 0)
      const token = escrow.token || 'SOL'
      
      volumeByToken[token] = (volumeByToken[token] || 0) + amount
      
      // For simplicity, count SOL volume (in production, convert all to USD)
      if (token === 'SOL') {
        totalVolumeSOL += amount
      }
    })

    // Count active escrows (not completed, cancelled, or refunded)
    const activeStatuses = ['created', 'buyer_deposited', 'seller_deposited', 'fully_funded', 'active', 'disputed']
    const activeEscrows = escrows.filter((e: any) => activeStatuses.includes(e.status))

    // Get all disputes for dispute rate and resolution time
    const { data: allDisputes, error: disputesError } = await supabase
      .from('escrow_disputes')
      .select('id, escrow_id, status, created_at, resolved_at')

    if (disputesError) {
      console.error('Failed to fetch disputes:', disputesError)
      return NextResponse.json(
        { error: 'Failed to fetch dispute data' },
        { status: 500 }
      )
    }

    const disputes = allDisputes || []

    // Calculate dispute rate
    const escrowsWithDisputes = new Set(disputes.map((d: any) => d.escrow_id))
    const disputeRate = escrows.length > 0 
      ? (escrowsWithDisputes.size / escrows.length) * 100 
      : 0

    // Calculate average resolution time for resolved disputes
    const resolvedDisputes = disputes.filter((d: any) => 
      d.status === 'resolved' && d.created_at && d.resolved_at
    )

    let avgResolutionTimeHours = 0
    if (resolvedDisputes.length > 0) {
      const totalResolutionTime = resolvedDisputes.reduce((sum: number, d: any) => {
        const created = new Date(d.created_at).getTime()
        const resolved = new Date(d.resolved_at).getTime()
        return sum + (resolved - created)
      }, 0)
      
      avgResolutionTimeHours = totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60)
    }

    // Count disputes by status
    const disputesByStatus = {
      open: disputes.filter((d: any) => d.status === 'open').length,
      under_review: disputes.filter((d: any) => d.status === 'under_review').length,
      resolved: disputes.filter((d: any) => d.status === 'resolved').length,
      closed: disputes.filter((d: any) => d.status === 'closed').length,
    }

    // Count escrows by type
    const escrowsByType = {
      traditional: escrows.filter((e: any) => e.escrow_type === 'traditional').length,
      simple_buyer: escrows.filter((e: any) => e.escrow_type === 'simple_buyer').length,
      atomic_swap: escrows.filter((e: any) => e.escrow_type === 'atomic_swap').length,
    }

    // Count escrows by status
    const escrowsByStatus = {
      created: escrows.filter((e: any) => e.status === 'created').length,
      active: escrows.filter((e: any) => ['buyer_deposited', 'seller_deposited', 'fully_funded', 'active'].includes(e.status)).length,
      disputed: escrows.filter((e: any) => e.status === 'disputed').length,
      completed: escrows.filter((e: any) => e.status === 'completed').length,
      cancelled: escrows.filter((e: any) => e.status === 'cancelled').length,
      refunded: escrows.filter((e: any) => e.status === 'refunded').length,
    }

    // Calculate completion rate
    const completedEscrows = escrows.filter((e: any) => e.status === 'completed')
    const completionRate = escrows.length > 0 
      ? (completedEscrows.length / escrows.length) * 100 
      : 0

    // Calculate average escrow duration for completed escrows
    let avgDurationHours = 0
    const completedWithDates = completedEscrows.filter((e: any) => e.created_at && e.completed_at)
    
    if (completedWithDates.length > 0) {
      const totalDuration = completedWithDates.reduce((sum: number, e: any) => {
        const created = new Date(e.created_at).getTime()
        const completed = new Date(e.completed_at).getTime()
        return sum + (completed - created)
      }, 0)
      
      avgDurationHours = totalDuration / completedWithDates.length / (1000 * 60 * 60)
    }

    const response = {
      success: true,
      overview: {
        // Primary metrics (as per requirements)
        total_escrow_volume: totalVolumeSOL,
        volume_by_token: volumeByToken,
        dispute_rate: parseFloat(disputeRate.toFixed(2)),
        avg_resolution_time_hours: parseFloat(avgResolutionTimeHours.toFixed(2)),
        active_escrows_count: activeEscrows.length,
        
        // Additional useful metrics
        total_escrows: escrows.length,
        total_disputes: disputes.length,
        completion_rate: parseFloat(completionRate.toFixed(2)),
        avg_escrow_duration_hours: parseFloat(avgDurationHours.toFixed(2)),
        
        // Breakdowns
        escrows_by_type: escrowsByType,
        escrows_by_status: escrowsByStatus,
        disputes_by_status: disputesByStatus,
        
        // Recent activity (last 7 days)
        recent_activity: {
          new_escrows_7d: escrows.filter((e: any) => {
            const created = new Date(e.created_at)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return created >= sevenDaysAgo
          }).length,
          new_disputes_7d: disputes.filter((d: any) => {
            const created = new Date(d.created_at)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return created >= sevenDaysAgo
          }).length,
          completed_escrows_7d: completedEscrows.filter((e: any) => {
            const completed = new Date(e.completed_at)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return completed >= sevenDaysAgo
          }).length,
        },
      },
    }

    // Cache the result for 5 minutes
    queryCache.set(cacheKey, response, CacheTTL.MEDIUM)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Get overview error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get overview statistics' },
      { status: 500 }
    )
  }
}
