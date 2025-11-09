# Production Setup Guide

## Step 1: Database Setup (Supabase)

### Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Name: `solana-invoice-pay`
   - Database Password: (save this!)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

### Get Your Credentials

Once created, go to Project Settings → API:
- Copy `Project URL`
- Copy `anon public` key
- Copy `service_role` key (keep secret!)

### Create Database Tables

Go to SQL Editor and run this:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL NOT NULL,
  token TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_wallet TEXT NOT NULL,
  merchant_wallet TEXT NOT NULL,
  type TEXT DEFAULT 'simple',
  
  -- Split payment data
  split_recipients JSONB,
  
  -- Escrow data
  escrow_enabled BOOLEAN DEFAULT FALSE,
  milestones JSONB,
  
  -- Goal data
  is_goal BOOLEAN DEFAULT FALSE,
  goal_amount DECIMAL,
  current_amount DECIMAL DEFAULT 0,
  contributors INTEGER DEFAULT 0,
  
  -- Transaction data
  tx_signature TEXT,
  
  -- Encrypted private key (we'll encrypt this)
  encrypted_private_key TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see their own data)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (user_id::text = auth.uid()::text);
```

## Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install crypto-js
npm install @supabase/auth-helpers-nextjs
```

## Step 3: Environment Variables

Create/update `.env.local`:

```bash
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption (generate a random 32-character string)
ENCRYPTION_KEY=your_random_32_char_string_here

# Email (optional - for notifications)
SENDGRID_API_KEY=your_sendgrid_key_here
NOTIFICATION_EMAIL=your_email@example.com
```

To generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Email Setup (SendGrid - Optional)

1. Go to https://sendgrid.com
2. Sign up for free account (100 emails/day free)
3. Create API Key:
   - Settings → API Keys → Create API Key
   - Full Access
   - Copy the key
4. Verify sender email:
   - Settings → Sender Authentication
   - Verify your email address

## Step 5: Deploy to Vercel

1. Push your code to GitHub (already done!)
2. Go to https://vercel.com
3. Import your GitHub repo
4. Add environment variables:
   - All variables from `.env.local`
5. Deploy!

## Step 6: Switch to Mainnet (When Ready)

Change in `.env.local` and Vercel:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## Cost Breakdown (Monthly)

- **Supabase**: $0 (free tier: 500MB database, 2GB bandwidth)
- **Vercel**: $0 (free tier: 100GB bandwidth)
- **SendGrid**: $0 (free tier: 100 emails/day)
- **Total**: $0/month for small scale!

## When to Upgrade:

**Supabase Pro ($25/mo)** when you hit:
- 500MB database size
- 2GB bandwidth
- Need more than 50,000 monthly active users

**Vercel Pro ($20/mo)** when you need:
- Custom domains
- More bandwidth
- Team collaboration

**SendGrid Essentials ($20/mo)** when you need:
- More than 100 emails/day
- Email templates
- Analytics

## Next Steps After Setup:

1. Test on devnet with database
2. Verify all features work
3. Test email notifications
4. Switch to mainnet
5. Test with small amounts
6. Launch!

## Security Checklist:

- [ ] Database credentials in environment variables
- [ ] Private keys encrypted in database
- [ ] Row Level Security enabled
- [ ] HTTPS only (Vercel handles this)
- [ ] Rate limiting on API routes
- [ ] Input validation on all forms
- [ ] Error logging (Sentry)
- [ ] Regular backups (Supabase auto-backups)

Ready to implement? I can help you with each step!
