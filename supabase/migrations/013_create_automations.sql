-- Stores per-client automation configurations
CREATE TABLE IF NOT EXISTS client_automations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,   -- follow_up_sequence | appointment_confirmation | auto_qualify | auto_close | after_hours | round_robin | review_request
  enabled      BOOLEAN NOT NULL DEFAULT false,
  config       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, type)
);

-- Tracks queued automation jobs (drip steps, review requests, etc.)
CREATE TABLE IF NOT EXISTS automation_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  step            INT NOT NULL DEFAULT 0,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  ran_at          TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | sent | cancelled
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_jobs_pending ON automation_jobs (scheduled_at)
  WHERE status = 'pending';

ALTER TABLE client_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_automations_client" ON client_automations
  FOR ALL USING (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "automation_jobs_client" ON automation_jobs
  FOR ALL USING (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );

-- Service role bypass handled by service client
