// API endpoint to fetch user notifications

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userWallet = searchParams.get('wallet')
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    
    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    
    // Build query
    let query = supabase
      .from('notification_queue')
      .select('*')
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Filter for unread only if requested
    if (unreadOnly) {
      query = query.is('read_at', null)
    }
    
    const { data: notifications, error } = await query
    
    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_wallet', userWallet)
      .is('read_at', null)
    
    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    })
  } catch (error) {
    console.error('Error in notifications list API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
