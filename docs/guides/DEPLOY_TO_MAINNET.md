# 🚀 Deploy to Mainnet - Complete Guide

## ⚠️ IMPORTANT: Read This First

You are about to deploy to **Solana Mainnet** where **real money** is involved. Follow these steps carefully.

## 📋 Pre-Deployment Checklist

### 1. Verify Your Wallet
- [ ] You have a Solana mainnet wallet
- [ ] You have backed up your seed phrase
- [ ] You have some SOL for testing (~0.1 SOL minimum)
- [ ] You know your wallet address

### 2. Get a Reliable RPC Provider

**Why?** The public RPC endpoint is rate-limited and may be slow.

**Recommended Providers (Free Tier Available):**

1. **Helius** (Recommended)
   - Visit: https://www.helius.dev
   - Sign up for free account
   - Get your RPC URL
   - Free tier: 100 requests/second

2. **QuickNode**
   - Visit: https://www.quicknode.com
   - Create free endpoint
   - Get your RPC URL
   - Free tier: 10 requests/second

3. **Alchemy**
   - Visit: https://www.alchemy.com
   - Create Solana endpoint
   - Get your RPC URL

### 3. Configure Environment Variables

Edit your `.env.local` file:

```bash
# REQUIRED: Set to mainnet
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# REQUIRED: Your RPC URL (get from Helius/QuickNode)
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-url-here

# REQUIRED: Your mainnet wallet to receive fees
NEXT_PUBLIC_FEE_WALLET=YOUR_MAINNET_WALLET_ADDRESS

# REQUIRED: Platform fee percentage
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=1

# REQUIRED: Generate new encryption key
# Run: openssl rand -hex 32
ENCRYPTION_KEY=your_new_secure_random_key

# REQUIRED: Your production domain
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# OPTIONAL: Database (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OPTIONAL: Email notifications
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### 4. Generate Secure Encryption Key

```bash
# On Mac/Linux:
openssl rand -hex 32

# Copy the output and use it as ENCRYPTION_KEY
```

## 🔍 Verification Steps

### Step 1: Run Verification Script

```bash
npm run verify
```

This checks:
- ✅ Environment variables are set
- ✅ Network is mainnet-beta
- ✅ Fee wallet is configured
- ✅ Encryption key is secure
- ✅ Required files exist
- ✅ Security settings

### Step 2: Test Build Locally

```bash
# Build the production version
npm run build

# Start production server locally
npm start
```

Visit `http://localhost:3000` and test:
- [ ] Create a payment link
- [ ] Check the network indicator (should say "Mainnet Live")
- [ ] Verify fee wallet address is correct
- [ ] Test with a small amount (0.01 SOL)

### Step 3: Test on Mainnet (Small Amount)

**IMPORTANT:** Test with small amounts first!

1. Create a payment link for 0.01 SOL
2. Send payment from your wallet
3. Verify funds arrive at merchant wallet
4. Check platform fee was deducted correctly
5. Verify transaction on Solscan

## 🌐 Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: Using GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

### Configure Environment Variables in Vercel

1. Go to your project in Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:

```
NEXT_PUBLIC_SOLANA_NETWORK = mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL = your_rpc_url
NEXT_PUBLIC_FEE_WALLET = your_wallet_address
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE = 1
ENCRYPTION_KEY = your_encryption_key
NEXT_PUBLIC_BASE_URL = https://yourdomain.vercel.app
```

4. Click "Save"
5. Redeploy the project

## 🎯 Post-Deployment Checklist

### Immediate Checks (First 5 Minutes)

- [ ] Visit your production URL
- [ ] Check `/status` page - all systems operational
- [ ] Check `/api/health` endpoint returns 200
- [ ] Verify network indicator shows "Mainnet Live"
- [ ] Create a test payment link
- [ ] Test with 0.01 SOL
- [ ] Verify funds arrive correctly
- [ ] Check fee deduction is correct

### First Hour Monitoring

- [ ] Monitor `/status` page
- [ ] Check for any errors in Vercel logs
- [ ] Test all payment types:
  - [ ] Simple payment
  - [ ] Split payment
  - [ ] Escrow payment
  - [ ] Goal-based payment
- [ ] Test on mobile device
- [ ] Test with different wallets (Phantom, Solflare, etc.)

### First Day Monitoring

- [ ] Check transaction success rate
- [ ] Monitor RPC performance
- [ ] Review any user feedback
- [ ] Check fee collection
- [ ] Monitor system status

## 🔒 Security Best Practices

