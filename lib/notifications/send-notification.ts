// Unified notification sending utility

import { NotificationType } from './types'
import { shouldSendNotification, getNotificationPreferences, isInQuietHours } from './preferences'
import { sendEscrowNotification } from './browser-notifications'
import { getSupabase } from '@/lib/supabase'

export interface SendNotificationParams {
  userWallet: string
  escrowId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, any>
}

/**
 * Store in-app notification in database
 */
async function storeInAppNotification(params: SendNotificationParams): Promise<boolean> {
  try {
    const { userWallet, escrowId, type, title, message, metadata } = params
    const supabase = getSupabase()
    
    const { error } = await supabase
      .from('notification_queue')
      .insert({
        user_wallet: userWallet,
        escrow_id: escrowId,
        notification_type: type,
        title,
        message,
        link: `/escrow/${escrowId}`,
        metadata,
        in_app_delivered: true,
        browser_delivered: false,
        email_delivered: false,
      })
    
    if (error) {
      console.error('Error storing in-app notification:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in storeInAppNotification:', error)
    return false
  }
}

/**
 * Send a notification through all enabled channels
 * Respects user preferences and quiet hours
 */
export async function sendNotification(params: SendNotificationParams): Promise<{
  inApp: boolean
  browser: boolean
  email: boolean
}> {
  const { userWallet, escrowId, type, title, message, metadata } = params
  
  const result = {
    inApp: false,
    browser: false,
    email: false,
  }

  try {
    // Get user preferences
    const preferences = await getNotificationPreferences(userWallet)
    
    // Check quiet hours
    const inQuietHours = isInQuietHours(preferences)
    
    // Send in-app notification (always store in database if enabled)
    if (await shouldSendNotification(userWallet, type, 'in_app')) {
      result.inApp = await storeInAppNotification(params)
    }
    
    // Send browser notification (respect quiet hours)
    if (!inQuietHours && await shouldSendNotification(userWallet, type, 'browser')) {
      try {
        const notification = await sendEscrowNotification(type, escrowId, message, metadata)
        result.browser = notification !== null
      } catch (error) {
        console.error('Error sending browser notification:', error)
      }
    }
    
    // Send email notification (respect quiet hours)
    if (!inQuietHours && await shouldSendNotification(userWallet, type, 'email')) {
      // Email notifications would be implemented separately
      // This is a placeholder for future email integration
      result.email = false
    }
    
    return result
  } catch (error) {
    console.error('Error sending notification:', error)
    return result
  }
}

/**
 * Send notification to multiple users
 */
export async function sendNotificationToMultiple(
  userWallets: string[],
  params: Omit<SendNotificationParams, 'userWallet'>
): Promise<void> {
  await Promise.all(
    userWallets.map(userWallet =>
      sendNotification({ ...params, userWallet })
    )
  )
}

/**
 * Send deposit notification to both parties
 */
export async function sendDepositNotification(
  buyerWallet: string,
  sellerWallet: string,
  escrowId: string,
  depositor: 'buyer' | 'seller',
  amount: number,
  token: string
): Promise<void> {
  const message = `${depositor === 'buyer' ? 'Buyer' : 'Seller'} deposited ${amount} ${token}`
  
  await sendNotificationToMultiple(
    [buyerWallet, sellerWallet],
    {
      escrowId,
      type: 'deposit',
      title: 'Deposit Received',
      message,
      metadata: { depositor, amount, token }
    }
  )
}

/**
 * Send work submission notification
 */
export async function sendWorkSubmissionNotification(
  buyerWallet: string,
  escrowId: string,
  milestoneId: string,
  milestoneDescription: string
): Promise<void> {
  await sendNotification({
    userWallet: buyerWallet,
    escrowId,
    type: 'work_submission',
    title: 'Work Submitted',
    message: `Seller has submitted work for: ${milestoneDescription}`,
    metadata: { milestoneId }
  })
}

/**
 * Send approval notification
 */
export async function sendApprovalNotification(
  sellerWallet: string,
  escrowId: string,
  milestoneId: string,
  milestoneDescription: string,
  amount: number,
  token: string
): Promise<void> {
  await sendNotification({
    userWallet: sellerWallet,
    escrowId,
    type: 'approval',
    title: 'Milestone Approved',
    message: `Buyer approved milestone: ${milestoneDescription}. ${amount} ${token} released.`,
    metadata: { milestoneId, amount, token }
  })
}

/**
 * Send dispute notification
 */
export async function sendDisputeNotification(
  notifyWallet: string,
  escrowId: string,
  raisedBy: 'buyer' | 'seller',
  reason: string
): Promise<void> {
  await sendNotification({
    userWallet: notifyWallet,
    escrowId,
    type: 'dispute',
    title: 'Dispute Raised',
    message: `${raisedBy === 'buyer' ? 'Buyer' : 'Seller'} raised a dispute: ${reason}`,
    metadata: { raisedBy, reason }
  })
}

/**
 * Send timeout warning notification
 */
export async function sendTimeoutWarningNotification(
  userWallet: string,
  escrowId: string,
  hoursRemaining: number
): Promise<void> {
  await sendNotification({
    userWallet,
    escrowId,
    type: 'timeout',
    title: 'Timeout Warning',
    message: `Escrow will timeout in ${hoursRemaining} hours. Please take action.`,
    metadata: { hoursRemaining }
  })
}

/**
 * Send release notification
 */
export async function sendReleaseNotification(
  recipientWallet: string,
  escrowId: string,
  amount: number,
  token: string
): Promise<void> {
  await sendNotification({
    userWallet: recipientWallet,
    escrowId,
    type: 'release',
    title: 'Funds Released',
    message: `${amount} ${token} has been released to your wallet.`,
    metadata: { amount, token }
  })
}

/**
 * Send refund notification
 */
export async function sendRefundNotification(
  recipientWallet: string,
  escrowId: string,
  amount: number,
  token: string,
  reason: string
): Promise<void> {
  await sendNotification({
    userWallet: recipientWallet,
    escrowId,
    type: 'refund',
    title: 'Refund Processed',
    message: `${amount} ${token} has been refunded. Reason: ${reason}`,
    metadata: { amount, token, reason }
  })
}
