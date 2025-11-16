'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { NotificationPreferences as NotificationPreferencesType, NotificationFrequency } from '@/lib/notifications/types'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { LoadingState } from './ui/LoadingState'
import { ErrorMessage } from './ui/ErrorMessage'
import BrowserNotificationManager from './BrowserNotificationManager'

export default function NotificationPreferences() {
  const { publicKey } = useWallet()
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (publicKey) {
      loadPreferences()
    }
  }, [publicKey])

  const loadPreferences = async () => {
    if (!publicKey) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notifications/preferences?wallet=${publicKey.toBase58()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load preferences')
      }
      
      setPreferences(data.preferences)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!publicKey || !preferences) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          updates: preferences
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }
      
      setPreferences(data.preferences)
      setSuccess(true)
      setHasChanges(false)
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferencesType, value: any) => {
    if (!preferences) return
    setPreferences({ ...preferences, [key]: value })
    setHasChanges(true)
  }

  if (!publicKey) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-400">Please connect your wallet to manage notification preferences</p>
        </div>
      </Card>
    )
  }

  if (loading) {
    return <LoadingState text="Loading notification preferences..." />
  }

  if (error && !preferences) {
    return <ErrorMessage message={error} />
  }

  if (!preferences) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
          <p className="text-gray-400 mt-1">Customize how and when you receive notifications</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-400 text-sm">✓ Preferences saved successfully</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* In-App Notifications */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">In-App Notifications</h3>
              <p className="text-sm text-gray-400">Notifications shown within the application</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.inAppEnabled && (
            <div className="pl-4 space-y-3 border-l-2 border-gray-700">
              <NotificationToggle
                label="Deposits"
                description="When funds are deposited to an escrow"
                checked={preferences.inAppDeposits}
                onChange={(checked) => updatePreference('inAppDeposits', checked)}
              />
              <NotificationToggle
                label="Work Submissions"
                description="When a seller submits work for a milestone"
                checked={preferences.inAppWorkSubmissions}
                onChange={(checked) => updatePreference('inAppWorkSubmissions', checked)}
              />
              <NotificationToggle
                label="Approvals"
                description="When a milestone is approved"
                checked={preferences.inAppApprovals}
                onChange={(checked) => updatePreference('inAppApprovals', checked)}
              />
              <NotificationToggle
                label="Disputes"
                description="When a dispute is raised or resolved"
                checked={preferences.inAppDisputes}
                onChange={(checked) => updatePreference('inAppDisputes', checked)}
              />
              <NotificationToggle
                label="Timeouts"
                description="When an escrow is approaching timeout"
                checked={preferences.inAppTimeouts}
                onChange={(checked) => updatePreference('inAppTimeouts', checked)}
              />
              <NotificationToggle
                label="Releases"
                description="When funds are released"
                checked={preferences.inAppReleases}
                onChange={(checked) => updatePreference('inAppReleases', checked)}
              />
              <NotificationToggle
                label="Refunds"
                description="When a refund is processed"
                checked={preferences.inAppRefunds}
                onChange={(checked) => updatePreference('inAppRefunds', checked)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Browser Notifications */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Browser Notifications</h3>
              <p className="text-sm text-gray-400">Push notifications to your browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.browserEnabled}
                onChange={(e) => updatePreference('browserEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Browser Permission Manager */}
          <BrowserNotificationManager />

          {preferences.browserEnabled && (
            <div className="pl-4 space-y-3 border-l-2 border-gray-700">
              <NotificationToggle
                label="Deposits"
                checked={preferences.browserDeposits}
                onChange={(checked) => updatePreference('browserDeposits', checked)}
              />
              <NotificationToggle
                label="Work Submissions"
                checked={preferences.browserWorkSubmissions}
                onChange={(checked) => updatePreference('browserWorkSubmissions', checked)}
              />
              <NotificationToggle
                label="Approvals"
                checked={preferences.browserApprovals}
                onChange={(checked) => updatePreference('browserApprovals', checked)}
              />
              <NotificationToggle
                label="Disputes"
                checked={preferences.browserDisputes}
                onChange={(checked) => updatePreference('browserDisputes', checked)}
              />
              <NotificationToggle
                label="Timeouts"
                checked={preferences.browserTimeouts}
                onChange={(checked) => updatePreference('browserTimeouts', checked)}
              />
              <NotificationToggle
                label="Releases"
                checked={preferences.browserReleases}
                onChange={(checked) => updatePreference('browserReleases', checked)}
              />
              <NotificationToggle
                label="Refunds"
                checked={preferences.browserRefunds}
                onChange={(checked) => updatePreference('browserRefunds', checked)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Email Notifications */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
              <p className="text-sm text-gray-400">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.emailEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={preferences.emailAddress || ''}
                  onChange={(e) => updatePreference('emailAddress', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pl-4 space-y-3 border-l-2 border-gray-700">
                <NotificationToggle
                  label="Deposits"
                  checked={preferences.emailDeposits}
                  onChange={(checked) => updatePreference('emailDeposits', checked)}
                />
                <NotificationToggle
                  label="Work Submissions"
                  checked={preferences.emailWorkSubmissions}
                  onChange={(checked) => updatePreference('emailWorkSubmissions', checked)}
                />
                <NotificationToggle
                  label="Approvals"
                  checked={preferences.emailApprovals}
                  onChange={(checked) => updatePreference('emailApprovals', checked)}
                />
                <NotificationToggle
                  label="Disputes"
                  checked={preferences.emailDisputes}
                  onChange={(checked) => updatePreference('emailDisputes', checked)}
                />
                <NotificationToggle
                  label="Timeouts"
                  checked={preferences.emailTimeouts}
                  onChange={(checked) => updatePreference('emailTimeouts', checked)}
                />
                <NotificationToggle
                  label="Releases"
                  checked={preferences.emailReleases}
                  onChange={(checked) => updatePreference('emailReleases', checked)}
                />
                <NotificationToggle
                  label="Refunds"
                  checked={preferences.emailRefunds}
                  onChange={(checked) => updatePreference('emailRefunds', checked)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Frequency Settings */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Notification Frequency</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Delivery Frequency
            </label>
            <select
              value={preferences.notificationFrequency}
              onChange={(e) => updatePreference('notificationFrequency', e.target.value as NotificationFrequency)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immediate - Send notifications right away</option>
              <option value="hourly">Hourly - Batch notifications every hour</option>
              <option value="daily">Daily - Send a daily digest</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-white">Quiet Hours</h4>
                <p className="text-xs text-gray-400">Suppress notifications during specific hours</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quietHoursEnabled}
                  onChange={(e) => updatePreference('quietHoursEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart || '22:00'}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd || '08:00'}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Save Button at Bottom */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

// Helper component for notification toggles
function NotificationToggle({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )
}
