'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  sendBrowserNotification,
  sendEscrowNotification,
  sendTestNotification,
  clearNotificationsByTag,
  clearEscrowNotifications,
  BrowserNotificationOptions
} from '@/lib/notifications/browser-notifications'
import { NotificationType } from '@/lib/notifications/types'

export function useBrowserNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isRequesting, setIsRequesting] = useState(false)

  // Check support and permission on mount
  useEffect(() => {
    setIsSupported(isNotificationSupported())
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission())
    }
  }, [])

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Browser notifications are not supported')
    }

    setIsRequesting(true)
    try {
      const newPermission = await requestNotificationPermission()
      setPermission(newPermission)
      return newPermission
    } finally {
      setIsRequesting(false)
    }
  }, [isSupported])

  // Send a generic notification
  const sendNotification = useCallback(async (options: BrowserNotificationOptions) => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported')
      return null
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return null
    }

    return await sendBrowserNotification(options)
  }, [isSupported, permission])

  // Send an escrow notification
  const sendEscrowNotif = useCallback(async (
    type: NotificationType,
    escrowId: string,
    message: string,
    additionalData?: any
  ) => {
    if (!isSupported || permission !== 'granted') {
      return null
    }

    return await sendEscrowNotification(type, escrowId, message, additionalData)
  }, [isSupported, permission])

  // Send a test notification
  const sendTest = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    return await sendTestNotification()
  }, [isSupported, permission])

  // Clear notifications
  const clearByTag = useCallback(async (tag: string) => {
    await clearNotificationsByTag(tag)
  }, [])

  const clearEscrow = useCallback(async (escrowId: string) => {
    await clearEscrowNotifications(escrowId)
  }, [])

  return {
    isSupported,
    permission,
    isRequesting,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    requestPermission,
    sendNotification,
    sendEscrowNotification: sendEscrowNotif,
    sendTestNotification: sendTest,
    clearNotificationsByTag: clearByTag,
    clearEscrowNotifications: clearEscrow,
  }
}
