# Solana Invoice & Payment Links

A simple, powerful platform for creating payment links and invoices on Solana. Accept SOL, USDC, and other SPL tokens with zero hassle.

## Features

- 🔗 Generate shareable payment links
- 💰 Accept SOL, USDC, USDT, and SPL tokens
- 🎯 Unique wallet per payment for easy tracking
- ⚡ Auto-forward funds to merchant wallet
- 📊 Dashboard to track all payments
- 📱 QR codes for mobile payments
- 🎨 Clean, professional UI
- 🔒 No wallet connection needed for payers

## How It Works

1. **Create Payment**: Generate a payment link with amount and description
2. **Unique Wallet**: System creates a temporary wallet for this payment
3. **Customer Pays**: Customer scans QR or sends to the wallet address
4. **Auto-Forward**: Once payment received, funds auto-forward to your merchant wallet
5. **Track Everything**: View all payments in the dashboard

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

3. Add your merchant wallet address in `.env.local`:
```
NEXT_PUBLIC_MERCHANT_WALLET=YourSolanaWalletAddressHere
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Solana Web3.js
- TailwindCSS
- QR Code generation

## Usage

1. Create a payment link with amount and description
2. Share the link or QR code with your client
3. Client sends SOL to the unique payment address
4. System detects payment and auto-forwards to your wallet
5. Track everything in the dashboard

## Security Notes

⚠️ **Important for Production:**
- Currently stores private keys in localStorage (for demo only!)
- In production, store private keys securely in backend database
- Use environment variables for sensitive data
- Implement proper authentication
- Add rate limiting and monitoring

## Deployment

Deploy on Vercel:
```bash
vercel deploy
```

Make sure to set environment variables in Vercel dashboard.

## Roadmap

- [ ] Database integration (PostgreSQL/Supabase)
- [ ] Email notifications
- [ ] USDC/USDT support
- [ ] Webhook support
- [ ] Invoice PDF generation
- [ ] Multi-merchant support
- [ ] Analytics dashboard

## License

MIT
