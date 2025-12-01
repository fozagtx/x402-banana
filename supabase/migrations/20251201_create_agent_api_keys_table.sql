-- Create agent_api_keys table for storing API keys
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_api_key ON agent_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_wallet ON agent_api_keys(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_active ON agent_api_keys(is_active);

-- Create table for tracking agent payments
CREATE TABLE IF NOT EXISTS agent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES agent_api_keys(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  amount_mnee TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_generated BOOLEAN DEFAULT FALSE
);

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_agent_payments_tx_hash ON agent_payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_agent_payments_api_key ON agent_payments(api_key_id);
CREATE INDEX IF NOT EXISTS idx_agent_payments_created_at ON agent_payments(created_at);

-- Add Row Level Security
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
CREATE POLICY "Users can view own API keys"
  ON agent_api_keys FOR SELECT
  USING (true);

-- Policy: Users can insert their own API keys
CREATE POLICY "Users can create API keys"
  ON agent_api_keys FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own API keys"
  ON agent_api_keys FOR UPDATE
  USING (true);

-- Policy: Anyone can view payments (for verification)
CREATE POLICY "Anyone can view payments"
  ON agent_payments FOR SELECT
  USING (true);

-- Policy: Service can insert payments
CREATE POLICY "Service can create payments"
  ON agent_payments FOR INSERT
  WITH CHECK (true);