# Quick Start - Production Setup

## Option 1: Quick Setup (5 minutes)

### 1. Run Setup Script
```bash
./scripts/setup-production.sh
```

### 2. Create Supabase Account
- Go to https://supabase.com
- Sign up (free)
- Create new project
- Wait 2 minutes for setup

### 3. Get Your Keys
In Supabase:
- Go to Project Settings → API
- Copy these 3 values:
  1. Project URL
  2. anon public key
  3. service_role key

### 4. Update .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=paste_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_service_role_key_here
```

### 5. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy output to `ENCRYPTION_KEY` in .env.local

### 6. Create Database Tables
- Open Supabase → SQL Editor
- Copy SQL from `PRODUCTION_SETUP.md` (Step 1)
- Click "Run"

### 7. Test It
```bash
npm run dev
```
Open http://localhost:3000 and test!

---

## Option 2: Deploy to Vercel (10 minutes)

### 1. Complete Option 1 First
Make sure local setup works

### 2. Push to GitHub
```bash
git push
```

### 3. Deploy on Vercel
- Go to https://vercel.com
- Click "Import Project"
- Select your GitHub repo
- Add environment variables (from .env.local)
- Click "Deploy"

### 4. Done!
Your app is live at: `your-app.vercel.app`

---

## What You Get:

✅ **Database**: Supabase (PostgreSQL)
- Stores all payments
- User authentication
- Encrypted private keys
- Free tier: 500MB database

✅ **Hosting**: Vercel
- Auto-deploys from GitHub
- HTTPS included
- Global CDN
- Free tier: 100GB bandwidth

✅ **Security**:
- Private keys encrypted
- Row-level security
- HTTPS only
- Environment variables

---

## Cost: $0/month

Everything runs on free tiers:
- Supabase: Free (500MB, 2GB bandwidth)
- Vercel: Free (100GB bandwidth)
- SendGrid: Free (100 emails/day)

Upgrade when you need more.

---

## Need Help?

1. Check `PRODUCTION_SETUP.md` for detailed guide
2. Check `BACKEND_STATUS.md` for what works
3. Open an issue on GitHub

---

## Quick Commands:

```bash
# Setup
./scripts/setup-production.sh

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test locally
npm run dev

# Deploy
git push  # Auto-deploys if connected to Vercel
```

That's it! You're production-ready! 🚀
