# Monetization Guide

## Platform Fee System

Your app now takes a small fee from every transaction!

## Setup (2 minutes)

### 1. Add Your Wallet Address

In `.env.local`:
```bash
PLATFORM_FEE_WALLET=your_solana_wallet_address_here
```

This is where you'll receive all platform fees.

### 2. Set Fee Percentage

```bash
PLATFORM_FEE_PERCENTAGE=1.5
```

Examples:
- `1.0` = 1% fee
- `1.5` = 1.5% fee (recommended)
- `2.0` = 2% fee
- `0.5` = 0.5% fee

### 3. Deploy

Push to Vercel and add the same environment variables.

## How It Works

**Example Transaction:**
- Customer pays: 10 SOL
- Platform fee (1.5%): 0.15 SOL → Goes to you
- Merchant receives: 9.85 SOL
- Solana network fee: ~0.00025 SOL

**The Split:**
```
Customer Payment: 10 SOL
├─ Platform Fee: 0.15 SOL (to you)
├─ Network Fee: 0.00025 SOL (to Solana)
└─ Merchant Gets: 9.85 SOL
```

## Revenue Calculator

### At 1.5% Fee:

| Monthly Volume | Your Revenue |
|---------------|--------------|
| 100 SOL       | 1.5 SOL      |
| 1,000 SOL     | 15 SOL       |
| 10,000 SOL    | 150 SOL      |
| 100,000 SOL   | 1,500 SOL    |

### At Current SOL Price (~$100):

| Monthly Volume | Your Revenue |
|---------------|--------------|
| $10,000       | $150/mo      |
| $100,000      | $1,500/mo    |
| $1,000,000    | $15,000/mo   |
| $10,000,000   | $150,000/mo  |

## Competitive Pricing

**Your Platform: 1.5%**
- Stripe: 2.9% + $0.30
- PayPal: 2.9% + $0.30
- Square: 2.6% + $0.10
- Coinbase Commerce: 1%

You're competitive!

## Transparency

Users see the fee:
- Shown on payment page
- Included in transaction
- Transparent pricing

## Revenue Tracking

### Check Your Wallet

All fees go directly to your wallet:
```
https://explorer.solana.com/address/YOUR_WALLET?cluster=mainnet-beta
```

### Track in Supabase

Query total fees:
```sql
SELECT 
  COUNT(*) as total_payments,
  SUM(amount) as total_volume,
  SUM(amount * 0.015) as total_fees
FROM payments 
WHERE status = 'paid';
```

## Scaling Revenue

### Grow Volume:
1. **Marketing**
   - Twitter/X presence
   - Product Hunt launch
   - Crypto communities
   - Content marketing

2. **Features**
   - Add USDC/USDT
   - Better analytics
   - API for developers
   - White-label option

3. **Partnerships**
   - Integrate with wallets
   - Partner with DAOs
   - Solana ecosystem grants

### Premium Tiers:

**Free Tier:**
- 1.5% fee
- Basic features
- Community support

**Pro Tier ($29/mo):**
- 1% fee (lower!)
- Advanced analytics
- Priority support
- Custom branding

**Enterprise:**
- 0.5% fee
- White-label
- Dedicated support
- Custom features

## Legal Considerations

- Register as a business
- Comply with local regulations
- Terms of service
- Privacy policy
- Tax reporting (1099s if needed)

## Withdrawal

Fees go directly to your wallet - no withdrawal needed!

Just:
1. Receive fees in real-time
2. Hold or convert to USD
3. Track for taxes

## Example: First Month

**Scenario:**
- 50 merchants sign up
- Average $2,000/month each
- Total volume: $100,000
- Your fee (1.5%): $1,500

**Costs:**
- Supabase: $0 (free tier)
- Vercel: $0 (free tier)
- SendGrid: $0 (free tier)
- **Profit: $1,500/mo**

## Tips for Success

1. **Start Low**: 1-1.5% to attract users
2. **Be Transparent**: Show fees clearly
3. **Add Value**: Make it worth the fee
4. **Scale Up**: Increase as you add features
5. **Premium Tiers**: Offer lower fees for paid plans

## Disable Fees (Optional)

To run without fees:
```bash
PLATFORM_FEE_PERCENTAGE=0
```

Or remove the variables entirely.

---

**You're now monetized! 💰**

Every transaction = passive income.
