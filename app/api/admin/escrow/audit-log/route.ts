import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/security'

/**
 * GET /api/admin/escrow/audit-log
 * Get admin audit log with all admin actions
 * Requirements: 14.5
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const escrowId = searchParams.get('escrow_id')
    const disputeId = searchParams.get('dispute_id')
    const adminWallet = searchParams.get('admin_wallet')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('escrow_admin_actions')
      .select(`
        *,
        escrow_contracts (
          id,
          payment_id,
          buyer_wallet,
          seller_wallet,
          total_amount,
          token,
          description,
          status,
          escrow_type
        ),
        escrow_disputes (
          id,
          reason,
          status,
          raised_by,
          party_role
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (escrowId) {
      query = query.eq('escrow_id', escrowId)
    }
    if (disputeId) {
      query = query.eq('dispute_id', disputeId)
    }
    if (adminWallet) {
      query = query.eq('admin_wallet', adminWallet)
    }
    if (action) {
      query = query.eq('action', action)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: auditLog, error: auditError, count } = await query

    if (auditError) {
      console.error('Failed to fetch audit log:', auditError)
      return NextResponse.json(
        { error: 'Failed to fetch audit log' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('escrow_admin_actions')
      .select('action, admin_wallet, decision')

    const actionCounts: Record<string, number> = {}
    const adminActionCounts: Record<string, number> = {}
    const decisionCounts: Record<string, number> = {}

    stats?.forEach((item: any) => {
      actionCounts[item.action] = (actionCounts[item.action] || 0) + 1
      adminActionCounts[item.admin_wallet] = (adminActionCounts[item.admin_wallet] || 0) + 1
      if (item.decision) {
        decisionCounts[item.decision] = (decisionCounts[item.decision] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      audit_log: auditLog || [],
      total: count || 0,
      limit,
      offset,
      stats: {
        total_actions: stats?.length || 0,
        by_action: actionCounts,
        by_admin: adminActionCounts,
        by_decision: decisionCounts,
      },
    })
  } catch (error: any) {
    console.error('Get audit log error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get audit log' },
      { status: 500 }
    )
  }
}
