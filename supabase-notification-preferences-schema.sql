-- ============================================
-- NOTIFICATION PREFERENCES SCHEMA
-- ============================================

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL UNIQUE,
  
  -- In-app notification preferences
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_deposits BOOLEAN DEFAULT true,
  in_app_work_submissions BOOLEAN DEFAULT true,
  in_app_approvals BOOLEAN DEFAULT true,
  in_app_disputes BOOLEAN DEFAULT true,
  in_app_timeouts BOOLEAN DEFAULT true,
  in_app_releases BOOLEAN DEFAULT true,
  in_app_refunds BOOLEAN DEFAULT true,
  
  -- Browser notification preferences
  browser_enabled BOOLEAN DEFAULT false,
  browser_deposits BOOLEAN DEFAULT true,
  browser_work_submissions BOOLEAN DEFAULT true,
  browser_approvals BOOLEAN DEFAULT true,
  browser_disputes BOOLEAN DEFAULT true,
  browser_timeouts BOOLEAN DEFAULT true,
  browser_releases BOOLEAN DEFAULT true,
  browser_refunds BOOLEAN DEFAULT true,
  
  -- Email notification preferences (future)
  email_enabled BOOLEAN DEFAULT false,
  email_address TEXT,
  email_deposits BOOLEAN DEFAULT false,
  email_work_submissions BOOLEAN DEFAULT false,
  email_approvals BOOLEAN DEFAULT false,
  email_disputes BOOLEAN DEFAULT true,
  email_timeouts BOOLEAN DEFAULT true,
  email_releases BOOLEAN DEFAULT true,
  email_refunds BOOLEAN DEFAULT true,
  
  -- Notification frequency settings
  notification_frequency TEXT DEFAULT 'immediate', -- 'immediate' | 'hourly' | 'daily'
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue table (for batching and delivery)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL,
  escrow_id TEXT,
  notification_type TEXT NOT NULL, -- 'deposit' | 'work_submission' | 'approval' | 'dispute' | 'timeout' | 'release' | 'refund'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  
  -- Delivery status
  in_app_delivered BOOLEAN DEFAULT false,
  browser_delivered BOOLEAN DEFAULT false,
  email_delivered BOOLEAN DEFAULT false,
  
  -- Read status
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_prefs_wallet ON user_notification_preferences(user_wallet);
CREATE INDEX IF NOT EXISTS idx_notification_queue_wallet ON notification_queue(user_wallet);
CREATE INDEX IF NOT EXISTS idx_notification_queue_escrow ON notification_queue(escrow_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_queue_unread ON notification_queue(user_wallet, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue(created_at DESC);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Policies for notification preferences
CREATE POLICY "Users can view their own preferences"
  ON user_notification_preferences FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own preferences"
  ON user_notification_preferences FOR UPDATE
  USING (true);

-- Policies for notification queue
CREATE POLICY "Users can view their own notifications"
  ON notification_queue FOR SELECT
  USING (true);

CREATE POLICY "System can insert notifications"
  ON notification_queue FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notification_queue FOR UPDATE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(wallet_param TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notification_queue
    WHERE user_wallet = wallet_param
    AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification delivery and types';
COMMENT ON TABLE notification_queue IS 'Queue of notifications to be delivered to users';
COMMENT ON COLUMN user_notification_preferences.notification_frequency IS 'How often to batch notifications: immediate, hourly, or daily';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_enabled IS 'Whether to suppress notifications during quiet hours';
