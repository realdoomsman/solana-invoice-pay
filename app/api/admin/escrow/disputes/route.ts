import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parsePaginationParams, executePaginatedQuery, validatePaginationParams } from '@/lib/pagination'
import queryCache, { CachePrefix, CacheTTL } from '@/lib/query-cache'

/**
 * GET /api/admin/escrow/disputes
 * Get all disputed escrows for admin review
 * Requirements: 6.5
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by dispute status
    const priority = searchParams.get('priority') // Filter by priority
    const escrowType = searchParams.get('escrowType') // Filter by escrow type

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
    const cacheKey = queryCache['generateKey'](CachePrefix.DISPUTE_LIST, {
      status,
      priority,
      escrowType,
      ...paginationParams,
    })

    // Try to get from cache
    const cached = queryCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build base query
    let baseQuery = supabase
      .from('escrow_disputes')
      .select(`
        *,
        escrow_contracts (
          id,
          escrow_type,
          payment_id,
          buyer_wallet,
          seller_wallet,
          buyer_amount,
          seller_amount,
          token,
          description,
          status,
          created_at,
          expires_at
        )
      `)

    // Apply filters
    if (status) {
      baseQuery = baseQuery.eq('status', status)
    } else {
      // Default to open and under_review disputes
      baseQuery = baseQuery.in('status', ['open', 'under_review'])
    }

    if (priority) {
      baseQuery = baseQuery.eq('priority', priority)
    }

    // Execute paginated query with custom sorting
    const result = await executePaginatedQuery(
      baseQuery,
      { 
        ...paginationParams, 
        sortBy: 'created_at', 
        sortOrder: 'asc' // Oldest disputes first for admin queue
      }
    )

    const disputes = result.data || []

    // Get evidence counts in batch
    const disputeIds = disputes.map((d: any) => d.id)
    let evidenceCounts: any = {}

    if (disputeIds.length > 0) {
      const { data: evidence } = await supabase
        .from('escrow_evidence')
        .select('dispute_id, party_role')
        .in('dispute_id', disputeIds)

      // Count evidence by dispute and party
      evidenceCounts = (evidence || []).reduce((acc: any, e: any) => {
        if (!acc[e.dispute_id]) {
          acc[e.dispute_id] = { total: 0, buyer: 0, seller: 0 }
        }
        acc[e.dispute_id].total++
        if (e.party_role === 'buyer') acc[e.dispute_id].buyer++
        if (e.party_role === 'seller') acc[e.dispute_id].seller++
        return acc
      }, {})
    }

    // Get recent actions in batch
    const escrowIds = disputes.map((d: any) => d.escrow_id)
    let recentActionsByEscrow: any = {}

    if (escrowIds.length > 0) {
      const { data: actions } = await supabase
        .from('escrow_actions')
        .select('*')
        .in('escrow_id', escrowIds)
        .order('created_at', { ascending: false })
        .limit(escrowIds.length * 5) // Get up to 5 per escrow

      // Group by escrow_id
      recentActionsByEscrow = (actions || []).reduce((acc: any, action: any) => {
        if (!acc[action.escrow_id]) {
          acc[action.escrow_id] = []
        }
        if (acc[action.escrow_id].length < 5) {
          acc[action.escrow_id].push(action)
        }
        return acc
      }, {})
    }

    // Enrich disputes with evidence and action data
    const enrichedDisputes = disputes.map((dispute: any) => {
      const evidence = evidenceCounts[dispute.id] || { total: 0, buyer: 0, seller: 0 }
      
      return {
        ...dispute,
        evidence_count: evidence.total,
        buyer_evidence_count: evidence.buyer,
        seller_evidence_count: evidence.seller,
        recent_actions: recentActionsByEscrow[dispute.escrow_id] || [],
      }
    })

    // Apply escrow type filter if specified
    let filteredDisputes = enrichedDisputes
    if (escrowType) {
      filteredDisputes = enrichedDisputes.filter(
        (d: any) => d.escrow_contracts?.escrow_type === escrowType
      )
    }

    // Calculate statistics
    const stats = {
      total: filteredDisputes.length,
      by_priority: {
        urgent: filteredDisputes.filter((d: any) => d.priority === 'urgent').length,
        high: filteredDisputes.filter((d: any) => d.priority === 'high').length,
        normal: filteredDisputes.filter((d: any) => d.priority === 'normal').length,
        low: filteredDisputes.filter((d: any) => d.priority === 'low').length,
      },
      by_status: {
        open: filteredDisputes.filter((d: any) => d.status === 'open').length,
        under_review: filteredDisputes.filter((d: any) => d.status === 'under_review').length,
      },
      by_escrow_type: {
        traditional: filteredDisputes.filter((d: any) => d.escrow_contracts?.escrow_type === 'traditional').length,
        simple_buyer: filteredDisputes.filter((d: any) => d.escrow_contracts?.escrow_type === 'simple_buyer').length,
        atomic_swap: filteredDisputes.filter((d: any) => d.escrow_contracts?.escrow_type === 'atomic_swap').length,
      },
    }

    const response = {
      success: true,
      disputes: filteredDisputes,
      stats,
      pagination: result.pagination,
    }

    // Cache the result
    queryCache.set(cacheKey, response, CacheTTL.SHORT)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Get disputes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get disputes' },
      { status: 500 }
    )
  }
}
