import NotificationPreferences from '@/components/NotificationPreferences'

export const metadata = {
  title: 'Notification Preferences - NOVIQ',
  description: 'Manage your notification preferences',
}

export default function NotificationPreferencesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <NotificationPreferences />
      </div>
    </div>
  )
}
