'use client'

import { useEffect, useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning'
  timestamp: Date
}

export default function PaymentNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Listen for payment events
    const handlePayment = (event: CustomEvent) => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: '💰 Payment Received!',
        message: `${event.detail.amount} ${event.detail.token} received`,
        type: 'success',
        timestamp: new Date(),
      }
      
      setNotifications(prev => [notification, ...prev].slice(0, 5))
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 5000)
    }

    window.addEventListener('payment-received' as any, handlePayment)
    return () => window.removeEventListener('payment-received' as any, handlePayment)
  }, [])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border-l-4 border-green-500 p-4 min-w-[300px] animate-in slide-in-from-right"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{notif.title.split(' ')[0]}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {notif.title.substring(3)}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {notif.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
