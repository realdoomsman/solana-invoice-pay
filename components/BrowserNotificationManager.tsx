'use client'

import { useState } from 'react'
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

export default function BrowserNotificationManager() {
  const {
    isSupported,
    permission,
    isRequesting,
    requestPermission,
    sendTestNotification
  } = useBrowserNotifications()
  
  const [testing, setTesting] = useState(false)

  const handleRequestPermission = async () => {
    try {
      await requestPermission()
    } catch (error) {
      console.error('Error requesting permission:', error)
    }
  }

  const handleTestNotification = async () => {
    setTesting(true)
    try {
      await sendTestNotification()
    } catch (error) {
      console.error('Error sending test notification:', error)
    } finally {
      setTesting(false)
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-medium">Browser notifications not supported</p>
              <p className="text-yellow-400/70 text-sm mt-1">
                Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Browser Notification Status</h4>
            <p className="text-xs text-gray-400 mt-1">
              {permission === 'granted' && 'Browser notifications are enabled'}
              {permission === 'denied' && 'Browser notifications are blocked'}
              {permission === 'default' && 'Browser notifications permission not requested'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Enabled
              </span>
            ) : permission === 'denied' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Not Set
              </span>
            )}
          </div>
        </div>

        {permission === 'default' && (
          <div className="pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-300 mb-3">
              Enable browser notifications to receive real-time updates about your escrows even when you're not on the page.
            </p>
            <Button 
              onClick={handleRequestPermission} 
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? 'Requesting Permission...' : '🔔 Enable Browser Notifications'}
            </Button>
          </div>
        )}

        {permission === 'granted' && (
          <div className="pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-300 mb-3">
              Test your browser notifications to make sure they're working correctly.
            </p>
            <Button 
              onClick={handleTestNotification} 
              disabled={testing}
              variant="secondary"
              className="w-full"
            >
              {testing ? 'Sending Test...' : '🧪 Send Test Notification'}
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="pt-4 border-t border-gray-700">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm font-medium mb-2">
                Browser notifications are blocked
              </p>
              <p className="text-red-400/70 text-xs">
                To enable notifications, you'll need to update your browser settings:
              </p>
              <ul className="text-red-400/70 text-xs mt-2 space-y-1 list-disc list-inside">
                <li>Click the lock icon in your address bar</li>
                <li>Find "Notifications" in the permissions list</li>
                <li>Change the setting to "Allow"</li>
                <li>Refresh this page</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
