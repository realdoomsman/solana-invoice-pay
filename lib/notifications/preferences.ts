// Notification preferences management

import { createClient } from '@supabase/supabase-js'
import { 
  NotificationPreferences, 
  NotificationPreferencesUpdate,
  DEFAULT_NOTIFICATION_PREFERENCES 
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Convert database row to NotificationPreferences
function dbToPreferences(row: any): NotificationPreferences {
  return {
    id: row.id,
    userWallet: row.user_wallet,
    
    inAppEnabled: row.in_app_enabled,
    inAppDeposits: row.in_app_deposits,
    inAppWorkSubmissions: row.in_app_work_submissions,
    inAppApprovals: row.in_app_approvals,
    inAppDisputes: row.in_app_disputes,
    inAppTimeouts: row.in_app_timeouts,
    inAppReleases: row.in_app_releases,
    inAppRefunds: row.in_app_refunds,
    
    browserEnabled: row.browser_enabled,
    browserDeposits: row.browser_deposits,
    browserWorkSubmissions: row.browser_work_submissions,
    browserApprovals: row.browser_approvals,
    browserDisputes: row.browser_disputes,
    browserTimeouts: row.browser_timeouts,
    browserReleases: row.browser_releases,
    browserRefunds: row.browser_refunds,
    
    emailEnabled: row.email_enabled,
    emailAddress: row.email_address,
    emailDeposits: row.email_deposits,
    emailWorkSubmissions: row.email_work_submissions,
    emailApprovals: row.email_approvals,
    emailDisputes: row.email_disputes,
    emailTimeouts: row.email_timeouts,
    emailReleases: row.email_releases,
    emailRefunds: row.email_refunds,
    
    notificationFrequency: row.notification_frequency,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Convert NotificationPreferencesUpdate to database format
function preferencesToDb(prefs: NotificationPreferencesUpdate): any {
  const dbPrefs: any = {}
  
  if (prefs.inAppEnabled !== undefined) dbPrefs.in_app_enabled = prefs.inAppEnabled
  if (prefs.inAppDeposits !== undefined) dbPrefs.in_app_deposits = prefs.inAppDeposits
  if (prefs.inAppWorkSubmissions !== undefined) dbPrefs.in_app_work_submissions = prefs.inAppWorkSubmissions
  if (prefs.inAppApprovals !== undefined) dbPrefs.in_app_approvals = prefs.inAppApprovals
  if (prefs.inAppDisputes !== undefined) dbPrefs.in_app_disputes = prefs.inAppDisputes
  if (prefs.inAppTimeouts !== undefined) dbPrefs.in_app_timeouts = prefs.inAppTimeouts
  if (prefs.inAppReleases !== undefined) dbPrefs.in_app_releases = prefs.inAppReleases
  if (prefs.inAppRefunds !== undefined) dbPrefs.in_app_refunds = prefs.inAppRefunds
  
  if (prefs.browserEnabled !== undefined) dbPrefs.browser_enabled = prefs.browserEnabled
  if (prefs.browserDeposits !== undefined) dbPrefs.browser_deposits = prefs.browserDeposits
  if (prefs.browserWorkSubmissions !== undefined) dbPrefs.browser_work_submissions = prefs.browserWorkSubmissions
  if (prefs.browserApprovals !== undefined) dbPrefs.browser_approvals = prefs.browserApprovals
  if (prefs.browserDisputes !== undefined) dbPrefs.browser_disputes = prefs.browserDisputes
  if (prefs.browserTimeouts !== undefined) dbPrefs.browser_timeouts = prefs.browserTimeouts
  if (prefs.browserReleases !== undefined) dbPrefs.browser_releases = prefs.browserReleases
  if (prefs.browserRefunds !== undefined) dbPrefs.browser_refunds = prefs.browserRefunds
  
  if (prefs.emailEnabled !== undefined) dbPrefs.email_enabled = prefs.emailEnabled
  if (prefs.emailAddress !== undefined) dbPrefs.email_address = prefs.emailAddress
  if (prefs.emailDeposits !== undefined) dbPrefs.email_deposits = prefs.emailDeposits
  if (prefs.emailWorkSubmissions !== undefined) dbPrefs.email_work_submissions = prefs.emailWorkSubmissions
  if (prefs.emailApprovals !== undefined) dbPrefs.email_approvals = prefs.emailApprovals
  if (prefs.emailDisputes !== undefined) dbPrefs.email_disputes = prefs.emailDisputes
  if (prefs.emailTimeouts !== undefined) dbPrefs.email_timeouts = prefs.emailTimeouts
  if (prefs.emailReleases !== undefined) dbPrefs.email_releases = prefs.emailReleases
  if (prefs.emailRefunds !== undefined) dbPrefs.email_refunds = prefs.emailRefunds
  
  if (prefs.notificationFrequency !== undefined) dbPrefs.notification_frequency = prefs.notificationFrequency
  if (prefs.quietHoursEnabled !== undefined) dbPrefs.quiet_hours_enabled = prefs.quietHoursEnabled
  if (prefs.quietHoursStart !== undefined) dbPrefs.quiet_hours_start = prefs.quietHoursStart
  if (prefs.quietHoursEnd !== undefined) dbPrefs.quiet_hours_end = prefs.quietHoursEnd
  
  return dbPrefs
}

/**
 * Get notification preferences for a user
 * Creates default preferences if none exist
 */
export async function getNotificationPreferences(
  userWallet: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_wallet', userWallet)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get notification preferences: ${error.message}`)
  }
  
  // If no preferences exist, create default ones
  if (!data) {
    return await createDefaultPreferences(userWallet)
  }
  
  return dbToPreferences(data)
}

/**
 * Create default notification preferences for a new user
 */
export async function createDefaultPreferences(
  userWallet: string
): Promise<NotificationPreferences> {
  const defaultPrefs = {
    user_wallet: userWallet,
    ...preferencesToDb(DEFAULT_NOTIFICATION_PREFERENCES as NotificationPreferencesUpdate)
  }
  
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .insert(defaultPrefs)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create default preferences: ${error.message}`)
  }
  
  return dbToPreferences(data)
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userWallet: string,
  updates: NotificationPreferencesUpdate
): Promise<NotificationPreferences> {
  const dbUpdates = preferencesToDb(updates)
  
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .update(dbUpdates)
    .eq('user_wallet', userWallet)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update notification preferences: ${error.message}`)
  }
  
  return dbToPreferences(data)
}

/**
 * Check if a specific notification type should be sent to a user
 */
export async function shouldSendNotification(
  userWallet: string,
  notificationType: string,
  channel: 'in_app' | 'browser' | 'email'
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userWallet)
  
  // Check if channel is enabled
  if (channel === 'in_app' && !prefs.inAppEnabled) return false
  if (channel === 'browser' && !prefs.browserEnabled) return false
  if (channel === 'email' && !prefs.emailEnabled) return false
  
  // Check if specific notification type is enabled for this channel
  const typeKey = `${channel === 'in_app' ? 'inApp' : channel === 'browser' ? 'browser' : 'email'}${
    notificationType.charAt(0).toUpperCase() + 
    notificationType.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }` as keyof NotificationPreferences
  
  return prefs[typeKey] === true
}

/**
 * Check if we're in quiet hours for a user
 */
export function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false
  }
  
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number)
  const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime
  }
  
  return currentTime >= startTime && currentTime <= endTime
}
