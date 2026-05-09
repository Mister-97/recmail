CREATE TABLE IF NOT EXISTS campaigns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  message      TEXT NOT NULL,
  audience     TEXT NOT NULL DEFAULT 'all', -- all | open | qualified | past
  status       TEXT NOT NULL DEFAULT 'draft', -- draft | scheduled | sending | sent
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  recipient_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  reply_count     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_client" ON campaigns
  FOR ALL USING (
    client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
  );
