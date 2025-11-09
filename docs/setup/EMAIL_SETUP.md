# Email Setup Guide (SendGrid)

## Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address

## Step 2: Create API Key

1. Log in to SendGrid
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Name it: `solana-invoice-pay`
5. Select "Full Access"
6. Click "Create & View"
7. **COPY THE KEY NOW** (you won't see it again!)

## Step 3: Verify Sender Email

SendGrid requires you to verify the email you'll send from:

1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details:
   - From Name: `Solana Pay`
   - From Email: Your email (e.g., `you@gmail.com`)
   - Reply To: Same email
   - Company: Your company name
   - Address: Your address
4. Click "Create"
5. Check your email and click the verification link

## Step 4: Update .env.local

Add these to your `.env.local`:

```bash
SENDGRID_API_KEY=your_api_key_here
NOTIFICATION_EMAIL=your_verified_email@example.com
```

## Step 5: Test Email

Run this test:

```bash
npx tsx scripts/test-email.ts your_email@example.com
```

You should receive a test email!

## Email Features

Your app will now send emails for:

1. **Payment Link Created**
   - Sent when you create a payment link
   - Includes the payment link and QR code
   - Helps you keep track of requests

2. **Payment Received**
   - Sent when payment is confirmed
   - Includes transaction details
   - Links to Solana Explorer

## Free Tier Limits

SendGrid Free Plan:
- 100 emails per day
- Forever free
- No credit card required

Perfect for:
- Testing
- Small businesses
- Personal use

## Upgrade When Needed

**Essentials Plan ($20/mo):**
- 50,000 emails/month
- Email templates
- Analytics
- Support

**Pro Plan ($90/mo):**
- 100,000 emails/month
- Advanced analytics
- Dedicated IP
- Priority support

## Troubleshooting

### Email not sending?

1. Check API key is correct
2. Verify sender email is verified
3. Check SendGrid dashboard for errors
4. Look at console logs for error messages

### Emails going to spam?

1. Verify your sender email
2. Add SPF/DKIM records (in SendGrid settings)
3. Use a custom domain (advanced)

### Rate limited?

Free tier: 100 emails/day
- Upgrade to Essentials for more
- Or implement email queuing

## Optional: Custom Domain

For professional emails (e.g., `noreply@yourdomain.com`):

1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow the DNS setup instructions
4. Update `NOTIFICATION_EMAIL` in `.env.local`

## Cost Summary

- **Free**: 100 emails/day (perfect for testing)
- **$20/mo**: 50,000 emails/month (small business)
- **$90/mo**: 100,000 emails/month (growing business)

Start free, upgrade when you need more!
