-- Track provisioned Twilio numbers per client
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS twilio_number_sid text,
  ADD COLUMN IF NOT EXISTS avg_job_value numeric(10,2) DEFAULT 350;

-- Referral system
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  referred_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  referral_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid')),
  commission_rate numeric(4,3) DEFAULT 0.10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES clients(id);
