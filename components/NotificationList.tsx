'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X,
  AlertCircle,
  DollarSign,
  FileText,
  ThumbsUp,
  Clock,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  user_wallet: string
  escrow_id: string | null
  notification_type: string
  title: string
  message: string
  link: string | null
  metadata: Record<string, any> | null
  read_at: string | null
  created_at: string
}

interface NotificationListProps {
  onClose?: () => void
  maxHeight?: string
}

export default function NotificationList({ onClose, maxHeight = '600px' }: NotificationListProps) {
  const { publicKey } = useWallet()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  useEffect(() => {
    if (publicKey) {
      fetchNotifications()
    }
  }, [publicKey, showUnreadOnly])

  const fetchNotifications = async () => {
    if (!publicKey) return
    
    try {
      setLoading(true)
      const response = await fetch(
        `/api/notifications/list?wallet=${publicKey.toBase58()}&unreadOnly=${showUnreadOnly}&limit=50`
      )
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!publicKey) return
    
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: [notificationId],
          userWallet: publicKey.toBase58(),
        }),
      })
      
      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!publicKey) return
    
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: publicKey.toBase58(),
          markAllRead: true,
        }),
      })
      
      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }
    
    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link)
      onClose?.()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'work_submission':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'approval':
        return <ThumbsUp className="w-5 h-5 text-green-600" />
      case 'dispute':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'timeout':
        return <Clock className="w-5 h-5 text-orange-600" />
      case 'release':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  if (!publicKey) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Connect your wallet to view notifications</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              title="Mark all as read"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {showUnreadOnly ? 'Show all' : 'Show unread only'}
        </button>
      </div>

      {/* Notifications List */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {showUnreadOnly ? "You're all caught up!" : "You'll see notifications here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-colors ${
                  notification.read_at
                    ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${
                        notification.read_at
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-900 dark:text-white font-semibold'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read_at && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
