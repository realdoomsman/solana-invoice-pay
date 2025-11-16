# In-App Notifications Guide

## Overview

The in-app notification system provides real-time updates to users about their escrow activities. Notifications appear in a dropdown panel accessible from the header and on a dedicated notifications page.

## Features

### 1. Notification Badge
- **Location**: Header navigation bar
- **Display**: Bell icon with red badge showing unread count
- **Auto-refresh**: Updates every 30 seconds
- **Badge format**: Shows count (99+ for large numbers)

### 2. Notification Panel
- **Access**: Click the bell icon in header
- **Features**:
  - Dropdown panel with notification list
  - Filter toggle (all/unread only)
  - Mark all as read button
  - Individual mark as read buttons
  - Click-outside-to-close

### 3. Notifications Page
- **URL**: `/notifications`
- **Features**:
  - Full-page notification view
  - Extended scrollable list
  - All notification panel features
  - Back navigation

## Notification Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| Deposit | 💵 | Green | Funds deposited to escrow |
| Work Submission | 📄 | Blue | Seller submitted work |
| Approval | 👍 | Green | Milestone approved |
| Dispute | ⚠️ | Red | Dispute raised |
| Timeout | ⏰ | Orange | Timeout warning |
| Release | 💵 | Green | Funds released |
| Refund | 🔄 | Blue | Refund processed |

## User Flow

### Receiving Notifications
1. Action occurs in escrow (deposit, approval, etc.)
2. System creates notification in database
3. Badge updates with new unread count
4. User sees notification in panel

### Reading Notifications
1. Click bell icon to open panel
2. View notification list
3. Click notification to navigate to escrow
4. Notification auto-marks as read
5. Badge count decreases

### Managing Notifications
- **Mark single as read**: Click checkmark icon
- **Mark all as read**: Click double-check icon in header
- **Filter unread**: Toggle "Show unread only"
- **Navigate**: Click notification to go to escrow

## API Endpoints

### GET `/api/notifications/list`
Fetch notifications for a user.

