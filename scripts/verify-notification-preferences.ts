#!/usr/bin/env ts-node

/**
 * Verification script for notification preferences system
 * Tests the notification preferences API and functionality
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_WALLET = 'TEST_WALLET_' + Date.now()

async function verifyNotificationPreferences() {
  console.log('🔍 Verifying Notification Preferences System\n')

  let allPassed = true

  // Test 1: Check if tables exist
  console.log('Test 1: Checking database tables...')
  try {
    const { error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('count')
      .limit(1)

    const { error: queueError } = await supabase
      .from('notification_queue')
      .select('count')
      .limit(1)

    if (prefsError) {
      console.error('❌ user_notification_preferences table not found')
      console.error('   Run: supabase-notification-preferences-schema.sql')
      allPassed = false
    } else {
      console.log('✅ user_notification_preferences table exists')
    }

    if (queueError) {
      console.error('❌ notification_queue table not found')
      console.error('   Run: supabase-notification-preferences-schema.sql')
      allPassed = false
    } else {
      console.log('✅ notification_queue table exists')
    }
  } catch (error: any) {
    console.error('❌ Database connection error:', error.message)
    allPassed = false
  }

  // Test 2: Create default preferences
  console.log('\nTest 2: Creating default preferences...')
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .insert({
        user_wallet: TEST_WALLET,
        in_app_enabled: true,
        browser_enabled: false,
        email_enabled: false,
        notification_frequency: 'immediate'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create preferences:', error.message)
      allPassed = false
    } else {
      console.log('✅ Default preferences created')
      console.log('   Wallet:', data.user_wallet)
      console.log('   In-app enabled:', data.in_app_enabled)
      console.log('   Browser enabled:', data.browser_enabled)
    }
  } catch (error: any) {
    console.error('❌ Error creating preferences:', error.message)
    allPassed = false
  }

  // Test 3: Read preferences
  console.log('\nTest 3: Reading preferences...')
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_wallet', TEST_WALLET)
      .single()

    if (error) {
      console.error('❌ Failed to read preferences:', error.message)
      allPassed = false
    } else {
      console.log('✅ Preferences retrieved')
      console.log('   In-app deposits:', data.in_app_deposits)
      console.log('   Browser disputes:', data.browser_disputes)
      console.log('   Email timeouts:', data.email_timeouts)
    }
  } catch (error: any) {
    console.error('❌ Error reading preferences:', error.message)
    allPassed = false
  }

  // Test 4: Update preferences
  console.log('\nTest 4: Updating preferences...')
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .update({
        browser_enabled: true,
        browser_deposits: true,
        notification_frequency: 'hourly',
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      })
      .eq('user_wallet', TEST_WALLET)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to update preferences:', error.message)
      allPassed = false
    } else {
      console.log('✅ Preferences updated')
      console.log('   Browser enabled:', data.browser_enabled)
      console.log('   Frequency:', data.notification_frequency)
      console.log('   Quiet hours:', data.quiet_hours_enabled)
      console.log('   Quiet hours range:', `${data.quiet_hours_start} - ${data.quiet_hours_end}`)
    }
  } catch (error: any) {
    console.error('❌ Error updating preferences:', error.message)
    allPassed = false
  }

  // Test 5: Create notification in queue
  console.log('\nTest 5: Creating notification in queue...')
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        user_wallet: TEST_WALLET,
        notification_type: 'deposit',
        title: 'Test Deposit Notification',
        message: 'A test deposit has been made',
        link: '/escrow/test-123',
        in_app_delivered: false,
        browser_delivered: false,
        email_delivered: false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create notification:', error.message)
      allPassed = false
    } else {
      console.log('✅ Notification created')
      console.log('   Type:', data.notification_type)
      console.log('   Title:', data.title)
      console.log('   Delivered:', data.in_app_delivered)
    }
  } catch (error: any) {
    console.error('❌ Error creating notification:', error.message)
    allPassed = false
  }

  // Test 6: Query unread notifications
  console.log('\nTest 6: Querying unread notifications...')
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_wallet', TEST_WALLET)
      .is('read_at', null)

    if (error) {
      console.error('❌ Failed to query notifications:', error.message)
      allPassed = false
    } else {
      console.log('✅ Unread notifications retrieved')
      console.log('   Count:', data.length)
    }
  } catch (error: any) {
    console.error('❌ Error querying notifications:', error.message)
    allPassed = false
  }

  // Test 7: Test helper function (if exists)
  console.log('\nTest 7: Testing helper function...')
  try {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { wallet_param: TEST_WALLET })

    if (error) {
      console.log('⚠️  Helper function not available (optional)')
    } else {
      console.log('✅ Helper function works')
      console.log('   Unread count:', data)
    }
  } catch (error: any) {
    console.log('⚠️  Helper function test skipped')
  }

  // Cleanup
  console.log('\nCleaning up test data...')
  try {
    await supabase
      .from('notification_queue')
      .delete()
      .eq('user_wallet', TEST_WALLET)

    await supabase
      .from('user_notification_preferences')
      .delete()
      .eq('user_wallet', TEST_WALLET)

    console.log('✅ Test data cleaned up')
  } catch (error: any) {
    console.log('⚠️  Cleanup warning:', error.message)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('✅ All tests passed!')
    console.log('\nNotification preferences system is working correctly.')
    console.log('\nNext steps:')
    console.log('1. Access preferences at: /settings/notifications')
    console.log('2. Test the UI with a connected wallet')
    console.log('3. Integrate with notification delivery system')
  } else {
    console.log('❌ Some tests failed')
    console.log('\nPlease check the errors above and:')
    console.log('1. Ensure database schema is applied')
    console.log('2. Check Supabase connection')
    console.log('3. Verify table permissions')
  }
  console.log('='.repeat(50))

  process.exit(allPassed ? 0 : 1)
}

// Run verification
verifyNotificationPreferences().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
