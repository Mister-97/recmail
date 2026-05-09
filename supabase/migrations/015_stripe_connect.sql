-- Stripe Connect: replace stripe_secret_key with OAuth tokens
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_access_token text,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2);

-- Keep stripe_secret_key for now as a deprecated fallback (can drop later)
