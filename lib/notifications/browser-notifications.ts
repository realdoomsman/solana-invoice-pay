// Browser notification utilities

import { NotificationType } from './types'

export interface BrowserNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
}

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Request notification permission from the user
 * Returns the permission status after the request
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Browser notifications are not supported')
  }

  // If already granted or denied, return current status
  if (Notification.permission !== 'default') {
    return Notification.permission
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Send a browser notification
 * Automatically requests permission if not already granted
 */
export async function sendBrowserNotification(
  options: BrowserNotificationOptions
): Promise<Notification | null> {
  if (!isNotificationSupported()) {
    console.warn('Browser notifications are not supported')
    return null
  }

  // Check permission
  let permission = Notification.permission
  
  if (permission === 'default') {
    permission = await requestNotificationPermission()
  }

  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return null
  }

  try {
    // Create notification
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.svg',
      badge: options.badge || '/logo.svg',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
    })

    return notification
  } catch (error) {
    console.error('Error sending browser notification:', error)
    return null
  }
}

/**
 * Send an escrow-related browser notification
 */
export async function sendEscrowNotification(
  type: NotificationType,
  escrowId: string,
  message: string,
  additionalData?: any
): Promise<Notification | null> {
  const titles: Record<NotificationType, string> = {
    deposit: '💰 Deposit Received',
    work_submission: '📝 Work Submitted',
    approval: '✅ Milestone Approved',
    dispute: '⚠️ Dispute Raised',
    timeout: '⏰ Timeout Warning',
    release: '🎉 Funds Released',
    refund: '↩️ Refund Processed',
  }

  const notification = await sendBrowserNotification({
    title: titles[type] || 'Escrow Update',
    body: message,
    tag: `escrow-${escrowId}-${type}`,
    data: {
      type,
      escrowId,
      url: `/escrow/${escrowId}`,
      ...additionalData,
    },
    requireInteraction: type === 'dispute' || type === 'timeout',
  })

  // Handle notification click
  if (notification) {
    notification.onclick = (event) => {
      event.preventDefault()
      const data = (event.target as Notification).data
      
      // Focus the window and navigate to escrow
      window.focus()
      if (data?.url) {
        window.location.href = data.url
      }
      
      notification.close()
    }
  }

  return notification
}

/**
 * Test browser notifications
 * Useful for letting users test their notification settings
 */
export async function sendTestNotification(): Promise<boolean> {
  const notification = await sendBrowserNotification({
    title: '🔔 Test Notification',
    body: 'Browser notifications are working correctly!',
    tag: 'test-notification',
  })

  if (notification) {
    notification.onclick = () => {
      notification.close()
    }
    return true
  }

  return false
}

/**
 * Clear all notifications with a specific tag
 */
export async function clearNotificationsByTag(tag: string): Promise<void> {
  if (!isNotificationSupported() || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const notifications = await registration.getNotifications({ tag })
    
    notifications.forEach(notification => notification.close())
  } catch (error) {
    console.error('Error clearing notifications:', error)
  }
}

/**
 * Clear all notifications for a specific escrow
 */
export async function clearEscrowNotifications(escrowId: string): Promise<void> {
  if (!isNotificationSupported() || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const notifications = await registration.getNotifications()
    
    notifications.forEach(notification => {
      if (notification.data?.escrowId === escrowId) {
        notification.close()
      }
    })
  } catch (error) {
    console.error('Error clearing escrow notifications:', error)
  }
}

/**
 * Hook for React components to manage browser notifications
 */
export function useBrowserNotifications() {
  const isSupported = isNotificationSupported()
  const permission = isSupported ? getNotificationPermission() : 'denied'

  return {
    isSupported,
    permission,
    requestPermission: requestNotificationPermission,
    sendNotification: sendBrowserNotification,
    sendEscrowNotification,
    sendTestNotification,
    clearNotificationsByTag,
    clearEscrowNotifications,
  }
}
