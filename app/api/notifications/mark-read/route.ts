// API endpoint to mark notifications as read

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, userWallet, markAllRead } = body
    
    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    
    if (markAllRead) {
      // Mark all notifications as read for this user
      const { error } = await supabase
        .from('notification_queue')
        .update({ read_at: new Date().toISOString() })
        .eq('user_wallet', userWallet)
        .is('read_at', null)
      
      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ success: true, markedAll: true })
    }
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      )
    }
    
    // Mark specific notifications as read
    const { error } = await supabase
      .from('notification_queue')
      .update({ read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('user_wallet', userWallet)
    
    if (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, count: notificationIds.length })
  } catch (error) {
    console.error('Error in mark-read API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
