# Notification Preferences Quick Start

## Setup (5 minutes)

### 1. Apply Database Schema
```bash
# Run the SQL schema in your Supabase project
cat supabase-notification-preferences-schema.sql | supabase db execute
```

### 2. Verify Installation
```bash
# Run the verification script
npx ts-node scripts/verify-notification-preferences.ts
```

### 3. Access the UI
Navigate to: `http://localhost:3000/settings/notifications`

## User Guide

### Accessing Preferences
1. Connect your wallet
2. Navigate to Settings → Notifications
3. Configure your preferences
4. Click "Save Changes"

### Configuration Options

#### In-App Notifications
- **Enabled by default**
- Shows notifications within the app
- Configure which events trigger notifications

#### Browser Notifications
- **Disabled by default**
- Requires browser permission
- Push notifications to your browser

#### Email Notifications
- **Disabled by default**
- Requires email address
- Receive notifications via email

### Notification Types
- ✉️ **Deposits**: When funds are deposited
- 📝 **Work Submissions**: When work is submitted
- ✅ **Approvals**: When milestones are approved
- ⚠️ **Disputes**: When disputes are raised/resolved
- ⏰ **Timeouts**: When escrows approach timeout
- 💰 **Releases**: When funds are released
- 🔄 **Refunds**: When refunds are processed

### Advanced Settings

#### Frequency
- **Immediate**: Get notifications right away
- **Hourly**: Batch notifications every hour
- **Daily**: Receive a daily digest

#### Quiet Hours
- Set start and end times
- Notifications are suppressed during these hours
- Example: 22:00 to 08:00 (no notifications while sleeping)

## Developer Guide

### Get User Preferences
```typescript
import { getNotificationPreferences } from '@/lib/notifications/preferences'

const prefs = await getNotificationPreferences(userWallet)
console.log('In-app enabled:', prefs.inAppEnabled)
```

### Update Preferences
```typescript
import { updateNotificationPreferences } from '@/lib/notifications/preferences'

await updateNotificationPreferences(userWallet, {
  inAppEnabled: true,
  browserEnabled: true,
  notificationFrequency: 'hourly'
})
```

### Check if Notification Should Be Sent
```typescript
import { shouldSendNotification } from '@/lib/notifications/preferences'

const shouldSend = await shouldSendNotification(
  userWallet,
  'deposit',
  'in_app'
)

if (shouldSend) {
  // Send the notification
}
```

### Check Quiet Hours
```typescript
import { isInQuietHours } from '@/lib/notifications/preferences'

const prefs = await getNotificationPreferences(userWallet)
if (!isInQuietHours(prefs)) {
  // Send notification
}
```

## API Usage

### Get Preferences
```bash
curl "http://localhost:3000/api/notifications/preferences?wallet=YOUR_WALLET"
```

### Update Preferences
```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "YOUR_WALLET",
    "updates": {
      "inAppEnabled": true,
      "browserEnabled": true,
      "emailEnabled": true,
      "emailAddress": "user@example.com",
      "notificationFrequency": "immediate"
    }
  }'
```

## Common Use Cases

### 1. Enable All Notifications
```typescript
await updateNotificationPreferences(wallet, {
  inAppEnabled: true,
  browserEnabled: true,
  emailEnabled: true,
  emailAddress: 'user@example.com'
})
```

### 2. Only Critical Notifications
```typescript
await updateNotificationPreferences(wallet, {
  inAppEnabled: true,
  inAppDeposits: false,
  inAppWorkSubmissions: false,
  inAppApprovals: false,
  inAppDisputes: true,
  inAppTimeouts: true,
  inAppReleases: true,
  inAppRefunds: true
})
```

### 3. Quiet Hours for Sleep
```typescript
await updateNotificationPreferences(wallet, {
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
})
```

### 4. Daily Digest
```typescript
await updateNotificationPreferences(wallet, {
  notificationFrequency: 'daily'
})
```

## Troubleshooting

### Preferences Not Saving
- ✅ Check wallet is connected
- ✅ Verify API endpoint is accessible
- ✅ Check browser console for errors
- ✅ Ensure database schema is applied

### Notifications Not Appearing
- ✅ Check if notification type is enabled
- ✅ Verify not in quiet hours
- ✅ Check notification queue table
- ✅ Verify delivery status

### Browser Notifications Not Working
- ✅ Check browser permissions
- ✅ Ensure HTTPS connection
- ✅ Verify browser supports notifications
- ✅ Check if enabled in preferences

## Testing Checklist

- [ ] Database schema applied
- [ ] Verification script passes
- [ ] Can access preferences page
- [ ] Can toggle in-app notifications
- [ ] Can toggle browser notifications
- [ ] Can toggle email notifications
- [ ] Can set email address
- [ ] Can change frequency
- [ ] Can enable quiet hours
- [ ] Can set quiet hours times
- [ ] Changes persist after save
- [ ] Changes persist after page reload

## Next Steps

1. **Integrate with Notification System**: Connect preferences with Tasks 14.1-14.3
2. **Test All Scenarios**: Test each notification type and channel
3. **User Documentation**: Create user-facing help documentation
4. **Analytics**: Track which preferences are most popular
5. **Enhancements**: Add more advanced filtering options

## Support

For issues or questions:
1. Check the full guide: `NOTIFICATION_PREFERENCES_GUIDE.md`
2. Review implementation: `TASK_14.4_IMPLEMENTATION_SUMMARY.md`
3. Run verification: `scripts/verify-notification-preferences.ts`