### DO:
✅ Use environment variables for all secrets
✅ Use a reliable RPC provider
✅ Test with small amounts first
✅ Monitor the status page regularly
✅ Keep encryption keys secure
✅ Rotate keys periodically
✅ Enable rate limiting
✅ Monitor for suspicious activity

### DON'T:
❌ Commit .env.local to git
❌ Share your encryption key
❌ Use default/example values in production
❌ Skip testing on mainnet
❌ Deploy without verification
❌ Use public RPC for high traffic
❌ Ignore error logs

## 📊 Monitoring Your Platform

### Health Checks

```bash
# Check system health
curl https://yourdomain.com/api/health

# Should return:
{
  "status": "healthy",
  "services": {
    "solana": { "status": "healthy", "latency": 123 },
    "platform": { "status": "healthy" }
  }
}
```

### Status Page

Visit: `https://yourdomain.com/status`

Monitor:
- Solana network status
- RPC endpoint latency
- Platform services status

### Vercel Logs

```bash
# View real-time logs
vercel logs --follow

# View recent logs
vercel logs
```

## 🚨 Troubleshooting

### Issue: "Network Error" or "RPC Error"

**Solution:**
1. Check your RPC URL is correct
2. Verify RPC provider is operational
3. Check rate limits on your RPC plan
4. Try switching to a different RPC provider

### Issue: "Insufficient Funds" Error

**Solution:**
1. Ensure payment wallet has enough SOL for transaction
2. Check network fees (usually ~0.000005 SOL)
3. Verify merchant wallet address is correct

### Issue: "Payment Not Forwarding"

**Solution:**
1. Check `/api/forward-payment` logs in Vercel
2. Verify encryption key is correct
3. Check payment wallet has enough SOL for forwarding fee
4. Review transaction on Solscan

### Issue: High Latency

**Solution:**
1. Upgrade to paid RPC plan
2. Use a closer RPC endpoint (geographic)
3. Enable caching where possible
4. Consider using multiple RPC endpoints

## 💰 Cost Estimates

### Solana Network Fees
- Transaction fee: ~$0.00025 per transaction
- Very low, predictable costs

### RPC Provider Costs
- **Free Tier**: 0-100 req/sec (sufficient for starting)
- **Paid Tier**: $50-200/month (for high traffic)

### Vercel Hosting
- **Hobby**: Free (sufficient for starting)
- **Pro**: $20/month (for custom domains, analytics)

### Total Monthly Cost (Starting)
- **Minimum**: $0 (using free tiers)
- **Recommended**: $50-100 (paid RPC + Vercel Pro)

## 📈 Scaling Considerations

### When to Upgrade RPC

Upgrade when you experience:
- Rate limiting errors
- Slow response times (>1 second)
- High traffic (>100 requests/second)

### When to Upgrade Hosting

Upgrade Vercel when you need:
- Custom domain
- Advanced analytics
- Team collaboration
- Priority support

## 🎉 Launch Announcement

Once everything is tested and working:

### Social Media Template

```
🚀 Launching [Your Platform Name]!

Accept Solana payments instantly:
✅ Payment links in seconds
✅ Split payments & escrow
✅ <1s confirmations
✅ $0.00025 avg fees
✅ Non-custodial & secure

Try it now: [your-domain.com]

Built on @solana 💜

#Solana #Crypto #Payments #Web3
```

### Product Hunt Launch

Consider launching on Product Hunt:
1. Create compelling screenshots
2. Write clear description
3. Prepare demo video
4. Engage with comments
5. Share on social media

## 📞 Support

### If You Need Help

1. Check `/faq` page
2. Review documentation
3. Check Vercel logs
4. Visit Solana Discord
5. Open GitHub issue

## ✅ Final Checklist

Before announcing your launch:

- [ ] All tests passing on mainnet
- [ ] Environment variables configured
- [ ] RPC provider set up
- [ ] Fee wallet receiving payments
- [ ] Status page operational
- [ ] Terms & Privacy pages reviewed
- [ ] Mobile testing complete
- [ ] Multiple wallet testing done
- [ ] Small transaction tested successfully
- [ ] Monitoring set up
- [ ] Backup plan ready
- [ ] Support channels ready

## 🎊 You're Live!

Congratulations! Your platform is now live on Solana mainnet.

**Remember:**
- Start small and scale gradually
- Monitor closely in the first week
- Collect user feedback
- Iterate and improve
- Stay engaged with your users

**Good luck with your launch! 🚀**

---

Need help? Check the docs or open an issue on GitHub.
