# 💸 Solana Invoice & Payment Platform

A production-ready payment platform built on Solana for accepting crypto payments with instant settlements and minimal fees.

![Solana](https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## ✨ Features

### Payment Types
- 🔗 **Simple Payments** - Create instant payment links with QR codes
- 💰 **Split Payments** - Divide payments among multiple recipients
- 🔒 **Escrow Payments** - Milestone-based secure transactions
- 🎯 **Goal Payments** - Crowdfunding with progress tracking

### Platform Features
- ⚡ **Lightning Fast** - Sub-second confirmations on Solana
- 🔄 **Auto-Forwarding** - Automatic payment forwarding to merchant wallet
- 💵 **Low Fees** - $0.00025 average transaction cost
- 🔐 **Secure** - Non-custodial with encrypted key storage
- 📊 **Dashboard** - Real-time payment tracking
- 📱 **Mobile Ready** - Responsive design with QR code support
- 🌐 **SEO Optimized** - Complete metadata and sitemap
- 📈 **Monitoring** - Health checks and status page
- ⚖️ **Legal Ready** - Terms of Service and Privacy Policy included

### 🤖 AI-Powered Features
- 💬 **AI Assistant** - Smart payment creation helper
- 📊 **Payment Insights** - AI-powered analytics and trends
- 💡 **Smart Suggestions** - Optimal amounts and descriptions
- ✅ **Address Validation** - AI-powered wallet verification
- 🎯 **Type Recommendations** - Best payment type for your needs
- 🔍 **Fraud Detection** - Suspicious pattern analysis

### Monetization
- 💰 **Platform Fees** - Earn 1% on payments ≥ 0.1 SOL
- 🎯 **Automatic Collection** - Fees collected on every transaction
- 📊 **Transparent** - Clear fee display to users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Solana wallet (Phantom, Solflare, etc.)
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/realdoomsman/solana-invoice-pay.git
cd solana-invoice-pay

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your settings
# Add your wallet address and configure network

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your platform!

## 📚 Documentation

### Setup Guides
- [Quick Start Guide](docs/setup/QUICK_START.md) - Get started in 5 minutes
- [Production Setup](docs/setup/PRODUCTION_SETUP.md) - Deploy to production
- [Email Setup](docs/setup/EMAIL_SETUP.md) - Configure notifications
- [GitHub Setup](docs/setup/GITHUB_SETUP.md) - Repository configuration

### Deployment Guides
- [Deploy to Mainnet](docs/guides/DEPLOY_TO_MAINNET.md) - Complete mainnet guide
- [Launch Checklist](docs/guides/LAUNCH_CHECKLIST.md) - Pre-launch verification
- [Launch Now](docs/guides/LAUNCH_NOW.md) - Quick launch guide

### Reference
- [Features](docs/FEATURES.md) - Complete feature list
- [AI Features](docs/AI_FEATURES.md) - AI-powered capabilities
- [Production Ready](docs/PRODUCTION_READY.md) - Readiness checklist
- [What's New](docs/WHATS_NEW.md) - Latest updates
- [Monetization](docs/MONETIZATION.md) - Revenue guide

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:

```env
# Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_url

# Platform Fee
NEXT_PUBLIC_FEE_WALLET=your_wallet_address
PLATFORM_FEE_PERCENTAGE=1
PLATFORM_FEE_WALLET=your_wallet_address

# Security
ENCRYPTION_KEY=your_secure_random_key

# Application
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

See `.env.production.example` for complete configuration.

## 🎯 Usage

### Create a Payment Link

1. Visit your platform homepage
2. Enter your wallet address
3. Set amount and description
4. Click "Create Payment Link"
5. Share the link with your customer

### Accept Payment

Customers can pay via:
- **QR Code** - Scan with mobile wallet
- **Wallet Connect** - Connect browser wallet
- **Direct Send** - Copy address and send

Payments auto-forward to your wallet within seconds!

## 🛠️ Development

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── pay/[id]/          # Payment pages
│   ├── create/            # Payment creation pages
│   └── dashboard/         # User dashboard
├── components/            # React components
├── lib/                   # Utility functions
├── scripts/               # Helper scripts
├── docs/                  # Documentation
│   ├── setup/            # Setup guides
│   └── guides/           # Deployment guides
└── public/               # Static assets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter
npm run verify       # Verify production readiness
```

### Manual Payment Forward

If auto-forward fails, use the manual script:

```bash
node scripts/manual-forward.js "private_key" "merchant_wallet"
```

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Configure Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Import `.env.production` or add manually
3. Redeploy

See [Deploy to Mainnet](docs/guides/DEPLOY_TO_MAINNET.md) for detailed instructions.

## 📊 Monitoring

### Health Check
```
GET /api/health
```

Returns system status and RPC latency.

### Status Page
Visit `/status` to see real-time system health.

## 🔒 Security

- ✅ Non-custodial architecture
- ✅ Encrypted private key storage
- ✅ Rate limiting (10 req/min per IP)
- ✅ Input validation
- ✅ Secure auto-forwarding
- ✅ Environment variable validation

## 💰 Monetization

Platform earns 1% fee on payments ≥ 0.1 SOL:
- $100 payment → $1 platform fee
- $500 payment → $5 platform fee
- $1000 payment → $10 platform fee

Fees automatically collected and sent to your fee wallet.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Open an issue on GitHub
- **FAQ**: Visit `/faq` on your deployed site

## 🎉 What's Next?

After deployment:
1. Test with small amounts (0.01 SOL)
2. Verify auto-forwarding works
3. Check fee collection
4. Monitor `/status` page
5. Share your platform!

## 📈 Roadmap

- [ ] Recurring payments / subscriptions
- [ ] Multi-token support (USDC, USDT)
- [ ] Email notifications
- [ ] Webhook support
- [ ] Public API
- [ ] Mobile apps
- [ ] Advanced analytics

## 🌟 Built With

- **Next.js 14** - React framework
- **Solana Web3.js** - Blockchain interaction
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel** - Deployment

---

**Ready to launch?** Check out [Launch Now](docs/guides/LAUNCH_NOW.md) for a quick start guide!

**Need help?** See the [documentation](docs/) or open an issue.

**Built on Solana 💜**
