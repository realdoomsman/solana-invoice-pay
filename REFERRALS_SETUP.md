# 💰 Referral System Setup Guide

## What's Included

A complete referral system that rewards users for bringing new customers!

### Features
- 🎯 Unique referral codes for each user
- 💵 5% commission on platform fees
- 📊 Real-time earnings tracking
- 🏆 Leaderboard
- 📱 Easy sharing (copy/share buttons)
- 📈 Detailed analytics

## Database Setup

### 1. Run the SQL Schema

Go to your Supabase dashboard:

1. Open your project at https://supabase.com
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase-referrals-schema.sql`
5. Paste and click **Run**

This creates 3 tables:
- `referrals` - User referral codes and stats
- `referral_relationships` - Who referred whom
- `referral_earnings` - Commission tracking

### 2. Verify Tables

In Supabase:
1. Go to **Table Editor**
2. You should see:
   - ✅ referrals
   - ✅ referral_relationships
   - ✅ referral_earnings

## How It Works

### User Flow

1. **User signs up**
   - Gets unique referral code (e.g., `C7YH-A2B3C4`)
   - Can share link: `https://noviq.fun?ref=C7YH-A2B3C4`

2. **Friend clicks link**
   - Referral code stored in browser
   - Friend signs up and creates account
   - Relationship tracked in database

3. **Friend makes payment**
   - Platform charges 3% fee
   - Referrer earns 5% of that fee (0.15% of payment)
   - Commission credited automatically

### Commission Example

```
Payment: 100 SOL
Platform fee (3%): 3 SOL
Referrer commission (5% of fee): 0.15 SOL
```

## Integration Points

### 1. Track Referral Signups

In your signup/login flow, add:

```typescript
import { trackReferralSignup } from '@/lib/referrals'

// After user signs up
const urlParams = new URLSearchParams(window.location.search)
const refCode = urlParams.get('ref')

if (refCode) {
  await trackReferralSignup(refCode, userWallet)
}
```

### 2. Track Commissions

In your payment processing (after successful payment):

```typescript
import { trackReferralCommission } from '@/lib/referrals'

// After payment is confirmed
await trackReferralCommission(
  paymentId,
  payerWallet,
  amount,
  platformFee
)
```

### 3. Display Referral Page

Already created at `/referrals`!

Users can:
- View their referral code
- See total referrals and earnings
- Copy/share their link
- View earnings history
- Check leaderboard

## Testing the System

### 1. Create a Referral Code

```bash
# Start your app
npm run dev

# Visit http://localhost:3000/login
# Sign in with a wallet
# Visit http://localhost:3000/referrals
# You should see your referral code
```

### 2. Test Referral Flow

```bash
# Copy your referral link
# Open in incognito window
# Sign up with different wallet
# Create a payment
# Check your referrals page - should show 1 referral
```

### 3. Test Commission

```bash
# Have referred user make a payment
# Check referrals page
# Should see commission in earnings
```

## Customization

### Change Commission Rate

In `lib/referrals.ts`, line 72:

```typescript
// Current: 5% of platform fee
const commission = platformFee * 0.05

// Change to 10%:
const commission = platformFee * 0.10
```

### Change Referral Code Format

In `lib/referrals.ts`, line 20:

```typescript
export function generateReferralCode(walletAddress: string): string {
  const shortWallet = walletAddress.slice(0, 4) + walletAddress.slice(-4)
  const random = nanoid(6).toUpperCase()
  return `${shortWallet}-${random}` // Customize format here
}
```

## Marketing Ideas

### 1. Promote Referrals

Add to homepage:
```tsx
<div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-lg">
  <h3>💰 Earn 5% Commission</h3>
  <p>Refer friends and earn on every payment they make!</p>
  <a href="/referrals">Get Your Referral Link →</a>
</div>
```

### 2. Email Notifications

When someone uses your referral:
```typescript
// Send email to referrer
await sendEmail({
  to: referrerEmail,
  subject: 'New Referral Signup!',
  body: 'Someone just signed up using your referral link!'
})
```

### 3. Social Sharing

Pre-filled tweets:
```typescript
const tweetText = `I'm earning passive income with @NOVIQ! Get 5% commission on every payment. Join me: ${referralLink}`
const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
```

## Analytics

Track referral performance:

```typescript
// Get top referrers
const leaderboard = await getReferralLeaderboard(10)

// Get user stats
const { stats, earnings } = await getReferralStats(wallet)

// Total platform referral stats
const totalReferrals = await supabase
  .from('referrals')
  .select('total_referrals')
  .sum('total_referrals')
```

## Security

- ✅ Referral codes are unique
- ✅ Can't refer yourself
- ✅ Commission only on real payments
- ✅ All tracked in database
- ✅ Row-level security enabled

## Payout System (Future)

To add automatic payouts:

1. Track pending commissions
2. Set minimum payout threshold (e.g., 1 SOL)
3. Create payout request system
4. Process payouts weekly/monthly
5. Send confirmation emails

## Support

Common questions:

**Q: When do I get paid?**
A: Commissions are tracked in real-time. Payouts can be manual or automated.

**Q: Is there a limit?**
A: No limit! Earn on every payment your referrals make, forever.

**Q: Can I refer myself?**
A: No, the system prevents self-referrals.

**Q: What if someone uses multiple referral codes?**
A: First referral code wins. Relationship is permanent.

## Next Steps

1. ✅ Run SQL schema in Supabase
2. ✅ Test referral code generation
3. ✅ Test referral signup flow
4. ✅ Test commission tracking
5. 🚀 Promote to users!

---

**Start earning with referrals! 💰**
