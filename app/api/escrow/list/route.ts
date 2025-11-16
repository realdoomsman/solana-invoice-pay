import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parsePaginationParams, executePaginatedQuery, validatePaginationParams } from '@/lib/pagination'
import queryCache, { CachePrefix, CacheTTL } from '@/lib/query-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    const statusFilter = searchParams.get('status')
    const typeFilter = searchParams.get('type')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Escrow system not configured' },
        { status: 503 }
      )
    }

    // Parse and validate pagination parameters
    const paginationParams = parsePaginationParams(searchParams)
    const validation = validatePaginationParams(paginationParams)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters', details: validation.errors },
        { status: 400 }
      )
    }

    // Build cache key
    const cacheKey = queryCache['generateKey'](CachePrefix.ESCROW_LIST, {
      wallet: walletAddress,
      status: statusFilter,
      type: typeFilter,
      ...paginationParams,
    })

    // Try to get from cache
    const cached = queryCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build base query
    let baseQuery = supabase
      .from('escrow_contracts')
      .select(`
        id,
        escrow_type,
        payment_id,
        buyer_wallet,
        seller_wallet,
        buyer_amount,
        seller_amount,
        token,
        status,
        description,
        created_at,
        expires_at,
        buyer_deposited,
        seller_deposited,
        buyer_confirmed,
        seller_confirmed
      `)
      .or(`buyer_wallet.eq.${walletAddress},seller_wallet.eq.${walletAddress}`)

    // Apply filters
    if (statusFilter) {
      baseQuery = baseQuery.eq('status', statusFilter)
    }
    if (typeFilter) {
      baseQuery = baseQuery.eq('escrow_type', typeFilter)
    }

    // Execute paginated query
    const result = await executePaginatedQuery(
      baseQuery,
      { ...paginationParams, sortBy: 'created_at', sortOrder: 'desc' }
    )

    const escrows = result.data

    // Get milestone counts for simple_buyer escrows (batch query)
    const simpleBuyerEscrowIds = escrows
      .filter((e: any) => e.escrow_type === 'simple_buyer')
      .map((e: any) => e.id)

    let milestoneData: any[] = []
    if (simpleBuyerEscrowIds.length > 0) {
      const { data: milestones } = await supabase
        .from('escrow_milestones')
        .select('escrow_id, status')
        .in('escrow_id', simpleBuyerEscrowIds)

      // Group by escrow_id
      const milestonesByEscrow = (milestones || []).reduce((acc: any, m: any) => {
        if (!acc[m.escrow_id]) {
          acc[m.escrow_id] = { pending: 0, submitted: 0 }
        }
        if (m.status === 'pending') acc[m.escrow_id].pending++
        if (m.status === 'work_submitted') acc[m.escrow_id].submitted++
        return acc
      }, {})

      milestoneData = Object.entries(milestonesByEscrow).map(([escrow_id, counts]: [string, any]) => ({
        escrow_id,
        pending_milestones: counts.pending,
        submitted_milestones: counts.submitted,
      }))
    }

    // Get unread notification counts (batch query)
    const escrowIds = escrows.map((e: any) => e.id)
    let notificationCounts: any[] = []
    
    if (escrowIds.length > 0) {
      const { data: notifications } = await supabase
        .from('escrow_notifications')
        .select('escrow_id')
        .in('escrow_id', escrowIds)
        .eq('recipient_wallet', walletAddress)
        .eq('read', false)

      // Count by escrow_id
      const countsByEscrow = (notifications || []).reduce((acc: any, n: any) => {
        acc[n.escrow_id] = (acc[n.escrow_id] || 0) + 1
        return acc
      }, {})

      notificationCounts = Object.entries(countsByEscrow).map(([escrow_id, count]) => ({
        escrow_id,
        unread_notifications: count,
      }))
    }

    // Enrich escrows with additional data
    const enrichedEscrows = escrows.map((escrow: any) => {
      const userRole = escrow.buyer_wallet === walletAddress ? 'buyer' : 'seller'
      const milestoneInfo = milestoneData.find((m: any) => m.escrow_id === escrow.id)
      const notificationInfo = notificationCounts.find((n: any) => n.escrow_id === escrow.id)

      return {
        ...escrow,
        user_role: userRole,
        counterparty_wallet: userRole === 'buyer' ? escrow.seller_wallet : escrow.buyer_wallet,
        pending_milestones: milestoneInfo?.pending_milestones || 0,
        submitted_milestones: milestoneInfo?.submitted_milestones || 0,
        unread_notifications: notificationInfo?.unread_notifications || 0,
      }
    })

    const response = {
      success: true,
      escrows: enrichedEscrows,
      pagination: result.pagination,
    }

    // Cache the result
    queryCache.set(cacheKey, response, CacheTTL.SHORT)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in escrow list API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
