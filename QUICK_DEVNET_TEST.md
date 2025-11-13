# ⚡ Quick Devnet Test (5 Minutes)

## 🎯 Super Fast Setup

### 1. Switch to Devnet (30 seconds)

```bash
# Copy devnet config
cp .env.devnet .env.local

# Restart server
npm run dev
```

### 2. Get Free SOL (1 minute)

**Option A: Web Faucet**
1. Go to https://faucet.solana.com/
2. Paste your wallet: `C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2`
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. Done! You have 1 SOL

**Option B: Command Line**
```bash
solana airdrop 2 C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2 --url devnet
```

### 3. Test Payment (2 minutes)

1. **Create Payment**
   - Go to http://localhost:3000
   - Enter wallet: `C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2`
   - Amount: `0.1`
   - Click "Create Payment Link"

2. **Pay It**
   - Open the payment link
   - Switch wallet to Devnet
   - Click "Pay with Wallet"
   - Approve transaction

3. **Verify**
   - Payment status → "Paid" ✅
   - Check wallet balance increased
   - View on Explorer: https://explorer.solana.com/?cluster=devnet

---

## ✅ Done!

You just tested:
- Payment creation ✅
- QR code generation ✅
- Wallet connection ✅
- Transaction processing ✅
- Auto-forwarding ✅

---

## 🔄 Switch Back to Mainnet

```bash
# Restore mainnet config
cp .env.production .env.local

# Restart
npm run dev
```

---

## 🎯 Test More Features?

See `DEVNET_TESTING.md` for:
- Split payments
- Escrow
- Goals/Crowdfunding
- Referrals
- Edge cases

---

**That's it! 5 minutes, fully tested!** ⚡
