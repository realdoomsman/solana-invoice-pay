# 🟢 DEVNET MODE ACTIVE

You're now on **DEVNET** for safe testing!

## ✅ Current Configuration

- Network: **Devnet**
- RPC: `https://api.devnet.solana.com`
- Mode: **Testing (Free)**

---

## 🎯 Next Steps

### 1. Restart Your Dev Server

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

### 2. Get Free Devnet SOL

**Option A: Web Faucet (Easiest)**
1. Go to https://faucet.solana.com/
2. Paste your wallet: `C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2`
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. You get 1 SOL!

**Option B: Command Line**
```bash
solana airdrop 2 C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2 --url devnet
```

### 3. Test Your Platform

1. Visit http://localhost:3000
2. Create a payment (use 0.1 SOL)
3. Pay it with your wallet (make sure wallet is on devnet!)
4. Verify it works!

---

## 🔄 Switch Back to Mainnet

When done testing:

```bash
cp .env.production .env.local
npm run dev
```

---

## ⚠️ Important

- **Wallet must be on devnet** - Switch in wallet settings
- **Devnet SOL is free** - Not real money
- **Test everything** - It's safe!
- **Check Explorer** - https://explorer.solana.com/?cluster=devnet

---

**You're ready to test! 🧪**
