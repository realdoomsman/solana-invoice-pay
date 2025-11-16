# Notification Preferences Guide

## Overview

The notification preferences system allows users to customize how and when they receive notifications about escrow events. Users can configure preferences for in-app, browser, and email notifications, with granular control over each notification type.

## Features

### 1. Notification Channels

#### In-App Notifications
- Displayed within the application interface
- Real-time updates
- Enabled by default

#### Browser Notifications
- Push notifications to the user's browser
- Requires browser permission
- Disabled by default

#### Email Notifications
- Notifications sent via email
- Requires email address
- Disabled by default

### 2. Notification Types

Users can enable/disable notifications for:
- **Deposits**: When funds are deposited to an escrow
- **Work Submissions**: When a seller submits work for a milestone
- **Approvals**: When a milestone is approved
- **Disputes**: When a dispute is raised or resolved
- **Timeouts**: When an escrow is approaching timeout
- **Releases**: When funds are released
- **Refunds**: When a refund is processed

### 3. Frequency Settings

#### Delivery Frequency
- **Immediate**: Send notifications right away (default)
- **Hourly**: Batch notifications every hour
- **Daily**: Send a daily digest

#### Quiet Hours
- Suppress notifications during specific hours
- Configurable start and end times
- Useful for preventing notifications during sleep hours

## Database Schema

### user_notification_preferences
Stores user preferences for notification delivery:
- Channel preferences (in-app, browser, email)
- Type-specific preferences for each channel
- Frequency settings
- Quiet hours configuration

### notification_queue
Stores notifications to be delivered:
- Notification details (title, message, link)
- Delivery status for each channel
- Read status
- Metadata for context

## API Endpoints

### GET /api/notifications/preferences
Get notification preferences for a user.

**Query Parameters:**
- `wallet`: User's wallet address

**Response:**
```json
{
  "preferences": {
    "userWallet": "...",
    "inAppEnabled": true,
    "inAppDeposits": true,
    // ... other preferences
  }
}
```

### PUT /api/notifications/preferences
Update notification preferences for a user.

**Request Body:**
```json
{
  "wallet": "...",
  "updates": {
    "inAppEnabled": true,
    "browserEnabled": false,
    "emailEnabled": true,
    "emailAddress": "user@example.com",
    "notificationFrequency": "immediate",
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  }
}
```

**Response:**
```json
{
  "preferences": { /* updated preferences */ },
  "message": "Notification preferences updated successfully"
}
```

## Usage

### Accessing Preferences
Users can access their notification preferences at:
```
/settings/notifications
```

### Component Usage
```tsx
import NotificationPreferences from '@/components/NotificationPreferences'

export default function SettingsPage() {
  return <NotificationPreferences />
}
```

### Checking Preferences Programmatically
```typescript
import { 
  getNotificationPreferences, 
  shouldSendNotification,
  isInQuietHours 
} from '@/lib/notifications/preferences'

// Get user preferences
const prefs = await getNotificationPreferences(userWallet)

// Check if notification should be sent
const shouldSend = await shouldSendNotification(
  userWallet,
  'deposit',
  'in_app'
)

// Check if in quiet hours
const inQuietHours = isInQuietHours(prefs)
```

## Default Preferences

When a user first accesses the system, default preferences are created:

- **In-App**: Enabled for all notification types
- **Browser**: Disabled (requires explicit opt-in)
- **Email**: Disabled (requires email address)
- **Frequency**: Immediate
- **Quiet Hours**: Disabled

## Implementation Details

### Preference Storage
- Preferences are stored per wallet address
- Automatically created on first access
- Updated via API endpoint

### Notification Delivery
1. Check if user has preferences (create defaults if not)
2. Check if notification type is enabled for channel
3. Check if in quiet hours
4. Check frequency settings
5. Queue or deliver notification

### Quiet Hours Logic
- Supports overnight quiet hours (e.g., 22:00 to 08:00)
- Notifications during quiet hours are queued
- Delivered after quiet hours end

## Future Enhancements

1. **Email Integration**: Connect email service for email notifications
2. **SMS Notifications**: Add SMS as a notification channel
3. **Notification History**: View past notifications
4. **Advanced Filtering**: Filter by escrow type, amount thresholds
5. **Notification Templates**: Customizable notification messages
6. **Multi-language Support**: Notifications in user's preferred language

## Testing

### Manual Testing
1. Connect wallet
2. Navigate to `/settings/notifications`
3. Toggle various preferences
4. Save changes
5. Verify preferences are persisted
6. Test quiet hours functionality

### API Testing
```bash
# Get preferences
curl "http://localhost:3000/api/notifications/preferences?wallet=WALLET_ADDRESS"

# Update preferences
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "WALLET_ADDRESS",
    "updates": {
      "inAppEnabled": true,
      "browserEnabled": true
    }
  }'
```

## Troubleshooting

### Preferences Not Saving
- Check wallet connection
- Verify API endpoint is accessible
- Check browser console for errors
- Ensure database table exists

### Notifications Not Appearing
- Check if notification type is enabled
- Verify not in quiet hours
- Check notification queue table
- Verify delivery status

### Browser Notifications Not Working
- Check browser permissions
- Ensure HTTPS connection
- Verify browser supports notifications
- Check if browser notifications are enabled in preferences

## Security Considerations

1. **Wallet Verification**: Only wallet owner can update preferences
2. **Email Validation**: Validate email format before saving
3. **Rate Limiting**: Prevent excessive preference updates
4. **Data Privacy**: Don't expose other users' preferences
5. **Secure Storage**: Encrypt sensitive notification data

## Performance

- Preferences cached after first load
- Batch updates to reduce database calls
- Indexed queries for fast lookups
- Efficient notification queue processing

## Compliance

- GDPR compliant (user controls their data)
- CAN-SPAM compliant (email opt-in/opt-out)
- Respects user privacy preferences
- Clear notification purposes
