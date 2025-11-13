-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_wallet TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_earned DECIMAL(20, 9) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral relationships table
CREATE TABLE IF NOT EXISTS referral_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (referrer_wallet) REFERENCES referrals(referrer_wallet)
);

-- Referral earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  commission DECIMAL(20, 9) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (referrer_wallet) REFERENCES referrals(referrer_wallet)
);

-- Indexes for performance
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_relationships_referred ON referral_relationships(referred_wallet);
CREATE INDEX idx_earnings_referrer ON referral_earnings(referrer_wallet);
CREATE INDEX idx_earnings_date ON referral_earnings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- Policies (users can read their own data)
CREATE POLICY "Users can view their own referral data"
  ON referrals FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own relationships"
  ON referral_relationships FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own earnings"
  ON referral_earnings FOR SELECT
  USING (true);
