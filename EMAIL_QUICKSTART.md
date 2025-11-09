# Email Setup - Quick Start

## 5-Minute Setup

### 1. Create SendGrid Account
```
https://sendgrid.com → Sign up (free)
```

### 2. Get API Key
```
Settings → API Keys → Create API Key
Name: solana-invoice-pay
Access: Full Access
COPY THE KEY!
```

### 3. Verify Your Email
```
Settings → Sender Authentication → Verify Single Sender
Enter your email → Verify
```

### 4. Add to .env.local
```bash
SENDGRID_API_KEY=paste_your_key_here
NOTIFICATION_EMAIL=your_verified_email@example.com
```

### 5. Test It
```bash
npx tsx scripts/test-email.ts your_email@example.com
```

Check your inbox!

---

## What You Get

Automatic emails for:
- Payment link created
- Payment received
- Beautiful HTML templates
- Transaction links

## Cost

FREE: 100 emails/day forever

That's it! 🎉

Full guide: See EMAIL_SETUP.md
