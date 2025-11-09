# Fix Vercel Environment Variables

## Problem
The auto-forwarding isn't working on Vercel because the server-side environment variables are missing.

## Solution

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/dashboard

### 2. Select Your Project
Click on `solana-invoice-pay`

### 3. Go to Settings → Environment Variables
Click "Settings" in the top menu, then "Environment Variables" in the sidebar

### 4. Add These Variables

**IMPORTANT:** Add these as **Production** environment variables:

```
PLATFORM_FEE_PERCENTAGE = 1
PLATFORM_FEE_WALLET = C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2
ENCRYPTION_KEY = 2d095bec9a2b7e7004ba14041653a3dcc5e8409b7494002cfebcec917a50feaf
```

Also make sure these are set:
```
NEXT_PUBLIC_SOLANA_NETWORK = mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL = https://mainnet.helius-rpc.com/?api-key=3392cc05-aa24-42e4-a940-98b98fc13578
NEXT_PUBLIC_FEE_WALLET = C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE = 1
NEXT_PUBLIC_BASE_URL = https://solana-invoice-pay.vercel.app
```

### 5. Redeploy

After adding the variables, you need to redeploy:

**Option A: From Dashboard**
- Go to "Deployments" tab
- Click the three dots (...) on the latest deployment
- Click "Redeploy"

**Option B: From CLI**
```bash
vercel --prod
```

### 6. Test Again

After redeployment:
1. Create a new payment link
2. Send a small amount (0.01 SOL)
3. Keep the payment page open
4. It should auto-forward within 2-3 seconds

## Quick Test

To verify environment variables are set correctly, visit:
```
https://solana-invoice-pay.vercel.app/api/health
```

Should return `{"status":"healthy"}`
