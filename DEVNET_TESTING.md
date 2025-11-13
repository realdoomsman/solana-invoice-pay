# 🧪 Devnet Testing Guide

## 🎯 Why Test on Devnet?

- **Free SOL** - No real money needed
- **Safe Testing** - Can't lose real funds
- **Fast Iteration** - Test features quickly
- **Same as Mainnet** - Works exactly the same

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Switch to Devnet

Update your `.env.local`:

```bash
# Change this line:
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# To this:
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# And update RPC (optional, but faster):
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Get Devnet SOL

You need devnet SOL to test. Here's how:

---

## 💰 Get Free Devnet SOL

### Method 1: Solana CLI (Fastest)

```bash
# Install Solana CLI if you don't have it
# Visit: https://docs.solana.com/cli/install-solana-cli-tools

# Airdrop 2 SOL to your wallet
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Example:
solana airdrop 2 C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2 --url devnet
```

### Method 2: Web Faucet

1. Go to https://faucet.solana.com/
2. Paste your wallet address
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. Wait 10-30 seconds
6. Check your wallet!

### Method 3: Phantom Wallet

1. Open Phantom wallet
2. Click Settings (gear icon)
3. Change network to "Devnet"
4. Click "Airdrop" button
5. Get 1 SOL instantly

### Method 4: Use the Script

```bash
# I created a helper script for you
npm run get-devnet-sol YOUR_WALLET_ADDRESS

# Or manually:
node scripts/get-devnet-sol.ts YOUR_WALLET_ADDRESS
```

---

## 🧪 Testing Checklist

### 1. Test Simple Payment

1. **Create Payment Link**
   - Go to homepage
   - Enter your devnet wallet address
   - Amount: 0.1 SOL
   - Description: "Test payment"
   - Click "Create Payment Link"

2. **Make Payment**
   - Open payment link
   - Connect wallet (make sure it's on devnet!)
   - Click "Pay with Wallet"
   - Approve transaction
   - Wait for confirmation

3. **Verify**
   - Check payment status changes to "Paid"
   - Check your wallet received the SOL
   - Check transaction on Devnet Explorer

### 2. Test Split Payment

1. **Create Split**
   - Go to `/create/split`
   - Add 2-3 recipient wallets
   - Set percentages (must total 100%)
   - Create payment

2. **Pay**
   - Send payment
   - Verify each recipient gets correct amount

3. **Check**
   - All recipients should receive their share
   - Check on Devnet Explorer

### 3. Test Escrow

1. **Create Escrow**
   - Go to `/create/escrow`
   - Set buyer and seller wallets
   - Add milestones
   - Create

2. **Test Flow**
   - Buyer deposits funds
   - Seller completes milestone
   - Buyer releases payment
   - Verify funds transfer

### 4. Test Goal/Crowdfunding

1. **Create Goal**
   - Go to `/create/goal`
   - Set target amount
   - Create goal

2. **Contribute**
   - Make contributions
   - Watch progress bar update
   - Test reaching goal

---

## 🔍 Verify Transactions

### Devnet Explorer

Visit: https://explorer.solana.com/?cluster=devnet

**Check your transaction:**
1. Copy transaction signature from payment page
2. Paste in Devnet Explorer
3. Verify:
   - Status: Success ✅
   - From: Payment wallet
   - To: Your wallet
   - Amount: Correct

### In Your Wallet

1. Switch wallet to Devnet
2. Check transaction history
3. Verify balance increased

---

## 🐛 Common Issues

### Issue: "Insufficient funds"

**Solution:**
```bash
# Get more devnet SOL
solana airdrop 2 YOUR_WALLET --url devnet
```

### Issue: "Transaction failed"

**Causes:**
- Not enough SOL for rent (need ~0.002 SOL minimum)
- Network congestion
- Wrong network (check you're on devnet)

**Solution:**
```bash
# Get more SOL
solana airdrop 2 YOUR_WALLET --url devnet

