import { NextRequest, NextResponse } from 'next/server'
import { 
  getNotificationPreferences, 
  updateNotificationPreferences 
} from '@/lib/notifications/preferences'
import { NotificationPreferencesUpdate } from '@/lib/notifications/types'

// GET /api/notifications/preferences?wallet=<wallet>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    const preferences = await getNotificationPreferences(wallet)
    
    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('Error getting notification preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet, updates } = body as { 
      wallet: string
      updates: NotificationPreferencesUpdate 
    }
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      )
    }
    
    // Validate email if email notifications are being enabled
    if (updates.emailEnabled && !updates.emailAddress) {
      return NextResponse.json(
        { error: 'Email address is required when enabling email notifications' },
        { status: 400 }
      )
    }
    
    // Validate quiet hours
    if (updates.quietHoursEnabled && (!updates.quietHoursStart || !updates.quietHoursEnd)) {
      return NextResponse.json(
        { error: 'Quiet hours start and end times are required when enabling quiet hours' },
        { status: 400 }
      )
    }
    
    const preferences = await updateNotificationPreferences(wallet, updates)
    
    return NextResponse.json({ 
      preferences,
      message: 'Notification preferences updated successfully' 
    })
  } catch (error: any) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
