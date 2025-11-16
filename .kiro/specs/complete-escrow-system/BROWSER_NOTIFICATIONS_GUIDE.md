# Browser Notifications Guide

## Overview

The browser notification system provides real-time push notifications to users about escrow events, even when they're not actively viewing the application. This guide covers implementation, usage, and best practices.

## Features

### ✅ Implemented Features

1. **Permission Management**
   - Request notification permission from users
   - Check current permission status
   - Handle permission states (granted, denied, default)
   - Browser compatibility detection

2. **Notification Sending**
   - Send generic browser notifications
   - Send escrow-specific notifications with context
   - Automatic icon and badge support
   - Notification click handling with navigation

3. **User Preferences Integration**
   - Respect user notification preferences
   - Honor quiet hours settings
   - Per-notification-type controls
   - Test notification functionality

4. **Notification Management**
   - Clear notifications by tag
   - Clear all notifications for an escrow
   - Prevent duplicate notifications
   - Automatic cleanup on click

## Architecture

### Core Components

```
lib/notifications/
├── browser-notifications.ts    # Core browser notification utilities
├── send-notification.ts        # Unified notification sending
├── preferences.ts              # User preference management
└── types.ts                    # TypeScript interfaces

components/
├── BrowserNotificationManager.tsx  # Permission UI component
└── NotificationPreferences.tsx     # Full preferences UI

hooks/
└── useBrowserNotifications.ts      # React hook for notifications
```

## Usage

### Basic Usage

```typescript
import { sendBrowserNotification } from '@/lib/notifications/browser-notifications'

// Send a simple notification
await sendBrowserNotification({
  title: 'Hello!',
  body: 'This is a test notification',
  icon: '/logo.svg'
})
```

### Escrow Notifications

```typescript
import { sendEscrowNotification } from '@/lib/notifications/browser-notifications'

// Send an escrow-specific notification
await sendEscrowNotification(
  'deposit',
  'escrow-123',
  'Buyer deposited 10 SOL',
  { amount: 10, token: 'SOL' }
)
```

### Using the React Hook

```typescript
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications'

function MyComponent() {
  const {
    isSupported,
    permission,
    isGranted,
    requestPermission,
    sendEscrowNotification
  } = useBrowserNotifications()

  const handleNotify = async () => {
    if (!isGranted) {
      await requestPermission()
    }
    
    await sendEscrowNotification(
      'approval',
      escrowId,
      'Milestone approved!'
    )
  }

  return (
    <button onClick={handleNotify}>
      Send Notification
    </button>
  )
}
```

### Unified Notification Sending

```typescript
import { sendNotification } from '@/lib/notifications/send-notification'

// Send through all enabled channels (in-app, browser, email)
await sendNotification({
  userWallet: 'user-wallet-address',
  escrowId: 'escrow-123',
  type: 'deposit',
  title: 'Deposit Received',
  message: 'Buyer deposited 10 SOL',
  metadata: { amount: 10, token: 'SOL' }
})
```

## Notification Types

The system supports the following notification types:

| Type | Icon | Description | Requires Interaction |
|------|------|-------------|---------------------|
| `deposit` | 💰 | Funds deposited to escrow | No |
| `work_submission` | 📝 | Seller submitted work | No |
| `approval` | ✅ | Milestone approved | No |
| `dispute` | ⚠️ | Dispute raised | Yes |
| `timeout` | ⏰ | Timeout warning | Yes |
| `release` | 🎉 | Funds released | No |
| `refund` | ↩️ | Refund processed | No |

## Permission Management

### Checking Permission Status

```typescript
import { getNotificationPermission } from '@/lib/notifications/browser-notifications'

const permission = getNotificationPermission()
// Returns: 'granted' | 'denied' | 'default'
```

### Requesting Permission

```typescript
import { requestNotificationPermission } from '@/lib/notifications/browser-notifications'

const permission = await requestNotificationPermission()

if (permission === 'granted') {
  console.log('Notifications enabled!')
} else if (permission === 'denied') {
  console.log('User blocked notifications')
}
```

### Browser Support Detection

```typescript
import { isNotificationSupported } from '@/lib/notifications/browser-notifications'

if (isNotificationSupported()) {
  // Browser supports notifications
} else {
  // Show fallback message
}
```

## Click Handling

Notifications automatically handle clicks and navigate to the relevant escrow:

```typescript
// Notification data includes navigation URL
const notification = await sendEscrowNotification(
  'deposit',
  'escrow-123',
  'Deposit received'
)

// Click handler is automatically attached
// Clicking will:
// 1. Focus the browser window
// 2. Navigate to /escrow/escrow-123
// 3. Close the notification
```

## User Preferences

### Respecting Preferences

The system automatically respects user preferences:

```typescript
import { shouldSendNotification } from '@/lib/notifications/preferences'

// Check if notification should be sent
const shouldSend = await shouldSendNotification(
  userWallet,
  'deposit',
  'browser'
)

if (shouldSend) {
  await sendBrowserNotification(...)
}
```

### Quiet Hours

Notifications respect quiet hours settings:

```typescript
import { isInQuietHours, getNotificationPreferences } from '@/lib/notifications/preferences'

const prefs = await getNotificationPreferences(userWallet)

if (!isInQuietHours(prefs)) {
  // Send notification
}
```

## Best Practices

### 1. Always Check Permission

