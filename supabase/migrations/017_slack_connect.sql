ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS slack_webhook_url text,
  ADD COLUMN IF NOT EXISTS slack_channel text,
  ADD COLUMN IF NOT EXISTS slack_workspace text,
  ADD COLUMN IF NOT EXISTS slack_trigger text DEFAULT 'qualified';
