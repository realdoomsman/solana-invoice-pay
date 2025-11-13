# ⚡ Quick Reference - NOVIQ Platform

## 🚀 Start in 3 Commands

```bash
npm run dev              # Start development
npm run build            # Build for production
vercel --prod            # Deploy
```

## ✅ Status Check

```bash
node scripts/verify-all.js    # Verify everything
```

**Current Status:** 🟢 All systems operational

## 📁 Key Files

```
app/page.tsx                    → Homepage
app/pay/[id]/page.tsx          → Payment pages
app/dashboard/page.tsx         → Dashboard
app/api/forward-payment/route.ts → Auto-forward API
lib/payment-wallet.ts          → Wallet generation
components/WalletProvider.tsx  → Wallet integration
.env.local                     → Configuration
```

## 🎯 Features

### Payment Types
- **Simple** - Basic payment links
- **Split** - Multi-recipient distribution
- **Escrow** - Milestone-based secure payments
- **Goals** - Crowdfunding with progress tracking

### Core Features
- QR code generation
- Wallet connection
- Auto-forwarding
- Real-time status
- Dashboard analytics
- CSV/JSON export
- Invoice generation
- AI assistant

## 🔧 Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build production
npm start                      # Run production build

# Testing
node scripts/verify-all.js     # Verify setup
npm run lint                   # Check code

# Deployment
vercel --prod                  # Deploy to Vercel
```

## 🌐 URLs

```
Local:       http://localhost:3000
Production:  https://noviq.fun
Status:      /status
Dashboard:   /dashboard
FAQ:         /faq
```

## 📊 What's Working

✅ Build successful  
✅ No TypeScript errors  
✅ All features functional  
✅ Database connected  
✅ Environment configured  
✅ Ready for production

## 🎯 Quick Actions

### Create Payment
1. Go to homepage
2. Enter wallet address
3. Set amount
4. Click "Create Payment Link"

### View Dashboard
1. Click "View Dashboard"
2. See all payments
3. Export data
4. Generate invoices

### Deploy
1. Run `npm run build`
2. Run `vercel --prod`
3. Done!

## 💡 Tips

- Test with 0.01 SOL first
- Check dashboard after creating payments
- Monitor `/status` page
- Use AI assistant for suggestions
- Export data regularly

## 🆘 Troubleshooting

**Port in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**Build fails?**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Need help?**
- Check `START_HERE.md`
- Run `node scripts/verify-all.js`
- See `/docs` folder

## 📈 Next Steps

1. ✅ Everything works
2. 🎯 Run `npm run dev`
3. 🚀 Test locally
4. 🌐 Deploy to production

---

**Status:** 🟢 Ready to go!  
**Action:** `npm run dev`