```typescript
// ❌ Bad
await sendBrowserNotification({ title: 'Hello', body: 'World' })

// ✅ Good
const permission = getNotificationPermission()
if (permission === 'granted') {
  await sendBrowserNotification({ title: 'Hello', body: 'World' })
}
```

### 2. Request Permission at Appropriate Times

```typescript
// ❌ Bad - Request on page load
useEffect(() => {
  requestNotificationPermission()
}, [])

// ✅ Good - Request when user enables notifications
const handleEnableNotifications = async () => {
  const permission = await requestNotificationPermission()
  if (permission === 'granted') {
    // Update user preferences
  }
}
```

### 3. Use Appropriate Notification Types

```typescript
// ✅ Use requireInteraction for critical notifications
await sendBrowserNotification({
  title: 'Dispute Raised',
  body: 'Action required',
  requireInteraction: true  // Notification stays until dismissed
})

// ✅ Use silent for non-urgent notifications
await sendBrowserNotification({
  title: 'Deposit Received',
  body: 'Funds deposited',
  silent: true  // No sound
})
```

### 4. Clean Up Notifications

```typescript
import { clearEscrowNotifications } from '@/lib/notifications/browser-notifications'

// Clear notifications when escrow is completed
await clearEscrowNotifications(escrowId)
```

### 5. Provide Fallback for Unsupported Browsers

```typescript
import { isNotificationSupported } from '@/lib/notifications/browser-notifications'

if (!isNotificationSupported()) {
  // Show in-app notification instead
  showInAppNotification(message)
}
```

## Testing

### Manual Testing

1. **Test Permission Request**
   - Go to notification preferences
   - Click "Enable Browser Notifications"
   - Verify browser permission prompt appears
   - Grant permission

2. **Test Notification Sending**
   - Click "Send Test Notification"
   - Verify notification appears
   - Click notification
   - Verify page focuses

3. **Test Notification Preferences**
   - Disable specific notification types
   - Trigger those events
   - Verify notifications are not sent

4. **Test Quiet Hours**
   - Enable quiet hours
   - Set current time within quiet hours
   - Trigger notification
   - Verify notification is suppressed

### Automated Testing

```typescript
// Test notification support detection
test('detects notification support', () => {
  const isSupported = isNotificationSupported()
  expect(typeof isSupported).toBe('boolean')
})

// Test permission checking
test('gets notification permission', () => {
  const permission = getNotificationPermission()
  expect(['granted', 'denied', 'default']).toContain(permission)
})
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | Requires user interaction |
| Edge | ✅ Full | All features supported |
| Opera | ✅ Full | All features supported |
| Mobile Safari | ⚠️ Limited | iOS 16.4+ only |
| Mobile Chrome | ✅ Full | Android only |

## Troubleshooting

### Notifications Not Appearing

1. **Check Permission Status**
   ```typescript
   console.log('Permission:', getNotificationPermission())
   ```

2. **Check Browser Support**
   ```typescript
   console.log('Supported:', isNotificationSupported())
   ```

3. **Check User Preferences**
   ```typescript
   const prefs = await getNotificationPreferences(userWallet)
   console.log('Browser enabled:', prefs.browserEnabled)
   ```

4. **Check Quiet Hours**
   ```typescript
   const prefs = await getNotificationPreferences(userWallet)
   console.log('In quiet hours:', isInQuietHours(prefs))
   ```

### Permission Denied

If permission is denied, users must manually enable it in browser settings:

**Chrome/Edge:**
1. Click lock icon in address bar
2. Find "Notifications"
3. Change to "Allow"
4. Refresh page

**Firefox:**
1. Click lock icon in address bar
2. Click "More Information"
3. Go to "Permissions" tab
4. Find "Notifications" and change to "Allow"

**Safari:**
1. Safari → Preferences
2. Websites → Notifications
3. Find your site and change to "Allow"

## Integration Examples

### Deposit Notification

```typescript
import { sendDepositNotification } from '@/lib/notifications/send-notification'

// After deposit is confirmed
await sendDepositNotification(
  buyerWallet,
  sellerWallet,
  escrowId,
  'buyer',
  10,
  'SOL'
)
```

### Work Submission Notification

```typescript
import { sendWorkSubmissionNotification } from '@/lib/notifications/send-notification'

// After seller submits work
await sendWorkSubmissionNotification(
  buyerWallet,
  escrowId,
  milestoneId,
  'Complete website design'
)
```

### Dispute Notification

```typescript
import { sendDisputeNotification } from '@/lib/notifications/send-notification'

// After dispute is raised
await sendDisputeNotification(
  sellerWallet,
  escrowId,
  'buyer',
  'Work not completed as agreed'
)
```

## Future Enhancements

- [ ] Service Worker integration for offline notifications
- [ ] Notification actions (approve/reject from notification)
- [ ] Rich notifications with images
- [ ] Notification grouping
- [ ] Notification history
- [ ] Push notification server integration
- [ ] Mobile app notifications

## Related Documentation

- [Notification Preferences Guide](./NOTIFICATION_PREFERENCES_GUIDE.md)
- [In-App Notifications Guide](./IN_APP_NOTIFICATIONS_GUIDE.md) (Task 14.1)
- [Notification Triggers Guide](./NOTIFICATION_TRIGGERS_GUIDE.md) (Task 14.2)
- [Requirements Document](./requirements.md) - Requirement 12.2
