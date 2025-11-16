# Browser Notifications Quick Start

## 🚀 Quick Implementation

### 1. Request Permission (User Action)

```typescript
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications'

function MyComponent() {
  const { requestPermission, isGranted } = useBrowserNotifications()

  return (
    <button onClick={requestPermission}>
      Enable Notifications
    </button>
  )
}
```

### 2. Send a Notification

```typescript
import { sendEscrowNotification } from '@/lib/notifications/browser-notifications'

// Send notification
await sendEscrowNotification(
  'deposit',           // type
  'escrow-123',        // escrowId
  'Buyer deposited 10 SOL'  // message
)
```

### 3. Use in Components

```typescript
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications'

function EscrowPage() {
  const { sendEscrowNotification, isGranted } = useBrowserNotifications()

  const handleDeposit = async () => {
    // ... deposit logic ...
    
    if (isGranted) {
      await sendEscrowNotification(
        'deposit',
        escrowId,
        'Deposit confirmed!'
      )
    }
  }
}
```

## 📋 Common Patterns

### Check Permission Before Sending

```typescript
const { permission, requestPermission, sendNotification } = useBrowserNotifications()

if (permission === 'default') {
  await requestPermission()
}

if (permission === 'granted') {
  await sendNotification({ title: 'Hello', body: 'World' })
}
```

### Respect User Preferences

```typescript
import { sendNotification } from '@/lib/notifications/send-notification'

// Automatically checks preferences and quiet hours
await sendNotification({
  userWallet: wallet,
  escrowId: id,
  type: 'deposit',
  title: 'Deposit',
  message: 'Funds received'
})
```

### Handle Clicks

```typescript
// Clicks automatically navigate to escrow page
// No additional code needed!
await sendEscrowNotification('deposit', escrowId, message)
// User clicks → navigates to /escrow/{escrowId}
```

## 🎯 Notification Types

```typescript
// Deposit
await sendEscrowNotification('deposit', id, 'Buyer deposited 10 SOL')

// Work Submission
await sendEscrowNotification('work_submission', id, 'Seller submitted work')

// Approval
await sendEscrowNotification('approval', id, 'Milestone approved')

// Dispute (requires interaction)
await sendEscrowNotification('dispute', id, 'Dispute raised')

// Timeout (requires interaction)
await sendEscrowNotification('timeout', id, 'Escrow expiring soon')

// Release
await sendEscrowNotification('release', id, 'Funds released')

// Refund
await sendEscrowNotification('refund', id, 'Refund processed')
```

## 🔧 UI Components

### Add Permission Manager

```tsx
import BrowserNotificationManager from '@/components/BrowserNotificationManager'

function SettingsPage() {
  return (
    <div>
      <h2>Notifications</h2>
      <BrowserNotificationManager />
    </div>
  )
}
```

### Full Preferences UI

```tsx
import NotificationPreferences from '@/components/NotificationPreferences'

function PreferencesPage() {
  return <NotificationPreferences />
}
```

## ✅ Testing

### Test Notification

```typescript
import { sendTestNotification } from '@/lib/notifications/browser-notifications'

await sendTestNotification()
// Shows: "🔔 Test Notification - Browser notifications are working correctly!"
```

### Using Hook

```typescript
const { sendTestNotification } = useBrowserNotifications()

<button onClick={sendTestNotification}>
  Test Notifications
</button>
```

## 🎨 Customization

### Custom Icon

```typescript
await sendBrowserNotification({
  title: 'Custom',
  body: 'Message',
  icon: '/custom-icon.png',
  badge: '/badge.png'
})
```

### Require Interaction

```typescript
await sendBrowserNotification({
  title: 'Important',
  body: 'Action required',
  requireInteraction: true  // Stays until dismissed
})
```

### Silent Notification

```typescript
await sendBrowserNotification({
  title: 'Info',
  body: 'Update',
  silent: true  // No sound
})
```

## 🚨 Error Handling

```typescript
const { isSupported, permission } = useBrowserNotifications()

if (!isSupported) {
  // Show fallback message
  console.log('Browser notifications not supported')
}

if (permission === 'denied') {
  // Show instructions to enable in browser settings
  console.log('Notifications blocked')
}
```

## 📱 Browser Support

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (requires user interaction)
- ⚠️ Mobile Safari: iOS 16.4+ only
- ✅ Mobile Chrome: Android only

## 🔗 Related

- Full Guide: [BROWSER_NOTIFICATIONS_GUIDE.md](./BROWSER_NOTIFICATIONS_GUIDE.md)
- Preferences: [NOTIFICATION_PREFERENCES_GUIDE.md](./NOTIFICATION_PREFERENCES_GUIDE.md)
- Requirements: [requirements.md](./requirements.md) - Requirement 12.2
