# Solana Invoice & Payment Links 💸

A modern, easy-to-use platform for creating payment links and invoices on Solana. Accept SOL, USDC, and other SPL tokens with instant settlement and ultra-low fees.

![Solana](https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- 🔗 **Shareable Payment Links** - Generate unique payment links in seconds
- 💰 **Multi-Token Support** - Accept SOL, USDC, USDT, and other SPL tokens
- 🎯 **Unique Wallets** - Each payment gets its own temporary wallet for tracking
- ⚡ **Auto-Forward** - Funds automatically forward to your merchant wallet
- 📊 **Dashboard** - Track all payments with real-time status updates
- 📱 **QR Codes** - Mobile-friendly QR codes for easy scanning
- 🔌 **Dual Payment Methods** - Customers can send to address OR connect wallet
- 🎨 **Clean UI** - Professional, intuitive interface
- 🔒 **Secure** - Non-custodial with transparent on-chain transactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Solana wallet (Phantom, Solflare, etc.)
- Some devnet SOL for testing (get from [Solana Faucet](https://faucet.solana.com))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/solana-invoice-pay.git
cd solana-invoice-pay
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your merchant wallet address:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_MERCHANT_WALLET=YourSolanaWalletAddressHere
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How It Works

1. **Create Payment Link**
   - Enter amount, select token (SOL/USDC/USDT)
   - Add optional description
   - System generates unique temporary wallet

2. **Share with Customer**
   - Send payment link via email, text, or social media
   - Customer can scan QR code or connect wallet

3. **Customer Pays**
   - Option 1: Scan QR code with Solana wallet
   - Option 2: Copy address and send manually
   - Option 3: Connect wallet and pay directly

4. **Auto-Forward**
   - System monitors payment wallet
   - Once payment received, auto-forwards to merchant wallet
   - Transaction recorded on Solana blockchain

5. **Track Everything**
   - View all payments in dashboard
   - See status (pending/paid)
   - Access transaction links on Solana Explorer

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: TailwindCSS
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **QR Codes**: qrcode.react
- **Date Formatting**: date-fns

## 📁 Project Structure

```
solana-invoice-pay/
├── app/
│   ├── api/
│   │   └── forward-payment/     # API route for auto-forwarding
│   ├── dashboard/               # Dashboard page
│   ├── pay/[id]/               # Payment page (dynamic route)
│   ├── page.tsx                # Homepage
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   └── WalletProvider.tsx      # Solana wallet provider
├── lib/
│   └── payment-wallet.ts       # Wallet generation utilities
├── .env.example                # Environment variables template
└── README.md
```

## 🔐 Security Considerations

⚠️ **Important for Production:**

This is a demo/MVP implementation. For production use:

- [ ] **Database**: Replace localStorage with secure database (PostgreSQL, Supabase)
- [ ] **Key Management**: Store private keys encrypted in backend only
- [ ] **Authentication**: Add user authentication and authorization
- [ ] **Rate Limiting**: Implement rate limiting on API routes
- [ ] **Monitoring**: Set up error tracking and monitoring
- [ ] **Webhooks**: Add webhook support for payment notifications
- [ ] **Testing**: Add comprehensive test coverage
- [ ] **Audit**: Get smart contract/security audit before mainnet

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
   - `NEXT_PUBLIC_MERCHANT_WALLET=YourWalletAddress`
4. Deploy!

### Deploy to Other Platforms

Works with any platform supporting Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 🗺️ Roadmap

- [ ] Database integration (PostgreSQL/Supabase)
- [ ] User authentication and multi-merchant support
- [ ] Email/SMS notifications
- [ ] Full USDC/USDT support
- [ ] Webhook API for integrations
- [ ] Invoice PDF generation
- [ ] Recurring payments/subscriptions
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] API for developers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Solana](https://solana.com) blockchain
- Powered by [Next.js](https://nextjs.org)
- Wallet integration via [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter)

## 📧 Contact

Have questions? Open an issue or reach out!

---

**⚡ Built with Solana - Fast, Cheap, Scalable**