# Check balance
solana balance YOUR_WALLET --url devnet
```

### Issue: "Wallet not connecting"

**Solution:**
1. Open wallet settings
2. Switch to Devnet network
3. Refresh page
4. Try connecting again

### Issue: "Payment not forwarding"

**Check:**
- Payment wallet has enough SOL for rent
- Merchant wallet address is correct
- Network is set to devnet
- Check console for errors

---

## 📊 Testing Scenarios

### Scenario 1: Small Payment
```
Amount: 0.01 SOL
Purpose: Test minimum payment
Expected: Works, auto-forwards
```

### Scenario 2: Large Payment
```
Amount: 10 SOL
Purpose: Test with larger amount
Expected: Works, fee calculated correctly
```

### Scenario 3: Multiple Payments
```
Create 5 payment links
Pay each one
Check dashboard shows all
```

### Scenario 4: Failed Payment
```
Try to pay without enough SOL
Should show error message
Payment status stays "pending"
```

### Scenario 5: Referral Flow
```
1. Get referral code from /referrals
2. Share link with ?ref=CODE
3. Friend signs up
4. Friend makes payment
5. Check you earned commission
```

---

## 🔄 Switch Back to Mainnet

When done testing:

### Step 1: Update .env.local

```bash
# Change back to:
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Step 2: Restart Server

```bash
npm run dev
```

### Step 3: Switch Wallet

1. Open wallet
2. Settings → Network
3. Select "Mainnet Beta"

---

## 🎯 Testing Best Practices

### Do's ✅

- Test all payment types
- Test with different amounts
- Test error cases
- Check transaction on explorer
- Test on mobile
- Test with different wallets
- Document any bugs

### Don'ts ❌

- Don't use real money on devnet
- Don't skip testing edge cases
- Don't forget to check auto-forwarding
- Don't test only happy paths
- Don't forget to test mobile

---

## 📝 Test Report Template

```markdown
## Test Session: [Date]

### Environment
- Network: Devnet
- Wallet: [Address]
- Browser: [Chrome/Firefox/etc]

### Tests Performed
1. Simple Payment
   - Status: ✅ Pass / ❌ Fail
   - Notes: 

2. Split Payment
   - Status: ✅ Pass / ❌ Fail
   - Notes:

3. Escrow
   - Status: ✅ Pass / ❌ Fail
   - Notes:

4. Goal
   - Status: ✅ Pass / ❌ Fail
   - Notes:

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected:
   - Actual:

### Overall Status
- Ready for mainnet: Yes/No
- Confidence level: High/Medium/Low
```

---

## 🚀 Quick Test Script

Run all tests automatically:

```bash
# Create test payment
npm run test:payment

# Test all features
npm run test:all

# Generate test report
npm run test:report
```

---

## 💡 Pro Tips

1. **Keep Devnet SOL**
   - Airdrop to multiple wallets
   - Save addresses for future testing

2. **Use Test Wallets**
   - Create separate wallets for testing
   - Don't use your main wallet

3. **Document Everything**
   - Take screenshots
   - Save transaction signatures
   - Note any weird behavior

4. **Test Edge Cases**
   - Very small amounts (0.001 SOL)
   - Very large amounts (100 SOL)
   - Invalid addresses
   - Network errors

5. **Mobile Testing**
   - Test on actual phone
   - Test QR code scanning
   - Test wallet connection

---

## 🆘 Need Help?

### Get More Devnet SOL

If faucet is rate-limited:
```bash
# Wait 24 hours, or
# Use different wallet address, or
# Ask in Solana Discord for devnet SOL
```

### Check Network Status

```bash
# Check if devnet is working
solana cluster-version --url devnet

# Check your balance
solana balance YOUR_WALLET --url devnet
```

### Debug Issues

```bash
# Check logs
npm run dev
# Look for errors in console

# Check transaction
# Visit: https://explorer.solana.com/?cluster=devnet
# Paste transaction signature
```

---

## ✅ Ready to Test?

**Quick Start:**
1. Change `.env.local` to devnet
2. Restart: `npm run dev`
3. Get SOL: Visit https://faucet.solana.com/
4. Create payment and test!

**After Testing:**
1. Switch back to mainnet
2. Deploy to production
3. Test with small real amount (0.01 SOL)
4. Go live! 🚀

---

**Happy Testing!** 🧪
