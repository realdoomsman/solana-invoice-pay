# 📁 Project Structure

## Overview

```
solana-invoice-pay/
├── app/                          # Next.js App Directory
│   ├── api/                     # API Routes
│   │   ├── forward-payment/    # Payment forwarding endpoint
│   │   └── health/             # Health check endpoint
│   ├── create/                  # Payment Creation Pages
│   │   ├── escrow/             # Escrow payment creation
│   │   ├── goal/               # Goal-based payment creation
│   │   └── split/              # Split payment creation
│   ├── dashboard/               # User Dashboard
│   ├── faq/                     # FAQ Page
│   ├── login/                   # Login Page
│   ├── pay/[id]/               # Dynamic Payment Pages
│   ├── privacy/                 # Privacy Policy
│   ├── status/                  # System Status Page
│   ├── terms/                   # Terms of Service
│   ├── layout.tsx              # Root Layout
│   ├── page.tsx                # Homepage
│   ├── loading.tsx             # Loading State
│   ├── not-found.tsx           # 404 Page
│   ├── robots.ts               # Robots.txt Generator
│   ├── sitemap.ts              # Sitemap Generator
│   └── manifest.ts             # PWA Manifest
│
├── components/                  # React Components
│   ├── Analytics.tsx           # Analytics tracking
│   ├── ErrorBoundary.tsx       # Error handling
│   ├── FeeInfo.tsx             # Fee information display
│   ├── Footer.tsx              # Site footer
│   ├── LoadingSpinner.tsx      # Loading indicator
│   ├── Notification.tsx        # Notification system
│   ├── Toast.tsx               # Toast notifications
│   └── WalletProvider.tsx      # Wallet connection provider
│
├── lib/                         # Utility Functions
│   ├── auth.ts                 # Authentication utilities
│   ├── email.ts                # Email sending
│   ├── encryption.ts           # Data encryption
│   ├── env.ts                  # Environment validation
│   ├── monitoring.ts           # Monitoring utilities
│   ├── payment-wallet.ts       # Wallet generation
│   └── rate-limit.ts           # Rate limiting
│
├── scripts/                     # Helper Scripts
│   ├── manual-forward.js       # Manual payment forwarding
│   ├── verify-production.js    # Production verification
│   └── get-devnet-sol.ts       # Devnet SOL faucet
│
├── docs/                        # Documentation
│   ├── setup/                  # Setup Guides
│   │   ├── QUICK_START.md
│   │   ├── PRODUCTION_SETUP.md
│   │   ├── EMAIL_SETUP.md
│   │   └── GITHUB_SETUP.md
│   ├── guides/                 # Deployment Guides
│   │   ├── DEPLOY_TO_MAINNET.md
│   │   ├── LAUNCH_CHECKLIST.md
│   │   └── LAUNCH_NOW.md
│   ├── FEATURES.md
│   ├── PRODUCTION_READY.md
│   ├── WHATS_NEW.md
│   ├── MONETIZATION.md
│   └── README.md
│
├── public/                      # Static Assets
│   └── (icons, images, etc.)
│
├── .env.example                 # Environment template
├── .env.production.example      # Production env template
├── .env.production              # Production environment
├── .env.local                   # Local environment (gitignored)
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
├── README.md                    # Main README
├── CONTRIBUTING.md              # Contribution guidelines
├── PROJECT_STRUCTURE.md         # This file
└── FIX_VERCEL_ENV.md           # Vercel env fix guide
```

## 📂 Directory Details

### `/app` - Application Pages & Routes

**API Routes** (`/app/api/`)
- `forward-payment/route.ts` - Handles payment forwarding with fee calculation
- `health/route.ts` - System health check endpoint

**Payment Creation** (`/app/create/`)
- `escrow/page.tsx` - Create escrow payments with milestones
- `goal/page.tsx` - Create goal-based crowdfunding campaigns
- `split/page.tsx` - Create split payments to multiple recipients

**Core Pages**
- `page.tsx` - Homepage with payment link creation
- `dashboard/page.tsx` - User dashboard with payment history
- `pay/[id]/page.tsx` - Dynamic payment page with QR code
- `login/page.tsx` - Wallet-based authentication

**Legal & Info**
- `terms/page.tsx` - Terms of Service
- `privacy/page.tsx` - Privacy Policy
- `faq/page.tsx` - Frequently Asked Questions
- `status/page.tsx` - Real-time system status

