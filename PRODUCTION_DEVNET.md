# ⚠️ PRODUCTION IS NOW ON DEVNET

## 🟡 Current Status

Your live website is now configured for **DEVNET TESTING**

- **Live URL:** https://solana-invoice-pay.vercel.app
- **Network:** Devnet (free testing)
- **RPC:** https://api.devnet.solana.com

---

## ✅ What This Means

### For Testing
- ✅ Users can test for free
- ✅ No real money needed
- ✅ Safe to experiment
- ✅ Get free SOL from faucet

### For Production
- ⚠️ **NOT ready for real users yet**
- ⚠️ Transactions use devnet SOL (not real)
- ⚠️ Need to switch back to mainnet before launch

---

## 🎯 How to Use

### 1. Visit Your Site
https://solana-invoice-pay.vercel.app

### 2. Get Devnet SOL
- Go to https://faucet.solana.com/
- Select "Devnet"
- Get free SOL

### 3. Test Everything
- Create payments
- Test all features
- Verify everything works

---

## 🔄 Switch Back to Mainnet

When ready for real users:

### Step 1: Update .env.production
```bash
# Change these lines:
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Back to:
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Step 2: Push Changes
```bash
git add .env.production
git commit -m "🚀 Switch to mainnet for production"
git push
```

### Step 3: Verify
- Wait for Vercel deployment
- Test with small real amount (0.01 SOL)
- Go live!

---

## 📋 Testing Checklist

Before switching to mainnet:

- [ ] Test simple payments
- [ ] Test split payments
- [ ] Test escrow
- [ ] Test goals/crowdfunding
- [ ] Test referrals
- [ ] Test on mobile
- [ ] Test QR codes
- [ ] Test wallet connection
- [ ] Verify auto-forwarding
- [ ] Check all links work

---

## ⚠️ Important Notes

### While on Devnet:
- Tell users it's in testing mode
- Add banner: "Testing Mode - Using Devnet"
- Don't accept real payments
- Document any bugs

### Before Mainnet:
- Test everything thoroughly
- Fix all bugs
- Update documentation
- Prepare support channels

---

## 🎨 Add Testing Banner (Optional)

Add this to your homepage to show it's in testing:

```tsx
{process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' && (
  <div className="bg-yellow-500 text-black text-center py-2 font-semibold">
    ⚠️ TESTING MODE - Using Devnet (Free SOL)
  </div>
)}
```

---

## 🚀 Deployment Status

Your changes will deploy automatically to Vercel.

**Check:** https://vercel.com/dashboard

Once deployed, your live site will be on devnet!

---

## 💡 Pro Tips

1. **Test thoroughly** - This is your chance to find bugs
2. **Get feedback** - Share with friends for testing
3. **Document issues** - Keep track of what needs fixing
4. **Test edge cases** - Try to break it!
5. **Mobile testing** - Test on actual phones

---

## 🆘 Need Help?

### Get Devnet SOL
- https://faucet.solana.com/
- Or: `solana airdrop 2 YOUR_WALLET --url devnet`

### Check Network
- Visit https://explorer.solana.com/?cluster=devnet
- Verify transactions appear there

### Issues?
- Check console for errors
- Verify wallet is on devnet
- Make sure you have enough SOL for rent

---

**Happy Testing! 🧪**

Remember to switch back to mainnet before real launch!
