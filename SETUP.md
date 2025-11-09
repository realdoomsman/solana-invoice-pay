# Quick Setup Guide

## 1. Configure Your Merchant Wallet

Open `.env.local` and add your Solana wallet address:

```bash
NEXT_PUBLIC_MERCHANT_WALLET=YourSolanaWalletAddressHere
```

This is where all payments will be forwarded to.

## 2. Choose Network

For testing, use devnet (default):
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

For production, use mainnet:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## 3. Get Test SOL (Devnet Only)

If testing on devnet, get free SOL from:
https://faucet.solana.com

## 4. Test the Flow

1. Go to http://localhost:3001
2. Create a payment link (e.g., 0.1 SOL)
3. You'll see a unique wallet address and QR code
4. Send SOL to that address from any wallet
5. Watch it auto-detect and forward to your merchant wallet!

## How It Works

```
Customer → Unique Payment Wallet → Auto-Forward → Your Merchant Wallet
```

Each payment gets its own temporary wallet for tracking. Once payment is received, the system automatically forwards all funds (minus fees) to your configured merchant wallet.

## Production Checklist

Before going live:

- [ ] Switch to mainnet-beta
- [ ] Set up proper database (replace localStorage)
- [ ] Store private keys securely in backend only
- [ ] Add authentication
- [ ] Set up monitoring and alerts
- [ ] Add webhook support for integrations
- [ ] Implement proper error handling
- [ ] Add rate limiting
- [ ] Set up backup system for payment data

## Security Warning

⚠️ The current implementation stores private keys in localStorage for demo purposes. 

**For production:**
- Store private keys encrypted in your backend database
- Never expose private keys to the frontend
- Use proper key management service (AWS KMS, etc.)
- Implement proper access controls
