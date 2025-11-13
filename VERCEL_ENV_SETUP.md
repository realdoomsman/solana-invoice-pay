# 🔧 Set Vercel to Devnet

Since `.env.production` is gitignored, you need to update environment variables directly in Vercel.

## 🎯 Quick Setup (2 minutes)

### Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Click on your project: **solana-invoice-pay**
3. Go to **Settings** tab
4. Click **Environment Variables** in sidebar

### Step 2: Update These Variables

Find and update these to devnet values:

```
NEXT_PUBLIC_SOLANA_NETWORK
Change to: devnet

NEXT_PUBLIC_SOLANA_RPC_URL
Change to: https://api.devnet.solana.com
```

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the **...** menu on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

---

## ✅ Your Site Will Be on Devnet!

Once redeployed:
- Visit https://solana-invoice-pay.vercel.app
- It will use devnet
- Free testing for everyone!

---

## 🔄 Switch Back to Mainnet Later

Update the same variables back to:

```
NEXT_PUBLIC_SOLANA_NETWORK = mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL = https://mainnet.helius-rpc.com/?api-key=3392cc05-aa24-42e4-a940-98b98fc13578
```

Then redeploy!

---

**That's it!** 🚀