**Query Parameters:**
- `wallet` (required): User wallet address
- `limit` (optional): Number of notifications (default: 50)
- `unreadOnly` (optional): Filter unread only (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_wallet": "wallet_address",
      "escrow_id": "escrow_id",
      "notification_type": "deposit",
      "title": "Deposit Received",
      "message": "Buyer deposited 10 SOL",
      "link": "/escrow/escrow_id",
      "metadata": {},
      "read_at": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### POST `/api/notifications/mark-read`
Mark notifications as read.

**Request Body:**
```json
{
  "userWallet": "wallet_address",
  "notificationIds": ["uuid1", "uuid2"],
  "markAllRead": false
}
```

**Response:**
```json
{
  "success": true,
  "count": 2
}
```

## Integration

### Sending Notifications

Use the `sendNotification` function from `lib/notifications/send-notification.ts`:

```typescript
import { sendNotification } from '@/lib/notifications/send-notification'

await sendNotification({
  userWallet: 'user_wallet_address',
  escrowId: 'escrow_id',
  type: 'deposit',
  title: 'Deposit Received',
  message: 'Buyer deposited 10 SOL',
  metadata: { amount: 10, token: 'SOL' }
})
```

### Helper Functions

Pre-built notification helpers are available:

```typescript
import {
  sendDepositNotification,
  sendWorkSubmissionNotification,
  sendApprovalNotification,
  sendDisputeNotification,
  sendTimeoutWarningNotification,
  sendReleaseNotification,
  sendRefundNotification
} from '@/lib/notifications/send-notification'

// Example: Send deposit notification
await sendDepositNotification(
  buyerWallet,
  sellerWallet,
  escrowId,
  'buyer',
  10,
  'SOL'
)
```

## Components

### NotificationBadge
```tsx
import NotificationBadge from '@/components/NotificationBadge'

<NotificationBadge onClick={() => setOpen(true)} />
```

### NotificationList
```tsx
import NotificationList from '@/components/NotificationList'

<NotificationList 
  onClose={() => setOpen(false)}
  maxHeight="600px"
/>
```

### NotificationPanel
```tsx
import NotificationPanel from '@/components/NotificationPanel'

<NotificationPanel />
```

## Database Schema

### notification_queue Table

```sql
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  escrow_id TEXT,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  in_app_delivered BOOLEAN DEFAULT false,
  browser_delivered BOOLEAN DEFAULT false,
  email_delivered BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);
```

### Indexes
- `idx_notification_queue_wallet` - Fast lookup by user
- `idx_notification_queue_escrow` - Fast lookup by escrow
- `idx_notification_queue_type` - Filter by type
- `idx_notification_queue_unread` - Efficient unread queries
- `idx_notification_queue_created` - Chronological ordering

## Preferences Integration

Notifications respect user preferences from the notification preferences system:

- **In-app enabled**: Controls if notifications are stored
- **Type preferences**: Filter by notification type
- **Quiet hours**: Respected for browser/email (not in-app)
- **Frequency**: Batching for email (not in-app)

## Performance

### Optimization Strategies
1. **Pagination**: Limit queries to 50 notifications
2. **Indexes**: Fast database queries
3. **Auto-refresh**: 30-second polling interval
4. **Lazy loading**: Components load on demand
5. **Optimistic updates**: Instant UI feedback

### Caching
- Badge count cached for 30 seconds
- Notification list refreshed on open
- Read status updated optimistically

## Accessibility

### Features
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors
- Clear visual hierarchy
- Focus management

### Screen Reader Support
- Badge announces unread count
- Notifications read with context
- Actions clearly labeled
- Navigation hints provided

## Testing

### Manual Testing Checklist
- [ ] Badge shows correct unread count
- [ ] Panel opens/closes correctly
- [ ] Notifications display with correct icons
- [ ] Mark as read works (individual)
- [ ] Mark all as read works
- [ ] Filter toggle works
- [ ] Click notification navigates correctly
- [ ] Auto-refresh updates count
- [ ] Empty states display correctly
- [ ] Loading states work

### Integration Testing
- [ ] Notifications created on escrow actions
- [ ] Preferences respected
- [ ] Multiple users receive notifications
- [ ] Database queries efficient
- [ ] API endpoints secure

## Troubleshooting

### Badge Not Updating
- Check wallet connection
- Verify API endpoint accessible
- Check browser console for errors
- Ensure database connection

### Notifications Not Appearing
- Verify notification preferences enabled
- Check database for notification records
- Ensure `storeInAppNotification` called
- Check API response in network tab

### Mark as Read Not Working
- Verify wallet address matches
- Check API endpoint response
- Ensure database permissions
- Check for JavaScript errors

## Best Practices

### For Developers
1. Always use helper functions for common notifications
2. Include relevant metadata for debugging
3. Test with multiple notification types
4. Verify database indexes exist
5. Handle errors gracefully

### For Users
1. Enable in-app notifications in preferences
2. Check notifications regularly
3. Mark as read to keep organized
4. Use filter for unread only
5. Click notifications to navigate quickly

## Future Enhancements

Potential improvements:
- Real-time updates via WebSocket
- Notification grouping by escrow
- Custom notification sounds
- Push notifications (mobile)
- Notification history export
- Advanced filtering options
- Notification search
- Bulk actions

## Related Documentation

- [Notification Preferences Guide](./NOTIFICATION_PREFERENCES_GUIDE.md)
- [Browser Notifications Guide](./BROWSER_NOTIFICATIONS_GUIDE.md)
- [Notification Triggers Checklist](./NOTIFICATION_TRIGGERS_CHECKLIST.md)
- [Task 14.1 Implementation Summary](./TASK_14.1_IMPLEMENTATION_SUMMARY.md)
