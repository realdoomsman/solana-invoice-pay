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
  
  -- Encrypted private key
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

-- Policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on payments" ON payments
  FOR ALL USING (true);