**Meta Files**
- `layout.tsx` - Root layout with providers
- `loading.tsx` - Global loading state
- `not-found.tsx` - Custom 404 page
- `robots.ts` - SEO robots.txt
- `sitemap.ts` - SEO sitemap
- `manifest.ts` - PWA manifest

### `/components` - Reusable Components

- `WalletProvider.tsx` - Solana wallet connection wrapper
- `ErrorBoundary.tsx` - Error catching and display
- `Footer.tsx` - Site footer with links
- `Toast.tsx` - Toast notification system
- `Analytics.tsx` - Page view tracking
- `FeeInfo.tsx` - Platform fee information
- `LoadingSpinner.tsx` - Loading indicators
- `Notification.tsx` - Alert notifications

### `/lib` - Utility Libraries

- `auth.ts` - User authentication with localStorage
- `email.ts` - Email notification sending
- `encryption.ts` - Secure data encryption
- `env.ts` - Environment variable validation
- `monitoring.ts` - Logging and performance tracking
- `payment-wallet.ts` - Temporary wallet generation
- `rate-limit.ts` - API rate limiting

### `/scripts` - Helper Scripts

- `manual-forward.js` - Manually forward stuck payments
- `verify-production.js` - Pre-deployment verification
- `get-devnet-sol.ts` - Request devnet SOL for testing

### `/docs` - Documentation

**Setup Guides** (`/docs/setup/`)
- Complete setup instructions
- Environment configuration
- Email and GitHub setup

**Deployment Guides** (`/docs/guides/`)
- Mainnet deployment steps
- Launch checklists
- Quick reference guides

**Reference Docs**
- Feature documentation
- Production readiness
- Update history
- Monetization guide

## 🔑 Key Files

### Configuration Files

- `.env.local` - Local development environment (gitignored)
- `.env.production` - Production environment variables
- `next.config.js` - Next.js framework configuration
- `tailwind.config.ts` - Tailwind CSS styling config
- `tsconfig.json` - TypeScript compiler options
- `package.json` - Project dependencies and scripts

### Documentation Files

- `README.md` - Main project documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `PROJECT_STRUCTURE.md` - This file
- `FIX_VERCEL_ENV.md` - Vercel deployment fix

## 🎯 Important Paths

### For Development
- Start here: `/app/page.tsx` (Homepage)
- API logic: `/app/api/forward-payment/route.ts`
- Payment page: `/app/pay/[id]/page.tsx`
- Utilities: `/lib/`

### For Deployment
- Environment: `.env.production`
- Verification: `scripts/verify-production.js`
- Guides: `docs/guides/DEPLOY_TO_MAINNET.md`

### For Customization
- Styling: `tailwind.config.ts`
- Layout: `app/layout.tsx`
- Footer: `components/Footer.tsx`
- Homepage: `app/page.tsx`

## 📝 File Naming Conventions

- **Pages**: `page.tsx` (Next.js convention)
- **Layouts**: `layout.tsx` (Next.js convention)
- **Components**: `PascalCase.tsx` (e.g., `Footer.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `rate-limit.ts`)
- **Scripts**: `kebab-case.js` (e.g., `manual-forward.js`)
- **Docs**: `SCREAMING_SNAKE_CASE.md` (e.g., `README.md`)

## 🔄 Data Flow

```
User → Homepage (page.tsx)
  ↓
Create Payment Link
  ↓
Payment Page (pay/[id]/page.tsx)
  ↓
Balance Check (every 3s)
  ↓
Payment Detected
  ↓
API Call (/api/forward-payment)
  ↓
Forward to Merchant Wallet
  ↓
Update Status → Dashboard
```

## 🛠️ Adding New Features

### Add a New Page
1. Create `app/your-page/page.tsx`
2. Add to sitemap in `app/sitemap.ts`
3. Link from navigation/footer

### Add a New API Route
1. Create `app/api/your-route/route.ts`
2. Add rate limiting if needed
3. Add error handling
4. Document in README

### Add a New Component
1. Create `components/YourComponent.tsx`
2. Export from component
3. Import where needed
4. Add TypeScript types

## 📊 Code Organization

- **Separation of Concerns**: Pages, components, and utilities are separate
- **Type Safety**: TypeScript throughout
- **Reusability**: Shared components and utilities
- **Documentation**: Inline comments and external docs
- **Testing**: Scripts for verification

---

**Need to find something?** Use your IDE's search (Cmd/Ctrl + P) to quickly locate files!
